import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface TimelineStep {
  id: string;
  kicker: string;
  title: string;
  description: string;
}

/**
 * 검증 타임라인 — 원산지 → 수확 → 가공 → 검사 → 포장 → 출고
 *
 * TODO: Product 타입에 Lot 단위 검증 이력이 없음. 실제 Lot 번호·날짜·
 * 담당자·증빙 링크·인증번호는 CMS 확장 후 연결 필요.
 * 현재는 프로세스 골격만 표시 (실제 날짜/Lot 번호 생성 금지 규칙 준수).
 */
const DEFAULT_STEPS: TimelineStep[] = [
  {
    id: 'origin',
    kicker: 'STEP · 01',
    title: '원산지',
    description: '베트남 Ha Tinh 직영 농장. 25년간 직접 재배·관리.',
  },
  {
    id: 'harvest',
    kicker: 'STEP · 02',
    title: '수확',
    description: '자연 침착된 수지만 선별 채취. 수지 함량 18.0% 이상.',
  },
  {
    id: 'process',
    kicker: 'STEP · 03',
    title: '가공',
    description: '저온 초임계 CO₂ 추출 (42℃ 이하). 국내 특허 공법.',
  },
  {
    id: 'inspect',
    kicker: 'STEP · 04',
    title: '검사',
    description: '한국분석연구원(KARA) 지표 성분·중금속·미생물 시험.',
  },
  {
    id: 'package',
    kicker: 'STEP · 05',
    title: '포장',
    description: 'HACCP 인증 공장 · 콜드체인 보관 포장.',
  },
  {
    id: 'ship',
    kicker: 'STEP · 06',
    title: '출고',
    description: 'Lot 번호 부여 · QR 이력 등록 · 7℃ 이하 콜드체인 배송.',
  },
];

export default function VerificationTimeline() {
  return (
    <section className="border-t border-gold-500/15 bg-lx-black py-20 md:py-[90px]">
      <div className="mx-auto max-w-page px-7 lg:px-16">
        <RevealOnScroll>
          <div className="mb-14 text-center">
            <p className="mb-4 font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold-500">
              Verification · 검증 타임라인
            </p>
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-light tracking-kr-tight text-lx-ivory">
              이 제품이 <em className="not-italic font-serif font-normal text-gold-400">지나온 이력</em>
            </h2>
            <p className="mt-4 text-sm font-light text-white/55">
              원산지 → 수확 → 가공 → 검사 → 포장 → 출고, 모든 단계를 공개합니다.
            </p>
          </div>
        </RevealOnScroll>

        {/* TODO: Lot 단위 실제 날짜·담당·증빙 링크·인증번호는 CMS 확장 시 연결 */}
        <div className="grid grid-cols-1 gap-px bg-gold-500/15 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_STEPS.map((step, idx) => (
            <RevealOnScroll key={step.id} delay={idx * 60}>
              <div className="h-full bg-lx-black p-8">
                <p className="mb-4 font-mono text-[0.62rem] uppercase tracking-[0.3em] text-gold-500">
                  {step.kicker}
                </p>
                <h3 className="mb-3 font-serif text-xl font-normal text-lx-ivory">
                  {step.title}
                </h3>
                <p className="text-sm font-light leading-[1.85] text-white/70">
                  {step.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
