import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface Card {
  step: string;
  title: string;
  en: string;
  body: string;
}

interface Cert {
  mark: string;
  name: string;
  sub: string;
}

interface Props {
  cards?: Card[];
  certs?: Cert[];
  notice?: React.ReactNode;
}

// TODO: 콘텐츠 확인 필요 — 3-Card Verified 섹션 디자인 추가, CMS 확인 필요
const defaultCards: Card[] = [
  {
    step: '01 · Origin',
    title: '학명 확인된 AAR',
    en: 'Aquilaria Agallocha Roxburgh',
    body:
      "식약처 '대한민국약전외한약(생약)규격집'에 등록된 공식 학명. 유전자(DNA) 검증으로 종 일치 확인 후에만 가공 단계로 진입합니다.",
  },
  {
    step: '02 · Process',
    title: 'HACCP·GMP 생산',
    en: 'Controlled Manufacturing',
    body:
      '원료 수령·분쇄·배합·충전·포장의 5단계 공정을 HACCP 및 GMP 시설에서 관리. 공정별 기록이 Lot 단위로 유지됩니다.',
  },
  {
    step: '03 · Evidence',
    title: 'Lot별 시험성적서',
    en: 'Per-Batch Lab Reports',
    body:
      '중금속(납·카드뮴·비소·수은)·잔류농약·유해물질 검사를 제조 Lot 단위로 실시. 결과는 제품 패키지 QR로 언제든 열람 가능합니다.',
  },
];

// TODO: 콘텐츠 확인 필요 — 8개 인증 chip 디자인 추가, CMS 확인 필요
const defaultCerts: Cert[] = [
  { mark: 'C', name: 'CITES', sub: '국제 보호 수종' },
  { mark: 'H', name: 'HACCP', sub: '식품 안전' },
  { mark: 'G', name: 'GMP', sub: '우수 제조' },
  { mark: 'O', name: 'ORGANIC', sub: '유기농' },
  { mark: 'V', name: '원산지', sub: '베트남 증명' },
  { mark: 'D', name: 'DNA', sub: '유전자 검증' },
  { mark: 'F', name: '식약처', sub: '고시 학명' },
  { mark: 'S', name: 'SGS', sub: '국제 검사' },
];

export default function VerificationGrid({
  cards = defaultCards,
  certs = defaultCerts,
  notice,
}: Props) {
  return (
    <section id="verified" className="py-24 md:py-[120px] bg-lx-black text-white">
      <div className="max-w-page mx-auto px-7 lg:px-16">
        <div className="text-center max-w-[780px] mx-auto mb-16 md:mb-20">
          <RevealOnScroll>
            <span className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500">
              Notice — 식약처 고시 기준
            </span>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extralight tracking-kr-tight leading-[1.2]">
              진짜 침향, 이젠
              <br />
              학명부터 확인하세요!
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <span className="block mx-auto my-7 w-12 h-px bg-gold-700" />
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            {notice ?? (
              <p className="text-[0.95rem] text-white/70 leading-[1.9] font-light">
                대한민국 국가법령정보센터의 식약처 고시{' '}
                <em className="font-serif text-gold-400 font-medium not-italic">
                  Aquilaria Agallocha Roxburgh(AAR)
                </em>
                . 대라천은 첫 묘목부터 완제품까지, 품질의 모든 단계를 공개합니다.
              </p>
            )}
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-white/10">
          {cards.map((c, i) => (
            <RevealOnScroll key={c.step} delay={i * 100}>
              <div className="h-full px-10 py-14 border-b border-r last:border-r-0 border-white/10 hover:bg-gold-500/5 transition-colors duration-600">
                <div className="inline-flex items-center gap-2.5 font-mono text-[0.6rem] tracking-en-tag uppercase text-gold-500 font-semibold mb-10">
                  <span className="block w-6 h-px bg-gold-500" />
                  {c.step}
                </div>
                <h3 className="text-[1.4rem] font-light tracking-kr-tight mb-4">{c.title}</h3>
                <div className="text-[0.78rem] text-gold-400 font-light italic tracking-[0.12em] mb-5">
                  {c.en}
                </div>
                <p className="text-[0.86rem] text-white/65 leading-[1.9] font-light">{c.body}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Certifications row */}
        <div className="bg-gold-500/5 border-t border-gold-500/20 p-10">
          <div className="font-mono text-[0.68rem] tracking-en-tag uppercase text-gold-500 text-center mb-5">
            Certifications · 8개 인증
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 max-w-[1100px] mx-auto">
            {certs.map((c, i) => (
              <div
                key={c.name}
                className={`text-center py-5 px-3 border-b border-white/10 ${
                  (i + 1) % 4 !== 0 ? 'sm:border-r' : ''
                } ${i % 2 !== 0 ? 'border-r-0 sm:border-r' : 'border-r sm:border-r'} border-white/10`}
              >
                <div className="w-[38px] h-[38px] mx-auto mb-2.5 border border-gold-500 flex items-center justify-center font-serif text-gold-500 text-[0.9rem] font-medium">
                  {c.mark}
                </div>
                <div className="text-[0.7rem] text-white font-normal">{c.name}</div>
                <div className="font-mono text-[0.58rem] tracking-[0.18em] uppercase text-white/40 mt-1">
                  {c.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
