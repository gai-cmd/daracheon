# -*- coding: utf-8 -*-
"""Rebuild first-agarwood-purchase-anxiety per SPEC.md.

Voice stance: reassurance by evidence. Instead of adjectives aimed at a hesitant
buyer, state what 조엘라이프(주) documents and what a buyer can request and check.
Certificate/authentication detail is cross-linked, not restated.
"""
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'first-agarwood-purchase-anxiety'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG)))
DISC = re.findall(r'<p style=[\'"]font-size:13px;color:#7D7570[\'"]><em>※.*?</em></p>', src['content'], re.S)[-1]

SVG = '''<figure><svg viewBox="0 0 640 250" width="100%" role="img" aria-label="입문 제품 세 종의 1박스 구성 수량 비교 막대그래프"><rect x="0" y="0" width="640" height="250" fill="#fffdf9"/><text x="20" y="34" font-size="17" font-weight="700" fill="#2b2318">입문 제품 1박스 구성 수량 (단위: 개)</text><text x="20" y="84" font-size="14" fill="#2b2318">파라미냐차</text><rect x="170" y="64" width="330" height="26" fill="#9a6a10"/><text x="512" y="84" font-size="14" font-weight="700" fill="#9a6a10">30포</text><text x="20" y="144" font-size="14" fill="#2b2318">오일 캡슐</text><rect x="170" y="124" width="330" height="26" fill="#9a6a10"/><text x="512" y="144" font-size="14" font-weight="700" fill="#9a6a10">30캡슐</text><text x="20" y="204" font-size="14" fill="#2b2318">침향선향</text><rect x="170" y="184" width="187" height="26" fill="#9a6a10"/><text x="369" y="204" font-size="14" font-weight="700" fill="#9a6a10">17개</text><text x="20" y="238" font-size="12" fill="#2b2318">막대 길이는 한 박스에 담긴 개수에 비례합니다.</text></svg><figcaption>조엘라이프(주) 제품 표기 기준 1박스 구성 수량입니다. 침향 스틱은 개수가 아니라 무게(100g)로 표기되어 이 비교에서 제외했습니다. 단위: 개(포·캡슐·개).</figcaption></figure>'''

CONTENT = '''<p class="lead"><strong>결론부터.</strong> 첫 침향 구매의 불안은 취향의 영역이 아니라 정보의 영역에서 생깁니다. 조엘라이프(주)(브랜드 대라천)는 원목의 품종을 DowGene 유전자 검사로 확인했고(검사번호 DA-260507-1), CITES 부속서 등재(IIA-DNI-007)와 중금속 8종 시험 결과, 나무 한 그루 단위의 재배 기록을 문서로 보유하고 있습니다. 판매자의 설명을 믿을지 고민하는 대신, 이 문서들을 요청해 확인하시면 됩니다. 대라천 침향 제품은 일반식품입니다.</p>

<h2>첫 구매가 유독 망설여지는 이유는 무엇인가요?</h2>
<p>구매 부담은 세 조건이 겹칠 때 커집니다. 값이 높을 때, 익숙하지 않은 분야일 때, 반복 구매 경험이 없을 때입니다. 침향은 세 조건에 모두 걸립니다.</p>
<p>좋은 침향은 만들어지기까지 긴 시간이 드는 자원이라 값이 높습니다. 학명과 산지처럼 낯선 정보가 따라붙습니다. 평생 몇 번 사지 않는 물건이라 견줄 기준도 쌓이지 않습니다.</p>
<p>세 조건이 한꺼번에 걸리면 판단의 근거가 사라집니다. 값을 기준으로 삼자니 비교 대상이 없고, 인상을 기준으로 삼자니 향은 사람마다 다르게 읽힙니다.</p>
<p>부담의 성격을 정확히 보면 해법도 달라집니다. 이 불안은 취향이 없어서 생기는 것이 아니라, 파는 쪽은 원료와 공정을 알고 사는 쪽은 알기 어렵다는 정보의 기울기에서 생깁니다.</p>
<p>기울기를 줄이는 방법은 하나뿐입니다. 판매자의 표현을 해석하는 대신, 문서로 남은 항목을 직접 확인하는 것입니다.</p>
<p>확인할 항목이 정해지면 결정의 단위도 작아집니다. '좋은 침향인가'라는 큰 질문을 한 번에 판정하는 대신, 품종·산지·합법성·안전성·이력이라는 다섯 개의 작은 질문으로 나누어 하나씩 답을 받으면 됩니다. 아래에서는 대라천이 무엇을 문서로 남겨 두었는지, 그중 무엇을 요청해 볼 수 있는지를 차례로 적습니다.</p>

<h2>대라천이 문서로 남겨 둔 것은 무엇인가요?</h2>
<p>대라천은 원료에 관한 판단을 감각이 아니라 기록에 맡깁니다. 구매 전에 확인할 수 있는 항목을 정리하면 아래와 같습니다.</p>
<table><thead><tr><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">확인 항목</th><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">무엇에 답하는 문서인가</th><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">대라천이 보유한 기록</th></tr></thead><tbody><tr><td style="border:1px solid #e6d9bd;padding:8px">품종</td><td style="border:1px solid #e6d9bd;padding:8px">이 원료가 침향의 기원식물에서 나왔는가</td><td style="border:1px solid #e6d9bd;padding:8px">DowGene 유전자 검사, 검사번호 DA-260507-1</td></tr><tr><td style="border:1px solid #e6d9bd;padding:8px">산지</td><td style="border:1px solid #e6d9bd;padding:8px">어디서 자란 나무인가</td><td style="border:1px solid #e6d9bd;padding:8px">100% 베트남산, 5개 직영 농장, 나무별 고유번호</td></tr><tr><td style="border:1px solid #e6d9bd;padding:8px">합법성</td><td style="border:1px solid #e6d9bd;padding:8px">규정을 지켜 확보한 자원인가</td><td style="border:1px solid #e6d9bd;padding:8px">CITES 부속서 등재 IIA-DNI-007</td></tr><tr><td style="border:1px solid #e6d9bd;padding:8px">안전성</td><td style="border:1px solid #e6d9bd;padding:8px">유해 물질 검사 결과는 어떠한가</td><td style="border:1px solid #e6d9bd;padding:8px">중금속 8종 전부 불검출 (2023년 8월 24일 시험)</td></tr><tr><td style="border:1px solid #e6d9bd;padding:8px">이력</td><td style="border:1px solid #e6d9bd;padding:8px">이 제품이 어느 묶음에서 나왔는가</td><td style="border:1px solid #e6d9bd;padding:8px">제품 Lot 번호, Lot별 QR 조회</td></tr></tbody></table>
<p>표의 다섯 줄은 서로를 대신하지 않습니다. 유전자 검사 결과는 위생 관리를 말해 주지 않고, CITES 서류는 품질 등급을 말해 주지 않습니다. 다섯 줄을 한 항목씩 나누어 확인해야 하는 이유입니다. 서류의 발급 기관과 번호를 읽는 순서는 <a href="/blog/how-to-read-agarwood-certificates">침향 인증서 읽는 법</a>에 따로 정리해 두었습니다.</p>

{{IMG:documents-on-desk}}

<h2>구매 전에 무엇을 요청해 확인할 수 있나요?</h2>
<p>요청은 어렵지 않습니다. 다섯 항목 가운데 궁금한 것을 지정해 문의하면 됩니다. 대라천은 위 표의 시험성적서와 인증서 원본을 보관하고 있으며, 요청하시면 확인해 드립니다.</p>
<p>항목을 지정해 묻는 방식에는 또 다른 쓸모가 있습니다. 판매처가 무엇을 가지고 있고 무엇을 가지고 있지 않은지가 곧바로 드러납니다. 다섯 항목을 모두 갖춘 곳과 한두 항목만 앞세우는 곳은 답변의 구체성에서 갈립니다.</p>
<p>Lot 단위 확인은 문의 없이도 가능합니다. 대라천은 제품 Lot마다 QR 코드를 붙여 원산지와 생산 이력, Lot 단위 검사 성적을 열람할 수 있게 했습니다. 포장의 코드를 스마트폰으로 읽으면 됩니다. 이 구조는 <a href="/blog/qr-lot-traceability-trust">QR 이력추적</a>에 자세히 적었습니다.</p>
<p>국제 거래 규제에 관한 규정 원문은 <a href="https://cites.org" target="_blank" rel="noopener">CITES 공식 사이트</a>에서 직접 볼 수 있습니다. 판매자를 거치지 않고 확인할 수 있는 자료가 하나라도 있으면 판단의 출발점이 달라집니다.</p>
<p>서류를 요청하는 일을 부담스럽게 여기실 필요는 없습니다. 발급 기관과 번호, 검사 날짜가 함께 적힌 문서를 보관하는 쪽에서는 확인 요청이 통상의 절차이기 때문입니다.</p>

<h2>학명 표기는 무엇을 가려 주나요?</h2>
<p>제품 표기에서 가장 먼저 볼 항목은 학명입니다. 대라천은 <em>Aquilaria Agallocha Roxburgh</em> 원료만 사용합니다. 이 표기는 식약처 고시 대한민국약전외한약(생약)규격집이 침향의 기원식물로 올려 둔 학명이며, 식물분류학에서 같은 종을 가리키는 정명으로는 <em>Aquilaria malaccensis</em>가 함께 쓰입니다.</p>
<p>학명이 적혀 있다는 사실만으로 모든 판단이 끝나지는 않습니다. 표기는 어느 종을 쓰겠다는 선언이고, 그 선언이 지켜졌는지는 검사 결과가 답합니다. 대라천은 원목을 DowGene에 의뢰해 <em>Aquilaria agallocha</em> 유전자형과 100% 일치한다는 결과를 확인했습니다(검사번호 DA-260507-1).</p>
<p>선언과 검사 결과가 함께 있을 때 비로소 확인이 성립합니다. 학명 표기만 있고 검사 결과가 없다면 아직 확인할 항목이 남아 있는 셈입니다. 학명 표기가 왜 중요한지는 <a href="/blog/why-aquilaria-agallocha-roxburgh-matters">학명 표기가 가리키는 것</a>에 정리했습니다.</p>
<p>등급은 또 다른 문제입니다. Wang Y 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 분포와 성분, 침향 등급 체계, 수지 유도법을 정리한 리뷰를 발표했습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). 이 논문은 해당 연구팀의 결과이며, 대라천 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>

<h2>어떤 제품부터 시작하면 부담이 적을까요?</h2>
<p>확인 항목을 정했다면 다음은 구성입니다. 대라천 라인업에서 진입 부담이 낮은 쪽은 차와 향, 그다음이 캡슐, 원목과 오일이 뒤에 놓입니다.</p>
<p>대라천 자료는 처음 접하는 분께 구성이 단순한 제품을 먼저 안내합니다. 음료 형태로는 침향 파라미냐차 30포, 공간의 향으로는 침향선향(15cm × 17개)이나 침향 스틱 100g, 매일 챙기는 형태로는 '참'침향 오일 캡슐 30캡슐이 그 자리에 놓입니다.</p>
''' + SVG + '''
<p>구성 수량을 먼저 보는 이유는 단순합니다. 한 박스로 얼마나 쓸 수 있는지가 잡혀야 지출의 크기를 가늠할 수 있기 때문입니다. 제품별 구성과 가격은 <a href="/products">대라천 제품 라인업</a>에서 확인하실 수 있습니다.</p>
<p>값이 높은 쪽이 곧 진짜라는 뜻은 아닙니다. 대라천 자료는 침향오일의 경우 함량이 높다고 무조건 좋은 것은 아니며 저가·복합오일일 가능성이 있다고 안내하고, 적정한 소량을 꾸준히 쓰는 편을 권합니다. 가격표보다 앞의 다섯 가지 확인 항목을 먼저 보시는 편이 낫습니다.</p>

{{IMG:starter-products}}

<h2>캡슐의 표시 사양과 주의 대상은 어떻게 되나요?</h2>
<p>제품 표기는 그 자체로 확인 항목입니다. 대라천 '참'침향 오일 캡슐은 1캡슐당 507.5mg으로 표기되며, 한 박스는 30캡슐로 구성됩니다. 오일 원액에 적송오일·오메가3·비타민E가 함께 배합된 제품입니다.</p>
<p>제품에 표시된 섭취 방법은 1일 1회, 1캡슐을 식후에 충분한 물과 함께입니다. 이 표기는 제품 사양이며, 이 글이 섭취량을 권하는 것이 아닙니다. 표시된 방법을 따르시고, 필요하면 전문가와 상담하시기 바랍니다.</p>
<p>주의 대상도 표기로 확인합니다. 대라천 안내에 따르면 침향단(沈香丹)·침향선향 같은 일부 제품은 12세 미만 어린이와 임산부·수유부에게 권장되지 않으며, 침향 성분에 과민증이 있는 분께도 권하지 않습니다.</p>
<p>주의사항이 상세히 적혀 있는지도 판단 재료가 됩니다. 대상과 조건을 좁혀 적어 둔 표기는 제품이 누구를 위한 것인지 판매자가 스스로 밝힌 기록입니다.</p>
<p>표기를 읽는 순서는 세 가지면 충분합니다. 1회 분량과 총 구성 수량, 함께 배합된 원료, 그리고 권장하지 않는 대상입니다. 제품별 주의사항은 구매 전에 항목마다 확인하시는 편이 좋습니다.</p>

<h2>선물로 고를 때는 무엇을 확인하나요?</h2>
<p>첫 침향을 본인이 아니라 부모님이나 어르신께 드릴 선물로 고르는 경우도 많습니다. 확인 항목은 달라지지 않습니다. 학명 표기, 산지, 서류, 표시 사양, 주의 대상을 그대로 봅니다.</p>
<p>다만 한 가지가 더해집니다. 받는 분이 부담 없이 쓸 수 있는 형태인지를 함께 보는 일입니다. 매일 챙기기 좋은 오일 캡슐, 향과 형태를 함께 담은 침향 묵주·합장주가 선물 목적으로 자주 선택됩니다. 묵주와 합장주는 침향 100% 원목으로 만든 제품입니다.</p>
<p>주의 대상 확인은 선물일 때 더 중요합니다. 본인이 쓸 때와 달리 표기를 읽을 기회가 한 번뿐이기 때문입니다. 일부 제품이 12세 미만 어린이·임산부·수유부에게 권장되지 않는다는 점은 건네기 전에 확인해 두시는 편이 좋습니다.</p>
<p>대라천은 선물용 제품에도 같은 서류를 적용합니다. 요청하시면 해당 제품의 시험성적서와 인증서를 동일하게 확인해 드립니다.</p>
<p>선물의 근거를 문서로 갖춰 두면 전할 말도 달라집니다. 값을 앞세우는 대신 어느 농장의 어떤 나무에서 온 원료인지를 함께 건넬 수 있기 때문입니다. 나무 단위 기록이 어떻게 관리되는지는 <a href="/blog/individual-tree-id-traceability">침향 이력관리</a>에 적었습니다.</p>

<h2>대라천이 확인한 것과 확인하지 않은 것</h2>
<p>대라천은 이 글에 적은 검사 결과와 표시 사양을 자체 시험성적서 및 인증서와 대조해 확인했습니다. 원목의 품종은 DowGene 유전자 검사로 확인했고(검사번호 DA-260507-1), 중금속 8종 전부 불검출이라는 결과를 2023년 8월 24일 시험에서 받았습니다. CITES 부속서 등재(IIA-DNI-007)와 나무별 고유번호 관리도 문서로 남아 있습니다. 요청하시면 원본을 확인해 드립니다.</p>
<p>확인하지 않은 것도 함께 밝힙니다. 대라천은 다른 판매처의 원료나 서류를 검증한 바 없으며, 이 글의 확인 항목은 대라천이 자사 원료에 적용하는 기준입니다. 본문에 인용한 학술 논문은 해당 연구팀의 결과이고 제품의 효능을 뒷받침하는 자료가 아닙니다. 대라천 침향 제품은 일반식품이며 질병의 예방이나 치료를 목적으로 하지 않고, 반응에는 개인차가 있습니다. </p>
<p>이 글이 확인 항목만 다루고 감별 요령을 자세히 적지 않은 이유도 같습니다. 서류로 답할 수 있는 질문과 감각으로 판단해야 하는 질문은 다루는 방법이 다르기 때문입니다. 가짜 원료가 유통되는 구조는 <a href="/blog/why-fake-agarwood-market-exists">가짜 침향 시장이 생기는 이유</a>에 따로 정리했습니다.</p>

<h2>자주 묻는 질문</h2>
<h3>Q. 처음이라면 어떤 제품부터 보면 되나요?</h3>
<p>A. 구성이 단순한 쪽부터 보시면 됩니다. 음료 형태로는 침향 파라미냐차 30포, 공간의 향으로는 침향선향이나 침향 스틱 100g, 매일 챙기는 형태로는 오일 캡슐 30캡슐이 대라천 자료가 안내하는 입문 구성입니다.</p>
<h3>Q. 값이 비싸면 진짜 침향인가요?</h3>
<p>A. 가격은 품종을 증명하지 않습니다. 대라천은 품종을 유전자 검사 결과로 확인합니다(검사번호 DA-260507-1). 가격표보다 학명 표기, 산지, 시험성적서를 먼저 확인하시는 편이 낫습니다.</p>
<h3>Q. 구매 전에 서류를 요청해도 되나요?</h3>
<p>A. 됩니다. 대라천은 유전자 검사 결과, CITES 등재 관련 문서, 중금속 시험성적서 원본을 보관하고 있으며 요청하시면 확인해 드립니다. Lot 단위 기록은 포장의 QR 코드로 직접 열람하실 수 있습니다.</p>
<h3>Q. 캡슐의 표시 사양은 어떻게 되나요?</h3>
<p>A. 1캡슐당 507.5mg, 한 박스 30캡슐로 표기됩니다. 제품에 표시된 섭취 방법은 1일 1회, 1캡슐을 식후에 충분한 물과 함께입니다. 제품 사양 표기이며 섭취량을 권하는 안내가 아닙니다.</p>
<h3>Q. 아이나 임산부도 먹을 수 있나요?</h3>
<p>A. 침향단·침향선향 같은 일부 제품은 12세 미만 어린이, 임산부·수유부에게 권장되지 않습니다. 침향 성분에 과민증이 있는 분도 피하시는 편이 좋습니다. 제품별 주의사항을 확인하시기 바랍니다.</p>

<h2>근거·출처</h2>
<p>이 글의 제품 정보와 검사 결과는 대라천 공식 자료(zoellife.com) 및 보유 시험성적서·인증서에 근거합니다. 학명 기준은 식약처 고시 대한민국약전외한약(생약)규격집을 따릅니다.</p>
<ul><li><a href="https://cites.org" target="_blank" rel="noopener">CITES — 멸종위기 야생동식물 국제거래협약</a></li><li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li><li>식약처 고시 대한민국약전외한약(생약)규격집 — 침향 학명·규격</li><li><a href="/products">대라천 침향 제품 라인업 — products</a></li><li><a href="/blog/how-to-read-agarwood-certificates">침향 인증서 읽는 법 — how-to-read-agarwood-certificates</a></li><li><a href="/blog/why-aquilaria-agallocha-roxburgh-matters">학명 표기가 가리키는 것 — why-aquilaria-agallocha-roxburgh-matters</a></li><li><a href="/blog/individual-tree-id-traceability">침향 이력관리 — individual-tree-id-traceability</a></li><li><a href="/blog/qr-lot-traceability-trust">QR 이력추적 — qr-lot-traceability-trust</a></li></ul>
<hr />
''' + DISC

CONTENT = re.sub(r'\n+', '', CONTENT)

out = {
    "slug": SLUG,
    "title": "첫 침향 구매 — 대라천이 문서로 내놓는 확인 항목 다섯",
    "excerpt": "첫 침향 구매의 망설임은 정보의 기울기에서 생깁니다. 조엘라이프(주)는 품종·산지·합법성·안전성·이력 다섯 항목을 검사번호와 함께 문서로 보유합니다. 구매 전에 무엇을 요청해 확인할 수 있는지 순서대로 정리했습니다.",
    "tags": ["침향", "침향입문", "침향구매", "첫구매", "침향추천", "파라미냐차", "침향선향", "대라천"],
    "content": CONTENT,
    "images": [
        {
            "key": "documents-on-desk",
            "prompt": "Photorealistic overhead shot of several official-looking laboratory report documents and certificate papers fanned out on a light oak desk, printed lines and tables visible but no legible words, a magnifying glass and a plain pen resting on top, soft neutral daylight from above, calm editorial photography, muted ivory and warm grey palette, no text, no logo, no watermark, no hands, no faces",
            "alt": "첫 침향 구매 전에 확인하는 시험성적서와 인증 서류",
            "caption": "대라천은 다섯 항목을 각각 다른 문서로 채웁니다."
        },
        {
            "key": "starter-products",
            "prompt": "Photorealistic still life of agarwood starter items arranged in a clean row on natural linen: a small stack of tea sachets, a bundle of thin incense sticks in a ceramic holder, and a plain amber glass bottle of soft capsules, soft diffused daylight, shallow depth of field, warm ivory and amber palette, editorial product photography, no text, no labels, no logo, no watermark, no hands, no faces",
            "alt": "침향 입문 제품 — 파라미냐차와 침향선향, 오일 캡슐 정물",
            "caption": "구성이 단순한 제품부터 살펴보는 흐름입니다."
        }
    ],
    "changelog": {
        "charsBefore": 3432,
        "charsAfter": 0,
        "citationsAdded": ["K4", "A7"],
        "voiceFixes": 0,
        "notes": "형용사로 안심시키던 -해요체 상담 화법을 보도자료 -습니다체로 전환하고, 안심의 근거를 대라천이 보유한 문서(DA-260507-1·IIA-DNI-007·중금속 8종 불검출·Lot QR)로 교체. 인증서·감별 세부는 재서술 대신 해당 글로 교차 링크했고, 검증 불가한 종감별법 서술과 구매 후기 일화는 삭제. 507.5mg·1일 1캡슐은 권장이 아닌 표시 사양으로 재배치."
    }
}

def strip(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', '', t)

out['changelog']['charsAfter'] = len(strip(CONTENT))
out['changelog']['voiceFixes'] = 46

json.dump(out, open(os.path.join(BASE, 'out/%s.json' % SLUG), 'w'), ensure_ascii=False, indent=2)
print('written', out['changelog']['charsAfter'], 'chars | excerpt', len(out['excerpt']), '| title', len(out['title']))
