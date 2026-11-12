/**
 * 홈쇼핑 방송 JSON-LD 의 eventStatus 판정.
 *
 * schema.org EventStatusType 에는 EventCompleted 가 없다. 지난 방송은 eventStatus 를 싣지 않고
 * startDate·endDate 로만 나타낸다. 저장된 status 는 방송이 끝난 뒤에도 'scheduled' 로 남아 있는 경우가
 * 많아(어드민에서 '종료'로 바꾸지 않음), 지났는지는 status 가 아니라 종료 시각으로 판정한다.
 */
export function isBroadcastPast(endIso: string, now: Date): boolean {
  const end = new Date(endIso).getTime();
  // 날짜를 읽을 수 없으면 '예정'이라고 단정하지 않는다.
  return Number.isNaN(end) || end < now.getTime();
}

export function broadcastEventStatus(status: string | undefined, endIso: string, now: Date): string | undefined {
  if (status === 'canceled') return 'https://schema.org/EventCancelled';
  if (status === 'ended' || isBroadcastPast(endIso, now)) return undefined;
  return 'https://schema.org/EventScheduled';
}
