import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = "scarcity-numbers-agarwood-400kg"
src = json.load(open(os.path.join(BASE, "in", SLUG + ".json"), encoding="utf-8"))
sc = src["content"]

SVG = re.search(r"<svg .*?</svg>", sc, re.S).group()          # byte-identical
IMG = re.search(r"<img[^>]*/>", sc).group()                    # byte-identical
DISC = re.search(r"<p style='font-size:13px;color:#7D7570'>.*?</p>", sc, re.S).group()

P = []
A = P.append

A('<p class="lead"><strong>결론부터.</strong> 침향 희소성 숫자는 크기가 아니라 환산해서 읽어야 뜻이 드러납니다. 조엘라이프(주)(브랜드 대라천)가 공개한 원목 약 400kg → 순수 오일 20~25cc는 무게 기준 약 0.005%라는 뜻이고, 219,000시간은 약 25년이라는 뜻입니다. 이 글은 대라천의 수치를 하나씩 환산해 각 숫자가 무엇을 보증하고 무엇은 보증하지 않는지 구분합니다. 값이 왜 그렇게 형성되는지는 <a href="/blog/why-is-agarwood-so-expensive">침향이 비싼 이유</a>에서 따로 다룹니다.</p>')

# 1
A('<h2>400kg에서 20~25cc는 어느 정도의 농축일까요</h2>')
A('<p>대라천 자료 기준 약 400kg의 침향 원목에서 얻는 순수 에센셜 오일은 20~25cc입니다. 두 숫자를 나란히 두면 격차만 눈에 들어오는데, 비율로 바꾸면 뜻이 분명해집니다. 무게로 따져 원목의 약 0.005%만 오일이 됩니다.</p>')
A('<p>환산해 보면 감이 달라집니다. 400kg은 성인 여러 명의 몸무게를 합친 무게이고, 거기서 나오는 오일은 작은 병 하나를 채우는 정도입니다. 나머지 99.99% 남짓은 오일이 되지 못하는 목질입니다.</p>')
A('<figure>' + SVG + '<figcaption>단위: kg 및 cc. 대라천 공식 자료 기준 원목 약 400kg당 순수 오일 20~25cc, 무게 대비 약 0.005%입니다.</figcaption></figure>')
A('<p>그래서 이 숫자가 실제로 알려 주는 정보는 “양이 적다”가 아니라 “한 방울에 들어간 원목의 양이 많다”입니다. 대라천이 이 오일을 한 방울 단위로 설명하는 이유도 여기 있습니다.</p>')

# 2
A('<h2>219,000시간을 햇수로 바꾸면 무엇이 남을까요</h2>')
A('<p>희소성에는 시간이라는 축이 하나 더 있습니다. 대라천은 침향이 만들어지기까지 최소 219,000시간, 약 25년이 걸린다고 밝힙니다. 시간 단위는 크게 보이지만 햇수로 환산하면 아이가 태어나 성인이 되는 기간과 비슷합니다.</p>')
A('<p>25년과 26년이 함께 등장하는 이유도 여기서 정리됩니다. 219,000시간(약 25년)은 수지가 쌓여 침향이 만들어지는 데 걸리는 시간이고, 대라천이 좋은 침향의 수확 시점으로 안내하는 기준은 최소 26년입니다. 제품 표기에 쓰이는 25년산은 원목의 나이를 가리킵니다.</p>')
A('<p>이 시간이 짧아지지 않는 까닭은 수지가 분비된 뒤에도 굳는 과정이 남아 있기 때문입니다. 대라천 자료에 따르면 수지는 분비 후에도 약 1~2년에 걸쳐 농축·응집되며 향과 밀도가 깊어집니다. 나무가 수지를 뿜는 순간이 끝이 아니라 시작인 셈입니다.</p>')
A('{{IMG:aged-timber-yard}}')

# 3
A('<h2>20년이라는 나무 나이는 왜 조건이 될까요</h2>')
A('<p>대라천은 20년 이상 자란 나무만 원료로 씁니다. 이 숫자는 규모나 수율과 달리 나무의 생리에서 나온 조건입니다.</p>')
A('<p>20년이 안 된 나무는 회복력이 강합니다. 상처가 나도 1~6개월 안에 아물려 버리고 수지 분비를 멈추므로, 이미 만들어진 수지도 줄거나 사라집니다. 앞서 말한 1~2년의 농축 기간을 버티지 못하는 것입니다.</p>')
A('<p>이 차이가 희소성의 실질입니다. 나무를 많이 심는다고 침향이 그만큼 나오지 않는 이유, 재배 기간을 앞당길 수 없는 이유가 모두 이 회복력의 시간표에서 나옵니다.</p>')
A('<p>키 성장이 끝난 20년 전후의 성숙한 나무는 반대로 움직입니다. 상처를 빨리 덮기보다 방어 물질인 수지를 오래 축적하고 유지하는 쪽으로 기울고, 그 결과 향과 밀도가 깊은 목질이 남습니다. 400kg에서 20~25cc라는 수율도, 최소 25년이라는 시간도 이 조건을 통과한 나무에서만 나오는 숫자입니다.</p>')

# 4
A('<h2>200헥타르·400만 그루는 무엇을 보증하고 무엇을 보증하지 않을까요</h2>')
A('<p>대라천은 베트남 5개 지역 약 200헥타르 부지에 약 400만 그루를 심고, 나무마다 고유번호를 붙여 관리합니다. 이 숫자가 보증하는 항목은 분명합니다. 산지가 실재하고, 26년짜리 재배 계획을 감당할 물량이 확보돼 있으며, 개체 단위로 이력을 되짚을 수 있다는 사실입니다.</p>')
A('<p>보증하지 않는 항목도 그만큼 분명합니다. 그루 수는 품질 등급이 아닙니다. 400만 그루 가운데 어느 나무가 수지를 얼마나 품었는지는 그루 수로 답할 수 없고, 개별 검사와 등급 판정을 따로 거쳐야 합니다.</p>')
A('<p>두 항목을 섞어 읽으면 판단이 어긋납니다. 그루 수가 적어도 개별 원목이 좋을 수 있고, 그루 수가 많아도 검사와 등급 판정이 없으면 확인되는 것은 물량뿐입니다.</p>')
A('<p>규모 숫자는 그래서 신뢰의 출발점이지 결론이 아닙니다. 농장별 조건은 <a href="/blog/vietnam-5-farms-200ha-4million-trees">베트남 5개 직영 농장</a>에, 개체 번호 관리 방식은 <a href="/blog/individual-tree-id-traceability">나무별 고유번호 추적</a>에 각각 정리돼 있습니다.</p>')

# 5
A('<h2>수율 숫자는 추출 조건이 바뀌면 함께 바뀝니다</h2>')
A('<p>희소성 숫자를 읽을 때 가장 자주 빠지는 함정은 수율을 고정된 상수로 여기는 태도입니다. 수율은 조건에 따라 달라지는 값입니다.</p>')
A('<p>Wang X 연구팀은 2025년 <em>Journal of Essential Oil Research</em>에 아퀼라리아 속 정유의 추출 방식이 수율과 화학 조성, 생물학적 활성에 미치는 영향을 종합 리뷰로 정리했습니다(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>). 같은 원목이라도 추출 방식과 시간이 달라지면 뽑히는 양과 성분이 달라진다는 뜻입니다.</p>')
A('<p>조건이 달라지면 수율만 움직이는 것도 아닙니다. 같은 리뷰는 추출 방식이 성분 구성까지 바꾼다고 정리했습니다. 수율이 높다는 사실이 곧 같은 향을 얻었다는 뜻은 아니라는 이야기입니다.</p>')
A('<p>그러므로 “400kg에서 20~25cc”라는 숫자는 조건과 함께 읽어야 성립합니다. 대라천의 조건은 25년산 원목을 72시간 동안 고온 증류해 100% 순수 오일로 받는 방식입니다. 조건이 빠진 수율 숫자끼리 견주는 비교는 성립하지 않습니다.</p>')

# 6
A('<h2>등급은 수율이나 연수로 정해지지 않습니다</h2>')
A('<p>연수와 수율이 좋으면 등급도 자동으로 높아진다고 읽기 쉽지만, 침향에는 별도의 등급 체계가 존재합니다.</p>')
A('<p>Wang Y 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 분포와 성분, 침향 등급 체계, 수지 유도법을 정리해 실었습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). 대라천은 이 리뷰를 등급 체계가 별도로 존재한다는 사실의 참고 자료로 인용하며, 자사 제품의 등급을 주장하는 근거로 쓰지 않습니다.</p>')
A('<p>등급이 별도로 존재한다는 사실은 소비자에게도 쓸모가 있습니다. 같은 25년산이라는 표기 아래에도 서로 다른 물건이 들어갈 수 있으니, 연수 표기만으로 물건이 특정되지 않는다는 점을 전제하고 나머지 정보를 찾게 되기 때문입니다.</p>')
A('<p>정리하면 연수는 원료의 나이, 수율은 추출 결과, 등급은 판정입니다. 세 숫자는 서로를 대신하지 못합니다. 하나의 숫자로 나머지 둘을 설명하는 문구를 만나면 그 지점이 확인이 필요한 자리입니다.</p>')

# 7
A('<h2>근거가 붙은 숫자와 붙지 않은 숫자를 가르는 네 가지 질문</h2>')
A('<p>숫자 자체는 참도 거짓도 아닙니다. 확인 경로가 붙어 있는지가 갈림길입니다. 대라천이 공개한 수치를 축별로 정리하면 확인해야 할 질문이 드러납니다.</p>')
A('<table><thead><tr><th>축</th><th>확인 질문</th><th>대라천이 내놓은 숫자</th><th>확인 경로</th></tr></thead><tbody>'
  '<tr><td>시간</td><td>몇 년 자란 나무인가</td><td>최소 25년(219,000시간) · 수확 기준 최소 26년</td><td>재배 이력</td></tr>'
  '<tr><td>수율</td><td>어떤 조건에서 얼마가 나오나</td><td>원목 약 400kg → 20~25cc (25년산·72시간 증류)</td><td>제품 사양</td></tr>'
  '<tr><td>규모</td><td>산지와 농장이 실재하나</td><td>5개 직영 · 200헥타르 · 400만 그루</td><td>농장 소재지</td></tr>'
  '<tr><td>이력</td><td>개체 단위로 되짚을 수 있나</td><td>나무별 고유번호</td><td>재배 기록·Lot 번호</td></tr>'
  '</tbody></table>')
A('<p>표를 쓰는 방법은 간단합니다. 어떤 침향 제품을 보든 네 줄을 그대로 옮겨 적고, 판매 페이지에서 채울 수 있는 칸이 몇 개인지 세어 보면 됩니다. 숫자의 크기를 비교하는 대신 빈칸의 수를 비교하는 방식입니다.</p>')
A('<p>네 칸이 모두 채워지면 그 숫자는 확인 가능한 숫자입니다. 오른쪽 두 칸이 비어 있으면 크기와 무관하게 확인되지 않은 숫자입니다.</p>')

# 8
A('<h2>근거 없는 큰 숫자는 왜 시장에서 사라지지 않을까요</h2>')
A('<p>확인되지 않은 숫자가 계속 쓰이는 데에는 구조적인 이유가 있습니다. 사는 쪽이 품질을 확인할 수 없으면 시장 자체가 왜곡된다는 설명은 경제학에서 오래전에 정리됐습니다.</p>')
A('<p>Akerlof는 1970년 <em>The Quarterly Journal of Economics</em>에 품질 불확실성이 시장 기제에 미치는 영향을 분석한 논문을 실었습니다(<a href="https://doi.org/10.2307/1879431" target="_blank" rel="noopener">DOI</a>). 파는 쪽만 품질을 알고 사는 쪽은 모르는 상태가 이어지면, 확인되지 않는 주장이 확인된 주장과 같은 값에 팔리는 상황이 만들어집니다.</p>')
A('<p>침향은 육안으로 진위를 가리기 어렵고 검사 비용이 드는 물건이라 이 조건에 정확히 들어맞습니다. 큰 숫자를 붙이는 쪽이 유리해지는 구조인 셈입니다. 그래서 대라천은 숫자마다 확인 경로를 함께 적고, 확인되지 않는 시장 일반의 수치는 이 글에 옮기지 않습니다. 향으로 진위를 가리는 방법의 한계는 <a href="/blog/smell-test-real-vs-blended-agarwood-oil">향으로 구분하는 법</a>에 별도로 정리돼 있습니다.</p>')

# 9
A('<h2>이 숫자들은 제품 속에서 어떻게 만나게 될까요</h2>')
A('<p>환산해 온 숫자는 결국 손에 쥐는 용량으로 돌아옵니다. 대라천 에센셜 오일은 25년산 원목을 72시간 고온 증류해 얻은 향을 1ml 용량에 담습니다. 앞의 수율을 대입하면 이 작은 용량이 어디에서 왔는지가 보입니다.</p>')
A('<p>침향단은 25년산 침향분말을 10% 배합한 제품이고, 제품 표기 기준 1단이 한 번에 즐기는 단위입니다. 오일 캡슐 역시 원액을 소량 단위로 나눠 담는 방식으로 설계됐습니다. 대라천은 오일 함량 수치가 높다고 품질이 자동으로 좋아지지는 않는다고 안내하며, 제품에 표기된 양을 기준으로 삼으시길 권합니다.</p>')
A('<figure>' + IMG + '<figcaption>원목 약 400kg에서 나온 20~25cc가 최종 용량으로 이어집니다.</figcaption></figure>')
A('<p>대라천은 이 글에 적은 수율과 재배 연수, 농장 규모를 자체 기록과 시험성적서로 보유하고 있으며, 요청하시면 확인해 드립니다. 다만 인용한 두 편의 논문은 대라천이 수행한 연구가 아니라 해당 연구팀의 결과이고, 제품의 효능을 뒷받침하는 자료가 아닙니다. 다른 판매자의 수율이나 시장 평균값은 대라천이 확인한 범위 밖이므로 이 글에 적지 않았습니다.</p>')
A('{{IMG:distillation-copper-still}}')

# FAQ
A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 400kg에서 20~25cc면 비율로 얼마인가요?</h3>')
A('<p>A. 무게 기준 약 0.005%입니다. 대라천 자료의 원목 약 400kg당 순수 에센셜 오일 20~25cc를 환산한 값입니다.</p>')
A('<h3>Q. 219,000시간과 25년, 26년은 각각 무엇을 가리키나요?</h3>')
A('<p>A. 219,000시간은 약 25년으로, 침향이 만들어지는 데 걸리는 시간입니다. 최소 26년은 대라천이 안내하는 수확 시점 기준이고, 25년산은 제품 원료가 된 원목의 나이입니다.</p>')
A('<h3>Q. 그루 수가 많으면 품질도 좋은 건가요?</h3>')
A('<p>A. 아닙니다. 400만 그루라는 숫자는 공급 규모와 이력 관리 범위를 보증할 뿐, 개별 원목의 수지량이나 등급을 보증하지 않습니다.</p>')
A('<h3>Q. 수율 숫자는 어디서나 같은가요?</h3>')
A('<p>A. 다릅니다. 추출 방식과 시간에 따라 수율과 성분이 달라진다는 점은 Wang X 연구팀의 2025년 리뷰에 정리돼 있습니다. 대라천의 수치는 25년산 원목을 72시간 고온 증류한 조건의 값입니다.</p>')
A('<h3>Q. 오일 함량이 높은 제품을 고르면 되나요?</h3>')
A('<p>A. 함량 수치만으로 품질이 정해지지는 않습니다. 대라천은 제품에 표기된 양을 기준으로 삼으시길 권합니다.</p>')

# Sources
A('<h2>근거·출처</h2>')
A('<ul>'
  '<li>Wang X, Chan SW, Singaram N 외, “Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities”, <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, “Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods”, <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>'
  '<li>Akerlof GA, “The Market for &quot;Lemons&quot;: Quality Uncertainty and the Market Mechanism”, <em>The Quarterly Journal of Economics</em> 84권 488쪽 (1970) — <a href="https://doi.org/10.2307/1879431" target="_blank" rel="noopener">https://doi.org/10.2307/1879431</a></li>'
  '<li>대라천 수율·재배 연수·농장 규모 자료: <a href="/about-agarwood">침향 알아보기</a> · <a href="/process">생산 공정</a></li>'
  '</ul>')
A('<hr />')
A(DISC)

content = "\n".join(P)

out = {
    "slug": SLUG,
    "title": "침향 희소성 숫자 읽는 법 — 400kg에서 20cc가 뜻하는 것",
    "excerpt": "조엘라이프(주)가 공개한 침향 희소성 숫자를 환산해 읽습니다. 원목 400kg에서 오일 20~25cc는 무게의 약 0.005%, 219,000시간은 약 25년입니다. 각 숫자가 무엇을 보증하고 무엇은 보증하지 않는지 네 가지 축으로 나눠 정리했습니다.",
    "tags": ["침향", "침향희소성", "침향오일", "침향농축", "26년", "침향가격", "침향가치", "대라천"],
    "content": content,
    "images": [
        {
            "key": "aged-timber-yard",
            "prompt": "Photorealistic documentary still life in a shaded open-air timber shed: a large stacked pile of rough cut tropical hardwood logs with dark resin-streaked cores, warm dusty sunlight falling in diagonal shafts, earthen floor, muted brown and ochre palette, wide angle, deep natural texture, no text, no letters, no numbers, no logo, no watermark, no people",
            "alt": "침향 원목 더미 — 400kg 원목에서 오일 20~25cc가 나오는 희소성 숫자의 출발점",
            "caption": "쌓인 원목 전체가 작은 병 하나 분량의 오일로 줄어듭니다"
        },
        {
            "key": "distillation-copper-still",
            "prompt": "Photorealistic industrial detail shot of a traditional copper distillation still in a clean workshop, softly glowing polished copper vessel with visible pipe joints and a condenser coil, faint steam, neutral concrete wall behind, warm amber and grey palette, shallow depth of field, calm documentary photography, no text, no letters, no numbers, no logo, no watermark, no people",
            "alt": "72시간 고온 증류에 쓰이는 구리 증류기 — 침향 수율을 결정하는 추출 조건",
            "caption": "수율 숫자는 추출 조건과 함께 읽어야 뜻이 성립합니다"
        }
    ],
    "changelog": {
        "charsBefore": len(re.sub(r"<[^>]+>", "", sc)),
        "charsAfter": len(re.sub(r"<[^>]+>", "", content)),
        "citationsAdded": ["A4", "A7", "A9"],
        "voiceFixes": 22,
        "notes": "글의 각도를 '숫자에 압도되지 말자'는 태도 서술에서 '각 숫자를 환산해 무엇을 보증하고 무엇은 보증하지 않는지 가르는' 해석 절차로 재구성해, 가격 형성을 다루는 자매글 why-is-agarwood-so-expensive와 H2 작명·표·논지를 분리하고 상호 링크를 걸었습니다. 근거 없는 큰 숫자가 존속하는 기전은 A9(Akerlof 1970)로, 수율의 조건 의존성은 A4로, 등급의 별도 체계는 A7로 귀속했습니다. 출처 없는 시장 추정('저가·복합오일일 수도 있습니다')은 삭제하고, '하루 1단'은 권장 복용량으로 읽히지 않도록 제품 표기 사양으로 바꿨습니다. 원문 수치(400kg·20~25cc·0.005%·219,000시간·25년·26년·20년·1~2년·1~6개월·200헥타르·400만 그루·10%·1ml·72시간)와 SVG·이미지 URL·disclaimer는 그대로 유지했습니다."
    }
}
json.dump(out, open(os.path.join(BASE, "out", SLUG + ".json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("written", out["changelog"]["charsBefore"], "->", out["changelog"]["charsAfter"],
      "excerpt", len(out["excerpt"]), "title", len(out["title"]))
