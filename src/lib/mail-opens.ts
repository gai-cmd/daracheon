import { readData, readDataForWrite, writeDataMerged } from '@/lib/db';

/**
 * 답변 메일 열람 기록 — inquiries 와 분리된 별도 저장소.
 *
 * 왜 분리했나 (2026-08-13 답변 유실 사고):
 * 열람 기록을 문의 레코드에 함께 쓰던 시절, 답변 저장과 열람 추적이 같은
 * 파일을 read-modify-write 로 다퉜다. Vercel Blob 은 쓰기 직후 최대 1분가량
 * 옛 값을 돌려줄 수 있어(read-after-write 전파 지연), 답변 저장 21초 뒤에
 * 들어온 열람 추적이 "최신본 재읽기"에서 그 답변을 보지 못한 채 옛 레코드
 * 위에 열람 시각만 얹어 저장했다. 결과적으로 발송까지 끝난 답변이 관리자
 * 화면에서 통째로 사라졌다 (고객은 메일을 받았는데 기록만 증발).
 * 열람 기록을 다른 파일로 빼면 두 쓰기가 만날 일이 없어 이 유실 경로 자체가
 * 사라진다. 열람 기록끼리의 경합은 남지만, 잃어도 통계 한 줄이다.
 *
 * replyAt 을 함께 저장하는 이유:
 * 새 답변을 보내면 그 이전 답변의 열람 기록은 무효다. 답변 저장 경로에서
 * 열람 기록을 지우게 하면 다시 두 저장소를 한 흐름에서 건드리게 되므로,
 * "어느 답변에 대한 열람인지"를 기록에 담아 조회 시점에 판정한다.
 * 답변 저장 코드는 이 파일을 전혀 알 필요가 없다.
 */
export interface MailOpenRecord {
  /** 문의 ID — 문의 1건당 최신 열람 상태 1행 */
  id: string;
  /** 이 열람이 가리키는 답변의 replyAt. 문의의 현재 replyAt 과 다르면 옛 기록. */
  replyAt?: string;
  openedAt: string;
  lastOpenAt: string;
  openCount: number;
}

const FILE = 'mail-opens';

export async function readMailOpens(): Promise<MailOpenRecord[]> {
  return readData<MailOpenRecord>(FILE);
}

export interface MailOpenView {
  openedAt?: string;
  lastOpenAt?: string;
  openCount?: number;
}

/**
 * 문의에 붙일 열람 상태를 고른다.
 * 현재 답변(replyAt)에 대한 기록만 유효로 본다 — 답변을 새로 보냈는데 옛
 * 열람이 남아 "이번 답변을 읽었다"로 보이면 운영 판단을 그르친다.
 *
 * 분리 이전에 문의 레코드에 직접 쌓인 기록은 그대로 살려 쓴다(폴백). 과거
 * 데이터를 옮기는 일회성 마이그레이션 없이 점진적으로 새 저장소로 넘어간다.
 */
export function pickOpenFor(
  inquiry: { id: string; replyAt?: string; openedAt?: string; lastOpenAt?: string; openCount?: number },
  opens: Map<string, MailOpenRecord>,
): MailOpenView {
  const rec = opens.get(inquiry.id);
  if (rec && (!rec.replyAt || !inquiry.replyAt || rec.replyAt === inquiry.replyAt)) {
    return { openedAt: rec.openedAt, lastOpenAt: rec.lastOpenAt, openCount: rec.openCount };
  }
  // 옛 답변에 대한 열람 — 문의 레코드에 남은 값까지 확실히 덮어 지운다.
  // (키를 빼면 호출부의 spread 가 옛 값을 그대로 살려 "이번 답변을 읽었다"로 보인다.)
  if (rec) return { openedAt: undefined, lastOpenAt: undefined, openCount: undefined };
  return {
    openedAt: inquiry.openedAt,
    lastOpenAt: inquiry.lastOpenAt,
    openCount: inquiry.openCount,
  };
}

/** 조회 편의 — id 로 찾을 수 있게 Map 으로. 실패해도 빈 Map (열람 표시는 부가 정보). */
export async function loadMailOpenMap(): Promise<Map<string, MailOpenRecord>> {
  try {
    const rows = await readMailOpens();
    return new Map(rows.map((r) => [r.id, r]));
  } catch (err) {
    console.warn('[mail-opens] read failed — 열람 표시 생략', err);
    return new Map();
  }
}

/**
 * 열람 1회 기록. 같은 답변에 대한 재열람이면 카운트만 올린다.
 * @returns isFirst — 이 답변에 대한 첫 열람인지 (슬랙 통지 1회 제한용)
 */
export async function recordMailOpen(
  inquiryId: string,
  replyAt: string | undefined,
  nowIso: string,
): Promise<{ isFirst: boolean }> {
  const rows = await readDataForWrite<MailOpenRecord>(FILE);
  const idx = rows.findIndex((r) => r.id === inquiryId);
  const prev = idx === -1 ? null : rows[idx];

  // 답변이 새로 나갔으면 이전 답변의 누적은 승계하지 않는다.
  const sameReply = !!prev && (!prev.replyAt || !replyAt || prev.replyAt === replyAt);
  const isFirst = !prev || !sameReply;

  const next: MailOpenRecord = {
    id: inquiryId,
    replyAt,
    openedAt: sameReply && prev ? prev.openedAt : nowIso,
    lastOpenAt: nowIso,
    openCount: sameReply && prev ? (prev.openCount ?? 0) + 1 : 1,
  };

  if (idx === -1) rows.push(next);
  else rows[idx] = next;

  await writeDataMerged(FILE, rows);
  return { isFirst };
}
