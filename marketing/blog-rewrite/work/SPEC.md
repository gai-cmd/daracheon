# 대라천 블로그 초안 재편 규격서 (v1)

작업 대상: zoellife.com 블로그 draft 59편. **published 4편은 절대 건드리지 않는다.**
산출물: `out/<slug>.json` — `{ "slug", "title", "excerpt", "content", "tags", "images", "changelog" }`
상태: 재편 후에도 `status`는 `draft` 유지. 발행은 사람이 한다.

---

## 0. 최우선 원칙 — 날조 금지

- **없는 출처를 만들지 않는다.** 저널명·저자명·연도·DOI를 추측해서 쓰지 않는다.
- 아래 §A 검증 인용맵에 있는 것만 인용한다. 그 외 새 논문을 인용하려면 반드시 WebSearch로 실존을 확인하고, CrossRef(`https://api.crossref.org/works/<DOI>`)로 서지정보를 대조한 뒤에만 쓴다.
- 확인 못 한 주장은 **쓰지 않는다.** "아마도", "~라고 알려져 있다"로 얼버무리지 말고 문장 자체를 뺀다.
- 원문에 있던 수치·검사번호·품종명·연도를 임의로 바꾸지 않는다. 근거 없이 새 수치를 만들지 않는다.

---

## A. 검증된 인용맵 (CrossRef 실존 확인 완료 — 이것만 자유롭게 인용 가능)

인용할 때는 **저자 + 연도 + 저널 + DOI 링크**를 본문에 노출한다. 저널 이름만 적는 것은 금지.

| # | 서지정보 | 링크 | 쓸 수 있는 주제 |
|---|---|---|---|
| A1 | Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", *Molecules* 23권 342 (2018) | `https://doi.org/10.3390/molecules23020342` | 침향 화학 성분 총론, 아퀼라리아 속 |
| A2 | Li W, Chen HQ, Wang H 외, "Natural products in agarwood and Aquilaria plants: chemistry, biological activities and biosynthesis", *Natural Product Reports* 38권 528~565쪽 (2021) | `https://doi.org/10.1039/D0NP00042F` | 성분 생합성, 수지 생성 기전 |
| A3 | Okugawa H, Ueda R, Matsumoto K 외, "Effect of Jinkoh-eremol and Agarospirol from Agarwood on the Central Nervous System in Mice", *Planta Medica* 62권 2~6쪽 (1996) | `https://doi.org/10.1055/s-2006-957784` | 진코에레몰·아가로스피롤, 중추신경 (동물실험) |
| A4 | Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities", *Journal of Essential Oil Research* 37권 110~144쪽 (2025) | `https://doi.org/10.1080/10412905.2024.2447706` | 추출법이 수율·성분에 미치는 영향, 증류 |
| A5 | Ahn S, Ma CT, Choi JM 외, "Adiponectin-Secretion-Promoting Phenylethylchromones from the Agarwood of Aquilaria malaccensis", *Journal of Natural Products* 82권 259~264쪽 (2019) | `https://doi.org/10.1021/acs.jnatprod.8b00635` | 페닐에틸크로몬 계열 성분 |
| A6 | Das A, Begum K, Ahmed R 외, "Agarwood as a neuroprotective agent: a comprehensive review of existing evidence and potential avenues for future research", *Phytochemistry Reviews* 25권 1~22쪽 (2025) | `https://doi.org/10.1007/s11101-025-10117-6` | 신경보호 연구 리뷰 (리뷰 논문임을 명시) |
| A7 | Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", *Molecules* 26권 7708 (2021) | `https://doi.org/10.3390/molecules26247708` | 분포, 등급 체계, 수지 유도법 |
| A8 | Takemoto H, Ito M, Shiraki T 외, "Sedative effects of vapor inhalation of agarwood oil and spikenard extract and identification of their active components", *Journal of Natural Medicines* 62권 41~46쪽 (2007) | `https://doi.org/10.1007/s11418-007-0177-0` | 증기 흡입 진정 작용 (동물실험) |
| A9 | Akerlof GA, "The Market for 'Lemons': Quality Uncertainty and the Market Mechanism", *The Quarterly Journal of Economics* 84권 3호 488~500쪽 (1970) | `https://doi.org/10.2307/1879431` | 정보 비대칭 시장 — 침향 진위·가격 판단 맥락에만 사용 (침향 성분·효능 주장 근거로 쓰지 않는다) |

**한국어 1차 출처**

| # | 출처 | 링크 | 용도 |
|---|---|---|---|
| K1 | 한국민족문화대백과사전 — 침향(沈香) | `https://encykorea.aks.ac.kr/Article/E0058589` | 한국 역사·문헌 서술 |
| K2 | 한국민족문화대백과사전 — 향약집성방(鄕藥集成方) | `https://encykorea.aks.ac.kr/Article/E0062961` | 조선 의서 |
| K3 | "침향 추출물의 면역조절 및 생리활성 분석", 대한한의학방제학회지 (KCI) | `https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002902473` | 국내 연구 |
| K4 | CITES (멸종위기 야생동식물 국제거래협약) | `https://cites.org` | 아퀼라리아 국제거래 규제 |
| K5 | 『삼국사기』 권33 잡지 — 침향목(沈香木) 조항, 국사편찬위원회 한국사데이터베이스 (註 322) | `https://db.history.go.kr/ancient/level.do?levelId=sg_033r_0030_0010` | 신라 흥덕왕 금령의 침향 규정 (수레 재목) |
| K6 | 『삼국사기』 권33 잡지 — 침향목(沈香木) 조항, 국사편찬위원회 한국사데이터베이스 (註 517) | `https://db.history.go.kr/ancient/level.do?levelId=sg_033r_0050_0010` | 신라 침향 사용 규정 (기물·장식) |
| K7 | 동국대학교 HK+사업단 칼럼 「침향(沈香), 고귀하고 엄숙한 향기」 (2023) | `https://hkplus.dongguk.edu/hkplus/column.php?mode=view&bbs_idx=1368` | 침향 문화사 — **2차 출처이므로 "동국대 HK+사업단 칼럼은 …라고 정리했습니다" 형태로 귀속** |
| K8 | 한국학중앙연구원 디지털인문학 — 『이운지』 「임원에서 즐기는 청아한 즐길거리(상)」 향료 침수향 조 역주 | `http://dh.aks.ac.kr/~pungseok/wiki/index.php/이운지:임원에서_즐기는_청아한_즐길거리(상):향:향료:침수향` | 소송(蘇頌, 1019~1101, 『본초도경』 편찬) 인용 침향 산지 서술 — **역주 자료이므로 "한국학중앙연구원 디지털인문학의 『이운지』 역주 자료는 …라고 옮겼습니다" 형태로 귀속** |
| K9 | 신광호 외, 「GC-MS를 이용한 침향류의 성분 비교 연구」, 대한한의학방제학회지(대한본초학회지) 26권 1호 7~12쪽 (2011) | `https://koreascience.kr/article/JAKO201122238508185.pdf` | 산지별 시료 성분 비교 — **본문 PDF 미열람(§검증 이력 참조). 인용 시 수치는 "대라천 자료가 인용해 온 값"으로 표기** |

**검증 이력 (2026-07-27, 오케스트레이터 직접 확인)**

- K5·K6: 국사편찬위 DB 본문에서 `沈香木` 문자열과 주석을 직접 확인. 경향신문 이기환 「흔적의 역사」가 인용한 『삼국사기』 잡지 원문 — 거기(車騎)조 "진골은 수레의 재목(車材)에 자단과 침향을 쓰지 못한다", 옥사(屋舍)조 "진골·6두품까지 침대를 대모·침향으로 장식하지 않는다" — 과 일치.
- K7: 페이지 본문에서 `침향(沈香)` 표제 확인.
- A9 (2026-07-27 추가): CrossRef `api.crossref.org/works/10.2307/1879431` 조회 — 제목 "The Market for 'Lemons'", 저자 Akerlof, 저널 The Quarterly Journal of Economics, 1970년 8월. 서지 4항목 일치.
- K8 (2026-07-27 추가): 페이지를 직접 받아 본문에서 인용문 `소송(蘇頌)은 다음과 같이 말했다. "교지(交趾, 베트남 북부)의 밀향수(蜜香樹)이다"` 를 글자 그대로 확인. 각주에 소송 = 1019~1101, 『본초도경』 편찬자로 명시돼 있다.
- K9 (2026-07-27 확인): 저자·저널·권·호·쪽·연도는 검색으로 대조했으나 **PDF 본문은 두 경로 모두 접속 실패**. β-selinene 등 개별 수치는 원 논문에서 확인하지 못했으므로 "대라천 자료가 인용해 온 값"으로만 표기한다.
- **사용 금지 — `https://encykorea.aks.ac.kr/Article/E0066953` (흥덕왕교서)**: 페이지는 실재하나 본문에 침향·沈香이 **없다**. 흥덕왕 금령의 침향 조항을 이 URL로 인용하면 인용-주장 불일치가 된다. 이 주장은 반드시 K5/K6으로 인용한다.
- **사용 금지 — `https://db.history.go.kr/goryeo/itemLevelKrList.do?parentId=kj_011r_0010_0060_0010&types=r` (고려사절요 의종 5년)**: 연도(1151년)는 맞으나 사료 본문이 서버 HTML에 없어 "침향목 관음상" 주장을 뒷받침하는지 확인 불가. **확인될 때까지 이 주장은 본문에서 삭제한다.**

**주의**: A3·A8은 동물실험, A6은 리뷰 논문이다. 인간 대상 효능으로 확대 해석하지 말고, 본문에 연구 설계를 명시한다 (예: "쥐를 대상으로 한 실험에서").

---

## B. 화자 규칙 — 보도자료 인칭 (이번 재편의 핵심)

### B-1. 주어를 세운다

모든 검증 가능한 사실 진술에는 **주체가 문장의 주어로** 나와야 한다.

- 첫 등장: `조엘라이프(주)(브랜드 대라천)` → 이후 `대라천` 또는 `조엘라이프`
- 종결어미는 현행 `-습니다` 체를 유지한다. `-다` 체로 바꾸지 않는다.
- **`저희`, `제가`, `우리`는 쓰지 않는다.** 보도자료 인칭이 아니다.

```
✗ 베트남산 침향이 상급으로 평가받습니다.
✓ 조엘라이프(주)는 베트남 하띤성 직영 농장에서 채취한 원목만 사용합니다.

✗ 침향은 DNA 검사로 품종을 확인할 수 있습니다.
✓ 대라천은 원목을 DowGene에 DNA 검사로 의뢰해 아퀼라리아 아갈로차 유전자형과
  일치한다는 결과를 확인했습니다(검사번호 DA-260507-1).
```

### B-2. 외부 연구는 연구 주체에 귀속

```
✗ 침향 성분이 중추신경에 작용한다고 보고되고 있습니다.
✓ Okugawa 연구팀은 1996년 Planta Medica에 진코에레몰과 아가로스피롤이
  쥐의 중추신경에 미치는 영향을 보고했습니다(<a href="https://doi.org/10.1055/s-2006-957784">DOI</a>).
```

### B-3. 회피 화법 제거

`알려져 있습니다 / 전해집니다 / 여겨집니다 / 보고되고 있습니다 / 한다고 합니다 / 평가받습니다` —
이 표현이 나오면 둘 중 하나로 바꾼다: **(a) 출처를 밝혀 귀속**하거나 **(b) 문장을 삭제**한다.
단, 역사·전승처럼 출처가 문헌 자체인 경우는 문헌명을 주어로 세운다 (`동의보감은 …라고 적고 있습니다`).

### B-4. 책임 진술을 닫는 문장에 넣는다

글을 disclaimer로만 끝내지 않는다. 마무리 직전에 대라천이 무엇을 확인했고 무엇은 확인하지 않았는지 한 문단으로 밝힌다.

```
✓ 대라천은 이 글에 적은 검사 결과와 규격을 자체 시험성적서로 보유하고 있으며,
  요청하시면 확인해 드립니다. 다만 인용한 연구는 대라천이 수행한 것이 아니라
  해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.
```

---

## C. 구조 규격 (Yoast + AEO)

### C-1. 필수 구성 순서

1. **결론 우선 리드** — 첫 문단(200~300자)에서 이 글의 답을 먼저 말한다. AEO 필수.
   형식: `<p class="lead"><strong>결론부터.</strong> …</p>`
2. 본문 H2 6~10개. **각 H2 아래 400~800자.** (현재 22편이 소제목당 300자 초과 → 분할 필요)
3. 표 1개 이상 — 비교·수치 정리
4. 수치 인포그래픽(인라인 SVG) 1개 이상
5. 이미지 2장 이상 (§E)
6. `자주 묻는 질문` H2 — Q 3~5개
7. `근거·출처` H2 — **반드시 클릭 가능한 링크**로. 텍스트만 적는 것 금지
8. disclaimer (원문 것 유지, 임의 삭제 금지)

### C-2. 제목·메타

- `title`: 60자 이내, 핵심 키프레이즈를 앞쪽에
- `excerpt`(메타디스크립션): **120~156자**. 현재 19편이 이탈 → 반드시 맞춘다
- 키프레이즈가 들어가야 할 곳: 제목 / excerpt / 첫 문단 / H2 최소 1개 / 이미지 alt 최소 1개
- 키프레이즈 밀도 0.5~3%. 억지로 반복하지 않는다
- `slug`는 **변경 금지** (URL 유지)

### C-3. 링크

- 내부링크 2개 이상 — `/products/<slug>`, `/blog/<slug>`, `/about-agarwood` 등 실재하는 경로만
- 외부 1차 출처 링크 1개 이상 — §A에서 가져온다
- 외부 링크는 `<a href="..." target="_blank" rel="noopener">`

### C-4. 질문형 H2

`무엇 / 왜 / 어떻게 / 언제 / ~까요` 형태의 H2를 2개 이상 둔다. (현재 대부분 충족)

### C-5. 분량

- 한글 문자 기준 **3,000자 이상**
- 짧은 글은 억지로 늘리지 말고, 검증된 사실·수치·표·사례를 추가해 채운다
- 특히 보강 필요: `agarwood-enjoy-and-storage-guide`(808자), `agarwood-cultural-history`(964자), `cham-agarwood-from-farm-to-capsule`(1,012자)

---

## D. 한국어 윤문 규칙

내용·사실·수치는 **한 글자도 바꾸지 않고** 문체만 다듬는다.

- 번역투 제거: 무생물 주어 남용, `~에 의해`, `~로 인해`, `~을 가지고 있습니다`
- 피동 남용 완화 (단, B-2의 연구 귀속 문장은 능동으로 살린다)
- 접속사 남발 정리: `그리고 / 하지만 / 또한 / 따라서` 연속 사용 금지
- 기계적 병렬 해체: 모든 문단이 같은 길이·같은 리듬이면 끊어 준다
- `~것이다 / ~수 있다` 남발 완화
- 연속 3문장이 같은 어절로 시작하지 않게
- 한 문장 90자 이하 권장, 한 문단 300자 이하
- **글마다 구조를 달리한다.** 현재 56편이 판박이(H2 8~12 + 표1 + 이미지1 + 마지막 H2가 `근거·출처`). 도입 방식, H2 작명, 표 위치를 글 성격에 맞게 바꾼다

**절대 보존 (바이트 동일)**: `<svg>` 내부, `<table>` 내부 수치, 학명 라틴어(*Aquilaria agallocha* 등), 한자, 검사번호(DA-260507-1 등), 연도, 비율, 가격, DOI URL, 이미지 URL, disclaimer 문구

---

## E. 이미지·인포그래픽

### E-1. Imagen 4 생성 이미지 (2장 이상)

`images` 배열로 스펙만 낸다. 실제 생성은 오케스트레이터가 `imagen-4.0-generate-001`로 처리한다.

```json
"images": [
  { "key": "hero-farm",
    "prompt": "영어 프롬프트. 사진풍, 사실적, 텍스트 없음",
    "alt": "한국어 alt — 키프레이즈 포함",
    "caption": "한국어 캡션" }
]
```

- 본문에는 `{{IMG:hero-farm}}` 토큰으로 삽입 위치를 표시한다
- **`{{IMG:cover}}`는 쓰지 않는다** — 상세페이지가 coverImage를 히어로로 이미 렌더한다. 본문에 또 넣으면 대표 이미지가 두 번 나온다
- 프롬프트에 글자·로고·워터마크를 넣지 않는다 (Imagen이 한글을 깨뜨린다)
- 사람 얼굴 클로즈업은 피한다

### E-2. 인라인 SVG 인포그래픽 (1개 이상)

- 실제 수치를 담은 막대·선·비교 도표. 장식용 도형 금지
- **밝은 리딩 표면 전제**: 배경 `#fffdf9`, 글자 `#2b2318`, 강조 `#9a6a10`
- `viewBox` + `width="100%"` 로 반응형. 고정 px 폭 금지
- `<figure>`로 감싸고 `<figcaption>`에 출처·단위 명시

---

## F. 컴플라이언스 (약사법·표시광고법)

- 대라천 제품은 **일반식품**이다. 질병의 예방·치료·개선을 표방하지 않는다
- 연구 결과는 반드시 **연구팀에 귀속**하고, 제품 효능으로 연결하지 않는다
- 동물실험은 `쥐를 대상으로 한 실험에서`를 명시한다
- 복용량(mg) 권장 표현 금지. 원문에 이미 있으면 제품 사양 설명으로만 남기고 권장으로 읽히지 않게 한다
- 금지: `치료 / 완치 / 부작용 없음 / 즉시 효과 / 반드시 좋아집니다`
- 허용: `100% 베트남산`, `유전자형 100% 일치`, `100% 순수 오일` — 사실 진술이므로 유지

---

## G. 출력 형식

```json
{
  "slug": "원본과 동일 (변경 금지)",
  "title": "60자 이내",
  "excerpt": "120~156자",
  "tags": ["...", "..."],
  "content": "<p class=\"lead\">…</p> … HTML 본문. {{IMG:key}} 토큰 포함",
  "images": [ { "key": "...", "prompt": "...", "alt": "...", "caption": "..." } ],
  "changelog": {
    "charsBefore": 0, "charsAfter": 0,
    "citationsAdded": ["A1", "A4"],
    "voiceFixes": 0,
    "notes": "무엇을 왜 바꿨는지 3줄 이내"
  }
}
```

허용 HTML 태그: `p, h2, h3, ul, ol, li, strong, em, a, table, thead, tbody, tr, th, td, figure, figcaption, img, svg 및 하위, blockquote, hr, br, span, div`

---

## H. 자체 검증 (제출 전 반드시 확인)

- [ ] 본문 한글 3,000자 이상
- [ ] 첫 문단이 결론 우선인가
- [ ] `근거·출처`에 클릭 가능한 링크가 있는가
- [ ] §A에 없는 출처를 인용하지 않았는가
- [ ] 대라천/조엘라이프가 주어인 문장이 3개 이상인가
- [ ] `저희 / 제가`를 쓰지 않았는가
- [ ] 회피 화법(알려져 있습니다 등)이 남아 있지 않은가
- [ ] excerpt가 120~156자인가
- [ ] 내부링크 2개 이상, 외부 1차 출처 1개 이상
- [ ] SVG 1개 이상, `{{IMG:}}` 토큰 2개 이상 (cover 제외)
- [ ] H2당 400~800자인가
- [ ] 원문의 수치·검사번호·학명·연도가 그대로인가
- [ ] disclaimer가 남아 있는가

- [ ] 학명은 **대소문자까지** 원문 그대로인가 — `Aquilaria Agallocha Roxburgh`(약전 등재 표기)와 `Aquilaria agallocha`(일반 표기)는 서로 대체할 수 없다. 원문에 있던 표기형을 모두 유지한다
- [ ] 원문의 수치·검사번호·학명·연도가 그대로인가
- [ ] disclaimer가 남아 있는가

