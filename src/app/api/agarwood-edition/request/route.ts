import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createLead, listLeads, recentByEmail } from '@/lib/leads';
import { sendEditionVerification } from '@/lib/edition-mail';

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5;
const rateBucket = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

function checkRate(ip: string): boolean {
  const now = Date.now();
  const history = (rateBucket.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (history.length >= RATE_MAX) {
    rateBucket.set(ip, history);
    return false;
  }
  history.push(now);
  rateBucket.set(ip, history);
  return true;
}

const requestSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(50),
  email: z.string().email('올바른 이메일 주소를 입력해 주세요.'),
  company: z.string().max(80).optional().default(''),
  role: z.string().max(60).optional().default(''),
  utm_source: z.string().max(60).optional(),
  utm_medium: z.string().max(60).optional(),
  utm_campaign: z.string().max(60).optional(),
  referrer: z.string().max(200).optional(),
});

function siteUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!checkRate(ip)) {
      return NextResponse.json(
        { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const v = requestSchema.parse(body);

    const all = await listLeads();
    const recent = recentByEmail(all, v.email, RATE_WINDOW_MS);
    if (recent.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: '같은 이메일로 최근에 신청하셨습니다. 받은 편지함을 확인해 주세요. (1시간 후 재신청 가능)',
        },
        { status: 429 }
      );
    }

    const lead = await createLead({
      email: v.email,
      name: v.name,
      company: v.company || undefined,
      role: v.role || undefined,
      source: {
        utm_source: v.utm_source,
        utm_medium: v.utm_medium,
        utm_campaign: v.utm_campaign,
        referrer: v.referrer,
      },
      ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    const verifyUrl = `${siteUrl(request)}/api/agarwood-edition/verify?token=${encodeURIComponent(lead.token)}`;

    sendEditionVerification({
      to: lead.email,
      name: lead.name,
      verifyUrl,
    }).catch((err) => console.error('[edition-request] verification mail failed:', err));

    console.log('[edition-request] new lead id=%s email=%s', lead.id, lead.email);

    return NextResponse.json(
      { success: true, message: '인증 메일을 발송했습니다. 받은 편지함을 확인해 주세요.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }
    console.error('[edition-request] error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

