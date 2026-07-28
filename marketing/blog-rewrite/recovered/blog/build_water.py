# -*- coding: utf-8 -*-
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(BASE, 'in/proof-in-water-cup-and-papers.json'), encoding='utf-8'))
S = src['content']

# 원문 자산을 바이트 그대로 추출 (SPEC §D 절대 보존)
CUP_SVG = re.search(r'<div><svg.*?</svg></div>', S, re.S).group(0)
TABLE = re.search(r'<table>.*?</table>', S, re.S).group(0)
PAPERS_FIG = re.search(r'<figure><img[^>]*papers-1782976448817[^>]*/><figcaption>.*?</figcaption></figure>', S, re.S).group(0)
DISCLAIMER = '<hr />' + re.search(r'<p style="font-size:13px;color:#7D7570">.*?</p>', S, re.S).group(0)

NUM_SVG = (
'<figure>'
'<svg viewBox="0 0 660 270" width="100%" role="img" aria-label="진짜 침향 확인 5단계와 중금속 검사 8종 항목 수 도표" '
'style="height:auto;font-family:sans-serif;background:#fffdf9">'
'<rect x="0" y="0" width="660" height="270" fill="#fffdf9"/>'
'<text x="24" y="34" fill="#2b2318" font-size="16" font-weight="bold">진짜 침향 확인 절차와 검사 항목 수</text>'
'<text x="24" y="56" fill="#2b2318" font-size="12">단위: 항목 수</text>'
'<text x="24" y="98" fill="#2b2318" font-size="13">확인 5단계</text>'
'<rect x="150" y="80" width="200" height="28" fill="#9a6a10"/>'
'<text x="250" y="99" text-anchor="middle" fill="#fffdf9" font-size="13">눈으로 2단계</text>'
'<rect x="350" y="80" width="300" height="28" fill="#c49a4a"/>'
'<text x="500" y="99" text-anchor="middle" fill="#2b2318" font-size="13">서류로 3단계</text>'
'<text x="150" y="130" fill="#2b2318" font-size="12">침강 관찰과 색·향 확인은 앞의 2단계, 학명·산지·서류 확인은 뒤의 3단계입니다.</text>'
'<text x="24" y="184" fill="#2b2318" font-size="13">중금속 8종</text>'
'<rect x="150" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<rect x="194" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<rect x="238" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<rect x="282" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<rect x="326" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<rect x="370" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<rect x="414" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<rect x="458" y="166" width="34" height="26" fill="#fffdf9" stroke="#9a6a10" stroke-width="2"/>'
'<text x="510" y="185" fill="#2b2318" font-size="13">검출 0종</text>'
'<text x="150" y="216" fill="#2b2318" font-size="12">납·카드뮴·수은·비소·구리·주석·안티몬·니켈, 빈 칸은 불검출을 뜻합니다.</text>'
'<text x="24" y="252" fill="#2b2318" font-size="12">물컵 시연은 왼쪽 2단계에만 해당합니다.</text>'
'</svg>'
'<figcaption>위 막대는 본문의 확인 5단계 구성(관능 2단계·서류 3단계), 아래 칸은 대라천 중금속 검사 결과(8종 중 검출 0종, 2023-08-24)입니다. 단위는 항목 수입니다.</figcaption>'
'</figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 침향 조각이 물에 가라앉는다는 것은 밀도가 물보다 높다는 뜻입니다. '
  '밀도는 수지가 얼마나 배었는지와 이어지므로, 침강은 수지량을 가늠하는 하나의 신호가 됩니다. '
  '다만 침강 자체는 품종도, 산지도, 등급도 증명하지 않습니다. 무거운 물질을 채워 억지로 가라앉히는 조작도 가능합니다. '
  '조엘라이프(주)(브랜드 대라천)는 물컵 시연을 1차 관문으로만 쓰고, 학명·산지·증빙 서류 석 장으로 최종 확인합니다.</p>')

# H2 1
A("<h2>침향을 왜 '물에 가라앉는 향'이라고 부를까요?</h2>")
A('<p>침향(沈香)이라는 이름에서 침(沈)은 가라앉는다는 뜻입니다. 대한민국약전외한약(생약)규격집도 침향의 관능 규격을 '
  '흑갈색을 띠고, 맛은 달고 쓰며, 물에 가라앉는 것으로 적어 두었습니다. 규격집은 물에 가라앉는 상급을 침수향(沈水香)으로 구분합니다.</p>')
A('<p>이름과 규격이 같은 성질을 가리키는 이유는 단순합니다. 침향은 아퀼라리아 나무가 상처를 아물리는 과정에서 만들어 낸 수지가 '
  '목질 속에 오래 쌓인 것입니다. 수지가 많이 밸수록 같은 부피의 목질이 무거워지고, 밀도가 물을 넘어서는 순간 가라앉습니다. '
  '수지가 거의 배지 않은 목질은 그대로 뜹니다.</p>')
A('<p>Wang S 연구팀은 2018년 Molecules에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 총론으로 정리했습니다'
  '(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). '
  '대라천은 이 리뷰를 성분 일반에 관한 참고 자료로만 인용하며, 제품의 효능 근거로는 사용하지 않습니다.</p>')
A('<p>정리하면 침강은 밀도에 관한 관찰이고, 밀도는 수지가 밴 정도와 이어집니다. '
  '이 연결이 물컵 시연에 쓸모를 주는 이유이자, 동시에 그 쓸모가 거기서 멈추는 이유입니다.</p>')

# H2 2
A('<h2>물컵 침강 테스트는 어떻게 하나요?</h2>')
A('<p>방법은 이름 그대로입니다. 맑은 물을 담은 컵에 침향 조각을 넣고 가라앉는지 뜨는지를 지켜보면 됩니다. '
  '특별한 도구도 사전 지식도 필요하지 않습니다.</p>')
A(CUP_SVG)
A('<p>적용 대상은 제한적입니다. 원목이나 스틱처럼 목질 형태가 남아 있어야 관찰할 수 있습니다. '
  '캡슐, 분말, 오일 같은 가공품은 이 방법으로 확인되지 않습니다. 가공품은 학명과 산지, 증빙 서류, Lot(로트) 번호로 확인해야 합니다.</p>')
A('{{IMG:water-sink-demo}}')
A('<p>대라천은 물컵 시연을 원료의 상태를 설명하는 도구로만 쓰고, 그 결과를 제품 등급의 근거로 제시하지 않습니다. '
  '가라앉는 장면 하나로 판단을 마무리하지 않는다는 뜻입니다.</p>')

# H2 3
A('<h2>침강이 증명하지 못하는 것은 무엇인가요?</h2>')
A('<p>물컵 시연의 한계는 분명히 짚어 둘 필요가 있습니다. 가라앉는다는 관찰이 말해 주는 것은 밀도 하나뿐입니다. '
  '밀도가 수지량과 이어진다는 사실까지가 이 관찰의 범위이고, 그 바깥은 다른 방법으로 확인해야 합니다.</p>')
A('<p>첫째, 침강은 품종을 증명하지 않습니다. 아퀼라리아 속이 아닌 나무라도 목질이 조밀하거나 무거운 물질이 스며 있으면 가라앉습니다. '
  '둘째, 침강은 산지를 증명하지 않습니다. 어느 나라 어느 농장에서 온 원목인지는 물속에서 드러나지 않습니다. '
  '셋째, 침강은 등급을 증명하지 않습니다.</p>')
A('<p>등급은 별도의 체계로 다루는 주제입니다. Wang Y 연구팀은 2021년 Molecules에 아퀼라리아 속의 분포와 성분, 침향 등급 체계, '
  '수지 유도법을 정리한 리뷰를 발표했습니다'
  '(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). '
  '대라천은 침향의 등급을 물에 뜨고 가라앉는지로 판정하지 않습니다.</p>')
A('<p>조작 가능성도 남아 있습니다. 목질에 무거운 물질을 채워 억지로 가라앉히면 관찰 결과는 같아집니다. '
  '그래서 대라천은 물컵 시연을 한 번 걸러 주는 관문으로만 두고, 최종 판단은 뒤에 이어지는 서류로 마무리합니다.</p>')

# H2 4
A('<h2>서류 석 장은 무엇을 말해 주나요?</h2>')
A('<p>진짜 침향은 눈에 보이는 특징만이 아니라 확인 가능한 서류로 뒷받침됩니다. '
  '대라천이 기준으로 삼는 세 축, 곧 학명·산지·증빙 문서를 표로 정리하면 아래와 같습니다.</p>')
A(TABLE)
A('<p>세 축은 서로를 대신하지 않습니다. 학명 서류는 산지를 말해 주지 않고, 산지 이력은 안전성을 말해 주지 않습니다. '
  '증빙 문서의 대표는 <a href="https://cites.org" target="_blank" rel="noopener">CITES</a> 인증입니다. '
  '아퀼라리아 속 나무는 국제적으로 보호받는 자원이므로, CITES 서류는 그 원목이 규정을 지켜 거래된 자원임을 보여 줍니다.</p>')
A('<p>안전성 항목에서 대라천은 중금속 8종(납·카드뮴·수은·비소·구리·주석·안티몬·니켈)이 2023년 8월 24일 검사에서 '
  '전부 불검출됐다는 결과를 보유하고 있습니다. 서류별 발급 기관과 번호를 읽는 순서는 '
  '<a href="/blog/how-to-read-agarwood-certificates">침향 인증서 읽는 법</a>에 따로 정리했습니다.</p>')
A(PAPERS_FIG)

# H2 5
A('<h2>학명 하나가 왜 그렇게 중요할까요?</h2>')
A('<p>서류 가운데 맨 앞에 두어야 할 것이 학명입니다. 대한민국 공식 문서가 침향의 기원식물로 올려 둔 대표 학명은 '
  'Aquilaria Agallocha Roxburgh(아퀼라리아 아갈로차 록스버그)입니다. '
  '식약처 고시 대한민국약전외한약(생약)규격집을 비롯해 한약재 관능검사 해설서, 원색 한약재감별도감 같은 공식 자료가 이 학명을 싣고 있습니다.</p>')
A('<p>식품공전은 아갈로차와 함께 Aquilaria Malaccensis Lam(말라센시스)도 침향의 기원으로 등재하고 있습니다. '
  '두 이름이 함께 통용되므로, 제품 라벨과 수출 서류에 적힌 학명을 검사서와 맞대어 확인하는 절차가 필요합니다.</p>')
A('<p>대라천은 원목을 DowGene에 의뢰해 유전자 검사를 진행했고, Aquilaria agallocha 유전자형과 100% 일치한다는 결과를 '
  '확인했습니다(검사번호 DA-260507-1). 라벨의 학명 표기와 검사 결과가 같은 대상을 가리키는지 대조할 수 있어야 이 항목이 확인됩니다.</p>')
A('<p>다만 학명만으로 품질이 갈리지는 않습니다. 같은 종이라도 자란 땅과 관리 방식, 수지가 밴 정도가 다릅니다. '
  '학명은 출발점이고, 산지와 이력이 그다음 항목입니다.</p>')

# H2 6
A('<h2>산지와 이력은 어떻게 확인하나요?</h2>')
A('<p>산지 확인의 핵심은 나라 이름이 아니라 되짚을 수 있는 기록입니다. 어느 농장에서 자란 어느 나무에서 나왔는지가 남아 있어야 '
  '확인이 성립합니다. 원산지 표기만 있고 그 뒤가 비어 있으면 대조할 대상이 없습니다.</p>')
A('<p>대라천은 100% 베트남산 원료를 사용하며, 베트남 5개 직영 농장에서 나무마다 개별 고유번호를 붙여 자란 과정을 관리합니다. '
  '원목 단위로 번호가 붙기 때문에 완제품에서 원목까지 거슬러 올라갈 수 있습니다. '
  '농장과 생산 과정은 <a href="/process">베트남 직영 농장과 생산 과정</a>에 정리돼 있습니다.</p>')
A('<p>완제품 쪽에서는 Lot 번호가 같은 역할을 합니다. 캡슐이나 오일처럼 물컵 시연이 통하지 않는 형태일수록 이 번호의 비중이 커집니다. '
  '번호가 없으면 확인을 시작할 지점 자체가 사라지기 때문입니다. '
  '대라천이 보유한 인증 항목은 <a href="/brand-story">대라천 인증·품질 증명</a>에서 볼 수 있습니다.</p>')
A('{{IMG:farm-tree-tag}}')

# H2 7
A('<h2>눈으로 보는 확인과 서류 확인을 어떻게 묶을까요?</h2>')
A('<p>물컵 시연은 직관적인 대신 조작될 여지가 있고, 서류는 확실한 대신 그 자리에서 바로 들여다보기 어렵습니다. '
  '둘을 함께 쓰면 서로의 빈틈이 줄어듭니다. 아래 순서를 따라가면 확인이 수월해집니다.</p>')
A('<ol>'
  '<li>물에 넣어 가라앉는지 본다(침수향 여부, 보조 확인).</li>'
  '<li>색이 흑갈색인지, 향이 자연스러운지 살핀다.</li>'
  '<li>학명이 Aquilaria Agallocha Roxburgh인지 묻는다.</li>'
  '<li>산지가 베트남인지, 이력 추적이 되는지 확인한다.</li>'
  '<li>CITES·DNA·성분분석서·Lot 번호를 요청한다.</li>'
  '</ol>')
A(NUM_SVG)
A('<p>다섯 단계 가운데 앞의 둘은 눈으로, 뒤의 셋은 서류로 확인합니다. 앞의 둘에서 걸러지는 것은 조잡한 흉내에 그치고, '
  '실제 판정은 뒤의 셋에서 이루어집니다. 순서를 바꾸어도 무방하지만, 뒤의 셋을 생략하면 확인은 완결되지 않습니다.</p>')
A('<p>값싼 나무에 향만 입힌 경우라면 물에 잘 뜨고, 흑갈색과 달고 쓴맛이라는 관능 규격도 함께 맞추기 어렵습니다. '
  '여기에 국제 협약 서류와 유전자 검사, 원산지 기록까지 요구하면 통과해야 할 관문이 겹겹이 쌓입니다. '
  '하나만 보지 않고 여러 개를 겹쳐 확인하는 편이 안전한 이유입니다.</p>')

# H2 8
A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 이 글에 적은 검사번호와 검사 날짜, 농장 수와 원목 관리 방식을 자체 기록과 시험성적서로 보유하고 있으며, '
  '요청하시면 확인해 드립니다. 유전자 검사는 DowGene이 수행한 결과이고, 중금속 검사도 해당 시험 기관이 측정한 값입니다.</p>')
A('<p>확인하지 않은 것도 함께 밝힙니다. 물컵 침강 여부는 대라천이 제품 등급의 근거로 삼는 항목이 아닙니다. '
  '이 글에 인용한 연구 논문은 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 대라천 제품의 효능을 뒷받침하는 자료가 아닙니다. '
  '대라천 제품은 일반식품이며, 이 글의 확인 절차는 원료의 진위와 안전성에 관한 것이지 질병의 예방이나 개선과는 관련이 없습니다.</p>')

# H2 9 FAQ
A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 물에 가라앉으면 진짜 침향인가요?</h3>')
A('<p>A. 아닙니다. 침강은 밀도가 높다는 관찰이고, 밀도는 수지가 밴 정도와 이어질 뿐입니다. '
  '품종과 산지, 등급은 침강으로 판정되지 않습니다. 무거운 물질을 채워 가라앉히는 조작도 가능하므로 학명·산지·서류를 함께 확인해야 합니다.</p>')
A('<h3>Q. 집에서 물컵 테스트를 해도 되나요?</h3>')
A('<p>A. 원목이나 스틱 형태라면 참고 삼아 해 볼 수 있습니다. 캡슐이나 오일 같은 가공품은 이 방법으로 확인되지 않습니다. '
  '가공품은 학명·산지·서류와 Lot 번호로 확인해야 합니다.</p>')
A('<h3>Q. CITES 서류가 없으면 가짜인가요?</h3>')
A('<p>A. 서류가 없다는 사실만으로 가짜라고 단정하기는 어렵습니다. 다만 아퀼라리아 속 나무는 보호 대상이므로, '
  '절차를 지켜 거래된 원료라면 관련 서류가 함께 따라옵니다. 요청했을 때 번호와 사본을 내놓는지가 실질적인 판단 기준이 됩니다.</p>')
A("<h3>Q. '침수향'과 '침향'은 다른 건가요?</h3>")
A('<p>A. 침수향은 물에 가라앉는 상급 침향을 가리키던 표현입니다. 대한민국약전외한약(생약)규격집도 물에 가라앉는 것을 '
  '상품(上品)으로 봅니다. 다만 이 구분은 관능 규격의 한 항목이며, 품종과 산지를 대신하지 않습니다.</p>')
A('<h3>Q. 캡슐이나 오일은 무엇으로 확인하나요?</h3>')
A('<p>A. 학명이 적힌 검사서, 산지 이력, CITES와 중금속 검사 성적서, 그리고 Lot 번호입니다. '
  '대라천은 완제품에 Lot 번호를 붙여 원목 단위까지 이력을 되짚을 수 있게 관리합니다.</p>')

# H2 10
A('<h2>근거·출처</h2>')
A('<p>이 글의 검사 결과와 농장 정보는 대라천 공식 자료에 근거합니다. 침강·색·맛 기준은 식약처 규격집의 침향 품질 기준을 따랐습니다.</p>')
A('<ul>'
  '<li><a href="/about-agarwood">진짜 침향 감별 3기준 (zoellife.com/about-agarwood)</a></li>'
  '<li><a href="/brand-story">CITES·DNA·중금속 불검출 등 인증 (zoellife.com/brand-story)</a></li>'
  '<li><a href="/process">베트남 직영 농장과 생산 과정 (zoellife.com/process)</a></li>'
  '<li><a href="/blog/how-to-read-agarwood-certificates">침향 인증서 읽는 법 (zoellife.com/blog)</a></li>'
  '<li><a href="https://cites.org" target="_blank" rel="noopener">CITES(멸종위기종 국제거래협약) — 침향속(Aquilaria) 부속서 II 등재</a></li>'
  '<li>Wang S, Yu Z, Wang C 외, “Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants”, '
  '<em>Molecules</em> 23권 342 (2018) — '
  '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">doi.org/10.3390/molecules23020342</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, “Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, '
  'Pharmacological Uses, Agarwood Grading System, and Induction Methods”, <em>Molecules</em> 26권 7708 (2021) — '
  '<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">doi.org/10.3390/molecules26247708</a></li>'
  '<li>식약처 고시 대한민국약전외한약(생약)규격집 — 침수향(沈水香) 품질 기준</li>'
  '</ul>')
A(DISCLAIMER)

content = ''.join(C)

out = {
    "slug": "proof-in-water-cup-and-papers",
    "title": "물컵 침강 테스트와 서류 석 장 — 진짜 침향 확인 순서",
    "excerpt": "침향이 물에 가라앉는다는 것은 밀도가 높다는 뜻일 뿐, 품종·산지·등급을 증명하지 않습니다. 조엘라이프(주)는 물컵 침강 시연을 1차 관문으로만 쓰고, 학명·산지·증빙 서류 석 장으로 진짜 침향인지 최종 확인하는 순서를 정리했습니다.",
    "tags": ["침향", "침수향", "물컵테스트", "진짜침향", "학명", "산지", "증빙서류", "대라천"],
    "content": content,
    "images": [
        {
            "key": "water-sink-demo",
            "prompt": "Photorealistic close-up of a clear glass tumbler filled with still water on a pale linen surface, one dark resinous wood chip resting on the bottom of the glass and one lighter pale wood chip floating at the surface, soft natural side light, visible water refraction and fine wood grain, muted ivory and warm brown palette, shallow depth of field, editorial still life photography, no text, no logo, no watermark, no hands, no people",
            "alt": "물컵 침강 테스트에서 가라앉은 진짜 침향 조각과 떠오른 목편",
            "caption": "가라앉는지 보는 관찰은 밀도에 관한 정보만 알려 줍니다."
        },
        {
            "key": "farm-tree-tag",
            "prompt": "Photorealistic close-up of a weathered blank metal tag tied with wire to the trunk of a tropical plantation tree, rough bark texture in sharp focus, rows of green trees blurred in the background, warm humid morning light, natural green and umber palette, shallow depth of field, documentary photography, no readable text, no numbers, no logo, no watermark, no people",
            "alt": "베트남 직영 농장에서 나무마다 붙인 고유번호 표식",
            "caption": "대라천은 원목마다 고유번호를 붙여 자란 과정을 관리합니다."
        }
    ],
    "changelog": {
        "charsBefore": 0,
        "charsAfter": 0,
        "citationsAdded": ["A1", "A7", "K4"],
        "voiceFixes": 0,
        "notes": "침강을 '진짜의 증거'로 읽히던 서술을 밀도 관찰로 한정하고, 품종·산지·등급을 증명하지 않는다는 한계를 전용 H2로 신설. 출처 없는 언론 보도·DNA 감별 동향 문장과 CITES 2010년 이명 정리·인도네시아 등재 배경 문단은 검증 불가로 삭제, 옛 문헌 산지 기록 주장도 삭제. -요체를 -습니다체로 통일하고 zoellife.com 절대경로를 내부 상대경로로 교체, A1·A7 인용과 수치 SVG·이미지 토큰 2종 추가."
    }
}

path = os.path.join(BASE, 'out/proof-in-water-cup-and-papers.json')
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

strip = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', s)).strip()
han = lambda s: len(re.findall(r'[가-힣]', s))
print('title', len(out['title']), '| excerpt', len(out['excerpt']))
print('charsBefore', han(strip(S)), '-> charsAfter', han(strip(content)))
print('cup svg preserved:', CUP_SVG in content, '| table:', TABLE in content, '| fig:', PAPERS_FIG in content)
