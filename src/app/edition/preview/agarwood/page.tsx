import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSingleSafe } from '@/lib/db';
import { agarwoodEditionKo } from '@/content/edition/agarwood.ko';
import type { EditionContent } from '@/content/edition/types';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import EditionClient from '../../[token]/agarwood/EditionClient';

// 어드민 전용 미리보기 — 토큰/리드 없이 카탈로그를 렌더한다.
// 세션 쿠키로만 게이트하므로 일반 방문자는 접근 불가.
export const metadata: Metadata = {
  title: '대라천 디지털 에디션 — 미리보기',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function EditionPreviewPage() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) {
    redirect('/admin/login?next=/edition/preview/agarwood');
  }

  const pages = await readSingleSafe<{ editionAgarwood?: EditionContent }>('pages');
  const content: EditionContent = pages?.editionAgarwood ?? agarwoodEditionKo;

  return (
    <>
      {/* 미리보기 안내 배너 — 화면 상단에 고정 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(90deg, #b88c2d, #d4a843)',
          color: '#0a0b10',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '8px 16px',
          fontWeight: 600,
        }}
      >
        ▶ 어드민 미리보기 · Preview Mode (열람 기록 미저장)
      </div>
      <div style={{ paddingTop: 36 }}>
        <EditionClient
          content={content}
          reader={{ name: session.email.split('@')[0] || 'Preview', company: 'ZOEL LIFE Admin' }}
        />
      </div>
    </>
  );
}
