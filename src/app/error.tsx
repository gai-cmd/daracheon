'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// 세그먼트 에러 바운더리 — 특정 페이지 렌더 중 예외가 나도 사이트 전체가
// 깨지지 않고 이 폴백 UI 를 보여준다(레이아웃·헤더·푸터는 유지). reset() 으로
// 해당 세그먼트만 다시 렌더 시도한다. (2026-07-08 안정성 대책: 에러 바운더리 부재 해소)
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 서버 로그로 수집(향후 Sentry 연동 지점). digest 는 서버 에러와 매칭되는 해시.
    console.error('[page-error]', error?.digest ?? '', error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-[#0a0b10] px-6 text-white">
      <div className="max-w-md text-center">
        <div className="mb-4 font-display text-[5rem] font-light leading-none text-gold-500/30">
          !
        </div>
        <h1 className="mb-3 font-serif text-2xl">일시적인 문제가 발생했습니다</h1>
        <p className="mx-auto mb-8 max-w-sm text-sm text-white/50">
          페이지를 표시하는 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 메인으로
          이동해 주세요. 문제가 계속되면 잠시 뒤 다시 방문해 주세요.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn btn-gold">
            다시 시도
          </button>
          <Link
            href="/"
            className="text-sm text-white/60 underline decoration-gold-500/40 underline-offset-4 transition-colors hover:text-white"
          >
            메인으로
          </Link>
        </div>
        {error?.digest && (
          <p className="mt-6 font-mono text-[11px] text-white/25">오류 코드: {error.digest}</p>
        )}
      </div>
    </section>
  );
}
