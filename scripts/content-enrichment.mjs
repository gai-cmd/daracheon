// 참조 사이트(zoel-life-369774072122.us-west1.run.app) 의 풍부한 내용을
// 현재 pages.json 에 통합:
//   - brandStoryTab.sourceBody      (4단락 full)
//   - sceneTab.body                 (2단락)
//   - historyTab.eras[].description (각 시대 narrative)
//   - certificationsTab.sections[].body (각 그룹 narrative)
//   - qualityTab.paragraphs[]       (4단락 신규)
//   - processTab.paragraphs[]       (4단락 신규)
//   - aboutAgarwood.dosageSection   (신규 — 침향 하루 복용량 3항목)
//   - homeShopping.warning          (신규 — 가짜 침향 경고 배너)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, list, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'data', 'db');

const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}
const PREFIX = (process.env.BLOB_DATA_PREFIX ?? 'fd290ae46c4cb398d2afcdc4fc7cfe95').replace(
  /[^a-zA-Z0-9_-]/g,
  ''
);

async function writeDb(filename, data) {
  const body = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(DB, `${filename}.json`), body, 'utf-8');
  const pathname = `${PREFIX}/${filename}.json`;
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const existing = blobs.find((b) => b.pathname === pathname);
    if (existing) await del(existing.url);
  } catch {}
  await put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  console.log(`  wrote ${filename}.json (${body.length}B)`);
}

const pages = JSON.parse(fs.readFileSync(path.join(DB, 'pages.json'), 'utf-8'));

/* ───────── Brand Story 보강 ───────── */
const bs = pages.brandStory ?? {};

// 탭1 brandStoryTab.sourceBody — 참조사이트 4단락
bs.brandStoryTab = bs.brandStoryTab ?? {};
bs.brandStoryTab.sourceBody = [
  "조엘라이프는 \"자연의 진실된 가치\"를 모토로 한 프리미엄 침향 브랜드 [대라천 '참'침향]을 소개합니다.",
  "침향은 수천 년 전부터 귀하게 여겨져 온 천연의 선물로, 침향나무가 스스로 상처를 치유하며 만들어내는 고귀한 수지입니다.",
  "조엘라이프는 이 고귀한 가치를 현대 과학과 결합하여 인류의 건강과 행복에 기여하고자 합니다.",
  '',
  "대라천 '참'침향은 세계적으로 인정 받은 침향의 최고 산지인 베트남에서 생산된 침향만 100% 사용합니다.",
  "직접 운영하는 침향농장에서 생산된 침향을 사용하는 제품은 오직 대라천 '참'침향뿐입니다.",
  "또한, 베트남 식약청에서 'Aquilaria Agallocha Roxburgh' 학명 사용을 인정한 제품은 대라천 '참'침향 제품 뿐입니다.",
  '',
  "대라천 '참'침향은 식목에서 침향을 얻기까지 20~30년 동안 유기농법으로 재배합니다.",
  "20년 이상 된 침향나무에서 2~10년에 걸쳐 열대과일 발효액으로 수지 내림을 해, 벌목 후 사람 손으로 하나하나 침향을 채취하고 국가 공인 유기농 인증을 통해 더욱 안전하고 신뢰할 수 있습니다.",
  '',
  '베트남 하띤성의 침향농장에서는 모든 Agallocha 침향나무에 개별적으로 고유번호를 부여해 이력을 관리하며 동나이 직영공장에서 전통 증기 증류법으로 침향오일을 생산합니다.',
  '침향나무 재배나 수지 추출 과정을 고려하면 당연히 비쌀 수 밖에 없지만 비싼 만큼 최선을 다하고 있습니다.',
].join('\n');

// 탭2 sceneTab.body — 참조 2단락
bs.sceneTab = bs.sceneTab ?? {};
bs.sceneTab.body = [
  "베트남 하띤성에 위치한 200ha 규모의 대규모 침향 농장은 대라천 '참'침향의 심장부로, 400만 그루의 침향나무가 자라는 생명의 터전입니다.",
  '하띤성, 나짱, 푸꿕 등 베트남 전역에 걸쳐 대규모 직영 농장을 운영하고 있습니다.',
  '',
  '직영 농장에서는 모든 Agallocha 침향나무에 개별적으로 고유번호를 부여해 이력을 관리하며, 특허받은 수지유도 기술을 통해 최상의 침향을 생산합니다.',
  'CITES 국제인증, Organic HACCP 품질인증, 베트남 정부 OCOP 품질보증을 통해 그 가치를 입증했습니다.',
].join('\n');

// 탭3 historyTab.eras[].description — 각 시대 narrative
bs.historyTab = bs.historyTab ?? {};
const eraDescriptions = {
  '1998-2001':
    "1998년 캄보디아에서 침향사업을 시작한 이래, 대라천 '참'침향은 끊임없는 도전과 연구를 이어왔습니다. 2000년에는 베트남 5개 성에 농장을 조성하며 본격적인 침향 재배를 시작했습니다. 2001년 동나이성에 대규모 식재를 진행하며 미래를 준비했습니다.",
  '2014-2019':
    '2014년 노니발효 시스템을 개발하며 기술력을 축적했고, 2018년에는 NTV Vietnam 통합법인을 설립하고 Organic/HACCP 인증을 획득하며 식용가능 수지유도제를 재개발했습니다. 2019년에는 OCOP 베트남 정부 품질보증을 받았습니다.',
  '2023-2025':
    '2023년 침향캡슐 건강기능성 재인증을 통해 18품목을 생산하게 되었고, 2024년에는 조엘라이프를 통해 한국 시장에 본격적으로 진출했습니다. 2025년에는 아시아 10대 선도 브랜드로 선정되었으며, 유기 바나듐, 셀레늄, 게르마늄 특허를 출원하며 기술 혁신을 이어가고 있습니다.',
};
if (Array.isArray(bs.historyTab.eras)) {
  for (const era of bs.historyTab.eras) {
    const desc = eraDescriptions[era.era];
    if (desc && !era.description) era.description = desc;
  }
}

// 탭4 certificationsTab.sections[].body
bs.certificationsTab = bs.certificationsTab ?? {};
const certSectionBodies = {
  '국제 거래 및 기술 특허':
    "대라천 '참'침향은 엄격한 품질 관리와 인증을 통해 고객에게 신뢰를 드립니다. CITES 인증번호 IIA-DNI-007은 멸종위기종인 침향의 국제거래가 합법적임을 보장합니다. 수지유도 특허 #12835는 2011년 출원하여 2014년 등록되었으며, 20년 유효한 식용가능 침향수지 생산 기술입니다.",
  '품질 보증':
    "Organic 유기농 재배 인증과 HACCP 식품안전관리 인증을 통해 안전성을 확보했습니다. OCOP 베트남 정부 품질보증을 통해 품질을 공인받았습니다. 2025 아시아 10대 선도 브랜드로 선정된 것은 대라천 '참'침향의 노력을 인정받은 결과입니다.",
  '안전성 시험':
    "TSL 안전성 시험은 ISO/IEC 17025:2017 기준을 준수하며, 2023년 8월 24일 실시한 중금속 8종 시험에서 전부 불검출 판정을 받았습니다. 이러한 인증들은 대라천 '참'침향이 안전하고 신뢰할 수 있는 제품임을 증명합니다.",
};
if (Array.isArray(bs.certificationsTab.sections)) {
  for (const sec of bs.certificationsTab.sections) {
    const desc = certSectionBodies[sec.title];
    if (desc && !sec.body) sec.body = desc;
  }
}

// 탭5 qualityTab.paragraphs[] — 4단락
bs.qualityTab = bs.qualityTab ?? {};
bs.qualityTab.paragraphs = [
  {
    title: '원료 및 품종',
    body:
      "대라천 '참'침향은 침수향(AQUILARIAE LIGNUM)을 원료로 합니다. Aquilaria agallocha Roxburgh(팥꽃나무과 Thymeleaceae) 품종을 사용하여 그 효능을 극대화했습니다.",
  },
  {
    title: '약전 규격 준수',
    body:
      '약전 규격에 따라 건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상을 엄격히 준수합니다. 등급양품은 흑갈색을 띠며 달고 쓴맛이 나고, 물에 가라앉는 특성을 가집니다.',
  },
  {
    title: '과학적 안전성',
    body:
      'TSL 안전성 시험을 통해 ISO/IEC 17025:2017 기준으로 중금속 8종(납Pb, 카드뮴Cd, 수은Hg, 비소As, 구리Cu, 주석Sn, 안티몬Sb, 니켈Ni)이 전부 불검출되었음을 확인했습니다. 이는 과학으로 입증된 안전성을 의미합니다.',
  },
  {
    title: '시간의 가치',
    body:
      "최소 26년의 시간이 만드는 한 방울의 가치는 대라천 '참'침향의 자부심입니다. 우리는 자연의 순수함을 지키면서도 과학적인 검증을 통해 최고의 품질을 유지합니다. 대라천 '참'침향은 고객의 건강을 위해 타협하지 않는 품질을 약속합니다.",
  },
];

// 탭6 processTab.paragraphs[] — 4단락
bs.processTab = bs.processTab ?? {};
bs.processTab.paragraphs = [
  {
    title: '14단계 프리미엄 공정',
    body:
      '침향오일은 14단계의 엄격한 생산공정을 거쳐 탄생합니다. 1. 식목, 2. 수지앉힘(특허#12835 식용가능유도제), 3. 침향검사, 4. 침향수확, 5. 원목입고, 6. 세척(표피제거), 7. 절단(10-20cm), 8. 수지목분리, 9. 이물질제거, 10. 세척(3회), 11. 건조(자연광), 12. 분쇄(1-2mm), 13. 고온증류(72시간), 14. 수지채취후숙성검사출고.',
  },
  {
    title: '시간과 기술',
    body:
      "총 소요 시간은 최소 26년입니다. 각 단계는 침향의 순수함과 효능을 유지하기 위해 정교하게 설계되었습니다. 수지앉힘 단계에서 사용하는 특허받은 식용가능 유도제는 대라천 '참'침향만의 핵심 기술입니다.",
  },
  {
    title: '증류 및 숙성',
    body:
      "고온증류 과정은 72시간 동안 지속되며, 이 과정에서 침향의 깊은 향과 성분이 추출됩니다. 이후 숙성 및 검사 과정을 거쳐 최종 제품으로 출고됩니다. 이러한 철저한 공정은 대라천 '참'침향이 왜 프리미엄인지를 보여줍니다.",
  },
  {
    title: '자연과 과학의 조화',
    body:
      "우리는 자연의 시간을 존중하며, 그 시간을 제품에 담아냅니다. 26년의 기다림 끝에 얻은 침향오일은 고객에게 최고의 경험을 선사할 것입니다. 대라천 '참'침향의 생산 공정은 자연과 과학의 완벽한 조화입니다.",
  },
];

pages.brandStory = bs;

/* ───────── About Agarwood — 침향 하루 적정 복용량 ───────── */
const aa = pages.aboutAgarwood ?? {};
aa.dosageSection = {
  tag: 'Dosage · 적정 복용량',
  title: '침향의 하루 적정 복용량',
  items: [
    {
      num: '01',
      title: '한국한의학연구원 한약자원연구센터',
      body:
        '용법용량: 1~1.5g을 쓰는데 먼저 다른 약을 달이고 난 다음에 넣는다. 또 갈아서 즙을 내어 먹기도 하며, 알약이나 가루약에 넣어 복용한다.',
    },
    {
      num: '02',
      title: '100% 침향 오일은 하루 2~3mg이 적정',
      body:
        '향은 자주 맡아도 좋지만 복용하는 침향은 권장량을 지키는 게 효과적이다. 하루 복용량 분말 1~2g을 증류법으로 오일을 추출하면 약 2~3mg이 나온다.',
    },
    {
      num: '03',
      title: '침향 오일 함량이 높다고 좋은 건 아니다',
      body:
        '복용하는 침향 오일은 단순히 함량은 높다고 좋은 것이 아니다. 오히려 저가 오일이거나 복합 오일일 가능성이 크다. 적정 함량이 가장 효과적이다.',
    },
  ],
};
pages.aboutAgarwood = aa;

/* ───────── Home Shopping — 가짜 침향 경고 배너 ───────── */
pages.homeShopping = pages.homeShopping ?? {};
pages.homeShopping.warningBanner = {
  enabled: true,
  alertLabel: '긴급 소비자 안내',
  title: '가짜 침향, 당신의 건강을 위협합니다',
  body:
    '최근 뉴스에서 가짜 침향 유통 문제가 보도되고 있습니다.\n식약처가 인정한 침향은 단 2종(Aquilaria crassna, Aquilaria malaccensis)뿐이며, 오직 이 종들만이 식용 가능합니다.',
  bullets: [
    'DNA 유전자 검증 완료',
    'CITES 국제인증',
    '식약처 인정 정품 침향 사용',
    'HACCP 인증',
    '25년 직영 농장 운영',
  ],
  newsQuote: '연합뉴스TV 2026.03.28 보도 — 가짜 침향 가려낸다…한약재도 유전자 검사',
  newsNote: 'ZOEL LIFE 침향은 이미 DNA 유전자 분석을 통해 검증된 정품 침향만을 사용합니다.',
};

await writeDb('pages', pages);
console.log('\n완료');
