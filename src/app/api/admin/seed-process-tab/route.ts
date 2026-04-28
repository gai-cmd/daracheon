import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PROCESS_TAB = {
  tag: 'PRODUCTION PROCESS',
  title: '생산 공정',
  subtitle: '베트남 직영 농장에서 완제품까지 — 최소 26년의 기록',
  heroVideo: {
    id: '1cEAulq4MzBUZ1uBf2F5fqFSigR0jAmWb',
    title: '대라천 직영 농장과 공정 전체 개요',
    body: '1998년 캄보디아에서 시작해 2000년 베트남 5개 성으로 확장된 대라천의 여정. 200ha 부지·400만 그루 규모의 직영 농장에서 최소 25년을 기다려 얻은 수지를, 자체 특허 공정으로 다듬어 한 방울의 오일로 완성합니다.',
  },
  stats: [
    { value: '400만+', label: '하띤 직영 농장 침향나무' },
    { value: '#12835', label: '수지유도 특허' },
    { value: '72h', label: '고온 증류 공정' },
    { value: '26+', label: '식목부터 출고까지 (년)' },
  ],
  images: [],
  steps: [],
  processGroups: [
    {
      title: '침향 생산과정',
      titleEn: 'AGARWOOD PRODUCTION',
      description: "좋은 침향을 수확하기까지는 최소 26년 이상의 긴 시간이 필요합니다. 대라천 '참'침향은 자체적인 유기농 특허기술을 적용한 독보적인 방법으로 생산되며, 이 모든 과정을 모니터링하여 투명하게 고객분들께 제공합니다. 대라천 '참'침향은 당분간 누구도 흉내내기 어려운 '명품'이 될 것입니다.",
      image: 'https://lh3.googleusercontent.com/d/1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g=w1280',
      steps: [
        { step: '01', name: '식목', duration: '최소 20년', desc: 'Aquilaria Agallocha Roxburgh 묘목을 베트남 5개 사업장에 식재. GPS 개별 번호 부여로 나무 한 그루씩 이력 추적.' },
        { step: '02', name: '유기농 관리', duration: '5~20년 이상', desc: '유기농 인증 기준(TCVN 11041-2:2017)에 따른 지속적인 재배 관리. 화학 농약 사용 금지.' },
        { step: '03', name: '수지 앉힘', duration: '2~10년', desc: '특허 #12835 식용가능 천연 수지유도제 주입. 나무에 천공 후 유도관 삽입으로 침향 수지 형성.' },
        { step: '04', name: '수지 관리', duration: '2~10년', desc: '수지 형성 상태를 정기적으로 모니터링하고 관리. 최적의 수지 품질 유지.' },
        { step: '05', name: '침향(수지) 검사', duration: '수시', desc: '수지 형성 상태 확인 및 등급 판정. 물에 가라앉는 침수(沈水香) 등급 최우선 선별.' },
        { step: '06', name: '침향 수확', duration: '숙성 확인 후', desc: '25년생 이상 원목 벌목 및 수확. GPS 번호 추적 체계로 나무별 이력 최종 확인 후 수확 진행.' },
        { step: '07', name: '선별 가공', duration: '—', desc: '수확된 침향을 등급별로 선별하고 초벌 가공. 고품질 침향만을 엄격히 선별.' },
        { step: '08', name: '완제품', duration: '—', desc: '침향 원목 완제품으로 완성. 최종 품질 검사 후 로트(Lot)별 이력 부착 후 출고.' },
      ],
    },
    {
      title: '침향 오일 생산과정',
      titleEn: 'OIL PRODUCTION',
      description: '',
      image: 'https://lh3.googleusercontent.com/d/1WkcqWc_4d2GJJepNlEynXaJ-d4OZiS6j=w1280',
      steps: [
        { step: '01', name: '원목 입고', duration: '—', desc: '수지가 앉혀진 벌목한 침향목을 동나이 직영 공장으로 입고. 로트(Lot) 번호 부여 시작.' },
        { step: '02', name: '세척', duration: '—', desc: '표피 제거 및 표면 이물질 제거. 흙·먼지·외부 오염물 완전 제거.' },
        { step: '03', name: '절단', duration: '—', desc: '10~20cm 크기로 수지앉힘 작업 시 천공된 부분 주변을 기준으로 절단.' },
        { step: '04', name: '수지목 분리', duration: '—', desc: '목질(비수지) 부분 제거. 순수 수지가 침착된 핵심 부분만 선별.' },
        { step: '05', name: '이물질 제거', duration: '—', desc: '수지앉힘 작업 시 천공한 부분 속 이물질 완전 제거. 정밀 수작업으로 진행.' },
        { step: '06', name: '세척', duration: '물세척 3회', desc: '물세척 3회 반복 정밀 세척. 잔여 이물질 완전 제거 확인.' },
        { step: '07', name: '건조', duration: '—', desc: '수지 손실을 막기 위해 자연광 건조. 인위적 열원 사용 금지.' },
        { step: '08', name: '분쇄', duration: '—', desc: '1~2mm 크기로 균일 분쇄. 고온증류 효율 극대화를 위한 최적 입자 크기 유지.' },
        { step: '09', name: '고온 증류법', duration: '72시간', desc: '전통 증기 증류법으로 72시간 연속 가동. 침향 수지의 유효성분을 순수 오일로 추출.' },
        { step: '10', name: '수지 채취', duration: '—', desc: '순수 수지만 분리·채취. 불순물 완전 제거 후 고순도 수지만 분리.' },
        { step: '11', name: '숙성', duration: '—', desc: '자체 숙성 과정을 통해 침향 오일의 깊은 향과 성분이 안정화.' },
        { step: '12', name: '검사', duration: '—', desc: 'ISO/IEC 17025:2017 기준 중금속 8종 불검출 검사. 전 검사 통과 확인.' },
        { step: '13', name: '출고', duration: '—', desc: '로트(Lot)별 QR코드 부착 후 최종 출고. 이력 추적 가능한 투명한 출고 시스템.' },
      ],
    },
  ],
  totalTimeLabel: 'TOTAL PROCESS TIME',
  totalTimeValue: '26+ Years',
  totalTimeDesc: '식목부터 최종 출고까지, 최소 26년의 시간이 만드는 가치',
  paragraphs: [],
};

export async function GET() {
  try {
    const pages = (await readSingle('pages') ?? {}) as Record<string, unknown>;
    const brandStory = ((pages.brandStory ?? {}) as Record<string, unknown>);
    const updated = { ...pages, brandStory: { ...brandStory, processTab: PROCESS_TAB } };
    await writeSingle('pages', updated);
    return NextResponse.json({ ok: true, msg: 'processTab 복구 완료' });
  } catch (err) {
    return NextResponse.json({ ok: false, msg: String(err) }, { status: 500 });
  }
}
