import Link from 'next/link';

interface TrustPoint {
  num: string;
  label: string;
  meta: string;
}

const trustPoints: TrustPoint[] = [
  // TODO: 콘텐츠 확인 필요 — 4-Point Verification 카드 디자인 추가, CMS 확인 필요
  { num: '01', label: '원산지 — 베트남 하띤 직영 200ha', meta: 'CITES' },
  { num: '02', label: '원료 — Aquilaria Agallocha Roxburgh', meta: '식약처' },
  { num: '03', label: '제조 — HACCP · GMP 시설', meta: '인증' },
  { num: '04', label: '시험 — 중금속·유해물질 0건', meta: 'LOT별' },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[780px] h-screen flex items-end overflow-hidden bg-lx-black text-lx-ivory"
    >
      {/* Background image + gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50 scale-110"
        style={{
          backgroundImage:
            "url('https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-lx-black/30 via-lx-black/10 to-lx-black/75" />
      <div className="absolute inset-0 bg-hero-gold pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-page mx-auto px-7 lg:px-16 pb-32 lg:pb-28">
        <div className="grid grid-cols-1 gap-14 items-end lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          {/* Left — headline */}
          <div>
            <div className="inline-flex items-center gap-4 mb-7">
              <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-400">
                Verified Agarwood · 참침향
              </span>
              <span className="font-mono text-[0.7rem] tracking-[0.2em] text-white/50 tabular-nums">
                01 — 03
              </span>
            </div>

            <h1 className="text-[clamp(2.5rem,5.5vw,4.8rem)] font-extralight tracking-kr-tight leading-[1.1] mb-6">
              확인되는 침향,
              <br />
              <em className="font-serif text-gold-400 font-normal not-italic">
                대라천 &lsquo;참&rsquo;침향
              </em>
            </h1>

            <p className="text-[0.95rem] md:text-base leading-[1.9] text-white/75 font-light max-w-[520px] mb-11">
              베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향. 원산지·원료·제조·시험까지
              4단계로 검증된 침향을 프리미엄이 아니라 근거로 증명합니다.
            </p>

            <div className="flex flex-wrap gap-3.5">
              <Link
                href="#verified"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gold-500 text-lx-black border border-gold-500 text-xs font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:bg-gold-700 hover:border-gold-700 hover:-translate-y-0.5"
              >
                검증 과정 보기 →
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-transparent text-white border border-white/35 text-xs font-medium tracking-en-nav uppercase transition-all duration-400 ease-out-soft hover:border-gold-500 hover:text-gold-400 hover:-translate-y-0.5"
              >
                제품 보기
              </Link>
            </div>
          </div>

          {/* Right — 4-point verification card */}
          <aside className="border-l border-gold-500/30 pl-7 bg-white/5 backdrop-blur-md p-7 md:p-8 border border-gold-500/20">
            <div className="font-mono text-[0.6rem] tracking-[0.32em] uppercase text-gold-500 font-semibold mb-6">
              4-Point Verification
            </div>
            <div className="flex flex-col gap-4">
              {trustPoints.map((p, i) => (
                <div
                  key={p.num}
                  className={`grid grid-cols-[auto_1fr_auto] items-center gap-3.5 pb-3.5 ${
                    i < trustPoints.length - 1 ? 'border-b border-white/10' : ''
                  }`}
                >
                  <div className="w-7 h-7 border border-gold-500 flex items-center justify-center font-mono text-[0.62rem] tracking-[0.1em] text-gold-500">
                    {p.num}
                  </div>
                  <div className="text-[0.78rem] text-white font-normal">{p.label}</div>
                  <div className="font-mono text-[0.58rem] tracking-[0.18em] uppercase text-white/50">
                    {p.meta}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* Meta bar bottom-left */}
      <div className="absolute left-7 lg:left-16 bottom-10 z-[3] flex items-center gap-5 font-mono text-[0.65rem] tracking-[0.2em] uppercase text-white/55">
        <span>VN · HÀ TĨNH</span>
        <span className="w-[3px] h-[3px] rounded-full bg-gold-500" />
        <span>Est. 1999</span>
        <span className="w-[3px] h-[3px] rounded-full bg-gold-500" />
        <span>400만+ Trees</span>
      </div>
    </section>
  );
}
