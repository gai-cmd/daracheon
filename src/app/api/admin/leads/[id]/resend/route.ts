import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { listLeads } from '@/lib/leads';
import { writeData } from '@/lib/db';
import { sendEditionVerification } from '@/lib/edition-mail';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const EXPIRY_DAYS = 14;

function siteUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

// 인증 메일 재발송 — 만료 또는 pending 상태에 사용.
// expired 였으면 토큰을 재발급하고 expiresAt 을 갱신해 다시 살린다.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const leads = await listLeads();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, message: '해당 리드를 찾을 수 없습니다.' }, { status: 404 });
    }

    const lead = leads[idx];
    const now = new Date();
    const expired = Date.parse(lead.expiresAt) < now.getTime();

    if (expired || lead.status === 'expired') {
      // 토큰·만료일 갱신, 상태는 pending 으로 되돌림.
      const newToken = crypto.randomBytes(24).toString('base64url');
      leads[idx] = {
        ...lead,
        token: newToken,
        status: 'pending',
        expiresAt: new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      };
      await writeData('leads', leads);
    }

    const finalLead = leads[idx];
    const verifyUrl = `${siteUrl(request)}/api/agarwood-edition/verify?token=${encodeURIComponent(finalLead.token)}`;

    const result = await sendEditionVerification({
      to: finalLead.email,
      name: finalLead.name,
      verifyUrl,
    });

    await logAdmin('leads', 'resend', {
      summary: '에디션 인증 메일 재발송',
      targetId: finalLead.id,
      meta: { email: finalLead.email, ok: result.ok, error: result.error, regenerated: expired },
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.error ?? '메일 발송 실패' }, { status: 500 });
    }
    return NextResponse.json({ success: true, regenerated: expired });
  } catch (error) {
    console.error('[api:admin:leads:resend] error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '재발송 실패' },
      { status: 500 },
    );
  }
}
