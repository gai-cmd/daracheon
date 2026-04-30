import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { recordView } from '@/lib/leads';
import { agarwoodEditionKo } from '@/content/edition/agarwood.ko';
import EditionClient from './EditionClient';

export const metadata: Metadata = {
  title: '대라천 디지털 에디션 — 진짜 침향의 25년',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function EditionPage({ params }: PageProps) {
  const { token } = await params;
  const result = await recordView(token);

  if ('error' in result) {
    if (result.error === 'expired') {
      return (
        <ExpiredOrInvalid
          title="링크가 만료되었습니다"
          body="이 디지털 에디션 링크는 14일이 경과하여 더 이상 사용할 수 없습니다. 다시 신청해 주세요."
        />
      );
    }
    if (result.error === 'unverified') {
      return (
        <ExpiredOrInvalid
          title="이메일 인증이 필요합니다"
          body="받은 메일 안의 인증 버튼을 먼저 클릭해 주세요. 인증 후 자동으로 이 페이지로 이동합니다."
        />
      );
    }
    notFound();
  }

  return (
    <EditionClient
      content={agarwoodEditionKo}
      reader={{ name: result.name, company: result.company }}
    />
  );
}

function ExpiredOrInvalid({ title, body }: { title: string; body: string }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050608',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 40px)',
      }}
    >
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.66rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 18,
          }}
        >
          Access Denied
        </div>
        <h1
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 300,
            fontSize: 'clamp(1.6rem, 3.2vw, 2rem)',
            lineHeight: 1.4,
            margin: 0,
            marginBottom: 20,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.85,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 36,
            fontWeight: 300,
          }}
        >
          {body}
        </p>
        <a
          href="/agarwood-edition"
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: 'var(--accent)',
            color: 'var(--lx-black)',
            textDecoration: 'none',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          다시 신청하기
        </a>
      </div>
    </main>
  );
}
