/**
 * Tier 3 백업: 백업 JSON 을 관리자 이메일에 첨부로 발송.
 *
 * GitHub + Vercel Blob 전부 유실되는 극단적 상황에서도 관리자 받은편지함
 * 에 파일이 남아 있어 수동 복구 가능.
 *
 * 요구 환경변수:
 *   RESEND_API_KEY           — 이미 설정됨
 *   BACKUP_EMAIL_RECIPIENT   — 수신자 (미설정 시 ADMIN_EMAIL 사용)
 *   MAIL_FROM                — 발신자 (이미 설정됨)
 */

import { gzipSync } from 'node:zlib';

interface EmailBackupResult {
  ok: boolean;
  recipient?: string;
  error?: string;
  sizeBytes?: number;
}

function pickRecipient(): string | null {
  return process.env.BACKUP_EMAIL_RECIPIENT ?? process.env.ADMIN_EMAIL ?? null;
}

export async function sendEmailBackup(
  label: string,
  body: string,
  meta?: Record<string, unknown>
): Promise<EmailBackupResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' };
  const to = pickRecipient();
  if (!to) return { ok: false, error: 'BACKUP_EMAIL_RECIPIENT/ADMIN_EMAIL not set' };

  const gz = gzipSync(Buffer.from(body, 'utf-8'));
  const filename = `daracheon-${label}-${new Date().toISOString().replace(/[:.]/g, '-')}.json.gz`;
  const attachment = gz.toString('base64');

  const now = new Date();
  const metaRows = Object.entries(meta ?? {})
    .map(([k, v]) => `<tr><td style="padding:4px 10px;color:#666">${k}</td><td style="padding:4px 10px"><code>${String(v)}</code></td></tr>`)
    .join('');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? 'noreply@daerachoen.com',
        to: [to],
        subject: `[대라천 백업] ${label} · ${now.toISOString().slice(0, 10)}`,
        html: `
          <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;">
            <h2 style="color:#c9a55c;margin-bottom:4px;">대라천 DB 백업</h2>
            <p style="color:#666;font-size:13px;margin-top:0;">
              ${now.toISOString()} — 라벨 <strong>${label}</strong>
            </p>
            <p style="color:#333;line-height:1.7;">
              이 메일에 첨부된 <code>.json.gz</code> 파일은 대라천 전체 DB 의
              압축 스냅샷입니다. Tier 1 (Vercel Blob) / Tier 2 (GitHub) 이 모두
              손상되었을 때 최후 복구 수단으로 사용합니다. 이 메일을 삭제하지
              마세요.
            </p>
            <h3 style="color:#333;margin-top:20px;">복구 방법</h3>
            <ol style="color:#444;line-height:1.8;">
              <li>첨부 파일 다운로드 후 <code>gunzip</code> 해제</li>
              <li>관리자 <code>/admin/backup</code> 접속 → "수동 스냅샷" 옆
                  "업로드 복원" 버튼 (또는 <code>/api/admin/backup</code> POST)</li>
              <li>JSON 파일 선택 → 복원 실행 → 자동으로 pre-restore 스냅샷 생성됨</li>
            </ol>
            <h3 style="color:#333;margin-top:20px;">메타</h3>
            <table style="border-collapse:collapse;font-size:13px;">
              <tbody>
                <tr><td style="padding:4px 10px;color:#666">size (raw)</td><td style="padding:4px 10px"><code>${body.length} bytes</code></td></tr>
                <tr><td style="padding:4px 10px;color:#666">size (gzip)</td><td style="padding:4px 10px"><code>${gz.length} bytes</code></td></tr>
                <tr><td style="padding:4px 10px;color:#666">filename</td><td style="padding:4px 10px"><code>${filename}</code></td></tr>
                ${metaRows}
              </tbody>
            </table>
            <p style="color:#999;font-size:11px;margin-top:24px;">
              자동 생성 — Vercel cron (주 1회 일요일 UTC 15:00 / KST 월요일 자정).
            </p>
          </div>
        `,
        text: `대라천 DB 백업 · ${label} · ${now.toISOString()}\n\n이 메일에 첨부된 .json.gz 은 전체 DB 스냅샷입니다. Tier 1·2 손상 시 /admin/backup 에서 업로드 복원하세요.`,
        attachments: [
          {
            filename,
            content: attachment,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { ok: false, error: `Resend API error ${res.status}: ${errBody}` };
    }
    return { ok: true, recipient: to, sizeBytes: gz.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function isEmailBackupConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!pickRecipient();
}
