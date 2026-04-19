import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface Stat {
  value: string;
  unit?: string;
  label: string;
  caption: string;
}

// TODO: 콘텐츠 확인 필요 — Trust Strip 통계 디자인 추가, CMS 확인 필요
const stats: Stat[] = [
  { value: '25', unit: 'yrs', label: 'Research', caption: '1999년부터 이어진 침향 연구' },
  { value: '400만', unit: '+', label: 'Trees', caption: '하띤성 직영 농장 보유 수목' },
  { value: '200', unit: 'ha', label: 'Farm', caption: '베트남 하띤성 유기농 직영지' },
  { value: '8', unit: '건', label: 'Certifications', caption: 'HACCP·GMP·CITES 외 5건' },
];

export default function TrustStrip() {
  return (
    <section className="bg-lx-black text-white border-y border-gold-500/18">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <RevealOnScroll key={s.label} delay={i * 100}>
            <div className="relative px-6 py-10 border-r last:border-r-0 border-b md:border-b-0 border-white/6 overflow-hidden h-full">
              <div className="font-serif text-[clamp(2rem,3.6vw,2.9rem)] font-extralight text-gold-400 leading-none tracking-kr-tight">
                {s.value}
                {s.unit && (
                  <span className="text-[0.5em] text-white/50 font-light ml-0.5">{s.unit}</span>
                )}
              </div>
              <div className="mt-3 font-mono text-[0.68rem] tracking-[0.28em] text-white/55 uppercase">
                {s.label}
              </div>
              <div className="mt-2.5 text-[0.8rem] text-white/85 leading-[1.6] font-light">
                {s.caption}
              </div>
              <span
                aria-hidden
                className="absolute right-5 top-6 w-2.5 h-2.5 border border-gold-500 rotate-45 opacity-50"
              />
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
