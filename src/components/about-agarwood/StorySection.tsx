import type { ReactNode } from 'react';

interface StorySectionProps {
  num: string;
  tag: string;
  title: string;
  alt?: boolean;
  children: ReactNode;
}

/**
 * StorySection — 브랜드 이야기 타임라인 챕터 블록.
 * 2컬럼 레이아웃: 좌측(sticky, 220px)에 큰 챕터 번호 + mono tag,
 * 우측(1fr)에 H3 제목 + 본문(max 62ch).
 *
 * @param alt - true일 경우 배경을 `bg-[#0c0d13]`로 교차.
 */
export default function StorySection({
  num,
  tag,
  title,
  alt = false,
  children,
}: StorySectionProps) {
  return (
    <section
      className={`border-b border-gold-500/10 ${alt ? 'bg-[#0c0d13]' : 'bg-lx-black'}`}
    >
      <div className="max-w-page mx-auto px-7 lg:px-16 py-[90px]">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-20">
          <div className="md:sticky md:top-[calc(var(--nav-h)+40px)] md:self-start">
            <div className="font-serif text-[3.2rem] font-light leading-none tracking-kr-tight text-gold-500">
              {num}
            </div>
            <div className="mt-4 font-mono text-[0.66rem] tracking-en-tag uppercase text-white/50">
              {tag}
            </div>
          </div>

          <div className="max-w-[62ch]">
            <h3 className="text-[clamp(1.5rem,2.6vw,2rem)] font-light tracking-[-0.01em] leading-[1.3] mb-6 text-white">
              {title}
            </h3>
            <div className="text-[1.02rem] leading-[1.95] font-light text-white/72 space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
