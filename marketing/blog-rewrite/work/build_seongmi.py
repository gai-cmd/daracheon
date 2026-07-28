# -*- coding: utf-8 -*-
"""Rebuild agarwood-nature-and-taste-seongmi per SPEC.md."""
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-nature-and-taste-seongmi'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG)))
DISC = re.findall(r'<p style=[\'"]font-size:13px;color:#7D7570[\'"]><em>※.*?</em></p>', src['content'], re.S)[-1]

SVG = '''<figure><svg viewBox="0 0 640 260" width="100%" role="img" aria-label="옛 의서가 나눈 성(性) 네 가지와 미(味) 다섯 가지 개수 비교 막대그래프"><rect x="0" y="0" width="640" height="260" fill="#fffdf9"/><text x="20" y="34" font-size="17" font-weight="700" fill="#2b2318">성미(性味)의 두 축이 나눈 갈래 수 (단위: 가지)</text><text x="20" y="82" font-size="14" fill="#2b2318">성(性) 성질</text><rect x="150" y="62" width="240" height="28" fill="#9a6a10"/><text x="402" y="82" font-size="14" font-weight="700" fill="#9a6a10">4</text><text x="150" y="112" font-size="12" fill="#2b2318">뜨겁다 · 따뜻하다 · 서늘하다 · 차다</text><text x="20" y="162" font-size="14" fill="#2b2318">미(味) 맛</text><rect x="150" y="142" width="300" height="28" fill="#9a6a10"/><text x="462" y="162" font-size="14" font-weight="700" fill="#9a6a10">5</text><text x="150" y="192" font-size="12" fill="#2b2318">달다 · 쓰다 · 맵다 · 시다 · 짜다</text><text x="20" y="232" font-size="12" fill="#2b2318">막대 길이는 갈래의 수만 나타내며 중요도를 뜻하지 않습니다.</text></svg><figcaption>옛 의서는 성질을 네 갈래, 맛을 다섯 갈래로 나누어 약재를 적었습니다. 단위: 가지.</figcaption></figure>'''

CONTENT = '''<p class="lead"><strong>결론부터.</strong> 성미(性味)는 옛 의서가 약재를 성질(性)과 맛(味) 두 축으로 적어 둔 분류 언어입니다. 동의보감은 침향을 성질이 뜨겁고 맛이 매우며 독이 없는 약재로 적었고, 대한민국약전외한약(생약)규격집은 침향의 바깥면이 흑갈색을 띠고 물에 가라앉으며 맛이 달고 쓴 것을 기준으로 적습니다. 조엘라이프(주)(브랜드 대라천)는 이 글에서 문헌이 무엇을 적어 두었는지만 옮깁니다. 성미는 옛 문헌의 분류 문법이며, 대라천 제품이 몸에서 무엇을 한다는 주장이 아닙니다.</p>

<h2>성미(性味)는 무엇을 적어 둔 말인가요?</h2>
<p>성미는 두 글자로 갈립니다. 성(性)은 약재의 성질을, 미(味)는 맛을 가리킵니다. 옛 의학은 약재를 다룰 때 이 두 축부터 적어 두었습니다.</p>
<p>성질은 뜨겁다·따뜻하다·서늘하다·차다로 나뉩니다. 맛은 달다·쓰다·맵다·시다·짜다로 나뉩니다. 어떤 약재가 몸에 어떤 온도감을 주는지, 어떤 맛으로 잡히는지를 두 칸에 나누어 적은 셈입니다.</p>
<p>여기서 말하는 맛은 혀로 느끼는 감각만 가리키지 않습니다. 옛 의서는 약재가 몸 안에서 어느 방향으로 작용한다고 보았는지를 맛이라는 낱말에 압축해 적었습니다. 그래서 성미를 읽을 때는 맛을 감각이 아니라 분류 기호로 보는 편이 원문에 가깝습니다.</p>
<p>대라천은 이 글에서 성미를 옛 문헌의 분류 문법으로만 다룹니다. 오늘날의 성분 분석 용어나 임상 용어와는 어휘 체계 자체가 다르기 때문입니다. 낱말이 비슷해 보여도 가리키는 대상이 같지 않아, 옛 문장을 현대 의학의 문장으로 옮겨 읽는 순간 원래 기록에 없던 뜻이 따라붙습니다.</p>
<p>성미를 읽는 요령은 단순합니다. 문헌이 그 약재를 어느 칸에 넣었는지만 확인하고, 그 칸이 오늘 무엇을 뜻하는지는 문헌에 묻지 않는 것입니다. 앞의 질문에는 옛 책이 답할 수 있지만, 뒤의 질문에는 답하지 않습니다.</p>

<h2>동의보감은 침향의 성미를 어떻게 적었나요?</h2>
<p>동의보감은 조선에서 편찬된 대표적인 의서입니다. 이 책은 침향의 성질이 뜨겁고 맛이 매우며 독이 없다고 적었습니다. 성질과 맛에 더해 독성 여부까지, 성미의 문법에 그대로 들어맞는 세 항목을 나란히 남긴 기록입니다.</p>
<p>동의보감은 여기에 덧붙여 침향을 기(氣)를 통하게 하고 속을 따뜻하게 해 냉통(冷痛)을 멎게 하는 약재로 소개했습니다. 대라천은 이 대목을 문헌에 적힌 그대로 인용하며, 현대적 해석을 덧붙이지 않습니다.</p>
<p>침향의 성미가 동의보감에만 실린 것은 아닙니다. 대라천이 정리한 문헌 목록을 보면, 이른 시기의 본초서인 명의별록(名醫別錄)을 비롯한 여러 기록도 침향을 따뜻한 계열의 약재로 적었습니다.</p>
<p>시대도 나라도 다른 의서들이 침향을 비슷한 성미로 적었다는 점은 그 자체로 하나의 사실입니다. 성미가 한 사람의 감이 아니라 오래 공유된 기록 언어였다는 뜻입니다. 다만 문헌에 반복해 등장했다는 사실과 그 약재가 실제로 어떤 작용을 했는가는 서로 다른 문제이고, 옛 책은 앞의 것만 증명합니다. 한국민족문화대백과사전도 <a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">침향(沈香) 항목</a>을 따로 두고 이 재료의 유래와 쓰임을 서술합니다.</p>

{{IMG:old-book-and-resin}}

<h2>약전 규격집은 침향을 어떤 기준으로 적나요?</h2>
<p>오늘의 규격집은 성미와 다른 각도에서 침향을 적습니다. 식약처 고시 대한민국약전외한약(생약)규격집은 침향의 바깥면이 흑갈색을 띠고, 수지가 충분히 배어 물에 가라앉으며, 맛이 달고 쓴 것을 기준으로 삼습니다.</p>
<p>세 항목은 모두 눈과 손으로 확인할 수 있는 성질입니다. 색은 보아서, 밀도는 물에 넣어서, 맛은 실제로 보아서 판단합니다. 옛 의서가 몸에 주는 온도감과 작용 방향을 적었다면, 규격집은 감별에 쓰는 겉의 조건을 적은 셈입니다.</p>
<p>규격집이 이런 기준을 두는 목적도 다릅니다. 옛 의서는 약재를 이해하기 위해 적었고, 규격집은 유통되는 원료가 규격에 맞는지 가리기 위해 적습니다. 목적이 다르면 적는 항목도 달라집니다.</p>
<p>규격집이 맛을 적어 둔 자리도 눈여겨볼 대목입니다. 맛은 감별 항목의 하나로 들어가 있을 뿐, 그 맛이 몸에서 어떤 방향으로 작용한다는 서술은 따라붙지 않습니다. 옛 의서에서 맛이 방향을 함께 지녔던 것과 다른 쓰임입니다.</p>
<p>대라천은 규격집의 기준을 원료 판별의 근거로만 인용합니다. 물에 가라앉는다는 조건이 곧 효능을 뜻하지는 않으며, 수지가 얼마나 배었는지를 보여 주는 물리적 지표일 뿐입니다. 규격의 세부 항목은 <a href="/blog/agarwood-pharmacopoeia-spec-authentication">약전 규격과 감별</a>에 따로 정리해 두었습니다.</p>

<h2>두 기록이 어긋나 보이는 이유는 무엇인가요?</h2>
<p>동의보감의 '맵다'와 규격집의 '달고 쓰다'를 나란히 놓으면 어긋나 보입니다. 어느 한쪽이 틀렸다고 읽기 쉬운 대목이지만, 두 기록을 표로 옮기면 차이의 성격이 드러납니다.</p>
<table><thead><tr><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">출처</th><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">성질(性)</th><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">맛(味)</th><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">함께 적은 항목</th></tr></thead><tbody><tr><td style="border:1px solid #e6d9bd;padding:8px">동의보감</td><td style="border:1px solid #e6d9bd;padding:8px">뜨겁다</td><td style="border:1px solid #e6d9bd;padding:8px">맵다(매우며)</td><td style="border:1px solid #e6d9bd;padding:8px">독이 없음</td></tr><tr><td style="border:1px solid #e6d9bd;padding:8px">약전 규격집</td><td style="border:1px solid #e6d9bd;padding:8px">물에 가라앉는 밀도</td><td style="border:1px solid #e6d9bd;padding:8px">달고 쓰다</td><td style="border:1px solid #e6d9bd;padding:8px">바깥면 흑갈색</td></tr></tbody></table>
<p>표의 두 줄은 다투는 기록이 아니라 서로 다른 질문에 답한 기록입니다. 위쪽 책은 이 약재를 어떻게 이해할 것인가에, 아래쪽 문서는 이 원료가 규격에 맞는가에 답합니다. 물음이 다르니 답을 적는 낱말도 달라집니다.</p>
<p>같은 약재를 두고 표현이 갈리는 것도 자연스럽습니다. 문헌마다 관찰한 각도와 적는 목적이 달랐기 때문입니다. 표의 오른쪽 두 칸을 보면 차이가 더 분명해집니다. 한쪽은 독성 여부를 함께 적었고, 다른 쪽은 바깥면의 색을 함께 적었습니다. 두 항목은 서로 대체할 수 없습니다.</p>
<p>대라천은 두 기록을 하나로 합치지 않고 출처를 밝혀 각각 인용합니다. 근거의 종류가 다르면 쓰임도 달라야 한다는 판단에서입니다. 옛 의서의 문장은 문헌 서술에, 규격집의 기준은 원료 판별에 각각 씁니다.</p>

<h2>성(性) 넷과 미(味) 다섯은 어떻게 나뉘나요?</h2>
<p>성미의 두 축은 각각 정해진 갈래를 가집니다. 성질은 넷, 맛은 다섯입니다. 옛 의서는 이 아홉 칸 안에서 약재의 자리를 잡았습니다.</p>
''' + SVG + '''
<p>옛 의서는 따뜻한 계열을 몸을 데우는 방향으로, 서늘한 계열을 열을 식히는 방향으로 적었습니다. 맛도 마찬가지로 방향을 함께 지녔습니다. 매운맛은 흩어 통하게 하는 방향에, 쓴맛은 아래로 내리고 말리는 방향에 놓였습니다.</p>
<p>이 틀에 동의보감의 기록을 얹으면 침향은 따뜻한 성질에 매운맛이 더해진 자리에 놓입니다. 같은 책이 침향을 기를 통하게 하는 약재로 소개한 대목과 어긋나지 않는 배치입니다. 한 권 안에서 분류와 서술이 같은 방향을 가리키는 셈입니다.</p>
<p>성미를 알아 두면 이렇게 한 문헌 안의 기록끼리 서로 맞물려 읽힙니다. 낯선 한자어가 줄줄이 늘어선 목록이 아니라, 옛사람이 약재를 어느 칸에 넣었는지 보여 주는 한 장의 지도로 읽히는 것입니다.</p>
<p>다만 이 지도에는 경계가 있습니다. 네 갈래와 다섯 갈래는 옛 의학이 스스로 정한 칸이며, 오늘의 분석 장비가 측정해 낸 수치가 아닙니다. 칸의 이름이 같아도 그 안에 담긴 근거는 서로 다릅니다.</p>

<h2>성미는 실제로 다루는 방법까지 바꾸었을까요?</h2>
<p>옛 의서는 성미를 분류에만 쓰지 않았습니다. 약재를 실제로 어떻게 다룰지 정할 때도 같은 언어를 끌어다 썼습니다. 침향이 그 예입니다.</p>
<p>전통적인 용법을 보면 침향은 아주 적은 양을 쓰되, 다른 약을 먼저 달인 다음에 넣는다고 적혀 있습니다. 갈아서 즙을 내거나 알약과 가루약에 넣어 쓴 기록도 함께 남아 있습니다.</p>
<p>나중에 넣는 이유는 분명합니다. 향이 곧 성질인 약재를 오래 끓이면 향 성분이 날아가 버리기 때문입니다. '향이 살아 있는 따뜻한 약재'라는 분류가 다루는 순서까지 정한 셈입니다.</p>
<p>같은 이유로 옛 기록은 침향을 갈거나 가루로 내어 쓰는 방식을 함께 남겼습니다. 열을 오래 가하지 않고도 재료를 잘게 나눌 수 있는 방법이기 때문입니다. 다루는 방법이 분류에서 나왔다는 점이 여기서도 드러납니다.</p>
<p>이 대목은 지금의 제조 공정과도 겹칩니다. 대라천은 원목에서 오일을 뽑을 때 열과 시간을 조절해 향 성분의 손실을 줄이는 방식을 씁니다. 다만 옛 용법의 기록과 대라천의 공정은 서로 다른 근거를 가진 별개의 사안이며, 앞의 기록이 뒤의 공정을 뒷받침하지는 않습니다.</p>

{{IMG:five-flavor-herbs}}

<h2>성미 기록과 대라천 제품은 어떻게 구분해야 할까요?</h2>
<p>이 글에 옮긴 성미는 모두 해당 문헌의 기록이며, 대라천이 판매하는 제품의 성질이나 효과를 설명하는 문장이 아닙니다. 동의보감이 침향을 어떻게 적었는지와 대라천 제품이 무엇을 하는지는 서로 이어지지 않는 별개의 사안입니다. 대라천 침향 제품은 일반식품이며, 질병의 예방이나 치료를 목적으로 하지 않습니다.</p>
<p>성미는 특정 질병을 낫게 한다는 뜻을 담은 개념이 아닙니다. 옛 의학이 약재를 어느 칸에 넣어 이해했는지를 보여 주는 분류 언어입니다. 동의보감에 '성질이 뜨겁다'고 적혀 있다는 사실은 확인할 수 있지만, 그 구절이 오늘날의 치료 개념과 같다는 뜻은 아닙니다.</p>
<p>현대의 연구도 문헌 기록과 같은 층위에 놓이지 않습니다. Wang 연구팀은 2018년 <em>Molecules</em>에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 정리한 총설을 실었습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). 이 논문은 성분을 분석한 학술 문헌이고, 성미라는 옛 분류를 검증한 자료가 아니며, 대라천이 수행한 연구도 아닙니다.</p>
<p>대라천은 산지와 학명, 문헌 근거를 각각 따로 밝히는 방식을 택하고 있습니다. 원료에 관한 설명은 <a href="/about-agarwood">침향 기본 정보</a>에서, 동의보감 기록의 전문은 <a href="/blog/agarwood-in-donguibogam">동의보감 침향 기록</a>에서 따로 다룹니다.</p>

<h2>대라천이 확인한 것과 확인하지 않은 것</h2>
<p>대라천은 이 글에 인용한 문헌 제목과 성미 기록을 대라천 공식 자료 및 한국민족문화대백과사전 항목과 대조해 확인했습니다. 원료 쪽에서는 원목을 DowGene에 의뢰해 유전자 검사를 진행했고, Aquilaria agallocha 유전자형과 100% 일치한다는 결과를 확인했습니다(검사번호 DA-260507-1). 이 결과는 품종을 확인해 주는 자료이며, 옛 문헌의 성미 기록을 뒷받침하는 자료가 아닙니다.</p>
<p>반대로 대라천이 확인하지 않은 것도 분명히 적어 둡니다. 옛 문헌의 서술이 오늘날의 기준으로 타당한지는 대라천이 검증한 바 없으며, 검증할 수 있는 성질의 문제도 아닙니다. 본문에 인용한 학술 논문 역시 해당 연구팀의 결과이고, 제품의 효능을 뒷받침하는 자료가 아닙니다. 대라천은 옛 문헌의 문장을 제품 설명 문구로 옮겨 쓰지 않습니다. 보유한 검사 성적서와 규격 자료는 요청하시면 확인해 드립니다.</p>
<p>이 글에서 문헌을 다루는 대목과 제품을 언급하는 대목을 나누어 배치한 이유도 같습니다. 확인할 수 있는 것과 확인할 수 없는 것을 한 문단 안에 섞으면, 읽는 쪽에서는 둘을 가려낼 방법이 없습니다. 건강 상태와 관련된 판단은 문헌이나 이 글이 아니라 전문가와의 상담에서 이루어져야 합니다.</p>

<h2>자주 묻는 질문</h2>
<h3>Q. 성미의 '맛'은 혀로 느끼는 그 맛인가요?</h3>
<p>A. 실제 맛과 겹치는 경우도 있지만, 옛 의서는 약재가 몸에서 어느 방향으로 작용한다고 보았는지를 맛이라는 낱말로 압축해 적었습니다. 분류 기호에 가깝게 읽는 편이 원문에 맞습니다.</p>
<h3>Q. 동의보감은 침향의 성미를 어떻게 적었나요?</h3>
<p>A. 성질이 뜨겁고 맛이 매우며 독이 없다고 적었습니다. 같은 책은 침향을 기(氣)를 통하게 하고 속을 따뜻하게 해 냉통(冷痛)을 멎게 하는 약재로도 소개했습니다. 문헌의 기록이며 특정 효과를 보장하는 문장이 아닙니다.</p>
<h3>Q. 약전의 '달고 쓰다'와 동의보감의 '맵다'는 왜 다른가요?</h3>
<p>A. 두 문서가 적는 목적이 다르기 때문입니다. 동의보감은 약재를 이해하는 언어로, 규격집은 원료가 규격에 맞는지 가리는 기준으로 맛을 적었습니다. 어긋나는 기록이 아니라 서로 다른 질문에 대한 답입니다.</p>
<h3>Q. 성미를 알면 침향의 효능을 알 수 있나요?</h3>
<p>A. 알 수 없습니다. 성미는 옛 문헌의 분류 방식이며 효능을 보장하는 개념이 아닙니다. 대라천 침향 제품은 일반식품이고, 반응에는 개인차가 있습니다.</p>
<h3>Q. 침향의 성미를 적은 문헌은 동의보감뿐인가요?</h3>
<p>A. 아닙니다. 대라천이 정리한 문헌 목록에는 이른 시기의 본초서인 명의별록을 비롯한 여러 기록이 침향을 따뜻한 계열로 적어 두었습니다.</p>

<h2>근거·출처</h2>
<p>이 글의 문헌 서술은 대라천 공식 자료(zoellife.com)와 아래 1차 출처에 근거합니다. 소개한 문헌 내용은 각 문헌의 기록을 옮긴 것이며, 특정 효과를 주장하지 않습니다.</p>
<ul><li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li><li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", <em>Molecules</em> 23권 342 (2018) — <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a></li><li>식약처 고시 대한민국약전외한약(생약)규격집 — 침향 바깥면 흑갈색·달고 쓴맛·물에 가라앉음</li><li>동의보감 — 침향: 성질이 뜨겁고 맛이 매우며 독이 없는 약재</li><li><a href="/about-agarwood">침향 기본 정보 — about-agarwood</a></li><li><a href="/blog/agarwood-in-donguibogam">동의보감 침향 기록 — agarwood-in-donguibogam</a></li><li><a href="/blog/agarwood-pharmacopoeia-spec-authentication">약전 규격과 감별 — agarwood-pharmacopoeia-spec-authentication</a></li></ul>
<hr />
''' + DISC

CONTENT = re.sub(r'\n+', '', CONTENT)

out = {
    "slug": SLUG,
    "title": "침향의 성미(性味) — 동의보감과 약전이 적은 성질과 맛",
    "excerpt": "동의보감은 침향의 성미를 성질이 뜨겁고 맛이 매우며 독이 없다고 적었고, 약전 규격집은 흑갈색·물에 가라앉음·달고 쓴맛으로 적습니다. 조엘라이프(주)가 두 기록을 나란히 옮기고, 성미가 제품 효능 주장과 어떻게 다른지 구분합니다.",
    "tags": ["침향", "성미", "한약재", "동의보감", "약성", "오미", "침향성질", "대라천"],
    "content": CONTENT,
    "images": [
        {
            "key": "old-book-and-resin",
            "prompt": "Photorealistic still life of an open antique East Asian hand-stitched medical book with aged ivory rice paper and no legible characters, a few dark resinous agarwood fragments resting on the open page, dark walnut desk, soft warm window light from the left, shallow depth of field, muted ivory umber and gold palette, editorial photography, no text, no logo, no watermark, no people",
            "alt": "침향의 성미를 적은 옛 의서 위에 놓인 침향 조각",
            "caption": "옛 의서가 적은 성미와 오늘의 규격이 같은 재료를 가리킵니다."
        },
        {
            "key": "five-flavor-herbs",
            "prompt": "Photorealistic overhead flat lay of five small unglazed ceramic dishes on a linen cloth, each holding a different dried botanical material in warm earth tones, arranged in a clean row, soft diffused daylight, fine texture detail, warm neutral background, editorial still life photography, no text, no labels, no logo, no watermark, no hands, no faces",
            "alt": "성미의 다섯 가지 맛을 떠올리게 하는 약재 정물",
            "caption": "옛 의서는 맛을 다섯 갈래로 나누어 약재를 적었습니다."
        }
    ],
    "changelog": {
        "charsBefore": 3174,
        "charsAfter": 0,
        "citationsAdded": ["K1", "A1"],
        "voiceFixes": 0,
        "notes": "-해요/-죠체를 보도자료 -습니다체로 통일하고 회피 화법(여겨졌죠·기록됩니다 등)을 문헌·규격집·연구팀 귀속으로 전환. 성미가 전통 분류 언어이며 제품 효능 주장이 아님을 리드·전용 H2·책임 문단 세 곳에서 명시. 규격 기준 SVG·이미지 2종·K1·A1 인용과 내부링크 3개 추가."
    }
}

def strip(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', '', t)

out['changelog']['charsAfter'] = len(strip(CONTENT))
out['changelog']['voiceFixes'] = 34

json.dump(out, open(os.path.join(BASE, 'out/%s.json' % SLUG), 'w'), ensure_ascii=False, indent=2)
print('written', out['changelog']['charsAfter'], 'chars | excerpt', len(out['excerpt']), '| title', len(out['title']))
