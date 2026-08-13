import Link from 'next/link';

/**
 * 관리자 가이드라인 — 목록.
 *
 * 사이트 운영자가 콘텐츠를 올릴 때 지켜야 할 기준을 모아 두는 곳.
 * 첫 항목은 블로그 타이포그래피(폰트·크기·색·행간) 기준.
 */

interface GuidelineCard {
  href: string;
  icon: string;
  title: string;
  desc: string;
  meta: string;
}

const GUIDELINES: GuidelineCard[] = [
  {
    href: '/admin/guidelines/typography',
    icon: '🔤',
    title: '타이포그래피',
    desc: '블로그 글을 올릴 때 쓰는 폰트·글자 크기·글자 색·행간 기준. 블록 서식별 실제 표시 예시 포함.',
    meta: '블로그 · 에디터',
  },
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#b8862c]">
          Guidelines
        </p>
        <h1 className="text-2xl font-bold text-gray-900">관리자 가이드라인</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          콘텐츠를 올릴 때 사이트 전체 톤을 유지하기 위한 기준 문서입니다.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {GUIDELINES.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-[#d4a843] hover:bg-[#fdfbf7]"
            >
              <span className="text-2xl leading-none" aria-hidden>
                {g.icon}
              </span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-gray-900">{g.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-gray-600">{g.desc}</span>
                <span className="mt-2 block text-xs uppercase tracking-[0.16em] text-gray-400">
                  {g.meta}
                </span>
              </span>
              <span className="text-gray-300" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
