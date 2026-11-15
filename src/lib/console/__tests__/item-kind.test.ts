import { describe, expect, it } from 'vitest';
import { LINK_ACCESS_METHODS, applyKind, kindOf, linkMemoryFor, needsCredDeleteConfirm } from '../ui-model';

// SPEC-CONSOLE-002 AC-CS2-009: 종류 선택 → 저장 칸 변환과 왕복 복원(CS2-D12), 저장 전 삭제 확인(CS2-D11).
describe('item kind', () => {
  it('공유 계정 항목만 공유 계정으로 열린다', () => {
    expect(kindOf(null)).toBe('link');
    expect(kindOf({ access_method: 'public' })).toBe('link');
    expect(kindOf({ access_method: 'sso' })).toBe('link');
    expect(kindOf({ access_method: 'shared-credential' })).toBe('shared');
  });

  it('새 항목: 공유 계정 → account/shared-credential, 다시 링크 → link/public', () => {
    let mem = linkMemoryFor(null);
    let st = { type: 'link' as const, access_method: 'public' as const } as Parameters<typeof applyKind>[0];
    ({ state: st, memory: mem } = applyKind(st, 'shared', mem));
    expect(st).toEqual({ type: 'account', access_method: 'shared-credential' });
    ({ state: st, memory: mem } = applyKind(st, 'link', mem));
    expect(st).toEqual({ type: 'link', access_method: 'public' });
  });

  it('project/sso 로 열린 항목은 왕복하면 project/sso 로 돌아온다', () => {
    const item = { type: 'project', access_method: 'sso' } as const;
    let mem = linkMemoryFor(item);
    let st = { ...item } as Parameters<typeof applyKind>[0];
    ({ state: st, memory: mem } = applyKind(st, 'shared', mem));
    ({ state: st, memory: mem } = applyKind(st, 'link', mem));
    expect(st).toEqual({ type: 'project', access_method: 'sso' });
  });

  it('링크 상태에서 접속 방식을 invite 로 바꾼 뒤 왕복하면 마지막 링크 값 project/invite', () => {
    const item = { type: 'project', access_method: 'sso' } as const;
    let mem = linkMemoryFor(item);
    let st = { type: 'project', access_method: 'invite' } as Parameters<typeof applyKind>[0];
    ({ state: st, memory: mem } = applyKind(st, 'shared', mem));
    expect(st).toEqual({ type: 'account', access_method: 'shared-credential' });
    ({ state: st, memory: mem } = applyKind(st, 'link', mem));
    expect(st).toEqual({ type: 'project', access_method: 'invite' });
  });

  it('공유 계정으로 열린 항목에서 링크로 → link/public', () => {
    const item = { type: 'account', access_method: 'shared-credential' } as const;
    const mem = linkMemoryFor(item);
    const { state } = applyKind({ ...item }, 'link', mem);
    expect(state).toEqual({ type: 'link', access_method: 'public' });
  });

  it('같은 종류를 다시 골라도 값이 바뀌지 않는다', () => {
    const mem = linkMemoryFor(null);
    const st = { type: 'channel', access_method: 'invite' } as const;
    expect(applyKind(st, 'link', mem).state).toEqual(st);
  });

  it('링크의 접속 방식 선택지에는 공유 계정이 없다', () => {
    expect(LINK_ACCESS_METHODS).not.toContain('shared-credential');
    expect(LINK_ACCESS_METHODS).toContain('public');
  });

  it('저장된 아이디나 비밀번호가 있는 항목을 링크로 저장할 때만 삭제 확인', () => {
    const stored = { hasLoginId: true, hasPassword: false };
    expect(needsCredDeleteConfirm(stored, 'link')).toBe(true);
    expect(needsCredDeleteConfirm({ hasLoginId: false, hasPassword: true }, 'link')).toBe(true);
    expect(needsCredDeleteConfirm(stored, 'shared')).toBe(false);
    expect(needsCredDeleteConfirm({ hasLoginId: false, hasPassword: false }, 'link')).toBe(false);
    expect(needsCredDeleteConfirm(null, 'link')).toBe(false);
  });
});
