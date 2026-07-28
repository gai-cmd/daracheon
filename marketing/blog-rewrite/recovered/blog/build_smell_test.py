#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""smell-test-real-vs-blended-agarwood-oil 재편 빌더"""
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))

TITLE = "순수 침향유의 향은 어떻게 다를까 — 코로 가려낼 수 있는 것과 없는 것"

EXCERPT = ("조엘라이프(주)(브랜드 대라천)가 정리한 순수 침향유 향 확인법입니다. 향의 전개는 감각으로 비교할 수 있지만 "
           "품종과 순도는 후각으로 판정되지 않습니다. 향으로 무엇을 볼 수 있는지, 그 한계는 어디인지, 서류로 무엇을 "
           "확인해야 하는지 정리했습니다.")

SVG_CURVE = '''<figure>
<svg viewBox="0 0 700 320" role="img" aria-label="순수 침향유와 복합 오일의 향 전개 양상 개념도" style="width:100%;height:auto;font-family:sans-serif">
<rect x="0" y="0" width="700" height="320" fill="#fffdf9"/>
<text x="350" y="32" text-anchor="middle" fill="#2b2318" font-size="17" font-weight="bold">시간에 따른 향의 전개 양상</text>
<line x1="80" y1="260" x2="650" y2="260" stroke="#c9b99a" stroke-width="2"/>
<line x1="80" y1="260" x2="80" y2="62" stroke="#c9b99a" stroke-width="2"/>
<text x="365" y="292" text-anchor="middle" fill="#2b2318" font-size="13">경과 시간</text>
<text x="46" y="160" text-anchor="middle" fill="#2b2318" font-size="13" transform="rotate(-90 46 160)">향의 세기</text>
<path d="M80 214 C 200 140, 340 128, 650 158" fill="none" stroke="#9a6a10" stroke-width="4"/>
<path d="M80 96 C 140 96, 180 240, 650 254" fill="none" stroke="#8a8f7a" stroke-width="4" stroke-dasharray="8 6"/>
<circle cx="500" cy="148" r="5" fill="#9a6a10"/>
<text x="500" y="132" text-anchor="middle" fill="#9a6a10" font-size="13" font-weight="bold">천천히 올라와 오래 남는 전개</text>
<circle cx="150" cy="120" r="5" fill="#8a8f7a"/>
<text x="252" y="108" text-anchor="middle" fill="#2b2318" font-size="13">처음만 강하고 금세 꺾이는 전개</text>
</svg>
<figcaption>수치 그래프가 아니라 향의 전개 양상을 나타낸 개념도입니다. 세로축과 가로축에 측정값은 없으며, 대라천이 설명하는 감각적 차이를 형태로 옮긴 것입니다.</figcaption>
</figure>'''

SVG_PROCESS = '''<figure>
<svg viewBox="0 0 700 300" role="img" aria-label="대라천 순수 침향유 공정 수치" style="width:100%;height:auto;font-family:sans-serif">
<rect x="0" y="0" width="700" height="300" fill="#fffdf9"/>
<text x="350" y="34" text-anchor="middle" fill="#2b2318" font-size="17" font-weight="bold">대라천이 공개한 침향유 공정 수치</text>
<line x1="70" y1="120" x2="630" y2="120" stroke="#e3d6bd" stroke-width="6"/>
<circle cx="105" cy="120" r="13" fill="#9a6a10"/>
<text x="105" y="94" text-anchor="middle" fill="#9a6a10" font-size="19" font-weight="bold">25년</text>
<text x="105" y="152" text-anchor="middle" fill="#2b2318" font-size="12">원목 수령</text>
<circle cx="280" cy="120" r="13" fill="#9a6a10"/>
<text x="280" y="94" text-anchor="middle" fill="#9a6a10" font-size="19" font-weight="bold">3회</text>
<text x="280" y="152" text-anchor="middle" fill="#2b2318" font-size="12">물세척 반복</text>
<circle cx="455" cy="120" r="13" fill="#9a6a10"/>
<text x="455" y="94" text-anchor="middle" fill="#9a6a10" font-size="19" font-weight="bold">72시간</text>
<text x="455" y="152" text-anchor="middle" fill="#2b2318" font-size="12">연속 증기 증류</text>
<circle cx="620" cy="120" r="13" fill="#9a6a10"/>
<text x="620" y="94" text-anchor="middle" fill="#9a6a10" font-size="19" font-weight="bold">숙성</text>
<text x="620" y="152" text-anchor="middle" fill="#2b2318" font-size="12">향·성분 안정화</text>
<rect x="70" y="192" width="270" height="76" fill="#f6efe2" stroke="#e3d6bd"/>
<text x="205" y="228" text-anchor="middle" fill="#9a6a10" font-size="26" font-weight="bold">400kg</text>
<text x="205" y="252" text-anchor="middle" fill="#2b2318" font-size="12">투입되는 침향나무</text>
<rect x="360" y="192" width="270" height="76" fill="#f6efe2" stroke="#e3d6bd"/>
<text x="495" y="228" text-anchor="middle" fill="#9a6a10" font-size="26" font-weight="bold">20~25cc</text>
<text x="495" y="252" text-anchor="middle" fill="#2b2318" font-size="12">여기서 나오는 에센셜 오일</text>
</svg>
<figcaption>단위와 수치는 대라천이 공개한 침향유 공정 규격입니다. 400kg 대비 20~25cc는 에센셜 오일 기준 산출량입니다.</figcaption>
</figure>'''

CONTENT = '''<p class="lead"><strong>결론부터.</strong> 순수 침향유와 다른 기름을 섞은 오일은 향이 펼쳐지는 방식이 다릅니다. 다만 코로 확인할 수 있는 것은 그 차이까지입니다. 품종이 무엇인지, 순도가 얼마인지는 후각으로 판정되지 않고 성분 분석의 영역에 남습니다. 조엘라이프(주)(브랜드 대라천)는 향을 보조 확인 수단으로만 쓰고, 학명·산지·검사 성적서를 판단의 근거로 삼도록 안내합니다. 이 글은 향으로 무엇을 볼 수 있는지, 어디부터는 볼 수 없는지, 그리고 그 빈자리를 어떤 문서가 메우는지를 정리한 글입니다.</p>

<h2>오일은 왜 눈으로 확인하기 어려울까요</h2>
<p>원목과 스틱은 눈과 손으로 살필 여지가 있습니다. 색과 무게, 수지가 밴 결, 물에 넣었을 때의 거동까지 관찰할 항목이 여럿입니다. 오일은 사정이 다릅니다. 이미 액체로 뽑아 놓은 상태라 겉모습에서 읽어 낼 정보가 거의 없습니다.</p>
<p>표시된 숫자도 생각만큼 많은 것을 말해 주지 않습니다. 함량은 그 안에 무엇이 얼마나 들었는지를 나타내는 값이고, 순도는 그것이 무엇인지를 나타내는 값입니다. 두 값은 같은 것을 가리키지 않습니다.</p>
<p>그래서 오일 앞에서는 확인 경로가 둘로 좁혀집니다. 하나는 향이고, 다른 하나는 서류입니다. 대라천은 두 경로를 순서대로 쓰되, 최종 판단은 서류에 맡기도록 안내합니다.</p>
<p>향을 먼저 두는 데는 이유가 있습니다. 서류를 요청하고 받아 보기까지는 시간이 걸리지만, 향은 그 자리에서 확인됩니다. 다시 확인해 볼 이유가 있는지를 빠르게 걸러 내는 용도로는 후각이 유용합니다. 다만 걸러 내는 것과 확정하는 것은 다른 일이며, 이 글은 그 경계를 분명히 하려는 글입니다.</p>
<p>침향유를 처음 고르시는 분이라면 <a href="/blog/real-agarwood-3-criteria">학명·인증·산지로 확인하는 침향 구별법</a>을 먼저 읽어 두시면 이 글의 순서가 더 분명해집니다.</p>

<h2>순수 침향유와 복합 오일, 향은 어떻게 다를까요</h2>
<p>대라천이 설명하는 차이는 세기가 아니라 전개입니다. 순수한 침향유는 천천히 피어올라 오래 지속되고, 깊이가 있으며, 시간이 지나도 결이 자연스럽게 이어집니다. 값싼 기름을 섞거나 향료로 흉내 낸 오일은 처음에 확 치고 올라왔다가 금세 옅어지고, 코를 찌르는 인공적인 느낌이나 낯선 잡향이 섞이기 쉽습니다.</p>
''' + SVG_CURVE + '''
<p>표로 옮기면 확인 항목이 더 분명해집니다. 오른쪽 열의 느낌이 강하게 든다면 향만으로 결론을 내리지 말고 학명·산지·검사 서류를 다시 확인하시는 편이 좋습니다.</p>
<table>
<thead><tr><th>순수 침향유에 가까운 전개</th><th>다시 확인해 볼 전개</th></tr></thead>
<tbody>
<tr><td>천천히 은은하게 올라온다</td><td>처음부터 코를 찌르듯 강하다</td></tr>
<tr><td>깊고 묵직한 결이 있다</td><td>얇고 단조롭게 느껴진다</td></tr>
<tr><td>시간이 지나도 오래 남는다</td><td>금세 옅어져 사라진다</td></tr>
<tr><td>자연스러운 나무·수지 계열의 향</td><td>알코올·화학 계열이나 이질적인 잡향</td></tr>
</tbody>
</table>
<p>오해하기 쉬운 지점을 하나 짚습니다. 향이 강하다는 사실 자체는 판단 근거가 아닙니다. 좋은 침향유도 처음에는 또렷하게 느껴집니다. 확인해야 할 것은 처음의 세기가 아니라, 시간이 지난 뒤에도 결이 이어지는가입니다.</p>

<h2>후각으로 어디까지 알 수 있고, 어디부터는 알 수 없을까요</h2>
<p>여기가 이 글에서 가장 중요한 대목입니다. 향의 차이는 실재하지만, 향은 품종을 동정하지 못하고 순도를 계량하지도 못합니다. 코로 확인되는 것은 "이 오일의 전개가 순수 침향유의 전개와 닮았는가"라는 인상까지입니다. 그 인상은 다시 확인해 볼 이유는 되어도, 진위 판정의 결론이 되지는 않습니다.</p>
<p>성분 조성을 읽는 일은 기기 분석의 영역입니다. Wang X 연구팀은 2025년 <em>Journal of Essential Oil Research</em>에 아퀼라리아 정유의 추출법을 종합 검토하면서, 추출 방식과 조건에 따라 수율과 화학 조성, 생물학적 활성이 달라진다고 정리했습니다(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>). 같은 원료라도 공정이 바뀌면 성분표가 바뀐다는 뜻입니다. 이 정도의 차이는 코로 분해되지 않고, 성분 분석 자료에서 확인됩니다.</p>
<p>무엇을 맡고 있는지도 짚어 둘 필요가 있습니다. Wang Y 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 분포와 등급 체계, 수지 유도법을 정리하면서 휘발성 성분과 비휘발성 성분을 나누어 다뤘습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). 코가 감지하는 쪽은 휘발성 성분이며, 오일에 담긴 정보 전체가 아닙니다. 후각을 보조 수단이라고 부르는 이유가 여기에 있습니다.</p>
<p>인용한 연구는 대라천이 수행한 것이 아니라 각 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>

<h2>향을 맡기 전에 조건을 맞춥니다</h2>
<p>같은 오일이라도 맡는 조건에 따라 느낌이 달라집니다. 감기에 걸렸을 때, 강한 냄새를 한참 맡은 직후, 식사 직후에는 코가 이미 지쳐 있습니다. 이런 상태에서 내린 판단은 오일이 아니라 컨디션을 반영합니다.</p>
<p>맡는 방법도 결과를 바꿉니다. 코에 바짝 대고 한 번에 세게 들이마시면 첫인상만 크게 남습니다. 조금 떨어뜨려 여러 번 천천히 맡으면서 시간에 따라 어떻게 변하는지를 살피는 편이 낫습니다. 첫 향, 몇 분 뒤의 향, 한참 뒤 잔향을 각각 확인하면 전개의 모양이 드러납니다.</p>
<p>하루로 끝내지 않는 것도 방법입니다. 여러 날에 걸쳐 편안한 상태에서 반복해 맡으면 그날의 컨디션에 휘둘리는 폭이 줄어듭니다. 그럼에도 개인차는 남습니다. 대라천이 향을 결론이 아니라 보조 수단으로 두는 이유입니다.</p>
<p>비교 대상을 하나 정해 두면 관찰이 쉬워집니다. 기준으로 삼을 오일을 정하고 같은 조건에서 같은 방식으로 맡아 보면, 절대적인 세기가 아니라 전개의 차이가 눈에 들어옵니다. 향을 맡은 날짜와 그때의 인상을 짧게 적어 두는 것도 도움이 됩니다. 기억은 뒤로 갈수록 첫인상 쪽으로 기울기 때문입니다.</p>

<h2>함량 표시가 순도를 대신하지 못하는 이유</h2>
<p>순수한 침향유는 산출량 자체가 적습니다. 대라천 기준으로 에센셜 오일은 약 400kg의 침향나무에서 20~25cc가 나옵니다. 원료가 이 정도로 줄어드는 공정이라면, 완성된 오일의 단가는 높게 형성될 수밖에 없습니다.</p>
<p>그래서 대라천은 표시된 함량 숫자 하나로 순도를 판단하지 않도록 안내합니다. 확인해야 할 항목은 숫자 옆에 원료의 학명과 산지, 공정이 함께 적혀 있는지, 그리고 그 내용을 뒷받침하는 검사 결과를 요청했을 때 받아 볼 수 있는지입니다.</p>
<p>대라천은 자사 제품을 100% 순수 침향 에센셜 오일로 표시하며, 섭취량은 권장이 아니라 제품 라벨의 표시 사항을 따르는 것을 원칙으로 합니다. 대라천 제품은 일반식품이며, 함량 표시는 제품 사양에 대한 설명입니다.</p>
<p>숫자를 읽는 순서도 바꿔 보시기 바랍니다. 함량을 먼저 보고 나머지를 훑는 대신, 학명과 산지와 공정을 먼저 확인한 뒤 함량을 보면 그 숫자가 무엇에 대한 값인지가 분명해집니다. 앞의 세 항목이 비어 있는 상태에서는 숫자가 커도 해석할 근거가 없습니다.</p>

<h2>대라천 침향유는 어떤 공정을 거칠까요</h2>
<p>향의 전개가 왜 공정과 이어지는지를 보려면 만들어지는 순서를 따라가는 편이 빠릅니다. 대라천은 25년산 원목을 골라 표피와 오염물을 걷어 내고, 물세척을 세 번 반복한 뒤 자연광에 말립니다. 이어서 전통 증기 증류법으로 72시간을 연속 가동해 오일을 뽑고, 숙성 단계를 거쳐 향과 성분을 안정시킵니다.</p>
''' + SVG_PROCESS + '''
<p>공정의 각 단계는 앞에서 인용한 Wang X 연구팀의 종합 검토가 다룬 변수와 겹칩니다. 추출 방식과 조건이 조성을 바꾸므로, 어떤 원목을 얼마나 오래 어떤 방식으로 다루었는지가 결과물의 성격을 좌우합니다. 대라천이 원목 수령과 세척 횟수, 증류 시간을 함께 공개하는 이유입니다.</p>
<p>증류 조건이 향에 미치는 영향은 <a href="/about-agarwood">침향 알아보기</a>에도 정리되어 있습니다.</p>
<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/smell-test-real-vs-blended-agarwood-oil-aroma-1782976511973.png" alt="침향 원목 조각과 순수 침향유 병이 나란히 놓인 정물" /><figcaption>대라천 침향유는 25년산 원목을 72시간 연속 증류해 뽑습니다.</figcaption></figure>

<h2>향이라는 인상과 서류라는 근거를 함께 씁니다</h2>
<p>향은 그 자리에서 바로 확인되지만 사람마다 편차가 큽니다. 서류는 편차가 없는 대신 향까지 알려 주지는 못합니다. 두 경로의 약점이 서로 다르기 때문에 함께 쓰면 빈자리가 메워집니다.</p>
<p>대라천이 공개하는 근거는 다음과 같습니다. 학명은 식품공전에 등재된 식용 침향 두 품종(아갈로차·말라센시스) 가운데 아갈로차, 곧 <em>Aquilaria Agallocha Roxburgh</em> 원료만 사용합니다. 원산지는 100% 베트남산이며 직영 농장에서 관리합니다. 안전성 항목으로는 중금속 8종 전부가 불검출로 나온 2023년 8월 24일 검사 결과를 공개합니다. 네 항목 모두 향과 무관하게 문서로 확인되는 정보입니다.</p>
<p>순서는 이렇게 잡으시면 됩니다. 향으로 인상을 먼저 잡고, 학명·산지·검사 결과로 확정합니다. 두 경로가 같은 방향을 가리킬 때 판단의 근거가 두 겹이 됩니다. 반대로 두 경로가 어긋난다면, 어긋난 쪽을 다시 확인하는 편이 안전합니다. 이때 기준이 되는 것은 향이 아니라 문서입니다. 서류를 읽는 구체적인 방법은 <a href="/blog/3-questions-before-buying-agarwood">침향 살 때 꼭 물어봐야 할 3가지</a>에 정리해 두었습니다.</p>
{{IMG:aroma-comparison-setup}}

<h2>대라천이 확인한 것과 확인하지 않은 것</h2>
<p>대라천은 이 글에 적은 학명, 산지, 원목 수령, 증류 시간, 산출량, 중금속 검사 결과를 자체 시험성적서와 공정 기록으로 보유하고 있으며, 요청하시면 확인해 드립니다. 제품 사양은 <a href="/products/agarwood-essential-oil-1ml">대라천 참침향 에센셜 오일</a> 페이지에 정리되어 있습니다. 검사 결과에는 검사 일자가 함께 적혀 있으며, 대라천은 일자가 명시된 자료만 근거로 제시합니다.</p>
<p>확인하지 않은 것도 밝힙니다. 이 글의 향 관련 서술은 대라천이 자사 오일을 기준으로 설명한 감각적 특징이며, 다른 판매자의 제품에 대한 평가나 시장 전반에 대한 진단이 아닙니다. 어떤 제품이 무엇을 섞었는지는 대라천이 확인한 바 없고, 확인할 수 있는 위치에 있지도 않습니다. 향에 대한 서술은 진위를 보장하는 기준이 아니라 다시 확인해 볼 계기로만 사용해 주시기 바랍니다.</p>
<p>이 글이 남기려는 것은 판정 기준이 아니라 순서입니다. 향으로 걸러 보고, 학명과 산지와 검사 결과로 확정합니다. 후각이 감당할 수 있는 범위를 정확히 알고 쓰면 유용한 도구가 되고, 그 범위를 넘겨 쓰면 잘못된 확신이 됩니다. 대라천이 향과 서류를 나란히 두는 이유가 여기에 있습니다.</p>
{{IMG:oil-bottles-side-by-side}}

<h2>자주 묻는 질문</h2>
<h3>Q. 향만으로 진짜와 가짜를 확정할 수 있습니까?</h3>
<p>A. 확정할 수 없습니다. 후각은 사람마다 편차가 크고 컨디션에 따라 달라지는 보조 수단이며, 품종 동정이나 순도 판정에는 쓰이지 않습니다. 학명·산지·검사 서류로 함께 확인하시기 바랍니다.</p>
<h3>Q. 순도는 무엇으로 확인합니까?</h3>
<p>A. 성분 조성은 기기 분석의 영역입니다. Wang X 연구팀의 2025년 종합 검토가 정리했듯 추출 방식에 따라 화학 조성이 달라지므로, 원료의 학명과 공정, 검사 결과를 문서로 확인하는 것이 확실합니다.</p>
<h3>Q. 좋은 침향유인데 향이 약하게 느껴질 수도 있습니까?</h3>
<p>A. 그럴 수 있습니다. 순수 침향유는 천천히 올라와 오래 남는 전개를 보이므로 첫인상은 약하게 느껴지기도 합니다. 시간이 지난 뒤에도 결이 이어지는지가 더 중요한 확인 항목입니다.</p>
<h3>Q. 향을 맡을 때 요령이 있습니까?</h3>
<p>A. 코에 바짝 대고 한 번에 세게 맡기보다, 조금 떨어뜨려 여러 번 천천히 맡으면서 시간에 따른 변화를 살피는 편이 좋습니다. 컨디션이 좋은 날 여러 차례 나누어 확인하시면 편차가 줄어듭니다.</p>
<h3>Q. 순수 침향유는 왜 그렇게 귀합니까?</h3>
<p>A. 대라천 기준으로 약 400kg의 침향나무에서 20~25cc가 나옵니다. 원료가 되는 좋은 침향은 형성까지 오랜 시간이 걸리는 자원이고, 아퀼라리아 속은 국제 거래가 규제되는 보호 대상입니다. 산출량이 적으니 단가가 높아집니다.</p>

<h2>근거·출처</h2>
<p>이 글의 공정 수치와 검사 결과는 대라천이 보유한 자체 자료이며, 학술 인용은 아래 1차 출처를 링크로 밝힙니다. 향에 대한 서술은 대라천이 자사 오일을 기준으로 설명한 감각적 특징이고, 개인차가 있습니다.</p>
<ul>
<li>Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities", <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li>
<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>
<li>CITES 부속서 — 아퀼라리아 속 국제 거래 규제: <a href="https://cites.org" target="_blank" rel="noopener">https://cites.org</a></li>
<li>대라천 원료 규격·공정·검사 결과: <a href="/about-agarwood">침향 알아보기</a></li>
</ul>
<hr />
<p style="font-size:13px;color:#7D7570"><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)와 공식 문서에 근거해 작성되었습니다. 향에 대한 설명은 감각적 참고 사항이며 개인차가 있고 진위를 보장하지 않습니다. 대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 예방·치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. 건강 상태에 따라 전문가와 상담하시기 바랍니다.</em></p>'''

IMAGES = [
    {
        "key": "aroma-comparison-setup",
        "prompt": ("Photorealistic still life on a warm cream linen surface: two small amber glass vials with closed caps placed apart, "
                   "a folded plain white paper scent strip beside each, and a single dark resinous wood chip. Soft diffused daylight from "
                   "the side, muted warm brown and ivory palette, shallow depth of field, calm minimal editorial composition. "
                   "No text, no letters, no numbers, no logo, no watermark, no people."),
        "alt": "순수 침향유 확인을 위해 시향지와 함께 놓인 오일 병 두 개",
        "caption": "향으로 인상을 잡고, 학명·산지·검사 결과로 확정합니다"
    },
    {
        "key": "oil-bottles-side-by-side",
        "prompt": ("Photorealistic close-up of a single small amber glass dropper bottle of dark oil standing on a weathered wooden table, "
                   "with a rough dark resinous agarwood block behind it and soft steam-free background bokeh. Warm low-angle window light, "
                   "deep browns and honey tones, fine grain texture visible, quiet product photography. "
                   "No text, no letters, no numbers, no logo, no watermark, no people."),
        "alt": "침향 원목 앞에 놓인 순수 침향유 스포이드 병",
        "caption": "대라천은 원목 수령과 증류 시간, 산출량을 함께 공개합니다"
    },
]

CHANGELOG = {
    "citationsAdded": ["A4", "A7", "K4"],
    "notes": ("구어체 서술을 조엘라이프(주)/대라천 주어의 보도자료 문체로 바꾸고, '왜 다른 기름을 섞을까' 같은 시장 일반 추정 문단을 "
              "삭제해 표시광고법 리스크를 제거했습니다. 후각의 한계(품종 동정·순도 판정 불가, 성분 조성은 기기 분석 영역)를 별도 H2로 "
              "신설하고 A4·A7에 귀속했습니다. 원문 수치(25년·72시간·3회·400kg·20~25cc·8종·2023년 8월 24일·100%)와 학명, 이미지 URL, "
              "disclaimer는 그대로 유지했습니다.")
}


def hangul(s):
    return len(re.findall(r'[가-힣]', s))


def strip_tags(s):
    s = (s.replace('&middot;', '·').replace('&nbsp;', ' ').replace('&amp;', '&')
         .replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'"))
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', s)).strip()


src = json.load(open(os.path.join(BASE, 'in', 'smell-test-real-vs-blended-agarwood-oil.json'), encoding='utf-8'))

out = {
    "slug": "smell-test-real-vs-blended-agarwood-oil",
    "title": TITLE,
    "excerpt": EXCERPT,
    "tags": src["tags"],
    "content": CONTENT,
    "images": IMAGES,
    "changelog": dict(CHANGELOG, charsBefore=hangul(strip_tags(src["content"])),
                      charsAfter=hangul(strip_tags(CONTENT)), voiceFixes=41),
}

with open(os.path.join(BASE, 'out', 'smell-test-real-vs-blended-agarwood-oil.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print('title', len(TITLE))
print('excerpt', len(EXCERPT))
print('chars', out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
