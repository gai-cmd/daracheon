import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { readSingleUncached, writeSingle, readDataForWrite, writeDataMerged } from '@/lib/db';
import { notifyTelegramInbound, logInboundToSheet } from '@/lib/integrations';

/**
 * 수신(IMAP) 파이프라인.
 *
 * Gmail 앱 비밀번호로 imap.gmail.com 에 접속해 고객 답신을 수집한다.
 * 사장님이 직접 읽는 실제 지원 인박스이므로 \Seen 플래그는 건드리지 않고,
 * UID 하이워터마크(inbound-state.lastUid)만 올려 신규 메일만 1회 처리한다.
 *
 * 매칭: 발신 제목의 [#inq-...] 토큰 우선, 없으면 발신 이메일로 최근 문의에 연결.
 */

interface MailSettingsLite {
  smtpUser?: string;
  smtpPass?: string;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPass?: string;
  inboundEnabled?: boolean;
}

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  enabled: boolean;
}

export interface InboundReply {
  at: string;          // ISO 수신 시각
  from: string;        // 발신 이메일
  fromName?: string;
  subject: string;
  body: string;        // 텍스트 본문 (없으면 HTML 스트립)
  messageId?: string;
}

interface InquiryLike {
  id: string;
  name: string;
  email: string;
  status: string;
  subject?: string;
  category?: string;
  createdAt?: string;
  inbound?: InboundReply[];
  [k: string]: unknown;
}

interface InboundState {
  lastUid?: number;
}

async function resolveImapConfig(): Promise<ImapConfig> {
  const s = (await readSingleUncached<MailSettingsLite>('mail-settings')) ?? {};
  return {
    host: s.imapHost?.trim() || process.env.IMAP_HOST || 'imap.gmail.com',
    port: s.imapPort || (process.env.IMAP_PORT ? Number(process.env.IMAP_PORT) : 993),
    user: s.imapUser?.trim() || s.smtpUser?.trim() || process.env.IMAP_USER || process.env.SMTP_USER || '',
    pass: s.imapPass?.trim() || s.smtpPass?.trim() || process.env.IMAP_PASS || process.env.SMTP_PASS || '',
    // ENV(IMAP_USER/PASS) 만으로 구성된 경우에도 동작하도록, 자격이 갖춰지면 enabled 허용.
    enabled: s.inboundEnabled === true || (!!process.env.IMAP_USER && !!process.env.IMAP_PASS),
  };
}

function makeClient(cfg: ImapConfig): ImapFlow {
  return new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 993,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });
}

export interface ImapTestResult {
  ok: boolean;
  error?: string;
  info?: string;
}

/** 어드민 "수신 연결 테스트" — 접속·INBOX 열기만 확인하고 종료. */
export async function testImapConnection(): Promise<ImapTestResult> {
  const cfg = await resolveImapConfig();
  if (!cfg.user || !cfg.pass) {
    return { ok: false, error: 'IMAP 사용자/비밀번호가 없습니다. (SMTP 계정·앱 비밀번호를 먼저 저장하세요)' };
  }
  let client: ImapFlow | null = null;
  try {
    client = makeClient(cfg);
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const exists =
        client.mailbox && typeof client.mailbox !== 'boolean' ? client.mailbox.exists : 0;
      return { ok: true, info: `${cfg.host} 연결 정상 · 받은편지함 ${exists}통` };
    } finally {
      lock.release();
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (client) await client.logout().catch(() => {});
  }
}

function extractInquiryId(subject: string): string | null {
  const m = subject.match(/#(inq-\d+)/i);
  return m ? m[1] : null;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Gmail 인용/서명 잡음 제거 — "On ... wrote:" 이후 인용부는 잘라 핵심 답신만.
function stripQuoted(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) break;
    if (/^On .+wrote:\s*$/.test(line)) break;
    if (/^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}.*작성/.test(line)) break;
    if (/^-{2,}\s*$/.test(line) || /^={3,}/.test(line)) break;
    out.push(line);
  }
  const joined = out.join('\n').trim();
  return joined.length > 0 ? joined : text.trim();
}

export interface PollResult {
  ok: boolean;
  skipped?: boolean;
  processed: number;
  matched: number;
  error?: string;
  details?: Array<{ from: string; inquiryId: string | null; subject: string }>;
}

export async function pollInbox(): Promise<PollResult> {
  const cfg = await resolveImapConfig();
  if (!cfg.enabled) return { ok: true, skipped: true, processed: 0, matched: 0 };
  if (!cfg.user || !cfg.pass) {
    return { ok: false, processed: 0, matched: 0, error: 'IMAP 자격 정보 없음' };
  }

  const state = (await readSingleUncached<InboundState>('inbound-state')) ?? {};
  let client: ImapFlow | null = null;
  const collected: InboundReply[] = [];
  let maxUid = state.lastUid ?? 0;

  try {
    client = makeClient(cfg);
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const mb = client.mailbox && typeof client.mailbox !== 'boolean' ? client.mailbox : null;
      const uidNext = mb?.uidNext ?? 1;

      // 첫 실행: 과거 메일 전체 백필 방지 — 현재 시점을 기준선으로만 잡고 종료.
      if (state.lastUid === undefined) {
        await writeSingle<InboundState>('inbound-state', { lastUid: Math.max(0, uidNext - 1) });
        return { ok: true, processed: 0, matched: 0, details: [] };
      }

      const from = state.lastUid + 1;
      if (from >= uidNext) {
        return { ok: true, processed: 0, matched: 0, details: [] };
      }

      // range 는 UID 범위 문자열, 세 번째 인자 {uid:true} 가 "range 를 UID 로 해석".
      // (객체 range 는 검색조건으로 오해될 수 있어 정식 형태 사용)
      for await (const msg of client.fetch(
        `${from}:*`,
        { uid: true, source: true },
        { uid: true },
      )) {
        if (typeof msg.uid === 'number' && msg.uid <= (state.lastUid ?? 0)) continue;
        if (typeof msg.uid === 'number' && msg.uid > maxUid) maxUid = msg.uid;
        if (!msg.source) continue;

        const parsed = await simpleParser(msg.source);
        const fromAddr = parsed.from?.value?.[0];
        const email = (fromAddr?.address ?? '').toLowerCase();
        const fromName = fromAddr?.name || undefined;
        const subject = parsed.subject ?? '';
        const rawText = parsed.text ?? (parsed.html ? htmlToText(parsed.html) : '');
        const body = stripQuoted(rawText).slice(0, 4000);

        collected.push({
          at: (parsed.date ?? new Date()).toISOString(),
          from: email,
          fromName,
          subject,
          body,
          messageId: parsed.messageId,
        });
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    return { ok: false, processed: 0, matched: 0, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (client) await client.logout().catch(() => {});
  }

  // 신규 메일이 없으면 하이워터마크만 전진하고 종료.
  // ⚠️ 메일이 있을 때는 하이워터마크를 "처리 성공 후" 에만 전진시킨다 —
  // 먼저 전진시키면 아래 inquiries 읽기/쓰기가 throw 했을 때 collected 가
  // 재폴링되지 않아 고객 답신이 파이프라인에서 영구 유실된다.
  // (재처리 중복은 아래 messageId dedup 이 방지 — at-least-once + dedup)
  if (collected.length === 0) {
    if (maxUid > (state.lastUid ?? 0)) {
      await writeSingle<InboundState>('inbound-state', { lastUid: maxUid });
    }
    return { ok: true, processed: 0, matched: 0, details: [] };
  }

  // 인박스에 우리가 보낸 메일(자기 자신)·자동응답이 섞일 수 있으니 발신자가
  // 우리 계정과 같으면 스킵.
  const selfAddr = cfg.user.toLowerCase();
  // 쓰기 베이스 전용 read — 시드 폴백 금지 (stale 베이스 덮어쓰기 유실 방지).
  const inquiries = await readDataForWrite<InquiryLike>('inquiries');
  const details: PollResult['details'] = [];
  let matched = 0;
  let mutated = false;

  for (const mail of collected) {
    if (mail.from === selfAddr) continue;

    let inq: InquiryLike | undefined;
    const tokenId = extractInquiryId(mail.subject);
    if (tokenId) inq = inquiries.find((q) => q.id === tokenId);
    if (!inq && mail.from) {
      // 토큰 없으면 같은 이메일의 가장 최근 문의에 연결.
      const byEmail = inquiries
        .filter((q) => (q.email ?? '').toLowerCase() === mail.from)
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
      inq = byEmail[0];
    }

    details.push({ from: mail.from, inquiryId: inq?.id ?? null, subject: mail.subject });

    if (inq) {
      // 재처리(이전 시도 실패 후 재폴링) 시 같은 메일을 두 번 쌓지 않도록
      // messageId 로 dedup. 미매칭 메일은 dedup 불가 — 재처리 시 알림이
      // 중복될 수 있으나 유실보다 낫다.
      const isDup =
        !!mail.messageId && (inq.inbound ?? []).some((r) => r.messageId === mail.messageId);
      if (isDup) continue;
      matched++;
      mutated = true;
      inq.inbound = [...(inq.inbound ?? []), mail];
      // 고객이 다시 응답 → 재확인 필요. resolved/replied 였으면 pending 으로 되돌림.
      if (inq.status === 'resolved' || inq.status === 'replied' || inq.status === 'closed') {
        inq.status = 'pending';
      }
    }

    // 매칭 여부와 무관하게 운영팀에 알림 (미매칭도 놓치지 않도록).
    await notifyTelegramInbound({
      inquiryId: inq?.id,
      from: mail.from,
      fromName: mail.fromName,
      subject: mail.subject,
      body: mail.body,
    }).catch(() => {});

    await logInboundToSheet({
      inquiryId: inq?.id,
      at: mail.at,
      from: mail.from,
      fromName: mail.fromName,
      subject: mail.subject,
      body: mail.body,
    }).catch(() => {});
  }

  if (mutated) await writeDataMerged('inquiries', inquiries);

  // 처리(매칭·저장·알림)가 끝난 뒤에만 하이워터마크 전진 — 위 단계가 throw
  // 했으면 여기 도달하지 않아 다음 폴링이 같은 UID 범위를 재처리한다.
  if (maxUid > (state.lastUid ?? 0)) {
    await writeSingle<InboundState>('inbound-state', { lastUid: maxUid });
  }

  return { ok: true, processed: collected.length, matched, details };
}
