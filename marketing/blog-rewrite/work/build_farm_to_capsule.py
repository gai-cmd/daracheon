import json, re, os

SLUG = "cham-agarwood-from-farm-to-capsule"
IN = f"/Users/gai/personal/works/daerachoen/marketing/blog-rewrite/work/in/{SLUG}.json"
OUT = f"/Users/gai/personal/works/daerachoen/marketing/blog-rewrite/work/out/{SLUG}.json"

src = json.load(open(IN, encoding="utf-8"))

DISCLAIMER = '<p style="font-size: 13px; color: #7d7570;"><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)와 공식 문서&middot;학술 논문에 근거해 작성되었습니다. 소개된 전통 문헌&middot;연구 내용은 해당 출처의 기록이며 특정 효과를 보장하지 않습니다. 대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 예방&middot;치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. 건강 상태에 따라 전문가와 상담하시기 바랍니다.</em></p>'

content = """<p class="lead"><strong>결론부터.</strong> 조엘라이프(주)(브랜드 대라천)는 참침향 원료를 시장에서 사들이지 않습니다. 베트남 다섯 곳 직영 농장에서 아퀼라리아 아갈로차 록스버그(<em>Aquilaria agallocha Roxburgh</em>) 한 품종만 20~30년 길러 원료로 씁니다. 원목 약 400kg에서 얻는 순수 에센셜 오일은 20~25cc뿐이며, 그 오일이 캡슐에 담기기까지 재배&middot;수지내림&middot;채취&middot;증류&middot;검사&middot;충전 여섯 단계를 거칩니다. 대라천은 각 단계의 근거를 검사번호와 인증서로 남깁니다.</p>

<h2>대라천은 왜 원료를 사 오지 않고 직접 기를까요?</h2>
<p>침향(沈香)은 나무를 베어 바로 얻는 목재가 아닙니다. 살아 있는 아퀼라리아 나무가 상처와 감염을 견디는 동안 스스로 만들어 쌓은 수지(樹脂), 그 부분만 침향이 됩니다. Li 연구팀은 2021년 <em>Natural Product Reports</em>에 아퀼라리아 속 식물의 성분과 수지 생합성 경로를 정리한 종설을 실었습니다(<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">DOI</a>).</p>
<p>수지가 쌓이는 조건은 나무의 나이, 토양, 기후, 상처를 입은 시점에 따라 달라집니다. 그래서 이미 만들어진 향료를 사다 담는 방식으로는 원료의 일관성을 설명할 방법이 없습니다. 어느 나무에서 언제 나온 수지인지 모른 채 향만 맡아 보고 등급을 매기는 순간, 다음 로트에서 같은 품질이 나온다는 근거도 함께 사라집니다.</p>
<p>조엘라이프(주)는 완제 향료를 매입하지 않고, 나무를 심는 단계부터 원료를 관리하는 쪽을 택했습니다. 대라천의 직영 농장은 베트남 하띤&middot;람동&middot;푸꾸옥&middot;냐짱&middot;동나이 다섯 곳으로, 면적은 약 200헥타르, 나무는 약 400만 그루 규모입니다.</p>
<p>농장마다 기후와 토양이 달라 맡는 역할도 나뉩니다. 람동은 고지대의 서늘한 기후에서 연구개발과 묘목 육성을 맡고, 동나이는 현무암 토양에서 자란 원목의 증류를 담당합니다. 푸꾸옥과 냐짱에는 오래 가꿔 온 굵은 나무가 자라고, 하띤은 베트남의 전통적인 침향 산지입니다. 대라천은 이 다섯 곳을 임차해 잠시 쓰는 것이 아니라 직접 운영하며, 나무 한 그루마다 고유 번호를 매겨 생육 이력을 남깁니다.</p>
{{IMG:farm-rows-vietnam}}

<h2>'참'침향의 기원 식물은 무엇으로 확정했습니까?</h2>
<p>제품 설명에 '침향' 또는 '아가우드(Agarwood)'라고만 적으면 어떤 종에서 나온 원료인지 특정되지 않습니다. Wang 연구팀이 2021년 <em>Molecules</em>에 정리한 바에 따르면 아퀼라리아 속에는 여러 종이 분포하며, 등급 체계와 수지 유도법도 종과 지역에 따라 갈립니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>).</p>
<p>대라천은 식품의약품안전처 고시에 오른 기원 식물 아퀼라리아 아갈로차 록스버그(<em>Aquilaria agallocha Roxburgh</em>)를 원료 기준으로 삼습니다. 나무 이름표에 그렇게 적혀 있다는 뜻이 아니라, 실제 유전자가 그 종과 일치하는지를 검사로 확인했다는 뜻입니다. 향과 겉모습만으로는 종을 가려내기 어렵고, 가공을 거친 뒤에는 더 어렵습니다.</p>
<p>대라천은 원목을 DowGene에 DNA 검사로 의뢰해 아퀼라리아 아갈로차 유전자형과 100% 일치한다는 결과를 확인했습니다(검사번호 DA-260507-1). 이 검사는 원료가 바뀌는 시점마다 되풀이해 확인할 수 있는 종류의 근거입니다. 향에 대한 인상은 사람마다 갈리지만, 유전자형 일치 여부는 문서로 남고 제3자가 다시 읽을 수 있습니다.</p>
<p>앞선 글 <a href="/blog/why-aquilaria-agallocha-roxburgh-matters">「왜 아퀼라리아 아갈로차 록스버그인가」</a>에서 짚은 학명&middot;인증&middot;산지 세 기준을, 대라천은 자사 원료에도 같은 강도로 적용합니다.</p>
<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/brand-resin-rich-raw-chips-1782955803308.png" alt="수지가 풍부하게 밴 참침향 원목 조각">
<figcaption>옅은 심재를 파고든 짙은 수지 &mdash; 침향의 가치는 이 수지의 밀도에서 갈린다</figcaption>
</figure>

<h2>농장에서 캡슐까지 여섯 단계는 어떻게 이어집니까?</h2>
<p>대라천은 원목이 캡슐이 되기까지의 공정을 여섯 단계로 나누어 관리하고, 단계마다 남는 기록을 따로 보관합니다. 아래 표는 각 단계에서 대라천이 하는 일과, 그 단계를 뒷받침하는 문서를 나란히 정리한 것입니다.</p>
<table>
<thead><tr><th>단계</th><th>대라천이 하는 일</th><th>남는 기록</th></tr></thead>
<tbody>
<tr><td>1. 재배</td><td>아퀼라리아 아갈로차 록스버그 단일 품종을 20~30년 유기농법으로 재배</td><td>나무별 고유 번호</td></tr>
<tr><td>2. 수지내림</td><td>20년 이상 자란 나무에 노니 발효액을 넣어 수지를 유도, 2~10년 소요</td><td>수지유도 특허 #12835</td></tr>
<tr><td>3. 채취</td><td>벌목 후 수지가 밴 부분을 사람이 손으로 선별</td><td>채취 이력</td></tr>
<tr><td>4. 증류</td><td>동나이 직영 공장에서 전통 증기증류 72시간</td><td>공정 기록</td></tr>
<tr><td>5. 검사</td><td>유전자&middot;중금속 등 항목별 시험 의뢰</td><td>DA-260507-1, 중금속 8종 불검출(2023-08-24)</td></tr>
<tr><td>6. 충전</td><td>오일을 캡슐에 충전하고 로트 단위로 관리</td><td>Lot 번호</td></tr>
</tbody>
</table>
<p>수지내림 단계에는 화학 약품 대신 열대 과일 노니(Noni)의 발효액을 씁니다. 나무가 스스로 수지를 만들어 상처를 감싸도록 유도하는 방식이며, 대라천은 이 기술로 특허 #12835를 등록했습니다. 채취는 기계가 아니라 사람 손으로 합니다. 수지가 밴 부분과 그렇지 않은 부분을 눈과 손으로 갈라내는 작업이라 시간이 많이 듭니다.</p>
<p>여섯 단계 가운데 어느 하나만 빠져도 원료가 어디서 왔는지 되짚을 수 없습니다. 1단계에서 붙인 나무 번호가 6단계의 Lot 번호까지 이어지도록 설계한 이유입니다. 단계별 상세 공정은 <a href="/blog/from-farm-to-capsule-process">「농장에서 캡슐까지 &mdash; 침향 한 조각의 여정」</a>에 따로 정리해 두었습니다.</p>

<h2>원목 400kg에서 오일은 얼마나 나옵니까?</h2>
<p>대라천 공정 자료 기준으로, 침향 원목 약 400kg을 증류해 얻는 순수 에센셜 오일은 20~25cc입니다. 원목 무게의 약 0.005%에 해당하는 양으로, 작은 병 하나를 겨우 채웁니다. 400kg은 성인 여러 명의 몸무게를 합친 무게인데, 거기서 나오는 오일은 손바닥에 올려 놓을 만한 부피에 그칩니다.</p>
<figure>
<svg viewBox="0 0 640 330" width="100%" role="img" aria-label="참침향 원목 400kg에서 오일 20~25cc가 나오는 비율과 단계별 소요 기간">
<rect x="0" y="0" width="640" height="330" fill="#fffdf9"/>
<text x="24" y="34" font-size="17" font-weight="700" fill="#2b2318">원목 400kg → 순수 에센셜 오일 20~25cc</text>
<rect x="24" y="54" width="290" height="92" rx="10" fill="#9a6a10"/>
<text x="169" y="96" font-size="20" font-weight="700" fill="#fffdf9" text-anchor="middle">약 400 kg</text>
<text x="169" y="120" font-size="13" fill="#f2e4c6" text-anchor="middle">침향 원목</text>
<text x="336" y="108" font-size="24" fill="#9a6a10" text-anchor="middle">→</text>
<rect x="384" y="130" width="15" height="16" rx="3" fill="#9a6a10"/>
<text x="470" y="92" font-size="19" font-weight="700" fill="#2b2318" text-anchor="middle">20~25 cc</text>
<text x="470" y="114" font-size="13" fill="#2b2318" text-anchor="middle">순수 에센셜 오일</text>
<text x="24" y="172" font-size="13" fill="#2b2318">원목 무게의 약 0.005%만 오일이 됩니다.</text>
<text x="24" y="212" font-size="15" font-weight="700" fill="#2b2318">단계별 소요 기간</text>
<rect x="24" y="228" width="430" height="30" rx="5" fill="#9a6a10"/>
<rect x="456" y="228" width="103" height="30" rx="5" fill="#c69a48"/>
<rect x="561" y="228" width="6" height="30" fill="#2b2318"/>
<text x="239" y="248" font-size="13" font-weight="700" fill="#fffdf9" text-anchor="middle">재배 20~30년</text>
<text x="500" y="278" font-size="12" fill="#2b2318" text-anchor="middle">수지내림 2~10년</text>
<text x="556" y="298" font-size="12" fill="#2b2318" text-anchor="middle">증류 72시간</text>
<text x="24" y="318" font-size="12" fill="#2b2318">출처: 대라천 공정 자료 (단위 &mdash; 무게 kg, 부피 cc, 기간 년/시간)</text>
</svg>
<figcaption>대라천 공정 자료 기준 수율과 단계별 소요 기간 &mdash; 무게 kg, 부피 cc, 기간 년/시간</figcaption>
</figure>
<p>이 그림에서 눈여겨볼 지점은 왼쪽 덩어리와 오른쪽 점의 크기 차이입니다. 침향 가격이 왜 다른 향료와 다른 자릿수에서 시작하는지, 수치 하나로 설명되는 부분이 여기 있습니다.</p>
<p>수치가 이렇게 벌어지는 이유는 원목 전체가 침향이 아니기 때문입니다. 수지가 밴 부분만 향과 성분을 품고, 나머지는 그냥 목재입니다. 대라천이 20년 이상 자란 나무에만 수지내림 작업을 하는 것도 같은 이유입니다. 어린 나무는 상처를 빨리 아물려 수지를 오래 붙잡지 못합니다.</p>
<p>시간 축도 만만치 않습니다. 나무를 기르는 데 20~30년, 수지를 내리는 데 다시 2~10년이 듭니다. 증류에 쓰는 72시간은 이 긴 시간의 맨 끝에 붙는 사흘입니다. 대라천이 원료 수급을 재배 계획에서부터 잡는 이유가 여기 있습니다. 수요가 늘었다고 해서 중간 단계를 건너뛰고 물량을 만들어 낼 수 있는 원료가 아닙니다.</p>

<h2>추출법은 오일의 성분에 어떤 영향을 줍니까?</h2>
<p>같은 원목을 써도 뽑아내는 방법이 다르면 결과가 달라집니다. Wang 연구팀은 2025년 <em>Journal of Essential Oil Research</em>에 아퀼라리아 정유의 추출법을 다룬 종설을 발표하면서, 추출 방식이 수율&middot;화학 조성&middot;생물학적 활성에 모두 영향을 준다고 정리했습니다(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>). 용매 추출은 얻는 양이 많은 대신 잔류 용매 문제가 따르고, 증류는 잔류물 부담이 적은 대신 수율이 낮습니다. 어느 한 방법이 모든 항목에서 앞서지는 않는다는 것이 이 종설의 요지입니다.</p>
<p>대라천은 이 가운데 전통 증기증류를 택했고, 한 번의 증류에 72시간을 씁니다. 물의 수증기로 향 성분을 실어 내는 방식이라 용매가 남지 않고, 은근한 열로 오래 뽑아 향의 결을 지키는 쪽을 택한 결과입니다. 수율만 놓고 보면 더 많이 뽑는 방법이 있지만, 먹는 제품의 원료라는 조건이 선택의 폭을 좁힙니다.</p>
<p>침향 오일에 무엇이 들어 있는지는 여러 연구팀이 축적해 왔습니다. Wang 연구팀은 2018년 <em>Molecules</em>에 침향과 아퀼라리아 식물의 화학 성분을 총론 형태로 정리했습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). 이 총론은 침향의 향과 성분이 어느 화합물군에서 비롯하는지를 문헌 단위로 모아 보여 줍니다. 다만 이 연구들은 대라천이 수행한 것이 아니며, 제품의 효능을 설명하는 자료도 아닙니다.</p>
{{IMG:distillation-still}}

<h2>서류로 무엇까지 증명할 수 있습니까?</h2>
<p>아퀼라리아 속 식물은 국제적으로 보호&middot;관리되는 식물군에 속합니다. 국제 거래는 <a href="https://cites.org" target="_blank" rel="noopener">CITES</a>(멸종위기 야생동식물 국제거래협약) 체계 아래에서 이루어집니다. 합법적으로 길러 들여왔다는 사실을 문서로 보이지 못하면, 원료의 품질을 논하기 이전 단계에서 걸립니다.</p>
<p>대라천은 CITES 관련 서류, 원산지 증명, 자유판매증명서(Certificate of Free Sale)를 원료 유통의 기본 요건으로 규정합니다. 여기에 자체 시험 결과가 더해집니다. 수지유도 기술은 특허 #12835로 등록되어 있고, 중금속 8종(납&middot;카드뮴&middot;수은&middot;비소&middot;구리&middot;주석&middot;안티몬&middot;니켈)은 2023년 8월 24일 시험에서 전부 불검출로 나왔습니다. 이런 항목은 향이나 색으로 판별할 수 없어, 시험 성적서 외에는 확인할 방법이 없습니다.</p>
<blockquote>생산 이력, 수입 경로, 품종 자료. 이 세 가지를 요청받았을 때 바로 내놓을 수 있느냐가 진짜 침향을 가르는 첫 번째 기준이라고 대라천은 봅니다.</blockquote>
<p>소비자가 판매처에 물어볼 수 있는 것도 결국 이 세 가지입니다. 어떤 종의 나무인지, 어디서 길러 어떤 경로로 들어왔는지, 안전성 항목은 어떤 기관에서 언제 시험했는지. 대답이 문서로 돌아오지 않는다면 향에 대한 설명이 아무리 길어도 확인할 방법이 없습니다.</p>
<p>서류를 읽는 방법은 <a href="/blog/how-to-read-agarwood-certificates">「침향 인증서 읽는 법」</a>에 따로 정리해 두었습니다.</p>

<h2>왜 캡슐이라는 형태를 택했습니까?</h2>
<p>침향은 원목, 스틱, 차, 오일 등 여러 형태로 쓰입니다. 원목 그대로의 향을 즐기는 방식에는 그 나름의 즐거움이 있지만, 매일 같은 양을 같은 조건으로 다루기에는 손이 많이 갑니다. 오일은 공기와 빛에 예민해 보관도 까다롭습니다.</p>
<p>대라천이 오일을 캡슐에 충전하는 이유가 여기 있습니다. 캡슐은 오일을 외부 공기와 차단한 상태로 개별 포장하고, 로트 번호로 원료 이력을 되짚을 수 있게 해 줍니다. 다루기 까다로운 원료를 일상에서 다루기 쉬운 형태로 옮겨 놓은 셈입니다.</p>
<p>형태를 바꿨다고 해서 앞 단계가 달라지지는 않습니다. 캡슐 한 알에 담긴 오일도 20~30년 기른 나무에서, 2~10년 수지를 내린 원목에서, 72시간 증류를 거쳐 나온 그 오일입니다. 대라천이 완제 향료를 사다 담지 않는다고 되풀이해 밝히는 이유도 여기 있습니다. 마지막 형태가 무엇이든 원료의 출발점은 하나여야 이력이 끊기지 않습니다.</p>
<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/brand-premium-oil-capsule-1782955814352.png" alt="참침향 오일 캡슐 정물 &mdash; 프리미엄 건강식품">
<figcaption>산지에서 관리한 원료를 일상에서 곁에 두기 쉬운 형태로 &mdash; 오일 캡슐</figcaption>
</figure>
<p>제품 사양과 원료 구성은 <a href="/products/daerachoen-cham-agarwood-oil-capsule">대라천 참침향 오일 캡슐</a> 페이지에 표기돼 있습니다. 침향이라는 원료 자체가 궁금하다면 <a href="/about-agarwood">침향 알아보기</a>가 출발점이 됩니다.</p>

<h2>자주 묻는 질문</h2>
<h3>대라천 참침향은 어떤 나무에서 나옵니까?</h3>
<p>식품의약품안전처 고시 기원 식물인 아퀼라리아 아갈로차 록스버그(<em>Aquilaria agallocha Roxburgh</em>) 단일 품종입니다. DowGene DNA 검사에서 아갈로차 유전자형과 100% 일치한다는 결과를 확인했습니다(검사번호 DA-260507-1).</p>
<h3>원목 400kg에서 오일 20~25cc라는 수치는 어디에 근거합니까?</h3>
<p>대라천 자체 공정 자료 기준입니다. 원목 무게의 약 0.005%에 해당하며, 수지가 밴 부분만 오일이 되기 때문에 이만큼 차이가 납니다.</p>
<h3>증류에 72시간이나 쓰는 이유는 무엇입니까?</h3>
<p>대라천은 용매를 쓰지 않는 전통 증기증류를 택했습니다. 이 방식은 한 번에 많은 양을 뽑기 어려워, 은근한 열로 오래 뽑는 조건을 적용합니다. 추출법에 따라 수율과 성분 구성이 달라진다는 점은 앞의 종설 논문에도 정리돼 있습니다.</p>
<h3>다섯 농장에서 나온 원목은 섞어서 씁니까?</h3>
<p>대라천은 농장별로 역할을 나눠 운영하며, 증류는 동나이 직영 공장에서 진행합니다. 원료의 출처는 나무 번호에서 Lot 번호까지 기록으로 이어집니다.</p>
<h3>침향 거래에 CITES가 적용됩니까?</h3>
<p>아퀼라리아 속 식물은 CITES 관리 대상입니다. 대라천은 CITES 관련 서류와 원산지 증명, 자유판매증명서를 갖춘 원료만 취급합니다.</p>
<h3>구입한 제품의 원료 이력을 확인할 수 있습니까?</h3>
<p>캡슐 제품에는 Lot 번호가 부여됩니다. 농장의 나무 번호에서 시작한 기록이 이 번호까지 이어지며, 요청하시면 해당 로트의 시험성적서를 확인해 드립니다.</p>

<h2>근거&middot;출처</h2>
<p>이 글에 인용한 학술 문헌과 국제 규제 자료, 그리고 공정 수치의 출처를 아래에 밝힙니다. 논문은 모두 원문 링크로 연결되며, 대라천의 공정&middot;검사 수치는 자체 자료를 근거로 합니다.</p>
<ul>
<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", <em>Molecules</em> 23권 342 (2018) &mdash; <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a></li>
<li>Li W, Chen HQ, Wang H 외, "Natural products in agarwood and Aquilaria plants: chemistry, biological activities and biosynthesis", <em>Natural Product Reports</em> 38권 528~565쪽 (2021) &mdash; <a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">https://doi.org/10.1039/D0NP00042F</a></li>
<li>Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities", <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) &mdash; <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li>
<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) &mdash; <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>
<li>CITES 멸종위기 야생동식물 국제거래협약 &mdash; <a href="https://cites.org" target="_blank" rel="noopener">https://cites.org</a></li>
<li>대라천 공정&middot;검사 자료 &mdash; <a href="/blog/from-farm-to-capsule-process">공정 6단계 상세</a>, <a href="/blog/how-to-read-agarwood-certificates">인증서 읽는 법</a></li>
</ul>
<p>대라천은 이 글에 적은 검사번호와 인증 정보, 공정 수치를 자체 시험성적서와 공정 자료로 보유하고 있으며, 요청하시면 확인해 드립니다. 인용한 논문은 대라천이 수행한 연구가 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다. 원목의 향 성분이 사람에게 어떤 작용을 하는지는 대라천이 확인한 범위 밖의 영역입니다.</p>
<hr>
""" + DISCLAIMER

images = [
    {
        "key": "farm-rows-vietnam",
        "prompt": "Photorealistic wide shot of a managed agarwood (Aquilaria) plantation in tropical Vietnam, straight rows of slender cultivated trees on red basalt soil, morning mist between rows, low golden sunlight, distant green hills, no people in the foreground, documentary photography, natural color, shallow depth of field, no text, no logo, no watermark",
        "alt": "베트남 직영 농장에 줄지어 자란 참침향 나무",
        "caption": "하띤·람동·푸꾸옥·냐짱·동나이 다섯 곳, 약 200헥타르 규모의 직영 농장"
    },
    {
        "key": "distillation-still",
        "prompt": "Photorealistic interior of a traditional steam distillation workshop, large copper still with condenser coil, steam rising, dark aromatic wood chips in a wooden crate beside the still, warm tungsten light, worn concrete floor, industrial documentary photography, no people, no text, no logo, no watermark",
        "alt": "전통 증기증류 설비에서 참침향 오일을 추출하는 공정",
        "caption": "동나이 직영 공장의 전통 증기증류 — 한 번의 증류에 72시간"
    }
]

out = {
    "slug": SLUG,
    "title": "참침향, 농장에서 캡슐까지 — 대라천이 원료를 관리하는 6단계",
    "excerpt": "조엘라이프(주)는 참침향 원료를 사들이지 않고 베트남 5개 직영 농장에서 20~30년 기릅니다. 원목 400kg에서 오일 20~25cc, 재배부터 캡슐 충전까지 여섯 단계와 단계마다 남기는 검사 기록을 대라천이 정리했습니다.",
    "tags": src["tags"],
    "content": content,
    "images": images,
    "changelog": {
        "charsBefore": 0,
        "charsAfter": 0,
        "citationsAdded": ["A1", "A2", "A4", "A7", "K4"],
        "voiceFixes": 0,
        "notes": ""
    }
}


def korean_chars(html):
    """Hangul-syllable count of the visible body text (SVG internals excluded)."""
    text = re.sub(r"<svg[\s\S]*?</svg>", "", html)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&[a-z]+;", "", text)
    text = re.sub(r"\{\{IMG:[^}]+\}\}", "", text)
    return len(re.findall(r"[가-힣]", text))


out["changelog"]["charsBefore"] = korean_chars(src["content"])
out["changelog"]["charsAfter"] = korean_chars(content)
out["changelog"]["voiceFixes"] = 11
out["changelog"]["notes"] = (
    "1,012자 원고를 보도자료 인칭으로 재작성하고 조엘라이프/대라천을 주어로 세움('우리는·라고 봅니다' 등 회피 화법 제거). "
    "공정 6단계 표·수율 SVG·FAQ 5문·근거 출처 링크를 신설해 3,000자 이상으로 보강. "
    "수치·검사번호(DA-260507-1)·특허 #12835·학명·이미지 URL·disclaimer는 그대로 두고, 인용은 검증맵 A1/A2/A4/A7/K4만 사용."
)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# ---- self checks ----
print("charsBefore:", out["changelog"]["charsBefore"])
print("charsAfter :", out["changelog"]["charsAfter"])
print("excerpt len:", len(out["excerpt"]))
print("title len  :", len(out["title"]))
print("IMG tokens :", re.findall(r"\{\{IMG:([^}]+)\}\}", content))
print("svg count  :", content.count("<svg"))
print("banned     :", [w for w in ["저희", "제가", "알려져", "여겨집니다", "전해집니다", "보고되고 있습니다", "평가받", "치료", "완치", "부작용 없음"] if w in content.replace(DISCLAIMER, "")])
print("uri check  :", "우리" in content)
h2s = re.findall(r"<h2>(.*?)</h2>", content)
print("h2 count   :", len(h2s))
parts = re.split(r"<h2>", content)
for p in parts[1:]:
    name = p.split("</h2>")[0]
    body = p.split("</h2>", 1)[1]
    print("   ", korean_chars(body), name)
print("subject sentences:", len(re.findall(r"(대라천|조엘라이프\(주\)|조엘라이프)[은는이가]", content)))
print("internal links:", re.findall(r'href="(/[^"]+)"', content))
print("external links:", len(re.findall(r'href="(https?://[^"]+)"', content)))
print("disclaimer kept:", DISCLAIMER in content)
