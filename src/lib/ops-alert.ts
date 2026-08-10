import { sendTelegramMessage, sendSlackMessage } from './integrations';
import { postSlack } from './slack';

/**
 * 운영 경보 전용 Slack 채널 (2026-08-11 사용자 지정: Miraclro #05_dev).
 * webhook(sendSlackMessage)과 별개로 봇 토큰 경로로 발송한다 — webhook 은
 * 생성 시점에 채널이 고정돼 있어 대상 변경이 코드/설정으로 안 되기 때문.
 * SLACK_OPS_CHANNEL env 로 오버라이드 가능. 봇이 채널에 초대돼 있어야 한다.
 * 기본값은 채널 ID(#05_dev = C096UCF20A3) — 이름을 쓰면 conversations.list 조회가
 * 필요해 channels:read 스코프 없는 토큰에서 "채널을 찾을 수 없습니다"로 실패한다.
 */
const OPS_CHANNEL = process.env.SLACK_OPS_CHANNEL?.trim() || 'C096UCF20A3';

/**
 * 운영 경보 이중 발송.
 *
 * 2026-07-26 사고 대응: 백업 경보가 텔레그램 단일 채널이었고, 미설정 시
 * sendTelegramMessage 가 { ok:false, skipped:true } 를 조용히 돌려주기 때문에
 * 경보가 아무 데도 도달하지 않아도 아무도 몰랐다. 두 채널로 동시에 쏘고,
 * 어느 쪽에도 도달하지 못하면 그 사실 자체를 에러 로그로 남긴다.
 *
 * 경보 발송 실패가 호출자(크론 라우트)의 응답을 깨면 안 되므로 절대 throw 하지
 * 않는다. 전달 채널 수를 반환하니 호출자가 응답에 포함시켜 가시화할 수 있다.
 */
export interface OpsAlertResult {
  delivered: number;
  telegram: { ok: boolean; skipped?: boolean; error?: string };
  slack: { ok: boolean; skipped?: boolean; error?: string };
  slackOpsChannel: { ok: boolean; skipped?: boolean; error?: string };
}

export async function sendOpsAlert(text: string): Promise<OpsAlertResult> {
  const settle = async (
    label: string,
    send: () => Promise<{ ok: boolean; skipped?: boolean; error?: string }>
  ) => {
    try {
      return await send();
    } catch (err) {
      console.warn(`[ops-alert] ${label} 예외:`, err);
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const [telegram, slack, slackOpsChannel] = await Promise.all([
    settle('telegram', () => sendTelegramMessage(text)),
    settle('slack', () => sendSlackMessage(text)),
    settle('slack-ops-channel', () => postSlack({ channel: OPS_CHANNEL, text })),
  ]);

  // 채널별 결과를 항상 로그로 — 일부 채널만 실패하면 delivered>0 이라 조용히 묻힌다.
  console.warn(
    '[ops-alert] delivery',
    JSON.stringify({ telegram, slack, slackOpsChannel, channel: OPS_CHANNEL })
  );

  const delivered = (telegram.ok ? 1 : 0) + (slack.ok ? 1 : 0) + (slackOpsChannel.ok ? 1 : 0);

  if (delivered === 0) {
    // 경보가 한 채널도 도달하지 못한 상황 — 이게 가장 위험하다.
    console.error(
      `[ops-alert] 경보가 어떤 채널로도 전달되지 않았습니다. text="${text}" ` +
        `telegram=${telegram.error ?? (telegram.skipped ? 'skipped' : 'failed')} ` +
        `slack=${slack.error ?? (slack.skipped ? 'skipped' : 'failed')} ` +
        `slackOps(${OPS_CHANNEL})=${slackOpsChannel.error ?? (slackOpsChannel.skipped ? 'skipped' : 'failed')}`
    );
  }

  return { delivered, telegram, slack, slackOpsChannel };
}
