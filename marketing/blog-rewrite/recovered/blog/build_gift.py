# -*- coding: utf-8 -*-
"""agarwood-gift-guide — press-release voice rebuild. Every price kept verbatim."""
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-gift-guide'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG)))
S = src['content']

TABLE = re.search(r'<table style=.*?</table>', S, re.S).group(0)
GIFT_FIG = re.search(r'<figure><img src="[^"]*gift-match[^"]*".*?</figure>', S, re.S).group(0)
DISCLAIMER = "<hr /><p style='font-size:13px;color:#7D7570'>" + re.findall(r'<em>※.*?</em>', S, re.S)[-1] + "</p>"

# Price bar chart — linear scale, 1,500,000원 = 300px (SPEC §E-2 light surface)
SVG_PRICE = """<svg viewBox="0 0 560 330" width="100%" role="img" aria-label="대라천 침향 선물 제품 참고 가격 비교 막대그래프">
<rect x="0" y="0" width="560" height="330" fill="#fffdf9"/>
<text x="24" y="30" font-size="13" fill="#2b2318">대라천 침향 선물 제품 — 참고 가격</text>
<text x="24" y="70" font-size="12" fill="#2b2318">침향단</text>
<rect x="150" y="56" width="36" height="18" fill="#d9c9a3"/>
<text x="196" y="70" font-size="12" fill="#2b2318">180,000원</text>
<text x="24" y="102" font-size="12" fill="#2b2318">침향차·수 세트</text>
<rect x="150" y="88" width="42" height="18" fill="#d9c9a3"/>
<text x="202" y="102" font-size="12" fill="#2b2318">210,000원</text>
<text x="24" y="134" font-size="12" fill="#2b2318">오일 캡슐</text>
<rect x="150" y="120" width="50" height="18" fill="#c8a24a"/>
<text x="210" y="134" font-size="12" fill="#2b2318">249,000원</text>
<text x="24" y="166" font-size="12" fill="#2b2318">기보단</text>
<rect x="150" y="152" width="96" height="18" fill="#c8a24a"/>
<text x="256" y="166" font-size="12" fill="#2b2318">480,000원</text>
<text x="24" y="198" font-size="12" fill="#2b2318">에센셜 오일</text>
<rect x="150" y="184" width="130" height="18" fill="#9a6a10"/>
<text x="290" y="198" font-size="12" fill="#2b2318">650,000원</text>
<text x="24" y="230" font-size="12" fill="#2b2318">팔찌·묵주</text>
<rect x="150" y="216" width="178" height="18" fill="#9a6a10"/>
<text x="338" y="230" font-size="12" fill="#2b2318">890,000원~</text>
<text x="24" y="262" font-size="12" fill="#2b2318">침향스틱</text>
<rect x="150" y="248" width="300" height="18" fill="#9a6a10"/>
<text x="460" y="262" font-size="12" fill="#2b2318">1,500,000원</text>
<line x1="150" y1="280" x2="450" y2="280" stroke="#d9c9a3" stroke-width="1"/>
<text x="150" y="298" font-size="11" fill="#7d7570">0원</text>
<text x="450" y="298" font-size="11" fill="#7d7570" text-anchor="end">1,500,000원</text>
<text x="24" y="320" font-size="12" fill="#7d7570">막대 길이는 참고 가격에 비례 — 대라천 제품 표기 기준</text>
</svg>"""

content = """<p class="lead"><strong>결론부터.</strong> 침향 선물은 가격순이 아니라 받는 분의 생활 방식에 맞춰 고르시면 됩니다. 조엘라이프(주)(브랜드 대라천)는 부담 없는 첫 선물로 침향차·수 세트를, 매일 챙기시길 바랄 때는 오일 캡슐을, 명상·기도하는 분께는 팔찌·묵주를 안내합니다. 아래 표에 상황별 추천 제품과 참고 가격을 제품 표기 그대로 정리했습니다.</p>

<h2>침향은 왜 선물로 어울릴까요?</h2>
<p>침향은 아퀼라리아 나무가 상처 입은 자리에 수지(진액)를 오랜 시간 쌓아 만들어 내는 재료입니다. 대라천 참침향 제품군은 그 가운데 <strong>25년산</strong> 원료를 바탕으로 구성됩니다.</p>
<p>오래 기다려 얻은 재료라는 사실 자체가 선물의 맥락이 됩니다. 감사와 존경을 전하는 자리에 침향이 자주 오르는 이유도 여기에 있습니다.</p>
<p>수지가 어떻게 만들어지는지는 학계에서도 정리된 주제입니다. Li W 연구팀은 2021년 <em>Natural Product Reports</em>에 침향과 아퀼라리아 식물의 천연물 화학과 생합성 경로를 정리한 논문을 실었습니다(<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">DOI</a>). 이 논문은 대라천이 수행한 연구가 아니며, 제품의 효능을 뒷받침하는 자료도 아닙니다.</p>
<p>형태의 폭이 넓다는 점도 선물로서의 강점입니다. 향으로도, 차로도, 몸에 지니는 형태로도 즐길 수 있어 받는 분의 취향에 맞추기 쉽습니다.</p>

<h2>상황별로 어떤 침향 제품이 어울릴까요?</h2>
<p>아래 표는 대라천 공식 제품 정보(<a href="/products">zoellife.com/products</a>)의 구성과 가격 표기를 선물 상황별로 다시 묶은 것입니다. 예산과 받는 분의 생활 방식을 함께 놓고 보시기 바랍니다.</p>
@@TABLE@@
<p style='font-size:13px;color:#7D7570'>※ 가격·구성은 대라천 제품 표기(zoellife.com/products)를 정리한 것으로, 변동될 수 있습니다.</p>
<p>표를 세로로 훑으시면 가격보다 <strong>형태</strong>가 먼저 눈에 들어옵니다. 마시는 제품, 챙겨 드시는 제품, 몸에 지니는 제품, 향을 내는 제품으로 갈리고, 선물의 성격도 여기서 정해집니다.</p>
@@GIFT@@

<h2>가격대는 어떻게 벌어져 있나요?</h2>
<p>참고 가격만 따로 떼어 막대로 세우면 선택 폭이 한눈에 들어옵니다. 아래 도표의 수치는 모두 대라천 제품 표기를 그대로 옮긴 것입니다.</p>
<figure>@@SVGPRICE@@<figcaption style='font-size:13px;color:#7D7570'>대라천 침향 선물 제품 참고 가격 — 침향단 180,000원, 침향차·수 세트 210,000원, 오일 캡슐 249,000원, 기보단 480,000원, 에센셜 오일 650,000원, 팔찌·묵주 890,000원부터, 침향스틱 1,500,000원. (출처: 대라천 제품 표기)</figcaption></figure>
<p>가장 낮은 자리에 침향단 <strong>180,000원</strong>과 침향차·수 세트 <strong>210,000원</strong>이 놓입니다. 매일 챙기시길 바랄 때 고르는 오일 캡슐은 <strong>249,000원</strong>입니다.</p>
<p>그 위로 기보단 <strong>480,000원</strong>, 에센셜 오일 <strong>650,000원</strong>, 팔찌·묵주 <strong>890,000원</strong>부터, 침향스틱 <strong>1,500,000원</strong>으로 이어집니다. 막대 길이 차이가 곧 원료의 형태와 사용량 차이입니다.</p>

<h2>부모님·어른께는 무엇을 드리면 좋을까요?</h2>
<p>매일 편하게 챙겨 드시길 바란다면 <strong>오일 캡슐</strong>이 어울립니다. 제품 표기 사용법이 하루 1캡슐로 단순하고, 25년산 침향 오일에 적송 오일·오메가3·비타민E를 더한 구성입니다.</p>
<p>전통적인 형태를 좋아하시는 어른께는 <strong>침향단</strong>이 맞습니다. 25년산 침향 분말 10%에 노니엑기스·북방감초·인삼·칵깐(녹용)·콜라겐·표고를 더한 환 형태이며, 제품 표기는 하루 1단 식후로 적혀 있습니다.</p>
<p>침향단은 5g짜리 15단 구성이라 포장이 정갈하고, 명절 선물로 건네기에도 무리가 없습니다.</p>
<p>더 특별한 자리에는 침향·동충하초·제비집을 함께 담은 <strong>기보단</strong>이 있습니다. 다만 침향단·기보단 같은 제품은 12세 미만 어린이와 임산부·수유부에게 권하지 않으므로, 받는 분의 상황을 확인하신 뒤 고르시기 바랍니다.</p>
{{IMG:gift-wrapping}}

<h2>가볍게 마음을 전하고 싶다면?</h2>
<p>처음 선물하시거나 부담을 줄이고 싶으시다면 <strong>침향차·수 세트</strong>가 무난합니다. 침향차 1.5g 티백 10포와 침향수 100ml가 함께 들어 있어, 마시는 즐거움과 공간의 향을 한 번에 경험할 수 있습니다.</p>
<p>침향을 처음 접하는 분께 건네기에도 문턱이 낮습니다. 사용법이 복잡하지 않고, 한 번에 다 쓰지 않아도 되는 구성이기 때문입니다.</p>
<p>차를 즐기시는 분께는 <strong>침향 파라미냐차</strong>도 어울립니다. 티백 한 포로 세 번(3탕)까지 우려 마실 수 있어 오래 즐기실 수 있습니다.</p>
<p>대라천은 이 두 제품을 입문 선물로 함께 안내합니다. 어떤 제품이 첫 침향으로 맞는지는 <a href="/blog/choose-your-first-agarwood-product">첫 침향 제품 고르기</a>에 진단표로 정리해 두었습니다.</p>

<h2>명상·기도하는 분께는 무엇이 어울릴까요?</h2>
<p>마음을 가라앉히는 시간을 아끼시는 분께는 <strong>침향 팔찌·묵주·합장주</strong>가 어울립니다. 침향 100% 원목으로 만들어, 손목에 차거나 손에 쥐면 체온으로 향이 은은하게 올라옵니다.</p>
<p>참고 가격은 890,000원부터이며, 원목의 상태에 따라 구성이 달라집니다. 명상이나 기도할 때 곁에 두기 좋은 형태입니다.</p>
<p>향을 직접 즐기시는 분께는 <strong>침향스틱</strong>이나 <strong>침향선향</strong>이 있습니다. 스틱은 온열판(전자향로)에 올려 태우지 않고 향을 내고, 선향은 전통적인 방식으로 향을 공간에 퍼뜨립니다.</p>
<p>두 제품 모두 25년산 침향으로 만들어집니다. 연기를 줄이고 싶으시면 스틱, 전통적인 향 피우기를 좋아하시면 선향으로 갈라 고르시면 됩니다.</p>

<h2>나를 위한 선물로도 괜찮을까요?</h2>
<p>선물이 반드시 남에게만 향할 이유는 없습니다. 하루를 마치고 침향차 한 잔을 우리거나 선향을 피워 공간을 정리하는 시간은 그 자체로 하나의 선물이 됩니다.</p>
<p>매일 챙기는 습관을 만들고 싶으시면 하루 1캡슐 표기의 <strong>오일 캡슐</strong>이 손이 덜 갑니다. 조용한 시간을 아끼신다면 손목에 차는 <strong>침향 팔찌</strong>도 어울립니다.</p>
<p>팔찌는 체온으로 향이 올라오는 형태라, 바쁜 하루 가운데 잠시 숨을 고르는 계기가 됩니다. 값의 높낮이보다 어떤 시간에 쓰일지가 선택의 기준이 됩니다.</p>
<p>대라천은 받는 사람이 누구든 — 부모님이든, 지인이든, 자기 자신이든 — 같은 기준을 안내합니다. 생활 방식에 맞는 형태를 먼저 고르시기 바랍니다.</p>
{{IMG:tea-set-gift}}

<h2>선물과 함께 알려 드리면 좋은 정보는?</h2>
<p>침향 선물은 <strong>어떻게 즐기고 어떻게 보관하는지</strong>를 함께 전할 때 값이 더 오래갑니다. 제품마다 즐기는 방법이 다르기 때문입니다.</p>
<p>오일 캡슐은 하루 1캡슐, 침향단은 하루 1단 식후, 침향차는 티백 한 포로 여러 번 우려 마시는 표기입니다. 짧은 카드에 이 한 줄씩만 적어 넣으셔도 충분합니다.</p>
<p>보관은 공통 원칙이 있습니다. 침향은 직사광선을 피하고 서늘·건조한 곳에 밀폐 보관하며, 오일 캡슐과 침향수는 개봉 후 냉장을 권합니다.</p>
<p>유통기한도 함께 귀띔해 드리면 좋습니다. 오일 캡슐은 3년, 에센셜 오일은 5년(오래될수록 좋음), 침향수는 2년, 스틱은 4년입니다. 보관법과 유통기한을 더 살펴보시려면 <a href="/blog/agarwood-enjoy-and-storage-guide">침향 즐기기·보관 가이드</a>를 참고하시기 바랍니다.</p>

<h2>조엘라이프(주)가 확인한 것과 확인하지 않은 것</h2>
<p>조엘라이프(주)는 이 글에 적은 구성·가격·유통기한을 제품 표기로 보유하고 있으며, 요청하시면 확인해 드립니다. 침향차 1.5g 10포와 침향수 100ml 세트 210,000원, 오일 캡슐 30캡슐 249,000원, 침향단 5g 15단 180,000원, 팔찌·묵주 890,000원부터, 스틱 100g 1,500,000원, 에센셜 오일 1ml 650,000원, 기보단 480,000원이 여기에 해당합니다.</p>
<p>확인하지 않은 것도 밝힙니다. 상황별 추천은 제품의 형태와 사용 방식에 따른 안내일 뿐, 어떤 제품이 다른 제품보다 몸에 좋다는 뜻이 아닙니다. 대라천 침향 제품은 일반식품이며 질병의 예방이나 치료를 목적으로 하지 않습니다.</p>
<p>인용한 Li W 연구팀의 논문 역시 대라천이 수행한 연구가 아니라 해당 연구팀의 결과입니다. 건강 상태가 신경 쓰이는 분께 선물하실 때는 전문가와 상의하시도록 함께 알려 주시기 바랍니다.</p>

<h2>자주 묻는 질문</h2>
<h3>Q. 침향 선물이 처음이라면 무엇이 무난한가요?</h3>
<p>A. 침향차·수 세트(210,000원)가 무난합니다. 마시는 차와 공간의 향을 함께 경험할 수 있어 침향을 처음 접하는 분께도 문턱이 낮습니다.</p>
<h3>Q. 부모님이 매일 챙겨 드시길 바랍니다.</h3>
<p>A. 제품 표기가 하루 1캡슐인 오일 캡슐(249,000원)이나 하루 1단 식후인 침향단(180,000원)이 어울립니다. 사용법이 단순해 자리 잡기 쉽습니다.</p>
<h3>Q. 명상·기도하시는 분께는 어떤 제품이 어울릴까요?</h3>
<p>A. 침향 100% 원목으로 만든 팔찌·묵주·합장주(890,000원~)가 어울립니다. 체온으로 향이 올라와 조용한 시간에 곁에 두기 좋습니다.</p>
<h3>Q. 대라천 제품은 모두 25년산 원료인가요?</h3>
<p>A. 오일 캡슐, 에센셜 오일, 침향단, 침향수, 파라미냐차, 스틱, 선향 등 여러 제품이 25년산 원료를 바탕으로 만들어집니다. 자세한 구성은 각 제품 페이지에서 확인하시기 바랍니다.</p>
<h3>Q. 스틱과 선향 가운데 무엇이 좋을까요?</h3>
<p>A. 연기를 줄이고 싶으시면 온열판(전자향로)에 올려 향을 내는 침향스틱(1,500,000원), 전통적인 향 피우기를 좋아하시면 침향선향이 어울립니다. 두 제품 모두 25년산 침향으로 만들어집니다.</p>
<h3>Q. 보관은 어떻게 안내하면 되나요?</h3>
<p>A. 직사광선을 피하고 서늘·건조한 곳에 밀폐 보관하는 것이 기본입니다. 오일 캡슐과 침향수는 개봉 후 냉장을 권합니다.</p>
<h3>Q. 차를 좋아하시는 분께는 무엇이 어울릴까요?</h3>
<p>A. 침향 파라미냐차가 어울립니다. 25년산 침향에 베트남 전통 파라미냐를 더한 차로, 티백 한 포로 세 번(3탕)까지 우려 마실 수 있습니다.</p>

<h2>근거·출처</h2>
<p>이 글의 제품 구성·가격 정보는 대라천 공식 제품 페이지(zoellife.com/products)의 표기를 정리한 제품 이용 안내입니다. 선물 상황별 추천은 제품의 형태와 사용 방식에 따른 안내이며, 특정 효과를 보장하지 않습니다. 인용한 학술 논문은 해당 연구팀의 결과이며 대라천 제품의 효능 근거가 아닙니다.</p>
<ul>
<li>Li W, Chen HQ, Wang H 외, "Natural products in agarwood and Aquilaria plants: chemistry, biological activities and biosynthesis", <em>Natural Product Reports</em> 38권 528~565쪽 (2021) — <a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">https://doi.org/10.1039/D0NP00042F</a></li>
<li><a href="/products">대라천 제품·가격 안내 — zoellife.com/products</a></li>
<li><a href="/about-agarwood">침향의 가치와 역사 — zoellife.com/about-agarwood</a></li>
</ul>
"""

content = (content.replace('@@TABLE@@', TABLE)
                  .replace('@@GIFT@@', GIFT_FIG)
                  .replace('@@SVGPRICE@@', SVG_PRICE)) + DISCLAIMER

out = {
    "slug": SLUG,
    "title": "침향 선물 가이드 — 상황별 추천 제품과 참고 가격",
    "excerpt": "부모님 선물부터 감사 인사, 명상 선물까지 상황별로 어울리는 침향 제품을 정리했습니다. 조엘라이프(주)가 표기한 침향차·수 세트 210,000원부터 침향스틱 1,500,000원까지 참고 가격을 표와 도표로 함께 담았습니다.",
    "tags": ["침향", "침향선물", "부모님선물", "명절선물", "침향세트", "감사선물", "대라천", "조엘라이프"],
    "content": content,
    "images": [
        {"key": "gift-wrapping",
         "prompt": "Photorealistic overhead shot of an elegant dark green gift box tied with a silk ribbon on a linen surface, a small handwritten-style blank card beside it, warm soft lighting, refined Korean gift presentation, muted earth tones, no text, no logo, no watermark",
         "alt": "정갈하게 포장된 침향 선물 상자 — 상황별 침향 선물 고르기",
         "caption": "즐기는 법과 보관법을 적은 카드를 함께 넣으면 좋습니다"},
        {"key": "tea-set-gift",
         "prompt": "Photorealistic still life of a ceramic teacup with amber tea beside a small glass bottle of clear liquid on a wooden tray, quiet evening light, minimal Korean interior, calm restful mood, no text, no logo, no watermark",
         "alt": "침향차 한 잔과 침향수 — 나를 위한 침향 선물",
         "caption": "하루를 마무리하는 침향차 한 잔"}
    ],
    "changelog": {
        "charsBefore": 0, "charsAfter": 0,
        "citationsAdded": ["A2"],
        "voiceFixes": 0,
        "notes": "회피 화법('사랑받아 왔습니다')을 조엘라이프(주) 주어 문장으로 교체하고 보도자료 인칭으로 통일했습니다. 참고 가격 7종을 선형 막대 인포그래픽으로 시각화하고 책임 진술 H2를 신설했으며, A2 1차 출처로 수지 형성 서술을 귀속했습니다. 가격·구성·유통기한 수치는 원문 그대로입니다."
    }
}

def strip(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', '', t)

out['changelog']['charsBefore'] = len(strip(S))
out['changelog']['charsAfter'] = len(strip(content))
out['changelog']['voiceFixes'] = len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는|대라천 자료는)', strip(content)))

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
print('excerpt', len(out['excerpt']), 'title', len(out['title']))
