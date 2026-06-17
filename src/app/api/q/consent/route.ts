import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordEvent } from '@/lib/qr/events';
import { getClientEnv, genEventId } from '@/lib/qr/collect';
import { verifyQrSession } from '@/lib/qr/token';
import type { QrEvent } from '@/lib/qr/types';

/**
 * QR 스캔 동의 수집 (연령·성별·연락처).
 * 진입은 막지 않으며(동의는 혜택 인센티브), '동의 없이 계속'도 기록(consented:false).
 * 위조 방지: POST · Origin 동일 · 서명된 zql_qsid 검증 · zod. 결과로 재프롬프트
 * 방지 쿠키를 설정한다(동의=180일, 거부=7일 뒤 재안내 가능).
 */

export const dynamic = 'force-dynamic';
const isProd = process.env.NODE_ENV === 'production';
const MAX_BODY = 2048;

const bodySchema = z.object({
  consented: z.boolean(),
  age: z.enum(['10대', '20대', '30대', '40대', '50대', '60대+', '비공개']).optional(),
  gender: z.enum(['남성', '여성', '비공개']).optional(),
  contact: z.string().max(120).optional(),
  name: z.string().max(60).optional(),
});

export async function POST(req: NextRequest) {
  // 항상 성공 형태로 응답해 클라이언트가 목적지로 진행할 수 있게 한다.
  const ok = () => NextResponse.json({ success: true });
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) return ok();

    const session = await verifyQrSession(req.cookies.get('zql_qsid')?.value);
    const raw = await req.text();
    if (raw.length > MAX_BODY) return ok();
    let json: unknown;
    try {
      json = JSON.parse(raw || '{}');
    } catch {
      return ok();
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return ok();
    const body = parsed.data;

    const res = ok();
    const base = { secure: isProd, sameSite: 'lax' as const, path: '/' };
    if (body.consented) {
      res.cookies.set('zql_consent', '1', { ...base, httpOnly: false, maxAge: 180 * 24 * 60 * 60 });
      res.cookies.delete('zql_decline');
    } else {
      // 거부 — 7일간 재안내 안 함
      res.cookies.set('zql_decline', '1', { ...base, httpOnly: false, maxAge: 7 * 24 * 60 * 60 });
    }

    // 세션이 있을 때만 이벤트 귀속 (동의 화면은 /q 를 거쳐 오므로 정상 케이스엔 존재)
    if (session) {
      const env = getClientEnv(req.headers);
      const vid = req.cookies.get('zql_vid')?.value ?? '';
      const ev: QrEvent = {
        id: genEventId(),
        type: 'consent',
        at: new Date().toISOString(),
        slug: session.slug,
        qsid: session.qsid,
        vid,
        consented: body.consented,
        country: env.country,
        region: env.region,
        city: env.city,
        // 동의한 경우에만 개인정보 저장
        ...(body.consented
          ? {
              ...(body.age ? { age: body.age } : {}),
              ...(body.gender ? { gender: body.gender } : {}),
              ...(body.contact?.trim() ? { contact: body.contact.trim() } : {}),
              ...(body.name?.trim() ? { name: body.name.trim() } : {}),
            }
          : {}),
      };
      try {
        await recordEvent(ev);
      } catch {
        /* 기록 실패해도 진행 */
      }
    }
    return res;
  } catch {
    return ok();
  }
}
