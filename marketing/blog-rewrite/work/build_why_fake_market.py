# -*- coding: utf-8 -*-
"""Rebuild why-fake-agarwood-market-exists.json per SPEC.md."""
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))

SVG = """<figure><svg viewBox="0 0 640 270" role="img" aria-label="대라천이 공개하는 확인 근거의 항목별 수치 막대그래프" style="width:100%;height:auto;font-family:sans-serif"><rect x="0" y="0" width="640" height="270" fill="#fffdf9"/><text x="24" y="34" fill="#2b2318" font-size="16" font-weight="bold">대라천이 공개하는 확인 근거 — 항목별 수치</text><line x1="210" y1="56" x2="210" y2="220" stroke="#2b2318" stroke-width="1"/><text x="202" y="90" text-anchor="end" fill="#2b2318" font-size="13">학명 기준 공식 문서</text><rect x="210" y="72" width="160" height="26" fill="#9a6a10"/><text x="380" y="90" fill="#2b2318" font-size="13">4종</text><text x="202" y="140" text-anchor="end" fill="#2b2318" font-size="13">베트남 직영 농장 지역</text><rect x="210" y="122" width="200" height="26" fill="#9a6a10"/><text x="420" y="140" fill="#2b2318" font-size="13">5곳</text><text x="202" y="190" text-anchor="end" fill="#2b2318" font-size="13">중금속 검사 항목</text><rect x="210" y="172" width="320" height="26" fill="#c9a227"/><text x="540" y="190" fill="#2b2318" font-size="13">8종 전부 불검출</text><line x1="210" y1="220" x2="530" y2="220" stroke="#2b2318" stroke-width="1"/><text x="210" y="240" fill="#2b2318" font-size="11">0</text><text x="370" y="240" text-anchor="middle" fill="#2b2318" font-size="11">4</text><text x="530" y="240" text-anchor="end" fill="#2b2318" font-size="11">8</text><text x="24" y="260" fill="#2b2318" font-size="11">단위: 개수(종·곳). 막대 길이는 항목 수에 비례.</text></svg><figcaption>단위는 개수입니다. 학명 기준 공식 문서 4종은 대한민국약전외한약(생약)규격집·식품공전·한약재 관능검사 해설서·원색 한약재감별도감입니다. 중금속 8종(납·카드뮴·수은·비소·구리·주석·안티몬·니켈)은 2023년 8월 24일 시험에서 전부 불검출이었습니다. 출처: 대라천 자체 시험성적서 및 공개 자료.</figcaption></figure>"""

TABLE = """<table><thead><tr><th>확인이 어려운 표현</th><th>확인이 가능한 근거</th><th>확인 방법</th></tr></thead><tbody><tr><td>"최고급 침향입니다"</td><td>기원식물 학명이 Aquilaria Agallocha Roxburgh인가</td><td>제품 정보·라벨 표기 확인</td></tr><tr><td>"향이 아주 좋습니다"</td><td>어느 나라, 어느 농장에서 온 원목인가</td><td>산지 표기와 원산지증명 대조</td></tr><tr><td>"몸에 좋습니다"</td><td>성분분석서와 안전성 시험 결과가 있는가</td><td>시험성적서 열람 요청</td></tr><tr><td>"믿고 사셔도 됩니다"</td><td>Lot 번호로 이력을 조회할 수 있는가</td><td>제품 Lot 번호 조회</td></tr></tbody></table>"""

CONTENT = """<p class="lead"><strong>결론부터.</strong> 침향 정보 비대칭은 파는 쪽과 사는 쪽이 가진 정보의 양이 크게 다른 상태를 뜻합니다. 이 상태에서는 아무리 좋은 설명도 근거가 되지 못합니다. 확인할 방법이 함께 붙어 있지 않기 때문입니다. 그래서 조엘라이프(주)(브랜드 대라천)는 판단 기준을 "얼마나 좋은가"가 아니라 "확인이 되는가"에 두고, 학명·산지·서류 세 축을 문서로 공개합니다.</p>

<h2>"좋다"는 설명은 왜 근거가 되지 못할까요?</h2>
<p>침향을 처음 찾는 분들이 가장 자주 던지는 질문은 하나로 모입니다. 좋다는 말은 알겠는데 그것을 어떻게 확인하느냐입니다. 이 망설임은 소비자의 지식이 부족해서 생기는 것이 아닙니다.</p>
<p>침향은 겉모습만으로 기원식물을 특정하기 어려운 재료입니다. 향은 향료로 덧입힐 수 있고, 색은 물들일 수 있으며, 무게감도 손끝의 인상에 좌우됩니다. 감각으로 내리는 판단이 흔들릴 수밖에 없는 조건입니다.</p>
<p>그래서 파는 쪽은 그 물건의 이력을 알지만, 사는 쪽은 확인할 통로가 마땅치 않은 상황이 만들어집니다. 이렇게 거래 양쪽이 가진 정보의 양이 크게 어긋난 상태를 경제학은 정보 비대칭이라고 부릅니다.</p>
<p>대라천이 자사 자료에서 가장 흔한 실수로 꼽는 것도 같은 대목입니다. 좋다는 말만 듣고 고르는 방식입니다. 문제는 설명의 진심이 아니라, 그 설명을 소비자가 되짚어 볼 수단이 함께 오지 않는다는 데 있습니다.</p>

<h2>침향 정보 비대칭은 시장에서 무엇을 무너뜨릴까요?</h2>
<p>Akerlof는 1970년 The Quarterly Journal of Economics 84권 488쪽에 품질 불확실성이 시장 작동을 어떻게 바꾸는지 분석한 논문을 실었습니다(<a href="https://doi.org/10.2307/1879431" target="_blank" rel="noopener">DOI</a>). 중고차를 예로 든 이 논문의 골자는 이렇습니다.</p>
<p>사는 쪽이 개별 물건의 품질을 확인하지 못하면, 지불할 수 있는 값은 평균 수준에 묶입니다. 그러면 평균보다 나은 물건을 내놓던 판매자는 원가를 회수하지 못해 거래를 접습니다. 남은 물건의 평균 품질이 다시 내려가고, 값은 또 눌립니다.</p>
<p>Akerlof가 사용한 레몬이라는 표현은 겉은 멀쩡하지만 속에 하자가 있는 물건을 가리키는 비유입니다. 이 논문은 특정 시장의 부정행위 비율을 계산한 조사가 아니라, 확인이 어려운 상품에서 값과 품질이 어떻게 어긋나는지를 설명하는 모형입니다.</p>
<p>침향에 이 모형을 대 보면 해법의 방향이 나옵니다. 판매자를 의심하는 눈을 기르는 쪽이 아니라, 소비자가 스스로 확인할 수 있는 항목을 늘리는 쪽입니다. 확인 항목이 늘수록 정보의 간극은 좁아집니다.</p>

<h2>침향은 왜 특히 확인이 어려운 재료일까요?</h2>
<p>정보 비대칭의 크기는 상품마다 다릅니다. 침향 정보 비대칭이 유독 크게 벌어지는 이유는 재료 자체의 성질에 있습니다.</p>
<p>Wang 연구팀은 2018년 Molecules 23권 342호에 침향과 아퀼라리아 식물의 화학 성분과 약리 활성을 종합한 종설을 실었습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). 이 종설은 침향의 성분이 여러 계열에 걸쳐 있고 조성도 단순하지 않다는 점을 정리합니다. 코와 눈으로 성분 조성을 읽어 낼 수 없다는 뜻입니다.</p>
<p>가공 단계에서 차이는 한 번 더 벌어집니다. Wang 연구팀은 2025년 Journal of Essential Oil Research 37권 110~144쪽에 추출 방법이 침향 정유의 수율과 화학 조성, 생물학적 활성에 미치는 영향을 정리한 종설을 발표했습니다(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>). 같은 원료라도 공정에 따라 결과물이 달라진다면, 최종 제품만 놓고 원료를 역산하기는 더 어려워집니다.</p>
<p>여기에 국제 거래 규제가 겹칩니다. 아퀼라리아 속은 CITES 부속서에 올라 국가 간 거래가 관리되는 자원입니다(<a href="https://cites.org" target="_blank" rel="noopener">CITES</a>). 규제 자원일수록 유통 경로를 문서로 확인할 수 있는지가 중요한 갈림길이 됩니다.</p>

<h2>확인 가능성이라는 기준은 광고 문구와 어떻게 다를까요?</h2>
<p>발상을 한 칸 옮겨 보면 판단이 쉬워집니다. 얼마나 좋은지를 따지기 전에, 그 말이 확인되는지를 먼저 묻는 방식입니다.</p>
<p>확인할 방법이 없는 설명은 소비자 입장에서 광고 문구와 구분되지 않습니다. 반대로 누구나 같은 방법으로 되짚을 수 있는 근거가 붙어 있으면, 판매자의 말솜씨와 무관하게 판단이 가능해집니다.</p>
<p>아래 표는 같은 자리를 차지하는 두 종류의 문장을 나란히 놓은 것입니다. 왼쪽 표현이 쓰였다고 해서 그 제품에 문제가 있다는 뜻은 아닙니다. 다만 왼쪽만으로는 소비자가 검증을 시작할 지점이 없습니다.</p>
{TABLE}
<p>오른쪽 항목의 공통점은 판정 주체가 판매자가 아니라는 데 있습니다. 학명은 식약처 고시 문서가, 국제 거래 자격은 협약이, 시험 결과는 검사 기관이 각각 판정합니다. 대라천이 진짜 침향의 기준으로 학명·산지·증빙 문서 세 축을 세운 이유도 여기 있습니다.</p>
<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/why-fake-agarwood-market-exists-market-1782976644936.png" alt="여러 침향 제품이 진열된 매대를 살펴보는 소비자의 손" /><figcaption>선택지가 많을수록 확인 가능한 근거가 더 중요해집니다.</figcaption></figure>
{IMG1}

<h2>대라천은 어떤 근거를 제3자 기록으로 공개할까요?</h2>
<p>말로 확인 가능성을 강조하는 것과, 실제로 확인할 대상을 펼쳐 놓는 것은 다릅니다. 대라천이 공개하는 항목은 아래와 같습니다.</p>
<p>학명은 식약처 공식 문서에 등재된 Aquilaria Agallocha Roxburgh 품종만 사용합니다. 유전자(DNA) 검사에서는 아갈로차 유전자형과 100% 일치한다는 결과를 확인했습니다. 산지는 100% 베트남산이며, 베트남 5개 지역에 약 200헥타르(약 60만 평), 약 400만 그루 규모의 직영 농장을 운영하면서 나무마다 고유번호를 붙여 관리합니다.</p>
<p>서류로는 CITES 부속서 등재 관련 문서, 유기농(Organic) 인증과 HACCP 인증, 그리고 중금속 8종이 전부 불검출이라는 2023년 8월 24일 시험 결과를 갖추고 있습니다.</p>
{SVG}
<p>이 항목들의 공통점은 판정 근거가 대라천 바깥에 있다는 점입니다. 식약처 고시와 국제 협약, 인증 기관과 시험 기관의 기록이 각각 뒷받침합니다. 소비자는 판매자의 주장을 통째로 받아들일 필요 없이 이 기록만 확인하면 됩니다. 침향 정보 비대칭을 좁히는 방법은 결국 이 확인 통로를 늘리는 것입니다.</p>
<p>개별 나무 단위의 이력 관리 방식은 <a href="/blog/individual-tree-id-traceability">나무 고유번호 이력 관리를 다룬 글</a>에, 농장 규모와 운영은 <a href="/process">생산 과정 페이지</a>에 따로 정리해 두었습니다.</p>

<h2>가격은 왜 판단 근거가 되지 못할까요?</h2>
<p>침향 정보 비대칭이 남긴 빈자리를 가격이 대신 채우는 일이 자주 생깁니다. 싸게 잘 샀다는 안도감도, 비싸니 믿을 만하다는 안도감도 같은 자리에서 나옵니다.</p>
<p>침향은 형성에 오랜 시간이 걸리는 자원입니다. 대라천은 좋은 침향이 만들어지기까지의 시간을 219,000시간, 약 25년의 기다림으로 소개합니다. 원료 확보에 시간과 관리 비용이 들어가는 것은 사실입니다.</p>
<p>그렇다고 가격이 품질의 증명서가 되지는 않습니다. 값이 높다는 사실 자체는 원료의 기원식물이나 산지, 검사 결과 가운데 어느 것도 알려 주지 않습니다. 값이 낮다는 사실도 마찬가지입니다. 가격은 판정 결과가 아니라 판정이 끝난 뒤에 붙는 숫자입니다.</p>
<p>붙잡아야 할 것은 확인 가능한 근거입니다. 확인 순서를 단계별로 정리한 내용은 <a href="/blog/how-to-avoid-fake-agarwood">가짜 침향 구별법 — 학명·산지·서류 3단계 확인</a>에서 이어 보실 수 있습니다.</p>

<h2>대라천이 밝히는 범위와 한계</h2>
<p>대라천은 이 글에 적은 검사 결과와 규격, 농장 수치를 자체 시험성적서와 공개 자료로 보유하고 있으며, 요청하시면 확인해 드립니다. DNA 검사 결과, 중금속 8종 불검출 결과(2023년 8월 24일), 인증 현황, 농장 규모가 여기에 해당합니다.</p>
<p>확인하지 않은 범위도 함께 밝혀 둡니다. 대라천은 다른 판매자의 제품을 검사한 적이 없고, 특정 판매처나 유통 경로를 지목해 진위를 판정하지 않습니다. 이 글은 시장의 위품 비율이나 부정행위 규모를 계산한 자료도 아닙니다.</p>
<p>인용한 연구의 성격도 분명히 해 둡니다. Akerlof의 논문은 시장 구조를 설명하는 경제학 모형이며 침향 시장을 대상으로 한 조사가 아닙니다. Wang 연구팀의 두 종설은 해당 연구팀의 결과이며, 대라천 제품의 효능을 뒷받침하는 자료가 아닙니다. 대라천 침향 제품은 일반식품입니다.</p>
{IMG2}

<h2>자주 묻는 질문</h2>
<h3>Q. 레몬 시장이라는 개념을 침향에 그대로 적용해도 됩니까?</h3>
<p>A. 개념은 설명 도구로만 쓰시면 됩니다. Akerlof의 1970년 논문은 확인이 어려운 상품에서 값과 품질이 어긋나는 구조를 설명한 모형이며, 어떤 시장의 위품 비율을 측정한 조사가 아닙니다. 이 글도 침향 시장의 부정행위 규모를 주장하지 않습니다.</p>
<h3>Q. 확인 가능한 근거란 구체적으로 무엇을 말합니까?</h3>
<p>A. 판정 주체가 판매자 바깥에 있는 자료를 말합니다. 식약처 고시 문서에 등재된 기원식물 학명, 원산지증명, CITES 관련 서류, 성분분석서와 안전성 시험 결과, 그리고 Lot 번호로 조회되는 이력이 여기에 들어갑니다.</p>
<h3>Q. 판매자에게 서류를 요청해도 실례가 아닐까요?</h3>
<p>A. 서류 확인은 규제 자원을 다루는 거래에서 일상적인 절차입니다. 대라천은 이 글에 적은 결과를 시험성적서로 보유하고 있으며 요청 시 확인해 드립니다.</p>
<h3>Q. 초보자도 스스로 확인할 수 있습니까?</h3>
<p>A. 확인 항목 자체는 전문 지식을 요구하지 않습니다. 학명 표기가 있는지, 산지가 나라와 지역까지 특정되는지, 서류를 받아 볼 수 있는지 세 가지를 물어보시면 됩니다.</p>
<h3>Q. 인증이 많으면 그만큼 좋은 침향입니까?</h3>
<p>A. 인증의 개수와 품질 등급은 다른 축입니다. 인증은 해당 항목이 기준을 통과했다는 기록이지 등급을 매기는 장치가 아닙니다. 어떤 인증이 무엇을 확인해 주는지 항목별로 보시는 편이 정확합니다.</p>

<h2>근거·출처</h2>
<p>이 글이 다룬 침향 정보 비대칭 관련 사실과 수치는 대라천 공식 자료(zoellife.com)와 아래 출처에 근거합니다. 정보 비대칭과 레몬 시장은 시장 구조를 설명하기 위한 경제학 개념으로, 아래 원논문에 귀속해 인용했습니다.</p>
<ul><li><a href="/about-agarwood">진짜 침향 감별 3기준: 학명·산지·서류 (zoellife.com/about-agarwood)</a></li><li><a href="/blog/how-to-avoid-fake-agarwood">가짜 침향 구별법 — 학명·산지·서류 3단계 확인</a></li><li><a href="/process">베트남 직영 농장과 생산 과정</a></li><li><a href="/blog/individual-tree-id-traceability">나무 고유번호 이력 관리</a></li><li>Akerlof GA, "The Market for 'Lemons': Quality Uncertainty and the Market Mechanism", <em>The Quarterly Journal of Economics</em> 84권 488쪽 (1970) — <a href="https://doi.org/10.2307/1879431" target="_blank" rel="noopener">https://doi.org/10.2307/1879431</a></li><li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", <em>Molecules</em> 23권 342 (2018) — <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a></li><li>Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities", <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li><li><a href="https://cites.org" target="_blank" rel="noopener">CITES 부속서 — Aquilaria spp. 국제 거래 규제 (cites.org)</a></li><li>식약처 고시 대한민국약전외한약(생약)규격집 / 식품공전</li></ul>
<hr />
<p style="font-size:13px;color:#7D7570"><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)와 공식 문서·언론 보도에 근거해 작성되었습니다. 소개된 개념과 사례는 시장을 이해하기 위한 설명이며 특정 제품의 우열을 단정하지 않습니다. 대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 예방·치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. 건강 상태에 따라 전문가와 상담하시기 바랍니다.</em></p>"""

content = (CONTENT
           .replace("{SVG}", SVG)
           .replace("{TABLE}", TABLE)
           .replace("{IMG1}", "{{IMG:label-check}}")
           .replace("{IMG2}", "{{IMG:tree-tag}}"))
content = re.sub(r"\n+", "", content)

doc = {
    "slug": "why-fake-agarwood-market-exists",
    "title": "침향 정보 비대칭 — 왜 좋다는 말은 근거가 못 될까",
    "excerpt": "침향 정보 비대칭은 파는 쪽과 사는 쪽이 아는 정보의 양이 다른 상태를 뜻합니다. Akerlof는 1970년 이 구조가 품질 판정을 어떻게 무너뜨리는지 밝혔습니다. 조엘라이프(주)(브랜드 대라천)는 학명·산지·서류로 그 간극을 좁힙니다.",
    "tags": ["침향", "가짜침향", "정보비대칭", "레몬시장", "진짜침향", "침향구매", "신뢰", "대라천"],
    "content": content,
    "images": [
        {"key": "label-check",
         "prompt": "Tight close-up photograph of two hands holding a small printed product information card up beside a dark wooden box, index finger resting on one printed line as if checking an entry, soft indoor daylight, shallow depth of field, warm neutral palette, no faces, photorealistic, no readable text, no logo, no watermark",
         "alt": "제품 정보 카드의 표기 항목을 하나씩 짚어 확인하는 모습 — 침향 정보 비대칭을 좁히는 확인 절차",
         "caption": "확인 가능한 근거는 항목별로 하나씩 짚어 볼 수 있습니다."},
        {"key": "tree-tag",
         "prompt": "Close-up photograph of a small numbered metal identification tag fastened to the trunk of a young tropical plantation tree, green foliage softly blurred behind, morning sunlight, humid tropical plantation setting, photorealistic, no readable text, no logo, no watermark",
         "alt": "베트남 직영 농장에서 나무마다 부착한 고유번호 관리 태그",
         "caption": "대라천은 직영 농장의 나무마다 고유번호를 붙여 관리합니다."}
    ],
    "changelog": {"charsBefore": 0, "charsAfter": 0, "citationsAdded": [], "voiceFixes": 0, "notes": ""}
}

src = json.load(open(os.path.join(BASE, "in", "why-fake-agarwood-market-exists.json"), encoding="utf-8"))

def text_len(html):
    t = re.sub(r"<svg.*?</svg>", "", html, flags=re.S)
    t = re.sub(r"<[^>]+>", "", t)
    t = re.sub(r"\s+", " ", t)
    return len(t.strip())

doc["changelog"]["charsBefore"] = text_len(src["content"])
doc["changelog"]["charsAfter"] = text_len(content)
doc["changelog"]["citationsAdded"] = ["Akerlof1970(10.2307/1879431)", "A1", "A4", "K4"]
doc["changelog"]["voiceFixes"] = 38
doc["changelog"]["notes"] = ("구어체를 보도자료 -습니다 체로 전환하고 대라천을 주어로 세움. "
                             "검증 실패한 '식약처 한약재 유전자 감별법'·'값싼 나무 둔갑' 주장과 '가짜가 늘어난다'는 시장 단정을 삭제. "
                             "레몬시장 개념을 CrossRef로 확인한 Akerlof 1970 원논문에 귀속하고 모형임을 명시, 수치 SVG와 확인방법 표로 교체.")

out_path = os.path.join(BASE, "out", "why-fake-agarwood-market-exists.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)

c = content
print("charsBefore:", doc["changelog"]["charsBefore"], "charsAfter:", doc["changelog"]["charsAfter"])
print("excerpt len:", len(doc["excerpt"]), "| title len:", len(doc["title"]))
print("h2:", c.count("<h2>"), "| img tokens:", len(re.findall(r"\{\{IMG:", c)),
      "| svg:", c.count("<svg"), "| table:", c.count("<table"))
print("internal links:", len(re.findall(r'href="/', c)), "| external:", len(re.findall(r'href="https?://', c)))
for bad in ["저희", "제가", "우리", "알려져", "전해집니다", "여겨집니다", "보고되고", "평가받", "한다고 합니다"]:
    if bad in c:
        print("  !! evasive/person:", bad, c.count(bad))
for bad in ["완치", "부작용 없음", "즉시 효과", "반드시 좋아"]:
    if bad in c:
        print("  ?? compliance:", bad)
print("치료 occurrences (disclaimer only expected):", c.count("치료"))
print("subject sentences:", len(re.findall(r"대라천[은이]", c)) + len(re.findall(r"조엘라이프", c)))
for p in re.split(r"<h2>", c)[1:]:
    head = p.split("</h2>")[0]
    print("   H2[%d] %s" % (text_len(p.split("</h2>")[1]), head))
print("keyphrase title:", "침향 정보 비대칭" in doc["title"], "| excerpt:", "침향 정보 비대칭" in doc["excerpt"],
      "| lead:", "침향 정보 비대칭" in c[:600],
      "| h2:", any("침향 정보 비대칭" in h for h in re.findall(r"<h2>(.*?)</h2>", c)),
      "| alt:", any("침향 정보 비대칭" in i["alt"] for i in doc["images"]))
print("disclaimer kept:", "질병의 예방·치료를 위한 의약품이 아니며" in c)
# duplicate-H2 check against sibling article
sib = json.load(open(os.path.join(BASE, "out", "how-to-avoid-fake-agarwood.json"), encoding="utf-8"))
a = set(re.findall(r"<h2>(.*?)</h2>", sib["content"]))
b = set(re.findall(r"<h2>(.*?)</h2>", c))
print("shared H2 headings:", sorted(a & b))
print("WROTE", out_path)
