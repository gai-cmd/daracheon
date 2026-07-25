import { describe, it, expect } from 'vitest';
import { parseSnapshotLabel, parseSnapshotCreatedAt } from '@/lib/backup';

// 2026-07-26 회귀 방지:
//  ① 'pre-delete-...' 를 'pre' 로 자르면 보존정책 키가 매칭되지 않아 한도 20 이
//     적용되지 않는다(실측: 34개 잔존).
//  ② uploadedAt 은 blob 이전·재업로드로 리셋되므로 백업 나이 판단 근거가 못 된다.
//     id 에 박힌 생성 시각을 복원할 수 있어야 워치독이 무력화되지 않는다.

describe('parseSnapshotLabel', () => {
  it('하이픈이 포함된 라벨을 통째로 인식한다', () => {
    expect(parseSnapshotLabel('pre-delete-2026-07-21T15-20-28-872Z')).toBe('pre-delete');
    expect(parseSnapshotLabel('pre-restore-2026-07-21T15-20-28-872Z')).toBe('pre-restore');
  });

  it('단순 라벨도 인식한다', () => {
    expect(parseSnapshotLabel('daily-2026-07-25T16-44-14-564Z')).toBe('daily');
    expect(parseSnapshotLabel('manual-2026-07-25T16-44-14-564Z')).toBe('manual');
  });

  it('알 수 없는 라벨은 unknown 으로 처리한다', () => {
    expect(parseSnapshotLabel('weekly-2026-07-25T16-44-14-564Z')).toBe('unknown');
    expect(parseSnapshotLabel('daily')).toBe('unknown');
    expect(parseSnapshotLabel('')).toBe('unknown');
  });
});

describe('parseSnapshotCreatedAt', () => {
  it('id 의 타임스탬프를 ISO 로 복원한다', () => {
    expect(parseSnapshotCreatedAt('daily-2026-07-25T16-44-14-564Z')).toBe('2026-07-25T16:44:14.564Z');
  });

  it('하이픈 라벨에서도 타임스탬프를 정확히 분리한다', () => {
    expect(parseSnapshotCreatedAt('pre-delete-2026-07-21T15-20-28-872Z')).toBe('2026-07-21T15:20:28.872Z');
  });

  it('형식이 어긋나면 null 을 돌려 호출자가 uploadedAt 으로 폴백하게 한다', () => {
    expect(parseSnapshotCreatedAt('daily-not-a-timestamp')).toBeNull();
    expect(parseSnapshotCreatedAt('unknown-label-2026-07-25T16-44-14-564Z')).toBeNull();
  });

  it('복원된 시각으로 최신 스냅샷을 고를 수 있다 (워치독 신선도 판정 경로)', () => {
    const ids = [
      'daily-2026-07-13T07-46-15-237Z',
      'daily-2026-07-25T16-44-14-564Z',
      'daily-2026-07-14T00-17-35-785Z',
    ];
    const latest = ids
      .map((id) => parseSnapshotCreatedAt(id)!)
      .reduce((a, b) => (b > a ? b : a));
    expect(latest).toBe('2026-07-25T16:44:14.564Z');
  });
});
