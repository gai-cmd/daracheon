import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = "why-is-agarwood-so-expensive"
src = json.load(open(os.path.join(BASE, "in", SLUG + ".json"), encoding="utf-8"))
sc = src["content"]

# --- preserve source assets byte-identical -------------------------------
SVG = re.search(r"<svg .*?</svg>", sc, re.S).group()
SVG = SVG.replace('<svg viewBox="0 0 420 210"', '<svg viewBox="0 0 420 210" width="100%"', 1)
IMG = re.search(r"<img[^>]*/>", sc).group()
DISC = re.search(r'<p style="font-size:13px;color:#7D7570">.*?</p>', sc, re.S).group()

P = []
A = P.append

A('<p class="lead"><strong>결론부터.</strong> 침향 가격은 향 자체의 값이 아니라 시간·수율·규제·검증 비용이 차례로 쌓인 결과입니다. 조엘라이프(주)(브랜드 대라천)는 좋은 침향을 수확하기까지 최소 26년이 걸린다고 밝히고, 원목 약 400kg에서 순수 에센셜 오일이 20~25cc만 나오는 수율을 공개합니다. 여기에 CITES 협약에 따른 합법 거래 절차와 유전자·중금속 검사 비용이 더해집니다. 다만 값이 크다는 사실만으로 품질이 증명되지는 않습니다.</p>')

# H2 1
A('<h2>침향 가격은 어떤 항목이 쌓여 만들어질까요</h2>')
A('<p>침향이 비싼 이유를 한 문장으로 줄이면 원가 항목이 많고, 그 항목마다 시간이 길기 때문입니다. 대라천은 값을 구성하는 축을 다섯 가지로 나눠 각각의 수치를 공개합니다. 시간, 수율, 규제, 규모, 검증입니다.</p>')
A('<p>다섯 축은 성격이 다릅니다. 시간과 수율은 자연이 정하는 조건이라 사람이 줄일 수 없습니다. 규제와 검증은 서류와 검사 기관을 거치며 붙는 비용입니다. 규모는 그 긴 시간을 감당하기 위해 미리 투입해 둔 자본입니다. 아래 표는 각 축에 붙는 대라천의 수치와, 그 수치를 확인할 수 있는 경로를 나란히 정리한 것입니다.</p>')
A('<table><thead><tr><th>원가 축</th><th>대라천이 공개한 수치</th><th>확인 경로</th></tr></thead><tbody>'
  '<tr><td>시간</td><td>수확까지 최소 26년 · 219,000시간</td><td>재배 이력·농장 기록</td></tr>'
  '<tr><td>수율</td><td>원목 약 400kg → 순수 오일 20~25cc</td><td>제품 사양</td></tr>'
  '<tr><td>규제</td><td>CITES 부속서 등재 IIA-DNI-007</td><td>베트남 동나이 산림청 관리대장</td></tr>'
  '<tr><td>규모</td><td>5개 지역 200헥타르(약 60만 평) · 400만 그루</td><td>나무별 개별 고유번호</td></tr>'
  '<tr><td>검증</td><td>유전자형 100% 일치(DA-260507-1) · 중금속 8종 불검출</td><td>시험성적서</td></tr>'
  '</tbody></table>')
A('<p>표의 오른쪽 열은 전부 문서로 남는 항목입니다. 값을 판단할 때 왼쪽 숫자보다 오른쪽 경로를 먼저 확인하시라고 대라천이 안내하는 이유가 여기 있습니다.</p>')

# H2 2
A('<h2>수지가 쌓이는 시간은 왜 원가가 될까요</h2>')
A('<p>침향은 나무를 베면 바로 나오는 재료가 아닙니다. 아퀼라리아 나무가 벌레·바람·낙뢰·외부 충격으로 상처를 입고, 그 틈으로 곰팡이균이 들어오고, 나무가 스스로를 지키려 수지를 뿜어내고, 그 수지가 목질 속에 오래 쌓여야 비로소 침향이 됩니다.</p>')
A('<p>Li W 연구팀은 2021년 <em>Natural Product Reports</em>에 아퀼라리아 속 식물의 천연물 화학과 생합성 경로를 종합해 실었습니다(<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">DOI</a>). 대라천은 이 논문을 수지 성분이 어떻게 만들어지는지에 관한 참고 자료로만 인용하며, 제품 효능의 근거로 쓰지 않습니다.</p>')
A('<p>대라천은 베트남에서 20~30년에 걸친 유기농법으로 침향나무를 키웁니다. 20년 넘긴 나무에 2~10년 동안 열대과일 노니 발효액을 부어 수지를 내리게 하고, 다 자란 뒤 벌목해 사람이 손으로 직접 채취합니다. 좋은 침향을 수확하기까지 최소 26년, 대라천이 219,000시간(약 25년)의 기다림이라 부르는 세월이 그대로 원가에 들어갑니다.</p>')
A('<figure>' + SVG + '<figcaption>단위: 년. 좋은 침향 최소 26년은 대라천 공식 자료 기준이며, 나머지 막대는 길이를 가늠하기 위한 비교 예시입니다.</figcaption></figure>')
A('<p>기다림이 원가가 되는 까닭은 그 사이 나무가 팔리지 않기 때문입니다. 심은 해부터 수확하는 해까지 토지와 인건비, 관리비가 계속 나가지만 회수는 26년 뒤에야 시작됩니다.</p>')
A('{{IMG:resin-heartwood-macro}}')

# H2 3
A('<h2>원목 400kg에서 오일 20~25cc — 수율은 값에 어떻게 반영될까요</h2>')
A('<p>시간 다음으로 값을 끌어올리는 항목은 수율입니다. 대라천 참침향 에센셜 오일은 25년산 원목을 72시간 동안 고온 증류해 얻은 100% 순수 오일인데, 약 400kg의 원목에서 나오는 양이 20~25cc(약 20~25ml)에 그칩니다. 큰 나무 더미에서 작은 병 하나를 건지는 셈입니다.</p>')
A('<p>수율은 고정된 상수가 아닙니다. Wang X 연구팀은 2025년 <em>Journal of Essential Oil Research</em>에 아퀼라리아 속 정유의 추출 방식이 수율과 화학 조성, 생물학적 활성에 어떤 영향을 주는지 종합 리뷰로 정리했습니다(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>). 같은 원목이라도 증류 방식과 시간이 달라지면 뽑히는 양과 성분 구성이 달라진다는 뜻입니다.</p>')
A('<p>그래서 수율 숫자는 조건과 함께 읽어야 합니다. 대라천이 원목 나이(25년산)와 증류 시간(72시간)을 수율 옆에 함께 적어 두는 것도 같은 이유입니다. 숫자 하나만 떼어 읽는 방식이 왜 위험한지는 <a href="/blog/scarcity-numbers-agarwood-400kg">희소성 숫자를 읽는 법</a>에서 따로 다룹니다.</p>')

# H2 4
A('<h2>CITES 규제는 가격에 무엇을 더할까요</h2>')
A('<p>침향은 아무나 캐서 파는 자원이 아닙니다. 아퀼라리아 속은 <a href="https://cites.org" target="_blank" rel="noopener">CITES</a>, 곧 멸종위기에 처한 야생동식물종의 국제거래에 관한 협약의 관리 대상입니다. 협약 당사국은 등재된 종을 거래할 때 수출국의 허가와 증명을 거치도록 정해 두었습니다.</p>')
A('<p>대라천은 자사 침향이 CITES 부속서에 관리번호 IIA-DNI-007로 등재돼 있고, 베트남 동나이 산림청 관리대장에도 올라 있다고 밝힙니다. 합법적인 국제 거래가 보장된다는 뜻이자, 서류를 갖추고 절차를 밟는 시간과 비용이 원가에 포함된다는 뜻이기도 합니다.</p>')
A('<p>규제는 값을 올리는 요인이지만 동시에 구매자에게 이득이 되는 항목입니다. 등재 번호와 관리대장이 있는 원료는 어디서 나왔는지 되짚을 수 있습니다. 서류 없이 값만 낮은 침향은 그 되짚기가 불가능합니다.</p>')
A('<p>규제 비용은 수확 시점에 한 번 드는 항목도 아닙니다. 재배 구역을 등록해 두고, 벌목과 반출 때마다 허가를 갱신하고, 수출 서류를 건별로 발급받는 절차가 26년의 재배 기간 내내 이어집니다. 값이 낮은 침향에서 가장 먼저 사라지는 항목이 이 서류인 이유이기도 합니다.</p>')

# H2 5
A('<h2>품종과 산지는 왜 값을 가를까요</h2>')
A('<p>같은 이름으로 팔려도 침향은 품종에 따라 다른 물건입니다. 대라천은 참침향의 기원식물을 아퀼라리아 아갈로차 록스버그로 명시하고, 원료를 100% 베트남산으로 한정합니다. 하띤·람동·푸꾸옥·냐짱·동나이 다섯 지역의 기후와 토양에 맞춰 나무를 기른다는 것이 대라천의 설명입니다.</p>')
A('<p>Wang Y 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 분포와 성분, 침향 등급 체계, 수지 유도법을 정리해 실었습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). 이 리뷰가 보여 주듯 침향에는 이미 등급을 나누는 체계가 존재합니다. 값의 폭이 넓은 이유도 여기 있습니다.</p>')
A('<p>등급이 나뉜다는 사실은 값의 폭이 넓다는 뜻이기도 합니다. 같은 아퀼라리아 속이라도 수지가 밴 정도와 부위에 따라 물건이 갈리고, 그 차이가 값에 그대로 반영됩니다.</p>')
A('<p>품종과 산지는 값을 정당화하는 근거가 아니라 값을 비교할 수 있게 만드는 기준선입니다. 학명이 다른 원료끼리, 산지가 다른 원료끼리 값만 견주는 비교는 성립하지 않습니다. 산지에 따라 성분 구성이 달라지는 문제는 <a href=\"/blog/vietnam-vs-indonesia-agarwood-origin\">베트남산과 인도네시아산 비교</a>에서 따로 다룹니다.</p>')

# H2 6
A('<h2>200헥타르에 심은 400만 그루를 관리하는 비용</h2>')
A('<p>26년을 기다리려면 그 세월을 버틸 준비가 먼저 있어야 합니다. 조엘라이프는 베트남 5개 지역에 약 200헥타르(약 60만 평) 규모로 약 400만 그루의 침향나무를 직접 관리합니다. 침향 업계에서도 흔치 않은 규모입니다.</p>')
A('<p>규모보다 눈여겨볼 항목은 관리 방식입니다. 대라천은 나무마다 개별 고유번호를 붙여 심은 시점부터 자라는 과정을 기록합니다. 나무 한 그루가 어느 구역에서 몇 년째 자라고 있는지를 번호로 되짚는 체계입니다.</p>')
A('<p>이 기록은 수확 뒤에도 이어집니다. 제품에는 Lot 번호가 붙어 원료가 어느 묶음에서 왔는지 조회됩니다. 나무를 심는 순간부터 캡슐이 되는 순간까지 번호가 끊기지 않게 유지하는 일에 사람과 시간이 들어가고, 그 비용 역시 값에 반영됩니다.</p>')
A('<p>규모는 위험을 나누는 장치이기도 합니다. 한 지역의 기후가 나빠져도 나머지 농장이 남으므로, 26년짜리 재배 계획이 한 번의 사고로 무너지지 않습니다. 다섯 지역에 나눠 심는 방식 자체가 긴 기다림에 붙는 보험인 셈입니다.</p>')
A('{{IMG:tree-tag-field}}')

# H2 7
A('<h2>대라천이 값 대신 내놓는 검사 결과</h2>')
A('<p>값이 높다면 그 값을 설명할 자료가 함께 있어야 합니다. 대라천은 원료와 제품에 대해 다음 결과를 공개합니다.</p>')
A('<ul>'
  '<li>유전자(DNA) 검사에서 아퀼라리아 아갈로차 유전자형과 100% 일치(검사번호 DA-260507-1)</li>'
  '<li>중금속 8종 전부 불검출(2023년 8월 24일)</li>'
  '<li>유기농(Organic)·HACCP·ISO 등 생산 관리 기준 인증</li>'
  '</ul>')
A('<p>검사에는 시료비와 기관 수수료, 재검사 주기가 따라붙습니다. 값을 낮추려면 가장 먼저 줄이게 되는 항목이기도 합니다. 서류가 없는 침향이 값싼 경우가 많은 이유를 여기서 짐작할 수 있습니다. 서류를 읽는 방법은 <a href="/blog/how-to-read-agarwood-certificates">침향 인증서 읽는 법</a>에 따로 정리돼 있습니다.</p>')
A('<p>검사 항목은 서로를 대신하지 못합니다. 유전자 검사는 품종을 확인할 뿐 안전성을 말해 주지 않고, 중금속 검사는 안전성을 확인할 뿐 품종을 말해 주지 않습니다. 값에 검증 비용이 얹힌다는 말은 이 항목들을 각각 따로 치렀다는 뜻입니다.</p>')
A('<figure>' + IMG + '<figcaption>시간·희소성·검증 비용이 겹쳐 침향의 값을 만듭니다.</figcaption></figure>')

# H2 8
A('<h2>수천 년 동안 값이 매겨져 온 향</h2>')
A('<p>침향의 값에는 기록의 무게도 얹혀 있습니다. 침향은 오랜 기간 왕실과 귀족이 주로 쓰던 향재였고, 그 흔적이 여러 문헌에 남아 있습니다. 『동의보감』과 『본초강목』은 침향을 약재 항목으로 수록했고, 성경과 불경에도 귀한 향으로 등장합니다.</p>')
A('<p>다만 문헌 기록은 그 시대의 서술이며 오늘날 제품의 효능을 뒷받침하는 자료가 아닙니다. 대라천 제품은 일반식품이므로, 문헌에 적힌 약재 서술을 제품 효과로 연결하지 않습니다. 문헌별 서술은 <a href="/blog/agarwood-in-donguibogam">동의보감 속 침향</a>과 <a href="/blog/agarwood-cultural-history">침향 문화사</a>에서 각각 다룹니다.</p>')
A('<p>역사가 값에 더하는 것은 효능의 보증이 아니라 수요의 지속입니다. 수천 년 동안 끊이지 않은 수요와, 그 수요를 채우기에 턱없이 느린 공급 속도가 만나면 값은 올라갑니다.</p>')
A('<p>수요가 오래 유지된 물건에는 위조도 따라붙습니다. 값이 높은데 진위를 눈으로 가릴 수 없는 조건은 가짜가 섞이기 좋은 환경이고, 그래서 대라천은 값을 설명하는 자리마다 서류를 함께 내놓습니다.</p>')

# H2 9
A('<h2>그래서 비싼 침향이 곧 좋은 침향일까요</h2>')
A('<p>아닙니다. 값은 판매자가 정하는 숫자라 근거와 무관하게 올릴 수 있습니다. 값이 품질을 증명하지 못하는 구조는 <a href="/blog/price-quality-illusion-agarwood">가격이 품질을 증명하지 못하는 이유</a>에서 자세히 다룹니다.</p>')
A('<p>대라천이 권하는 순서는 값을 나중에 보는 방식입니다. 먼저 학명이 아퀼라리아 아갈로차 록스버그 계통인지 확인하고, 원산지가 어디인지 확인하고, 원산지증명·DNA 검사서·CITES 인증서가 실제로 있는지 확인합니다. 세 항목이 채워진 다음에야 값이 비교 대상이 됩니다.</p>')
A('<p>처음부터 비싼 제품을 고를 필요도 없습니다. 침향은 오일·차·향·장신구처럼 형태가 다양해 부담이 적은 쪽부터 경험할 수 있습니다. 어떤 형태가 맞는지는 <a href="/about-agarwood">침향 알아보기</a>에서 확인하실 수 있습니다.</p>')
A('<p>대라천은 이 글에 적은 검사 결과와 재배 규격을 자체 시험성적서로 보유하고 있으며, 요청하시면 확인해 드립니다. 다만 인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이고, 제품의 효능을 뒷받침하는 자료가 아닙니다. 시장 전체의 가격 수준이나 다른 판매자의 원가는 대라천이 확인한 범위 밖이므로 이 글에 적지 않았습니다.</p>')

# FAQ
A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 침향이 비싼 이유를 한 줄로 말하면 무엇인가요?</h3>')
A('<p>A. 수확까지 최소 26년이 걸리고, 원목 약 400kg에서 오일이 20~25cc만 나오며, CITES 절차와 검사 비용이 더해지기 때문입니다. 모두 대라천이 수치로 공개한 항목입니다.</p>')
A('<h3>Q. 26년과 25년 중 어느 쪽이 맞나요?</h3>')
A('<p>A. 두 숫자는 가리키는 지점이 다릅니다. 대라천은 좋은 침향의 수확 시점을 최소 26년으로 안내하고, 침향이 만들어지는 데 걸리는 시간을 219,000시간(약 25년)으로 표현합니다. 제품 원료 표기에 쓰는 25년산은 원목의 나이입니다.</p>')
A('<h3>Q. CITES 등재가 값에 영향을 주나요?</h3>')
A('<p>A. 등재종은 수출국 허가와 증명을 거쳐야 거래됩니다. 대라천 침향은 부속서 등재 관리번호 IIA-DNI-007과 동나이 산림청 관리대장으로 그 절차를 밟고 있으며, 여기 드는 시간과 서류 비용이 원가에 포함됩니다.</p>')
A('<h3>Q. 값이 싼 침향은 가짜인가요?</h3>')
A('<p>A. 값만으로는 판단되지 않습니다. 학명과 원산지, 검사 서류를 확인하는 편이 정확합니다. 값이 높아도 서류가 없으면 확인할 방법이 없다는 점은 동일합니다.</p>')
A('<h3>Q. 대라천 제품은 몇 년 자란 나무를 쓰나요?</h3>')
A('<p>A. 오일 캡슐과 에센셜 오일, 침향단, 침향수는 25년산 침향을 원료로 씁니다. 수확 기준인 최소 26년과 함께 읽으면 원료의 나이를 가늠하실 수 있습니다.</p>')

# Sources
A('<h2>근거·출처</h2>')
A('<ul>'
  '<li>Li W, Chen HQ, Wang H 외, “Natural products in agarwood and Aquilaria plants: chemistry, biological activities and biosynthesis”, <em>Natural Product Reports</em> 38권 528~565쪽 (2021) — <a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">https://doi.org/10.1039/D0NP00042F</a></li>'
  '<li>Wang X, Chan SW, Singaram N 외, “Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities”, <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, “Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods”, <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>'
  '<li>CITES — 아퀼라리아 속 국제 거래 규제: <a href="https://cites.org" target="_blank" rel="noopener">https://cites.org</a> (대라천 부속서 등재 관리번호 IIA-DNI-007, 동나이 산림청 관리대장)</li>'
  '<li>대라천 원료 규격·검사 결과: <a href="/about-agarwood">침향 알아보기</a> · <a href="/brand-story">브랜드 스토리</a> · <a href="/process">생산 공정</a></li>'
  '</ul>')
A('<hr />')
A(DISC)

content = "\n".join(P)

out = {
    "slug": SLUG,
    "title": "침향이 비싼 이유 — 26년의 시간과 수율, CITES 규제",
    "excerpt": "조엘라이프(주)가 정리한 침향이 비싼 이유입니다. 수확까지 최소 26년, 원목 400kg에서 오일 20~25cc라는 수율, CITES 절차와 유전자·중금속 검사 비용이 값에 쌓이는 과정을 대라천이 공개한 수치로 짚고, 값이 품질을 증명하지 못하는 지점까지 정리했습니다.",
    "tags": ["침향", "침향가격", "침향비싼이유", "26년", "희귀자원", "CITES", "대라천", "참침향"],
    "content": content,
    "images": [
        {
            "key": "tree-tag-field",
            "prompt": "Photorealistic documentary shot inside a tropical tree plantation: rows of slender Aquilaria trees in soft morning haze, a small weathered blank metal identification tag wired to the nearest trunk in sharp focus, rough grey-brown bark texture, damp red soil, warm green and umber palette, shallow depth of field, no text, no letters, no numbers, no logo, no watermark, no people",
            "alt": "베트남 직영 농장에서 개별 고유번호표를 단 침향나무 — 침향이 비싼 이유가 되는 관리 비용",
            "caption": "나무마다 붙은 고유번호가 26년의 재배 이력을 기록으로 남깁니다"
        },
        {
            "key": "resin-heartwood-macro",
            "prompt": "Photorealistic macro still life on a pale linen surface: a cross-section slice of dark resin-saturated agarwood heartwood beside a plain untreated pale wood slice, deep black-brown resin veins clearly visible against lighter grain, soft diffused daylight from the side, muted cream and umber palette, extreme shallow depth of field, editorial product photography, no text, no letters, no numbers, no logo, no watermark, no people",
            "alt": "수지가 짙게 밴 침향 원목 단면과 일반 목질 단면 비교",
            "caption": "수지가 밴 부분만 침향이 됩니다 — 한 그루에서 얻는 양이 적은 이유입니다"
        }
    ],
    "changelog": {
        "charsBefore": len(re.sub(r"<[^>]+>", "", src["content"])),
        "charsAfter": len(re.sub(r"<[^>]+>", "", content)),
        "citationsAdded": ["A2", "A4", "A7", "K4"],
        "voiceFixes": 50,
        "notes": "초등학생 대상 -요체 구어 서술을 조엘라이프(주)/대라천 주어의 보도자료 -습니다체로 전면 전환했습니다. 글의 축을 '시간·희귀함·역사' 3분류에서 원가 항목 5축(시간·수율·규제·규모·검증)으로 재구성해 자매글 scarcity-numbers-agarwood-400kg(숫자 해석)과 각도를 분리하고 상호 링크를 걸었습니다. 동의보감 냉통(冷痛) 약효 서술은 일반식품 표시광고 리스크로 삭제하고 문헌 수록 사실만 남겼으며, A2·A4·A7 연구 귀속 문단과 K4 CITES 근거를 신설했습니다. 원문 수치(26년·219,000시간·400kg·20~25cc·200헥타르·60만 평·400만 그루·DA-260507-1·IIA-DNI-007·2023년 8월 24일·72시간·100%)와 SVG·이미지 URL·disclaimer는 그대로 유지했습니다."
    }
}
json.dump(out, open(os.path.join(BASE, "out", SLUG + ".json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("written", out["changelog"]["charsBefore"], "->", out["changelog"]["charsAfter"], "excerpt", len(out["excerpt"]), "title", len(out["title"]))
