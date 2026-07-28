# -*- coding: utf-8 -*-
"""choose-your-first-agarwood-product — press-release voice rebuild."""
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'choose-your-first-agarwood-product'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG)))
S = src['content']

# --- preserve source artifacts byte-identically -----------------------------
FLOW_SVG_BLOCK = re.search(r'<div style="margin:20px 0;.*?</div>', S, re.S).group(0)
TABLE = re.search(r'<table>.*?</table>', S, re.S).group(0)
GRID_FIG = re.search(r'<figure><img src="[^"]*grid[^"]*".*?</figure>', S, re.S).group(0)
DISCLAIMER = "<hr /><p style='font-size:13px;color:#7D7570'>" + re.findall(r'<em>※.*?</em>', S, re.S)[-1] + "</p>"

# --- new numeric infographic (SPEC §E-2 light reading surface) ---------------
SVG_COUNT = """<svg viewBox="0 0 500 250" width="100%" role="img" aria-label="대라천 입문 제품 한 구성당 개수 비교 막대그래프">
<rect x="0" y="0" width="500" height="250" fill="#fffdf9"/>
<text x="24" y="28" font-size="13" fill="#2b2318">한 구성에 담긴 개수 — 대라천 입문 제품</text>
<text x="24" y="66" font-size="12" fill="#2b2318">오일 캡슐</text>
<rect x="120" y="52" width="330" height="20" fill="#9a6a10"/>
<text x="458" y="67" font-size="12" fill="#2b2318">30캡슐</text>
<text x="24" y="112" font-size="12" fill="#2b2318">파라미냐차</text>
<rect x="120" y="98" width="330" height="20" fill="#c8a24a"/>
<text x="458" y="113" font-size="12" fill="#2b2318">30포</text>
<text x="24" y="158" font-size="12" fill="#2b2318">선향</text>
<rect x="120" y="144" width="187" height="20" fill="#d9c9a3"/>
<text x="315" y="159" font-size="12" fill="#2b2318">17개</text>
<line x1="120" y1="180" x2="450" y2="180" stroke="#d9c9a3" stroke-width="1"/>
<text x="120" y="198" font-size="11" fill="#7d7570">0</text>
<text x="450" y="198" font-size="11" fill="#7d7570">30</text>
<text x="24" y="222" font-size="12" fill="#2b2318">스틱은 100g 원목, 선향은 길이 15cm — 개수 눈금 밖의 규격입니다</text>
<text x="24" y="242" font-size="12" fill="#7d7570">수치는 대라천 제품 표기 기준</text>
</svg>"""

content = """<p class="lead"><strong>결론부터.</strong> 첫 침향 제품은 성분표가 아니라 생활 방식으로 고르면 됩니다. 조엘라이프(주)(브랜드 대라천)는 일상 복용에는 오일 캡슐, 음료로 즐기려면 파라미냐차, 공간의 향을 원하면 선향·스틱, 명상·기도와 함께하려면 묵주·팔찌를 입문 제품으로 안내합니다. 아래 진단표에서 예와 아니오만 따라가시면 첫 제품이 정해집니다.</p>

<h2>첫 제품은 무엇을 기준으로 고르면 될까요?</h2>
<p>침향 제품은 캡슐, 차, 선향, 스틱, 묵주까지 형태가 여러 갈래로 나뉩니다. 처음 고르는 분이 막히는 지점도 대개 여기입니다.</p>
<p>대라천은 입문 제품을 성분이 아니라 <strong>네 가지 생활 방식</strong>으로 나눠 안내합니다. 매일 챙겨 드시고 싶은 분, 향 좋은 음료로 즐기고 싶은 분, 공간을 은은한 향으로 채우고 싶은 분, 명상이나 기도 시간에 곁에 두고 싶은 분입니다.</p>
<p>성분을 따지기 전에 '침향을 어떻게 만나고 싶은가'만 정하면 선택지가 하나로 좁혀집니다. 대라천 자주 묻는 질문에도 같은 기준이 적혀 있습니다. 일상 복용은 오일 캡슐, 음료는 파라미냐차, 공간 향은 선향·스틱입니다.</p>
<p>형태가 정해지면 그다음 확인할 것은 원료와 이력입니다. 대라천은 참침향 제품군의 원료를 25년산 원목으로 표기하고, 학명과 산지를 제품 정보에 함께 밝힙니다.</p>

<h2>예와 아니오만 따라가면 첫 제품이 정해집니다</h2>
<p>아래 진단표는 대라천이 안내하는 입문 기준을 순서도로 옮긴 것입니다. 질문은 세 개, 도착점은 네 곳입니다.</p>
@@FLOW@@
<p>그림이 복잡하게 느껴지시면 말로 따라오셔도 됩니다. <strong>매일 챙겨 드시고 싶다</strong>면 오일 캡슐입니다. 아니라면 <strong>향 나는 음료</strong>가 끌리는지 물어보고, 그렇다면 파라미냐차로 갑니다.</p>
<p>이것도 아니라면 <strong>명상·기도 시간</strong>에 함께할지 물어보고, 그렇다면 묵주·팔찌입니다. 여기까지 모두 아니라면 <strong>공간을 채우는</strong> 선향·스틱이 남습니다.</p>
<p>진단표는 순위표가 아닙니다. 어느 도착점이 더 좋은 제품이라는 뜻이 아니라, 생활에 자리 잡기 쉬운 형태를 먼저 고르자는 제안입니다.</p>

<h2>제품별 성격은 어떻게 다를까요?</h2>
<p>방향을 잡으셨다면 제품마다 성격이 어떻게 갈리는지 견줘 보시기 바랍니다. 입문 난이도와 즐기는 방법만 알아도 선택이 한결 쉬워집니다.</p>
@@TABLE@@
<p>가장 부담이 적은 첫걸음은 <strong>오일 캡슐과 파라미냐차</strong>입니다. 캡슐은 제품 표기가 하루 1캡슐로 단순해 잊을 일이 적고, 차는 향을 즐기며 천천히 다가갈 수 있습니다.</p>
<p>향 자체가 궁금하시다면 선향이나 스틱으로 시작하셔도 됩니다. 다만 이 둘은 불이나 온열판을 다루는 과정이 따르므로, 표에서 입문 난이도를 보통으로 적었습니다.</p>
@@GRID@@

<h2>한 번 사면 얼마나 오래 즐길 수 있나요?</h2>
<p>첫 구매에서 가장 자주 나오는 질문은 값이 아니라 <strong>몇 회분인가</strong>입니다. 대라천 제품 표기를 기준으로 구성 수량을 나란히 놓으면 이렇습니다.</p>
<figure>@@SVGCOUNT@@<figcaption style='font-size:13px;color:#7D7570'>대라천 입문 제품의 한 구성당 개수 — 오일 캡슐 30캡슐, 파라미냐차 30포, 선향 17개. 스틱(100g 원목)과 선향 길이(15cm)는 개수로 재지 않는 규격이라 별도로 적었습니다. (출처: 대라천 제품 표기)</figcaption></figure>
<p>캡슐과 차는 구성 수량이 같아 비교가 쉽습니다. 여기에 파라미냐차는 한 포를 뜨거운 물 90ml에 넣어 3탕까지 우려 마시는 방식이라, 같은 30이라는 숫자라도 즐기는 횟수는 더 늘어납니다.</p>
<p>선향은 15cm 길이로 17개가 들어 있고, 스틱은 100g 원목을 조금씩 잘라 쓰는 구성입니다. 개수보다 사용하는 양에 따라 기간이 달라지므로, 처음에는 기본 구성으로 한 바퀴 즐겨 보시길 권합니다.</p>

<h2>오일 캡슐과 파라미냐차는 어떻게 다를까요?</h2>
<p>입문에서 가장 많이 갈리는 두 제품을 조금 더 들여다보겠습니다.</p>
<p><strong>오일 캡슐</strong>은 한 병에 30캡슐이 들어 있습니다. 침향오일에 적송오일, 오메가3, 비타민E를 함께 담았고, 제품 표기 사용법은 하루 한 알로 적혀 있습니다. 매일 무언가를 꾸준히 챙기는 습관이 있거나 알약 형태가 편한 분께 자리 잡기 쉬운 형태입니다.</p>
<p><strong>파라미냐차</strong>는 25년산 침향에 베트남 전통 약초 파라미냐를 섞은 허브티입니다. 한 포를 뜨거운 물 90ml에 넣고 3탕까지 우려 마십니다. 약처럼 챙겨 먹는 방식이 아직 어색하거나 향과 여유를 함께 즐기고 싶은 분께 어울립니다.</p>
<p>두 제품은 경쟁 관계가 아닙니다. 아침에는 캡슐, 오후에는 차처럼 시간대를 나눠 쓰셔도 됩니다. 다만 처음에는 하나씩 익숙해지신 뒤 늘리시는 편이 자기 취향을 파악하기에 좋습니다.</p>

<h2>선향과 스틱은 어떤 분께 맞을까요?</h2>
<p>공간을 향으로 채우고 싶은 분을 위한 제품이 선향과 스틱입니다. 두 제품은 향을 내는 방식부터 다릅니다.</p>
<p><strong>선향</strong>은 15cm 길이로 약 17개가 들어 있습니다. 사른 뒤 퍼지는 향을 간접적으로 즐기는 전통 방식입니다. 향을 직접 들이마시지 않도록, 또 어린이 손이 닿지 않는 곳에 두도록 대라천은 제품 안내에 함께 적어 두었습니다.</p>
<p><strong>스틱</strong>은 25년산 원목 100g 구성입니다. 조금씩 잘라 온열판에 올리거나 차로 우려 쓰는 다용도 제품이라, 향과 차를 두루 쓰고 싶은 분께 맞습니다.</p>
<p>향에 먼저 끌려 침향을 알게 되셨다면 이쪽에서 시작하셔도 무리가 없습니다. 캡슐이나 차로 넘어가는 순서를 지킬 필요는 없습니다.</p>

<h2>예산은 어떻게 잡으면 좋을까요?</h2>
<p>침향은 원료 자체가 귀해 값이 낮지 않은 편입니다. 그래서 첫 구매의 기준은 총액보다 <strong>얼마나 오래 즐길 수 있는가</strong>로 잡는 편이 현실적입니다.</p>
<p>캡슐은 하루 한 알씩 30캡슐, 파라미냐차는 한 포로 3탕씩 30포를 즐기는 구성입니다. 하루치로 환산해 보면 총액이 주는 인상과 다르게 읽힙니다.</p>
<p>여러 종류를 한꺼번에 사지 않는 것도 중요합니다. 취향에 맞는 하나로 시작해 습관이 자리 잡은 뒤 두 번째 제품을 더해도 늦지 않습니다.</p>
<p>값만 보지 마시고 학명(Aquilaria Agallocha Roxburgh)과 산지(베트남), 인증서처럼 <strong>확인 가능한 사실</strong>을 함께 살피시기 바랍니다. 같은 가격대라도 이 정보가 열려 있는지에 따라 제품의 성격이 달라집니다.</p>

<h2>진짜 침향인지 어떻게 확인하나요?</h2>
<p>결제 전에 확인하실 것은 두 가지입니다. 첫째는 이력, 둘째는 용량입니다.</p>
<p>이력은 제품 설명에서 확인합니다. 학명이 <strong>Aquilaria Agallocha Roxburgh</strong>로 적혀 있는지, 산지가 베트남인지, 인증서나 Lot 번호로 이력을 되짚을 수 있는지를 보시면 됩니다. 대라천은 이 세 가지를 제품 정보에 함께 공개합니다.</p>
<p>학명을 확인하는 일이 왜 중요한지는 학계 자료로도 설명됩니다. Wang Y 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 분포와 성분, 침향 등급 체계, 수지 유도법을 정리한 논문을 실었습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). 종과 산지에 따라 성분과 등급이 갈린다는 점을 확인할 수 있는 1차 자료입니다. 이 논문은 대라천이 수행한 연구가 아니며, 제품의 효능을 뒷받침하는 자료도 아닙니다.</p>
<p>둘째, 용량은 작게 시작하시기를 권합니다. 캡슐이면 30캡슐 한 병, 차면 한 박스처럼 기본 구성으로 한 바퀴 즐겨 보신 뒤 이어서 사셔도 늦지 않습니다.</p>

<h2>선물로 고를 때는 무엇이 달라질까요?</h2>
<p>내가 쓸 제품과 선물할 제품은 고르는 기준이 다릅니다. 선물은 포장이 단정하고, 받는 분이 부담 없이 시작할 수 있는 형태가 유리합니다.</p>
<p>침향차·수 세트는 마시는 즐거움과 공간의 향을 함께 담아 특별한 인상을 줍니다. 오일 캡슐은 매일 챙기기 좋아 실용적이고, 어르신 선물로도 어울립니다.</p>
<p>선물할 때 왜 이 제품을 골랐는지 한 줄 곁들이시면 전달이 달라집니다. 25년산 원료라는 점이나 학명 이야기처럼 확인 가능한 사실이면 충분합니다.</p>
<p>선물 상황별 구성과 가격을 더 살펴보시려면 <a href="/blog/agarwood-gift-guide">침향 선물 가이드</a>를 참고하시기 바랍니다.</p>

<h2>조엘라이프(주)가 확인한 것과 확인하지 않은 것</h2>
<p>조엘라이프(주)는 이 글에 적은 제품 구성과 표기를 제품 정보로 보유하고 있으며, 요청하시면 확인해 드립니다. 오일 캡슐 30캡슐 구성, 파라미냐차 30포와 90ml·3탕 표기, 선향 15cm 17개, 스틱 100g 원목, 25년산 원료, 학명 Aquilaria Agallocha Roxburgh와 베트남 산지가 여기에 해당합니다.</p>
<p>확인하지 않은 것도 밝힙니다. 이 글의 제품 추천은 생활 방식에 따른 형태 안내일 뿐, 어떤 제품이 다른 제품보다 몸에 좋다는 뜻이 아닙니다. 대라천 침향 제품은 일반식품이며 질병의 예방이나 치료를 목적으로 하지 않습니다.</p>
<p>침향단·선향 같은 일부 제품은 12세 미만 어린이, 임산부·수유부에게 권하지 않습니다. 성분에 예민한 분도 주의가 필요하므로, 구매 전 제품별 안내를 확인하시고 건강 상태가 신경 쓰이면 전문가와 상의하시기 바랍니다.</p>

<h2>자주 묻는 질문</h2>
<h3>Q. 정말 처음인데 딱 하나만 고른다면 무엇인가요?</h3>
<p>A. 매일 챙기는 습관이 있으면 오일 캡슐, 향과 여유를 좋아하시면 파라미냐차입니다. 대라천이 입문 제품으로 안내하는 두 가지입니다.</p>
<h3>Q. 캡슐과 차를 같이 시작해도 되나요?</h3>
<p>A. 가능합니다. 아침에는 캡슐, 오후에는 차처럼 시간대를 나누면 서로 겹치지 않습니다. 다만 처음에는 하나씩 익숙해지신 뒤 늘리시길 권합니다.</p>
<h3>Q. 선향은 초보자가 쓰기 어렵지 않나요?</h3>
<p>A. 사른 뒤 향을 간접적으로 즐기는 방식이라 익숙해지면 어렵지 않습니다. 향을 직접 들이마시지 않도록, 또 어린이 손이 닿지 않는 곳에 두시기 바랍니다.</p>
<h3>Q. 한 구성으로 얼마나 즐길 수 있나요?</h3>
<p>A. 오일 캡슐은 30캡슐, 파라미냐차는 30포이며 한 포로 90ml씩 3탕까지 우립니다. 선향은 15cm 17개, 스틱은 100g 원목 구성입니다.</p>
<h3>Q. 선물용으로는 무엇이 무난한가요?</h3>
<p>A. 침향차·수 세트나 오일 캡슐이 무난합니다. 포장이 단정하고 받는 분도 부담 없이 시작할 수 있습니다.</p>

<h2>근거·출처</h2>
<p>이 글의 제품 분류와 입문 안내는 대라천 공식 자료(zoellife.com)의 제품 정보와 자주 묻는 질문에 근거합니다. 제품별 구성·표기·주의사항은 공식 제품 정보를 그대로 옮겼습니다. 인용한 학술 논문은 해당 연구팀의 결과이며 대라천 제품의 효능 근거가 아닙니다.</p>
<ul>
<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>
<li><a href="/products">대라천 제품 소개 — zoellife.com/products</a></li>
<li><a href="/faq">자주 묻는 질문 — 입문 제품 안내 (zoellife.com/faq)</a></li>
<li><a href="/about-agarwood">침향의 가치와 성분 정보 — zoellife.com/about-agarwood</a></li>
</ul>
"""

content = (content.replace('@@FLOW@@', FLOW_SVG_BLOCK)
                  .replace('@@TABLE@@', TABLE)
                  .replace('@@GRID@@', GRID_FIG)
                  .replace('@@SVGCOUNT@@', SVG_COUNT)) + DISCLAIMER

out = {
    "slug": SLUG,
    "title": "침향 처음이라면 — 생활 방식으로 고르는 첫 제품 가이드",
    "excerpt": "캡슐, 차, 선향, 묵주 중 무엇부터 시작할지 막막하셨다면 예와 아니오만 따라가 보시기 바랍니다. 조엘라이프(주)가 안내하는 네 가지 생활 방식 기준으로 첫 침향 제품을 고르는 진단표와 구성 비교표를 담았습니다.",
    "tags": ["침향입문", "첫침향", "침향제품", "침향라이프", "오일캡슐", "파라미냐차", "선향", "대라천"],
    "content": content,
    "images": [
        {"key": "tea-brewing",
         "prompt": "Photorealistic close-up of a clear glass teapot brewing dark amber herbal tea on a linen cloth, a single paper tea sachet resting beside it, warm afternoon window light, calm minimal Korean interior, no text, no logo, no watermark",
         "alt": "파라미냐차를 우리는 모습 — 음료로 시작하는 첫 침향 제품",
         "caption": "한 포를 90ml에 우려 3탕까지 즐기는 파라미냐차"},
        {"key": "incense-desk",
         "prompt": "Photorealistic still life of a slim incense stick resting in a ceramic holder on a dark wooden desk, a thin ribbon of smoke rising, soft shadow, muted beige and charcoal tones, quiet meditative atmosphere, no text, no logo, no watermark",
         "alt": "선향을 피운 책상 — 공간의 향으로 시작하는 첫 침향 제품",
         "caption": "공간을 채우는 향으로 시작하는 선향"}
    ],
    "changelog": {
        "charsBefore": 0, "charsAfter": 0,
        "citationsAdded": ["A7"],
        "voiceFixes": 0,
        "notes": "구어체 '~예요'를 보도자료 인칭 '-습니다'로 전환하고 조엘라이프(주)/대라천을 주어로 세웠습니다. 구성 수량 인포그래픽과 책임 진술 H2를 신설하고, A7 1차 출처로 학명·산지 확인의 근거를 보강했습니다. 가격·구성·학명 표기는 원문 그대로 유지했습니다."
    }
}

def strip(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', '', t)

out['changelog']['charsBefore'] = len(strip(S))
out['changelog']['charsAfter'] = len(strip(content))
out['changelog']['voiceFixes'] = len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는|대라천 자료는|대라천 자료가)', strip(content)))

# insert image tokens
content = content.replace('<h2>오일 캡슐과 파라미냐차는 어떻게 다를까요?</h2>',
                          '{{IMG:tea-brewing}}\n<h2>오일 캡슐과 파라미냐차는 어떻게 다를까요?</h2>')
content = content.replace('<h2>예산은 어떻게 잡으면 좋을까요?</h2>',
                          '{{IMG:incense-desk}}\n<h2>예산은 어떻게 잡으면 좋을까요?</h2>')
out['content'] = content

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
print('excerpt', len(out['excerpt']), 'title', len(out['title']))
