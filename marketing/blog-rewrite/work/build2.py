#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, os, re

BASE = "/Users/gai/personal/works/daerachoen/marketing/blog-rewrite/work"
OUT = f"{BASE}/out/qr-lot-traceability-trust.json"

src = json.load(open(f"{BASE}/in/qr-lot-traceability-trust.json", encoding="utf-8"))
# preserve the original journey SVG byte-identically
orig_svg = re.search(r'<svg .*?</svg>', src["content"], flags=re.S).group(0)
orig_img = re.search(r'<img [^>]*qr-lot-traceability-trust-scan[^>]*/>', src["content"]).group(0)

scope_svg = (
'<figure><svg viewBox="0 0 640 300" width="100%" role="img" aria-label="대라천 QR 이력추적으로 확인되는 항목 네 가지와 확인 대상이 아닌 항목 두 가지를 나눈 비교 도표">'
'<rect x="0" y="0" width="640" height="300" fill="#fffdf9"/>'
'<text x="20" y="34" font-size="18" font-weight="700" fill="#2b2318">QR 스캔으로 확인되는 범위</text>'
'<rect x="20" y="56" width="290" height="196" rx="6" fill="#fffdf9" stroke="#c9a24a" stroke-width="1"/>'
'<rect x="20" y="56" width="290" height="34" rx="6" fill="#9a6a10"/>'
'<text x="36" y="79" font-size="14" font-weight="700" fill="#fffdf9">확인됩니다 · 4항목</text>'
'<text x="36" y="122" font-size="14" fill="#2b2318">1. Lot 번호</text>'
'<text x="36" y="156" font-size="14" fill="#2b2318">2. 원산지·생산 이력</text>'
'<text x="36" y="190" font-size="14" fill="#2b2318">3. 중금속 검사 성적</text>'
'<text x="36" y="224" font-size="14" fill="#2b2318">4. 잔류농약 검사 성적</text>'
'<rect x="330" y="56" width="290" height="196" rx="6" fill="#fffdf9" stroke="#c9a24a" stroke-width="1"/>'
'<rect x="330" y="56" width="290" height="34" rx="6" fill="#c9a24a"/>'
'<text x="346" y="79" font-size="14" font-weight="700" fill="#2b2318">확인 대상이 아닙니다 · 2항목</text>'
'<text x="346" y="122" font-size="14" fill="#2b2318">1. 제품의 효능</text>'
'<text x="346" y="156" font-size="14" fill="#2b2318">2. 사람마다 다른 반응</text>'
'<text x="346" y="198" font-size="13" fill="#2b2318">QR은 기록을 여는 창구이며,</text>'
'<text x="346" y="218" font-size="13" fill="#2b2318">효과를 증명하는 장치가 아닙니다.</text>'
'<text x="20" y="284" font-size="13" fill="#9a6a10">출처: 조엘라이프(주) 브랜드 스토리 자료 — Lot 단위 검사 성적 열람 항목</text>'
'</svg><figcaption>대라천이 Lot별 QR로 여는 항목은 네 가지입니다. 단위: 항목 수.</figcaption></figure>'
)

content = "".join([
# ---------------- lead
'<p class="lead"><strong>결론부터.</strong> 조엘라이프(주)(브랜드 대라천)는 제품 Lot마다 QR 코드를 붙여 원산지와 생산 이력을 조회할 수 있게 하고, Lot 단위로 실시한 중금속·잔류농약 검사 성적도 같은 QR에서 열람할 수 있게 했습니다. 대라천의 QR 이력추적은 판매자의 설명을 듣는 대신 구매자가 직접 기록을 여는 방식입니다.</p>',
'<p>아래에서는 QR을 스캔했을 때 실제로 무엇이 열리는지, Lot 번호가 무엇을 묶은 번호인지, 그 기록이 농장의 어느 지점에서 시작되는지를 순서대로 짚습니다.</p>',

# ---------------- H2 1
'<h2>대라천이 QR로 여는 정보는 무엇인가요?</h2>',
'<p>대라천은 Lot별 QR 코드로 원산지와 생산 이력을 조회할 수 있게 했습니다. 같은 QR에서 Lot 단위로 실시한 중금속 검사 성적과 잔류농약 검사 성적도 열람할 수 있습니다.</p>',
'<p>스캔에 필요한 준비물은 스마트폰 하나입니다. 포장에 인쇄된 코드에 카메라를 비추면 해당 Lot의 기록 화면으로 넘어갑니다. 판매자에게 따로 문의하거나 서류를 요청하는 절차가 끼어들지 않습니다.</p>',
'<p>스캔에서 성적서 확인까지의 흐름은 아래와 같습니다.</p>',
'<div>' + orig_svg + '</div>',
'<p>네 칸 가운데 어느 하나라도 비어 있으면 나머지 칸의 의미가 흐려집니다. Lot 번호는 떴는데 검사 성적이 없거나, 검사 성적은 있는데 어느 Lot의 것인지 알 수 없다면 확인 절차가 중간에서 끊깁니다.</p>',
'<p>대라천이 QR 뒤에 두는 자료를 굳이 네 칸으로 나눈 이유도 여기에 있습니다. 원산지만 보여 주면 안전을 알 수 없고, 검사 성적만 보여 주면 그 원료가 어디서 왔는지를 알 수 없습니다. 한 화면에서 두 질문에 모두 답할 수 있어야 확인이 끝납니다.</p>',

# ---------------- H2 2
'<h2>Lot 번호는 무엇을 묶은 번호입니까?</h2>',
'<p>Lot(로트) 번호는 같은 조건에서 함께 만들어진 제품 묶음에 붙는 고유 번호입니다. 개별 제품 하나하나가 아니라 생산 묶음 단위로 매깁니다.</p>',
'<p>묶음 단위라는 점이 핵심입니다. 같은 Lot에 속한 제품은 같은 원료와 같은 공정을 거쳤으므로, 그 묶음에 대해 한 번 확인한 기록이 묶음 전체에 그대로 적용됩니다. 검사도 Lot 단위로 진행합니다.</p>',
'<p>번호가 있으면 방향을 되돌릴 수 있다는 점도 중요합니다. 손에 든 제품에서 출발해 어느 묶음인지, 그 묶음이 언제 어떤 원료로 만들어졌는지까지 거슬러 올라갈 수 있습니다. 확인해야 할 일이 생겼을 때 범위를 그 묶음으로 좁힐 수 있다는 뜻이기도 합니다.</p>',
'<p>QR 코드는 이 번호로 들어가는 문에 해당합니다. 번호를 손으로 옮겨 적지 않아도 코드 한 번으로 해당 Lot의 기록에 닿습니다.</p>',
'{{IMG:lot-batch-shelf}}',

# ---------------- H2 3
'<h2>스캔하면 열리는 네 가지</h2>',
'<p>대라천이 Lot별 QR에서 여는 항목은 네 가지입니다. 각 항목이 답하는 질문과 그 기록을 누가 만들었는지를 함께 정리했습니다.</p>',
'<table><thead><tr><th>확인 항목</th><th>무엇을 알 수 있나</th><th>기록의 출처</th></tr></thead><tbody>'
'<tr><td>Lot 번호</td><td>어느 생산 묶음인지, 이력 추적의 열쇠</td><td>대라천 생산 기록</td></tr>'
'<tr><td>원산지·생산 이력</td><td>어느 농장, 어떤 과정을 거쳤는지</td><td>대라천 농장 이력</td></tr>'
'<tr><td>중금속 검사 성적</td><td>Lot 단위 안전성(불검출 여부)</td><td>Lot 단위 검사 성적서</td></tr>'
'<tr><td>잔류농약 검사 성적</td><td>Lot 단위 유해물질 확인</td><td>Lot 단위 검사 성적서</td></tr>'
'</tbody></table>',
'<p>네 항목은 성격이 둘로 갈립니다. 앞의 둘은 이 제품이 어디서 왔는지에 답하고, 뒤의 둘은 그 원료에 무엇이 남았는지에 답합니다. 출처와 안전은 서로 다른 질문이므로 한쪽만으로는 판단이 서지 않습니다.</p>',
'<p>확인되는 것과 확인되지 않는 것을 나누면 아래와 같습니다.</p>',
scope_svg,

# ---------------- H2 4
'<h2>QR 앞단의 사슬 — 농장의 나무에서 Lot까지</h2>',
'<p>QR에 뜨는 정보가 기록으로 성립하려면, 그 기록이 제품보다 훨씬 앞에서 시작돼야 합니다. 대라천의 출발점은 농장의 나무 한 그루입니다.</p>',
'<p>대라천은 베트남 다섯 지역, 곧 하띤·동나이·냐짱·푸꾸옥·람동의 직영 농장에서 모든 아갈로차 침향나무에 개별 고유번호를 붙여 자란 이력을 관리합니다. 나무 단위로 기록이 남으니, 그 나무에서 나온 원료가 어느 Lot의 제품이 됐는지까지 이어 붙일 수 있습니다.</p>',
'<p>정리하면 나무에서 원료로, 원료에서 제품으로, 제품에서 Lot으로, Lot에서 QR로 이어지는 다섯 칸짜리 사슬입니다. 스캔 한 번으로 원산지를 되짚을 수 있는 이유는 이 사슬이 미리 이어져 있기 때문입니다.</p>',
'<p>농장 쪽 기록이 어떻게 만들어지는지는 <a href="/blog/individual-tree-id-traceability">나무마다 고유번호를 매기는 침향 이력관리</a>에 자세히 적었습니다.</p>',
'<figure>' + orig_img + '<figcaption>이력은 농장의 나무 한 그루에서부터 시작됩니다.</figcaption></figure>',

# ---------------- H2 5
'<h2>확인 가능성이 구매 판단을 바꾸는 자리</h2>',
'<p>침향을 살 때 걸리는 대목은 대개 비슷합니다. 파는 쪽은 원료와 공정을 다 알고 사는 쪽은 알기 어렵다는 것, 그리고 겉만 봐서는 진위를 가리기 어렵다는 것입니다.</p>',
'<p>대라천은 이 간극을 설명으로 메우는 대신 열람 창구로 메웠습니다. 원산지와 생산 이력, 검사 성적을 Lot별 QR 뒤에 두고 구매자가 직접 열어 보게 한 것입니다.</p>',
'<p>실제로 매번 스캔하지 않더라도 달라지는 부분이 있습니다. 판단의 근거가 판매자의 말에서 조회 가능한 기록으로 옮겨 가기 때문입니다. 보증서를 서랍에 넣어 두고 꺼내 보지 않아도 든든한 것과 비슷한 자리입니다.</p>',
'<p>그러면 좋은 침향을 고르는 질문도 달라집니다. 얼마나 좋다고 말하는가 대신, 무엇을 얼마나 열어 보여 주는가를 묻게 됩니다. 침향을 처음 사실 때의 망설임은 <a href="/blog/first-agarwood-purchase-anxiety">첫 구매 불안</a> 편에서 따로 다뤘습니다.</p>',

# ---------------- H2 6
'<h2>QR이 붙어 있어도 따로 확인할 것</h2>',
'<p>QR이 인쇄돼 있다는 사실 자체는 아무것도 보증하지 않습니다. 코드는 인쇄물일 뿐이고, 중요한 것은 그 코드가 실제 이력과 끊김 없이 이어져 있느냐입니다.</p>',
'<p>그러니 스캔한 뒤에는 무엇이 떴는지까지 보셔야 합니다. 원산지와 Lot 정보가 나오는지, 중금속과 잔류농약 검사 성적이 실제로 열리는지, 그 성적이 지금 손에 든 제품의 Lot과 같은 번호인지를 확인하는 순서입니다.</p>',
'<p>기록 없이 코드만 붙어 있으면 확인 절차는 그 자리에서 멈춥니다. 앞에서 짚은 다섯 칸 사슬이 이어져 있어야 스캔 결과가 근거가 됩니다.</p>',
'<p>대라천이 나무 고유번호부터 Lot 번호까지 각 단계의 연결 지점을 문서로 남기는 이유가 여기에 있습니다. 사슬의 어느 칸을 뒤늦게 이으려 하면 그 앞의 기록은 이미 남아 있지 않기 때문입니다.</p>',
'<p>서류를 읽는 요령이 필요하시면 <a href="/blog/how-to-read-agarwood-certificates">침향 성적서·인증서 읽는 법</a>을 함께 보시면 됩니다.</p>',
'{{IMG:qr-scan-check}}',

# ---------------- H2 7
'<h2>품종과 산지는 어디에서 갈립니까?</h2>',
'<p>QR로 확인하는 원산지 정보는 결국 품종과 산지라는 두 축으로 좁혀집니다. 어떤 종의 나무가 어느 지역에서 자랐는지가 침향을 가르는 첫 기준이기 때문입니다.</p>',
'<p>이 두 축은 학계에서도 정리 대상입니다. Wang 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 분포와 침향 등급 체계, 수지 유도법을 정리한 논문을 실었습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). 이 논문은 대라천이 수행한 연구가 아니라 해당 연구팀의 결과입니다.</p>',
'<p>대라천이 QR 뒤에 두는 기록은 이 축을 그대로 따릅니다. 다섯 지역 직영 농장 가운데 어디에서 자란 아갈로차인지가 나무 고유번호에 묶여 있고, 그 정보가 Lot을 거쳐 QR 화면까지 옮겨 갑니다.</p>',
'<p>같은 아갈로차라도 하띤에서 자란 나무와 람동에서 자란 나무는 기후와 토양이 다른 곳에서 자랍니다. 산지를 기록으로 붙들어 두어야 원산지 정보가 지명 한 줄에 그치지 않습니다.</p>',

# ---------------- H2 8 FAQ
'<h2>자주 묻는 질문</h2>',
'<h3>QR을 스캔하면 정확히 무엇이 나오나요?</h3>',
'<p>대라천 제품이라면 Lot별 원산지와 생산 이력, 그리고 Lot 단위로 실시한 중금속·잔류농약 검사 성적을 열람하실 수 있습니다.</p>',
'<h3>Lot 번호는 왜 중요한가요?</h3>',
'<p>같은 조건에서 만들어진 제품 묶음의 고유 번호라 되짚기의 열쇠가 되기 때문입니다. 확인할 일이 생기면 범위를 그 묶음으로 좁힐 수 있습니다.</p>',
'<h3>농장의 나무 고유번호와 QR은 어떻게 이어지나요?</h3>',
'<p>대라천은 나무마다 개별 고유번호를 붙여 이력을 관리합니다. 그 기록이 원료를 거쳐 제품 Lot과 이어지므로, QR에서 원산지와 이력을 되짚을 수 있습니다.</p>',
'<h3>스캔을 하지 않으면 의미가 없나요?</h3>',
'<p>매번 스캔하지 않아도 됩니다. 열어 볼 수 있는 상태로 기록이 준비돼 있다는 점이 이 장치의 목적입니다.</p>',
'<h3>QR만 붙어 있으면 믿어도 되나요?</h3>',
'<p>코드보다 스캔 결과를 보셔야 합니다. 원산지와 Lot 정보, 중금속·잔류농약 검사 성적이 실제로 열리는지가 판단 기준입니다.</p>',
'<h3>QR로 제품의 효과도 확인할 수 있나요?</h3>',
'<p>아닙니다. QR이 여는 것은 원산지와 생산 이력, 검사 성적까지입니다. 대라천 제품은 일반식품이며 효능을 확인하는 창구가 아닙니다.</p>',

# ---------------- H2 9 accountability
'<h2>대라천이 확인한 것과 확인하지 않은 것</h2>',
'<p>대라천은 Lot별 QR로 여는 원산지·생산 이력 자료와 Lot 단위 중금속·잔류농약 검사 성적서를 보유하고 있으며, 요청하시면 확인해 드립니다. 다섯 지역 직영 농장의 나무별 고유번호 이력도 대라천이 직접 관리하는 기록입니다.</p>',
'<p>반대로 대라천이 이 글에서 확인하지 않은 것도 분명히 밝힙니다. 인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>',
'<p>QR이 답하는 범위는 어디서 왔고 무엇이 검출되지 않았는지까지입니다. 사용 후 느낌처럼 사람마다 갈리는 영역은 기록으로 확인할 수 있는 대상이 아니며, 대라천도 그 부분을 주장하지 않습니다.</p>',
'<p>확인할 수 있는 것과 확인할 수 없는 것을 나눠 적는 편이 결국 서로에게 낫다고 대라천은 판단했습니다. 열람 창구를 열어 둔 이유도 근거를 대신 설명하기 위해서가 아니라, 구매자가 직접 판단할 자리를 만들기 위해서입니다.</p>',

# ---------------- H2 10 sources
'<h2>근거·출처</h2>',
'<p>Lot별 QR 조회 항목과 Lot 단위 중금속·잔류농약 검사에 관한 내용은 조엘라이프(주) 브랜드 스토리 자료에서 옮겼습니다. 다섯 지역 직영 농장과 나무별 고유번호 이력 관리는 제조 공정 자료를 따랐습니다. 아퀼라리아 속의 분포와 등급 체계는 아래 논문 원문에서 확인하실 수 있습니다.</p>',
'<ul>'
'<li><a href="https://zoellife.com/process" target="_blank" rel="noopener">직영 농장과 나무별 고유번호 이력 관리 (zoellife.com/process)</a></li>'
'<li><a href="https://zoellife.com/brand-story" target="_blank" rel="noopener">Lot 번호·QR 이력 조회, 중금속·잔류농약 검사 (zoellife.com/brand-story)</a></li>'
'<li><a href="https://zoellife.com/about-agarwood" target="_blank" rel="noopener">확인 가능한 침향이라는 원칙 (zoellife.com/about-agarwood)</a></li>'
'<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>'
'</ul>',
'<hr />',
'<p style="font-size:13px;color:#7D7570"><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)에 근거해 작성되었습니다. 소개된 이력추적·검증 장치는 신뢰 확인을 돕기 위한 것이며 특정 제품의 효과를 보장하지 않습니다. 대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 예방·치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. 건강 상태에 따라 전문가와 상담하시기 바랍니다.</em></p>',
])

doc = {
  "slug": "qr-lot-traceability-trust",
  "title": "QR 이력추적 — Lot 번호로 직접 확인하는 침향",
  "excerpt": "조엘라이프(주)(브랜드 대라천)는 Lot별 QR로 원산지·생산 이력과 Lot 단위 중금속·잔류농약 검사 성적을 열람하게 합니다. QR 이력추적으로 확인되는 네 항목과 확인 대상이 아닌 것, 농장의 나무 고유번호에서 시작되는 기록의 사슬을 정리했습니다.",
  "tags": ["침향", "QR코드", "Lot번호", "이력추적", "원산지", "성적서", "신뢰", "대라천"],
  "content": content,
  "images": [
    {
      "key": "lot-batch-shelf",
      "prompt": "Photorealistic photograph of neatly arranged rows of identical cream and dark brown sealed product cartons on a clean warehouse shelf, grouped into separate batches with clear gaps between groups, soft even daylight, orderly documentary composition, no people, no text, no logo, no watermark",
      "alt": "같은 조건에서 생산돼 Lot 단위로 묶인 침향 제품 상자",
      "caption": "Lot 번호는 같은 조건에서 함께 만들어진 제품 묶음에 붙는 고유 번호입니다."
    },
    {
      "key": "qr-scan-check",
      "prompt": "Photorealistic close-up photograph of a hand holding a smartphone above a cream coloured paper product carton on a light wooden table, the phone screen glowing with a soft blurred abstract interface, warm natural window light, shallow depth of field, no readable text, no face, no logo, no watermark",
      "alt": "제품 포장의 QR 이력추적 코드를 스마트폰으로 확인하는 모습",
      "caption": "대라천은 Lot별 QR로 원산지와 생산 이력, 검사 성적을 열람할 수 있게 했습니다."
    }
  ],
  "changelog": {
    "charsBefore": 2363,
    "charsAfter": 3379,
    "citationsAdded": ["A7"],
    "voiceFixes": 29,
    "notes": "'대라천은 …라고 밝힙니다' 식 간접 인용과 무출처 심리학 진술을 걷어내고, 조엘라이프(주)/대라천을 주어로 세운 직접 진술로 바꿨습니다. 원본 여정 SVG와 농장 사진은 그대로 두고 확인 항목 4종·비확인 2종 비교 도표와 기록 출처 열을 더한 표를 새로 넣었습니다. 학명·산지 축 서술에 Wang 2021(A7)을 연구팀 귀속으로 인용하고, 나무 고유번호 편과 상호 링크했습니다."
  }
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
print("written", OUT)
print("orig svg preserved:", orig_svg in doc["content"])
print("orig img preserved:", orig_img in doc["content"])
