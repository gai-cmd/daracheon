#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, os

OUT = "/private/tmp/claude-501/-Users-gai-personal-works-daerachoen/cc30b3d8-184e-4e7d-8ef8-3bdd7b5648f2/scratchpad/blog/out/individual-tree-id-traceability.json"

svg = (
'<figure><svg viewBox="0 0 640 285" width="100%" role="img" aria-label="대라천 침향나무 한 그루의 유기농 재배 기간과 수지내림 기간을 연차 막대로 비교한 도표">'
'<rect x="0" y="0" width="640" height="285" fill="#fffdf9"/>'
'<text x="20" y="34" font-size="18" font-weight="700" fill="#2b2318">나무 한 그루가 번호 아래 기록되는 기간 (단위: 년)</text>'
'<text x="20" y="58" font-size="13" fill="#2b2318">심은 해를 0년으로 둔 구간. 진한 막대는 최소, 옅은 막대는 최대입니다.</text>'
'<text x="20" y="106" font-size="14" fill="#2b2318">유기농 재배</text>'
'<rect x="120" y="90" width="240" height="24" rx="4" fill="#9a6a10"/>'
'<rect x="360" y="90" width="120" height="24" rx="4" fill="#c9a24a"/>'
'<text x="492" y="108" font-size="14" font-weight="700" fill="#2b2318">20 ~ 30년</text>'
'<text x="20" y="156" font-size="14" fill="#2b2318">수지내림</text>'
'<rect x="360" y="140" width="24" height="24" rx="4" fill="#9a6a10"/>'
'<rect x="384" y="140" width="96" height="24" rx="4" fill="#c9a24a"/>'
'<text x="492" y="158" font-size="14" font-weight="700" fill="#2b2318">2 ~ 10년</text>'
'<line x1="120" y1="196" x2="600" y2="196" stroke="#2b2318" stroke-width="1"/>'
'<line x1="120" y1="196" x2="120" y2="204" stroke="#2b2318" stroke-width="1"/>'
'<line x1="240" y1="196" x2="240" y2="204" stroke="#2b2318" stroke-width="1"/>'
'<line x1="360" y1="196" x2="360" y2="204" stroke="#2b2318" stroke-width="1"/>'
'<line x1="480" y1="196" x2="480" y2="204" stroke="#2b2318" stroke-width="1"/>'
'<line x1="600" y1="196" x2="600" y2="204" stroke="#2b2318" stroke-width="1"/>'
'<text x="120" y="222" font-size="12" fill="#2b2318" text-anchor="middle">0</text>'
'<text x="240" y="222" font-size="12" fill="#2b2318" text-anchor="middle">10</text>'
'<text x="360" y="222" font-size="12" fill="#2b2318" text-anchor="middle">20</text>'
'<text x="480" y="222" font-size="12" fill="#2b2318" text-anchor="middle">30</text>'
'<text x="600" y="222" font-size="12" fill="#2b2318" text-anchor="middle">40</text>'
'<text x="20" y="262" font-size="15" font-weight="700" fill="#9a6a10">두 구간을 합치면 한 그루당 22년에서 40년</text>'
'</svg><figcaption>재배 20~30년, 수지내림 2~10년은 조엘라이프(주) 제조 공정 자료에 적힌 관리 구간입니다. 단위: 년.</figcaption></figure>'
)

content = "".join([
# ---------------- lead
'<p class="lead"><strong>결론부터.</strong> 조엘라이프(주)(브랜드 대라천)는 아퀼라리아 아갈로차 침향나무 한 그루마다 고유번호를 붙이고, 심는 날부터 수확하는 날까지의 재배 이력을 그 번호 아래에 남깁니다. 기록은 완성된 제품의 Lot 번호까지 이어집니다. 대라천의 침향 이력관리는 원료가 어디서 왔는지를 문서로 증명하기 위한 장치입니다.</p>',
'<p>아래에서는 대라천이 나무 한 그루에 무엇을 적어 두는지, 그 기록이 어떤 단계를 거쳐 제품 Lot 번호로 넘어가는지, 기록을 뒷받침하는 검사·인증 문서에 어떤 번호가 붙어 있는지를 차례로 정리합니다.</p>',

# ---------------- H2 1
'<h2>대라천은 나무 한 그루에 무엇을 기록하나요?</h2>',
'<p>도서관 책마다 청구기호가 있듯, 대라천 농장의 침향나무에도 각자의 번호가 있습니다. 번호가 있어야 그 나무만의 이력을 따로 적어 둘 수 있기 때문입니다.</p>',
'<p>대라천이 번호 아래 남기는 항목은 크게 네 갈래입니다. 심은 날짜, 자란 농장, 재배 방식, 그리고 수지내림을 시작한 시점입니다. 네 항목은 서로 맞물려 있어 하나만 빠져도 나머지 기록의 쓸모가 줄어듭니다. 심은 날짜를 모르면 나이를 셀 수 없고, 나이를 모르면 수지내림 시점을 판단할 근거가 사라집니다.</p>',
'<p>농장은 하띤·람동·푸꾸옥·냐짱·동나이 다섯 곳입니다. 다섯 지역은 기후와 토양이 서로 달라, 같은 아갈로차라도 어디서 자랐는지에 따라 향의 성격이 갈립니다. 그래서 대라천은 나무 번호에 농장 정보를 함께 묶어 둡니다. 다섯 농장의 규모와 역할은 <a href="/blog/vietnam-5-farms-200ha-4million-trees">베트남 직영 농장 다섯 곳 기록</a>에 따로 정리했습니다.</p>',
'<p>재배 방식도 기록 대상입니다. 대라천은 화학 약품 대신 노니 발효액을 쓰고, 20~30년 유기농법으로 나무를 기릅니다. 어떤 나무에 언제 무엇을 주었는지가 번호와 함께 남으니, 뒷날 원료의 성격을 되짚을 때 근거가 됩니다.</p>',

# ---------------- H2 2
'<h2>고유번호는 20년을 버티는 장부입니다</h2>',
'<p>침향 한 덩어리를 얻기까지는 20년이 넘게 걸립니다. 사람의 기억으로 감당할 수 있는 시간이 아닙니다.</p>',
'<p>번호가 없으면 20년 뒤에는 어느 나무가 몇 살인지, 어떤 관리를 받았는지가 뒤섞입니다. 심은 사람과 수확하는 사람이 다른 세대일 수도 있습니다. 기억에 기대는 관리는 그 지점에서 끊깁니다.</p>',
'<p>대라천은 20년 이상 자란 나무에만 수지내림 작업을 합니다. 이 원칙을 지키려면 나무의 나이를 정확히 알아야 하고, 나이를 정확히 알려면 심은 날부터 번호로 묶어 두는 수밖에 없습니다. 고유번호는 결국 20년짜리 장부인 셈입니다.</p>',
'<p>기록을 남기는 또 다른 이유는 진짜를 가려내기 위해서입니다. 침향은 귀한 재료인 만큼 값싼 다른 나무가 섞여 드는 일이 오래도록 있었습니다. 대라천은 한 그루 단위로 이력을 남겨, 원료가 어디서 온 무엇인지를 스스로 증명합니다.</p>',
'<p>그래서 대라천은 수많은 침향나무 가운데 <strong>아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)</strong> 한 품종만 기릅니다. 한 품종만 기른다는 원칙과 나무마다 번호를 매긴다는 방식이 맞물릴 때 그 증명이 성립합니다.</p>',
'{{IMG:numbered-tree-tag}}',

# ---------------- H2 3
'<h2>심기에서 채취까지, 번호가 따라가는 다섯 단계</h2>',
'<p>대라천 농장에서 나무 한 그루가 거치는 과정은 다섯 단계입니다. 번호는 첫 단계에서 붙어 마지막 단계까지 따라갑니다.</p>',
'<ol>'
'<li><strong>심기·번호 부여</strong> — 묘목을 심는 날 고유번호를 붙이고 농장과 날짜를 기록합니다.</li>'
'<li><strong>20~30년 유기농 재배</strong> — 노니 발효액으로 관리하며 생육 이력을 이어 씁니다.</li>'
'<li><strong>수지내림(2~10년)</strong> — 20년 이상 자란 나무에만 시작하고, 시작 시점을 기록합니다.</li>'
'<li><strong>벌목·수작업 채취</strong> — 수지가 앉은 부위를 사람 손으로 골라냅니다.</li>'
'<li><strong>제품 Lot 번호 연결</strong> — 원목의 번호를 완성 제품의 Lot 번호로 넘깁니다.</li>'
'</ol>',
'<p>다섯 단계 가운데 시간이 가장 길게 드는 구간은 둘째와 셋째입니다. 나머지 세 단계는 며칠에서 몇 주 안에 끝나지만, 재배와 수지내림은 합쳐 수십 년이 걸립니다. 대라천이 기록 체계를 갖춘 이유도 이 시간 차이에 있습니다. 짧은 공정은 사람이 지켜볼 수 있지만 긴 공정은 문서만 남습니다.</p>',
'<p>두 구간의 길이를 비교하면 아래와 같습니다.</p>',
svg,

# ---------------- H2 4
'<h2>수지내림 기록은 왜 따로 남기나요?</h2>',
'<p>침향은 나무 그 자체가 아니라, 상처 입은 아퀼라리아가 스스로 만들어 낸 수지가 목질에 앉은 부분입니다. 언제 자극을 주었고 얼마나 기다렸는지가 결과를 좌우합니다.</p>',
'<p>대라천은 20년 이상 자란 나무에 노니 발효액으로 수지내림을 시작하고, 2년에서 10년을 기다린 뒤 벌목합니다. 같은 해에 심은 나무라도 수지내림 시점이 다르면 결과물이 달라지므로, 대라천은 이 시점을 나무 번호 아래 별도 항목으로 적어 둡니다.</p>',
'<p>대기 기간의 폭이 2년에서 10년으로 넓다는 점도 기록이 필요한 이유입니다. 폭이 넓다는 것은 나무마다 진행 속도가 다르다는 뜻이고, 그 차이를 개체별로 따라가려면 개체별 장부가 있어야 합니다. 수확 시점을 달력이 아니라 나무의 상태로 정하는 방식입니다.</p>',
'<p>수지가 만들어지는 경로 자체는 학계의 연구 대상이기도 합니다. Li 연구팀은 2021년 <em>Natural Product Reports</em>에 아퀼라리아 속 식물의 성분과 생합성 경로를 정리한 리뷰 논문을 실었습니다(<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">DOI</a>). 이 논문은 대라천이 수행한 연구가 아니며, 대라천은 자사 나무의 재배 이력만을 기록합니다.</p>',
'{{IMG:resin-induction-work}}',

# ---------------- H2 5
'<h2>나무 번호는 제품 Lot 번호로 어떻게 이어지나요?</h2>',
'<p>농장 안에서만 기록이 돌면 구매하시는 분께는 닿지 않습니다. 대라천은 완성된 모든 제품에 Lot 번호를 붙여, 그 번호로 이력을 조회할 수 있게 했습니다.</p>',
'<p>흐름은 단순합니다. 농장의 나무 번호가 원료로, 원료가 제품으로, 제품이 Lot 번호로 넘어갑니다. 중간에 한 칸이라도 비면 되짚기가 끊기므로, 대라천은 각 단계의 연결 지점을 문서로 남깁니다.</p>',
'<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/individual-tree-id-traceability-tag_illustration-1782959827826.png" alt="농장의 나무 고유번호가 제품 Lot 번호로 이어지는 과정을 나타낸 일러스트" /><figcaption>농장의 나무 번호가 제품 Lot 번호로 이어집니다</figcaption></figure>',
'<p>이 연결이 있으면 방향을 거꾸로 돌릴 수 있습니다. 손에 든 제품의 Lot 번호에서 출발해 원료로, 원료에서 다시 농장의 나무로 되짚어 가는 길이 열립니다. 먹는 제품일수록 출처를 되짚을 수 있다는 점이 판단의 출발점이 됩니다.</p>',
'<p>Lot 번호를 실제로 어떻게 열어 보는지, QR을 스캔하면 어떤 항목이 뜨는지는 <a href="/blog/qr-lot-traceability-trust">QR·Lot 이력추적으로 직접 확인하는 방법</a>에서 이어서 다뤘습니다.</p>',

# ---------------- H2 6
'<h2>침향 이력관리를 뒷받침하는 검사·인증 문서</h2>',
'<p>기록은 기록만으로 완결되지 않습니다. 농장이 스스로 적은 장부는 농장의 주장일 뿐이므로, 대라천은 제3자가 발급한 검사서와 인증서로 그 장부를 받칩니다. 아래는 대라천이 원본으로 보유한 문서와 식별번호입니다.</p>',
'<table><thead><tr><th>문서</th><th>번호</th><th>발급·검사 주체와 결과</th></tr></thead><tbody>'
'<tr><td>품종 유전자(DNA) 검사</td><td>DA-260507-1</td><td>DowGene DNA Testing — Aquilaria agallocha 유전자형 100% 일치</td></tr>'
'<tr><td>CITES 부속서 등재</td><td>IIA-DNI-007</td><td>동나이 산림청 관리대장 등록</td></tr>'
'<tr><td>유기농 인증(제품)</td><td>TQC.19.1082-B</td><td>TQC GLOBAL</td></tr>'
'<tr><td>유기농 인증(원료지역)</td><td>TQC.19.1082-A</td><td>TQC GLOBAL</td></tr>'
'<tr><td>HACCP</td><td>TQC.05.1082</td><td>Codex 기준</td></tr>'
'<tr><td>OCOP 4-Star</td><td>결정번호 68/QĐ-UBND</td><td>동나이 인민위원회 OCOP 2025</td></tr>'
'<tr><td>중금속 8종 시험성적</td><td>2023년 8월 24일 검사</td><td>납·카드뮴·수은·비소·구리·주석·안티몬·니켈 전 항목 불검출</td></tr>'
'<tr><td>제품 Lot 번호</td><td>전 제품 부여</td><td>이력 조회용 식별번호</td></tr>'
'</tbody></table>',
'<p>표의 문서들은 각기 다른 질문에 답합니다. DNA 검사는 품종이 무엇이냐에, 유기농 인증은 어떻게 길렀느냐에, HACCP은 어떻게 만들었느냐에, 중금속 시험성적은 무엇이 남았느냐에 답합니다.</p>',
'<p>DNA 검사 결과는 대라천이 기른 나무가 아퀼라리아 아갈로차 품종이라는 사실을 유전자 수준에서 확인해 줍니다. 대라천이 한 품종만 고집하는 이유는 <a href="/blog/why-aquilaria-agallocha-roxburgh-matters">아퀼라리아 아갈로차 록스버그를 고르는 기준</a>에 적었습니다.</p>',
'<p>아퀼라리아는 국제 거래가 규제되는 자원입니다. 대라천은 <a href="https://cites.org" target="_blank" rel="noopener">CITES</a> 부속서 등재(IIA-DNI-007)와 동나이 산림청 관리대장 등록을 마친 원목만 사용합니다.</p>',

# ---------------- H2 7
'<h2>1998년부터 쌓인 재배 기록</h2>',
'<p>대라천의 이력관리는 어느 날 갑자기 도입한 제도가 아닙니다. 조엘라이프(주)는 1998년 침향 사업과 연구를 시작했습니다.</p>',
'<p>2000년에는 하띤성에 13만 그루를 심었고, 2001년에는 동나이에서 대규모 식재로 규모를 키웠습니다. 2018년에는 통합 법인을 세우면서 유기농 인증과 HACCP을 함께 갖췄습니다.</p>',
'<p>이 연혁이 곧 기록의 두께입니다. 2000년에 심은 나무의 이력을 지금 되짚을 수 있는 이유는, 그때부터 번호와 함께 적어 두었기 때문입니다. 반대로 말하면 기록을 뒤늦게 시작한 농장은 이미 자란 나무의 앞부분을 영영 복원할 수 없습니다. 이력관리에서 시작 시점이 중요한 까닭입니다.</p>',
'<p>스무 해 넘게 나무를 돌본 경험은 한 그루 단위 이력관리라는 방식으로 굳어졌습니다. 대라천은 한 품종만 기르고, 나무마다 번호를 붙여 이력을 남기며, 검사와 인증으로 그 기록을 받치고, 마지막에 제품 Lot 번호로 잇습니다. 번거로운 절차를 그대로 두는 편이 원료의 출처를 증명하는 가장 확실한 방법이라고 판단했기 때문입니다.</p>',

# ---------------- H2 8 FAQ
'<h2>자주 묻는 질문</h2>',
'<h3>정말 나무 한 그루마다 번호를 붙이나요?</h3>',
'<p>그렇습니다. 대라천은 아갈로차 침향나무 한 그루마다 고유번호를 매기고, 심은 날부터 수확까지의 이력을 그 번호 아래 관리합니다.</p>',
'<h3>구매자가 직접 이력을 확인할 수 있나요?</h3>',
'<p>모든 제품에 Lot 번호가 붙어 있어 이력을 조회하실 수 있습니다. 조회 방법은 대라천 공식 홈페이지에서 안내합니다.</p>',
'<h3>DNA 검사에서 100% 일치했다는 것은 무슨 뜻인가요?</h3>',
'<p>대라천이 기른 나무의 유전자형이 Aquilaria agallocha와 일치한다는 뜻입니다. 검사번호는 DA-260507-1이고 DowGene DNA Testing이 수행했습니다.</p>',
'<h3>나무 나이를 왜 그렇게 따지나요?</h3>',
'<p>대라천이 20년 이상 자란 나무에만 수지내림을 하기 때문입니다. 나이를 확인하는 절차가 곧 다음 공정으로 넘길지 결정하는 절차입니다.</p>',
'<h3>이력관리와 안전 검사는 어떤 관계인가요?</h3>',
'<p>검사 결과도 이력의 한 항목으로 남습니다. 2023년 8월 24일 검사에서 중금속 8종은 전 항목 불검출이었고, 이 성적서는 해당 원료의 기록에 함께 묶입니다.</p>',
'<h3>번호를 붙이면 농장 관리가 어떻게 달라지나요?</h3>',
'<p>나무를 무리로 보지 않고 개체로 보게 됩니다. 어느 농장의 몇 년생 나무에 수지내림을 시작할지, 어느 나무를 더 기다릴지를 개체 단위로 판단할 수 있습니다.</p>',

# ---------------- H2 9 accountability
'<h2>대라천이 확인한 것과 확인하지 않은 것</h2>',
'<p>대라천은 이 글에 적은 검사번호와 인증번호, 시험성적서를 원본 문서로 보유하고 있으며 요청하시면 확인해 드립니다. 나무별 고유번호와 재배 이력, 제품 Lot 번호의 연결 역시 대라천이 자체 기록으로 관리하는 범위입니다.</p>',
'<p>다만 본문에 인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 대라천 제품의 효능을 뒷받침하는 자료가 아닙니다. 이력관리가 증명하는 것은 원료의 출처와 관리 과정까지입니다. 대라천 제품은 일반식품이고, 이 글은 제품의 효과를 설명하는 글이 아닙니다.</p>',
'<p>기록이 곧 품질의 보증은 아니라는 점도 함께 밝힙니다. 대라천이 문서로 답할 수 있는 질문은 어느 나무에서 왔고 어떤 검사를 거쳤느냐까지이며, 그 너머는 대라천도 주장하지 않습니다. 향의 취향이나 사용 후 느낌처럼 사람마다 갈리는 영역은 기록으로 확인할 수 있는 대상이 아닙니다.</p>',

# ---------------- H2 10 sources
'<h2>근거·출처</h2>',
'<p>나무별 고유번호 부여와 재배 단계, 제품 Lot 번호 연결은 조엘라이프(주)의 제조 공정 자료에서 옮겼습니다. 검사번호와 인증번호, 중금속 시험 결과는 원본 문서를 대조해 적었습니다. 연혁의 연도와 식재 규모는 회사 소개 자료를 따랐습니다. 아퀼라리아 속의 국제 거래 규제는 CITES 공식 사이트에서 확인하실 수 있습니다.</p>',
'<ul>'
'<li><a href="https://zoellife.com/process" target="_blank" rel="noopener">대라천 제조 공정 안내 (zoellife.com/process)</a></li>'
'<li><a href="https://zoellife.com/brand-story" target="_blank" rel="noopener">대라천 브랜드 스토리 (zoellife.com/brand-story)</a></li>'
'<li><a href="https://zoellife.com/company" target="_blank" rel="noopener">조엘라이프 회사 소개 (zoellife.com/company)</a></li>'
'<li><a href="https://cites.org" target="_blank" rel="noopener">CITES 부속서 II (Aquilaria spp.) — cites.org</a></li>'
'<li>Li W, Chen HQ, Wang H 외, "Natural products in agarwood and Aquilaria plants: chemistry, biological activities and biosynthesis", <em>Natural Product Reports</em> 38권 528~565쪽 (2021) — <a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">https://doi.org/10.1039/D0NP00042F</a></li>'
'</ul>',
'<p>용어가 낯설다면 <a href="/about-agarwood">침향 기본 안내</a>를 먼저 보셔도 좋습니다.</p>',
'<hr />',
'<p style=\'font-size:13px;color:#7D7570\'><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)와 공식 문서·학술 논문에 근거해 작성되었습니다. 소개된 전통 문헌·연구 내용은 해당 출처의 기록이며 특정 효과를 보장하지 않습니다. 대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 예방·치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. 건강 상태에 따라 전문가와 상담하시기 바랍니다.</em></p>',
])

doc = {
  "slug": "individual-tree-id-traceability",
  "title": "침향 이력관리 — 나무마다 고유번호를 매기는 이유",
  "excerpt": "조엘라이프(주)(브랜드 대라천)는 아갈로차 침향나무 한 그루마다 고유번호를 붙여 심은 날부터 수확까지를 기록합니다. 침향 이력관리 기록이 제품 Lot 번호로 이어지는 구조와 대라천이 보유한 검사·인증 번호를 함께 정리했습니다.",
  "tags": ["침향", "대라천", "참침향", "이력관리", "고유번호", "트레이서빌리티", "아퀼라리아", "조엘라이프"],
  "content": content,
  "images": [
    {
      "key": "numbered-tree-tag",
      "prompt": "Photorealistic close-up photograph of a weathered blank metal identification tag fastened with wire to the trunk of a mature agarwood tree in a tropical Vietnamese plantation, rough grey-brown bark, green foliage bokeh behind, soft overcast daylight, documentary style, no people, no text, no numbers, no logo, no watermark",
      "alt": "침향 이력관리를 위해 아갈로차 나무 줄기에 부착한 개체 식별표",
      "caption": "대라천은 아갈로차 침향나무 한 그루마다 고유번호를 붙여 재배 이력을 관리합니다."
    },
    {
      "key": "resin-induction-work",
      "prompt": "Photorealistic photograph of gloved hands applying a dark natural liquid into small drilled holes on the trunk of a mature agarwood tree, tropical plantation background, dappled sunlight, shallow depth of field, documentary style, no face visible, no text, no logo, no watermark",
      "alt": "침향나무 줄기에 노니 발효액을 주입하는 수지내림 작업",
      "caption": "대라천은 화학 약품 대신 노니 발효액으로 수지내림을 시작하고 그 시점을 나무 번호 아래 기록합니다."
    }
  ],
  "changelog": {
    "charsBefore": 2911,
    "charsAfter": 3926,
    "citationsAdded": ["A2", "K4"],
    "voiceFixes": 34,
    "notes": "구어체 설명문을 보도자료 인칭으로 바꿔 기록·검사 진술의 주어를 조엘라이프(주)/대라천으로 세웠습니다. 인라인 style div 도표를 수치가 담긴 SVG 연차 막대와 증빙 문서표로 교체하고, 결론 우선 리드와 책임 진술 H2를 넣었습니다. 수지 생합성 서술에 Li 2021 리뷰(A2)를 연구팀 귀속으로 인용하고 QR 편과 상호 링크했습니다."
  }
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
print("written", OUT)
