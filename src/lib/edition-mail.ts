import { sendEmail } from '@/lib/mail';

const BRAND_GOLD = '#b88c2d';
const BRAND_DARK = '#0a0b10';

interface SendVerificationParams {
  to: string;
  name: string;
  verifyUrl: string;
}

export async function sendEditionVerification({
  to,
  name,
  verifyUrl,
}: SendVerificationParams): Promise<{ ok: boolean; error?: string }> {
  const subject = '[대라천] 디지털 에디션 — 한정 공개 링크가 도착했습니다.';
  const text = `${name}님,

대라천 침향 디지털 에디션 — 한정 공개 자료를 신청해 주셔서 감사합니다.

아래 링크를 클릭하시면 25년의 기록과 베트남 5개 성 농장의 진짜 침향 이야기를 만나보실 수 있습니다.

▶ 디지털 에디션 열람: ${verifyUrl}

이 링크는 신청자 본인만을 위해 발급되었으며 14일간 유효합니다. 외부 공유는 자제해 주세요.

문의: hello@daerachoen.com
대라천 · ZOEL LIFE`;

  const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>대라천 디지털 에디션</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f1ea;font-family:'Noto Sans KR','Apple SD Gothic Neo','Segoe UI',sans-serif;color:${BRAND_DARK};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f1ea;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${BRAND_DARK};color:#fff;">
            <tr>
              <td style="padding:48px 40px 32px;border-bottom:1px solid rgba(212,168,67,0.25);">
                <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.28em;color:${BRAND_GOLD};text-transform:uppercase;margin-bottom:16px;">DIGITAL EDITION · LIMITED ACCESS</div>
                <h1 style="margin:0;font-family:'Noto Serif KR',serif;font-weight:300;font-size:26px;line-height:1.4;color:#fff;">
                  ${escapeHtml(name)} 님,<br/>
                  <em style="color:${BRAND_GOLD};font-style:normal;">한정 공개 링크가 도착했습니다.</em>
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.85;color:rgba(255,255,255,0.78);">
                  대라천 침향 디지털 에디션을 신청해 주셔서 감사합니다.<br/>
                  아래 버튼을 클릭하시면 25년의 기록과 베트남 5개 성 농장의 진짜 침향 이야기를 만나보실 수 있습니다.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
                  <tr>
                    <td align="center" style="background:${BRAND_GOLD};">
                      <a href="${verifyUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:16px 36px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND_DARK};text-decoration:none;font-weight:600;">
                        디지털 에디션 열람 →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:12px;line-height:1.7;color:rgba(255,255,255,0.5);">
                  버튼이 보이지 않는다면 아래 링크를 복사해 브라우저에 붙여넣으세요:<br/>
                  <a href="${verifyUrl}" style="color:${BRAND_GOLD};word-break:break-all;">${escapeHtml(verifyUrl)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid rgba(212,168,67,0.18);background:#050608;">
                <p style="margin:0;font-size:11px;line-height:1.7;color:rgba(255,255,255,0.45);">
                  이 링크는 신청자 본인만을 위해 발급되었으며 <strong style="color:rgba(255,255,255,0.7);">14일간 유효</strong>합니다.<br/>
                  외부 공유는 자제해 주세요. 문의: <a href="mailto:hello@daerachoen.com" style="color:${BRAND_GOLD};">hello@daerachoen.com</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;background:#050608;text-align:center;">
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.3em;color:rgba(255,255,255,0.35);text-transform:uppercase;">
                  대라천 · ZOEL LIFE
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendEmail({ to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
