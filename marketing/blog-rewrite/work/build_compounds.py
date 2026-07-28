import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-active-compounds-explained'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A1 = '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a>'
A2 = '<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">https://doi.org/10.1039/D0NP00042F</a>'
A3 = '<a href="https://doi.org/10.1055/s-2006-957784" target="_blank" rel="noopener">https://doi.org/10.1055/s-2006-957784</a>'
A5 = '<a href="https://doi.org/10.1021/acs.jnatprod.8b00635" target="_blank" rel="noopener">https://doi.org/10.1021/acs.jnatprod.8b00635</a>'
KS = '<a href="https://koreascience.kr/article/JAKO201122238508185.pdf" target="_blank" rel="noopener">GC-MS를 이용한 침향류의 성분 비교 연구</a>'
K1 = '<a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">침향(沈香) 항목</a>'

TABLE = (
 '<table><thead><tr><th>구분</th><th>세스퀴테르펜</th><th>2-(2-페닐에틸)크로몬(PEC)</th></tr></thead><tbody>'
 '<tr><td>쉽게 말하면</td><td>식물이 만드는 향 물질의 한 종류</td><td>침향에 특히 많은 특징 물질</td></tr>'
 '<tr><td>구조</td><td>탄소 5개 단위가 세 번 이어진 탄소 15개 골격</td><td>크로몬 골격에 페닐에틸기가 붙은 형태</td></tr>'
 '<tr><td>감각에서의 자리</td><td>깊고 묵직한 향의 중심</td><td>침향을 다른 목재와 구별하는 표지</td></tr>'
 '<tr><td>예시</td><td>아가로스피롤(대라천 자료 표기)</td><td>PEC 유도체</td></tr>'
 '<tr><td>인용한 연구</td><td>Okugawa 외 1996 (쥐 대상 실험)</td><td>Ahn 외 2019 (세포 대상 실험)</td></tr>'
 '</tbody></table>'
)

SVG = (
 '<figure><svg viewBox="0 0 640 250" width="100%" role="img" '
 'aria-label="한 연구가 보고한 시료별 베타셀리넨 함량 막대그래프">'
 '<rect x="0" y="0" width="640" height="250" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">β-selinene 함량 — 한 연구의 시료별 값 (단위: %)</text>'
 '<rect x="150" y="62" width="450" height="30" fill="#9a6a10"/>'
 '<text x="20" y="83" font-size="14" fill="#2b2318">베트남 ①</text>'
 '<text x="610" y="83" font-size="14" font-weight="700" fill="#9a6a10">7.497</text>'
 '<rect x="150" y="106" width="412" height="30" fill="#9a6a10"/>'
 '<text x="20" y="127" font-size="14" fill="#2b2318">베트남 ②</text>'
 '<text x="572" y="127" font-size="14" font-weight="700" fill="#9a6a10">6.861</text>'
 '<rect x="150" y="150" width="97" height="30" fill="#2b2318"/>'
 '<text x="20" y="171" font-size="14" fill="#2b2318">미얀마</text>'
 '<text x="257" y="171" font-size="14" font-weight="700" fill="#2b2318">1.608</text>'
 '<text x="20" y="206" font-size="12" fill="#2b2318">출처: 신광호 외, 대한본초학회지 26권 7~12쪽 (2011)에서 대라천 자료가 인용한 값</text>'
 '<text x="20" y="228" font-size="12" fill="#2b2318">이후 다른 연구에서는 검출되지 않은 사례가 있어 산지 지표로 단정할 수 없습니다.</text>'
 '</svg><figcaption>한 연구가 보고한 시료별 β-selinene 함량 — 산지 판정 기준이 아닙니다</figcaption></figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 침향 성분은 크게 두 집안으로 나뉩니다. 향의 중심을 이루는 세스퀴테르펜과, '
  '침향에 특히 많은 2-(2-페닐에틸)크로몬(PEC)입니다. 두 성분군을 다룬 연구는 여럿 있지만, 그 연구들이 보고한 것은 '
  '실험에서 관찰된 활성입니다. 조엘라이프(주)(브랜드 대라천)는 이 글에서 연구가 보고한 범위만 옮기며, '
  '제품의 효능으로 연결하지 않습니다.</p>')

A('<h2>침향 성분은 어디서 생겨날까요?</h2>')
A('<p>침향은 목재가 아니라 수지가 밴 부분입니다. 침향나무가 벌레와 바람, 낙뢰, 외부 충격으로 상처를 입으면 '
  '그 자리로 곰팡이균이 들어오고, 나무는 스스로를 지키려 수지를 내보냅니다.</p>')
A('<p>이 수지가 목질 조직에 오래 쌓여 굳으면 비로소 침향이라 부를 수 있는 부분이 됩니다. 상처, 균 침투, 수지 분비, '
  '오랜 숙성이라는 네 단계를 거치는 구조입니다.</p>')
A('<p>Li 연구팀은 2021년 <em>Natural Product Reports</em> 38권 528~565쪽에 침향과 아퀼라리아 식물의 천연물 화학과 '
  '생합성을 정리한 총설을 실었습니다(' + A2 + '). 수지가 만들어지는 경로를 다룬 연구입니다.</p>')
A('<p>대라천은 이 과정에 최소 25년을 둡니다. 브랜드가 쓰는 219,000시간이라는 표현이 그 기간을 시간 단위로 바꾼 값입니다. '
  '하띤(Ha Tinh) 농장에서는 5년차 나무에 개미집이 생기며 자연스러운 자극이 더해진다고 대라천 자료는 밝힙니다.</p>')
A('<p>그러므로 이 글에서 다루는 성분은 나무가 상처를 견딘 결과물입니다. 성분의 이름을 먼저 외우는 것보다 '
  '어디서 생겨났는지를 아는 편이 이해에 가깝습니다.</p>')
A('{{IMG:resin-cross-section}}')

A('<h2>세스퀴테르펜은 무엇일까요?</h2>')
A('<p>세스퀴테르펜(sesquiterpene)은 식물이 만드는 향 물질의 한 종류입니다. 탄소 5개짜리 단위가 세 번 이어져 '
  '탄소 15개의 골격을 이루는 구조이고, 그 골격이 접히는 모양에 따라 향이 달라집니다.</p>')
A('<p>침향의 깊고 묵직한 향은 상당 부분 이 계열에서 나옵니다. 대라천 자료는 아가로스피롤을 침향의 진정 성분으로 '
  '소개하며, 이 물질도 세스퀴테르펜 계열에 속합니다.</p>')
A('<p>진정이라는 표현의 출처를 밝혀 둘 필요가 있습니다. Okugawa 연구팀은 1996년 <em>Planta Medica</em> 62권 2~6쪽에 '
  '진코에레몰과 아가로스피롤이 쥐의 중추신경에 미치는 영향을 보고했습니다(' + A3 + ').</p>')
A('<p>쥐를 대상으로 한 실험입니다. 사람에게서 확인된 결과가 아니며, 대라천은 이 연구를 사람에 대한 효과의 근거로 '
  '쓰지 않습니다.</p>')
A('<p>한국민족문화대백과사전은 ' + K1 + '에서 침향의 정유 성분으로 벤질아세톤과 P-메토실 벤질아세톤 등을 들고, '
  '동물실험에서 진정 작용이 관찰됐다는 옛 기록도 함께 서술합니다. 이 역시 동물실험 수준의 기록입니다.</p>')

A('<h2>크로몬(PEC)은 무엇일까요?</h2>')
A('<p>크로몬(chromone)도 식물이 만드는 물질의 한 종류입니다. 침향에는 그 가운데 2-(2-페닐에틸)크로몬, 줄여서 PEC라 부르는 '
  '물질이 많이 들어 있습니다.</p>')
A('<p>PEC가 주목받은 이유는 분포에 있습니다. 다른 목재에서는 흔치 않고 침향에서 두드러지므로, 침향을 구별하는 '
  '표지 역할을 할 수 있기 때문입니다.</p>')
A('<p>Ahn 연구팀은 2019년 <em>Journal of Natural Products</em> 82권 259~264쪽에 아퀼라리아 말라켄시스 침향에서 얻은 '
  '페닐에틸크로몬이 아디포넥틴 분비를 촉진하는 현상을 보고했습니다(' + A5 + ').</p>')
A('<p>세포를 대상으로 한 실험입니다. 사람을 대상으로 한 임상시험과 안전성 연구가 더 필요한 단계이며, '
  '대라천은 이 결과를 제품의 기능으로 연결하지 않습니다.</p>')
A('<p>두 연구의 공통점은 실험 대상입니다. 하나는 쥐, 하나는 세포입니다. 이 조건을 빼고 결과만 옮기면 '
  '연구가 하지 않은 주장이 만들어집니다.</p>')

A('<h2>두 성분군을 표로 견주면</h2>')
A('<p>구조와 자리, 그리고 인용한 연구를 한 표에 놓으면 아래와 같습니다.</p>')
A(TABLE)
A('<p>표의 마지막 줄이 이 글에서 가장 중요한 칸입니다. 두 성분군에 붙은 연구가 각각 어떤 대상에서 이루어졌는지를 '
  '함께 적어야 결과의 범위가 유지됩니다.</p>')
A('<p>어느 쪽이 더 중요한 성분인가라는 질문에는 이 글이 답하지 않습니다. 세스퀴테르펜은 향의 중심을 이루고, '
  'PEC는 구별의 표지 역할을 합니다. 서로 다른 축의 이야기입니다.</p>')
A('<p>대라천 자료는 이 둘과 함께 그 외 방향족 화합물을 주성분군으로 듭니다. 방향족은 향이 난다는 뜻이 아니라 '
  '탄소가 고리 모양으로 안정되게 연결된 구조를 가리키는 이름입니다.</p>')

A('<h2>연구는 무엇을 보고했고, 무엇을 보고하지 않았을까요?</h2>')
A('<p>Wang 연구팀은 2018년 <em>Molecules</em> 23권 342에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 정리한 '
  '총설을 실었습니다(' + A1 + '). 여러 활성이 보고된 현황을 모은 문헌입니다.</p>')
A('<p>이런 총설을 읽을 때 함께 봐야 할 것이 저자들이 스스로 적어 둔 한계입니다. 다수의 연구가 사람을 대상으로 한 '
  '임상시험과 독성 연구가 더 필요하다고 밝히고 있습니다.</p>')
A('<p>그러므로 지금까지의 연구는 가능성을 관찰한 단계입니다. 효과가 확인되었다고 말할 수 있는 단계가 아닙니다. '
  '대라천이 성분을 이야기할 때 연구가 보고했다는 표현을 쓰는 이유가 여기에 있습니다.</p>')
A('<p>보고되지 않은 것도 분명합니다. 어떤 연구도 대라천 제품을 대상으로 삼지 않았습니다. 성분 계열이 같다는 사실이 '
  '특정 제품의 결과를 뜻하지는 않습니다.</p>')
A('<p>대라천 침향 제품은 일반식품이며 질병의 예방이나 치료를 위한 의약품이 아닙니다. 이 문장은 형식적인 단서가 아니라 '
  '위 연구들의 범위에서 곧바로 따라 나오는 결론입니다.</p>')

A('<h2>성분은 어떻게 숫자로 확인할까요?</h2>')
A('<p>성분 확인에는 GC-MS를 씁니다. 기체크로마토그래피로 섞여 있는 성분을 하나씩 분리한 뒤, 질량분석기로 각 성분의 '
  '질량을 재어 무엇인지 판정하는 장비입니다.</p>')
A('<p>국내 연구로는 신광호 외의 ' + KS + '가 있습니다. 대한본초학회지 26권 7~12쪽(2011)에 실렸고, '
  '베트남과 인도네시아, 미얀마 시료를 GC-MS로 견준 연구입니다.</p>')
A(SVG)
A('<p>대라천 자료는 이 연구에서 β-selinene 값을 인용해 왔습니다. 베트남 시료에서 7.497%와 6.861%, 미얀마 시료에서 '
  '1.608%라는 값입니다. β-selinene은 세스퀴테르펜 계열의 향 성분입니다.</p>')
A('<p>다만 이 수치를 산지 판정 기준으로 쓸 수는 없습니다. 이후 다른 연구에서는 베트남 시료에서 검출되지 않은 사례가 있습니다. '
  '한 연구의 시료에서 나온 값이라는 조건을 함께 읽어야 합니다.</p>')
A('<p>그럼에도 이 방식이 의미를 갖는 이유는 분명합니다. 향의 인상을 말로 견주는 대신 성분을 수치로 견줄 수 있게 하기 때문입니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 이 글에 인용한 네 편의 국제 논문을 DOI로 확인했고, 국내 GC-MS 연구는 저자와 저널, 권과 쪽수, 연도가 '
  '일치하는지 공개 데이터베이스에서 대조했습니다.</p>')
A('<p>확인하지 못한 것도 적어 둡니다. 국내 GC-MS 연구의 본문 전문은 작성 시점에 열람에 실패했습니다. '
  '그래서 본문에 적은 β-selinene 수치는 대라천 자료가 인용해 온 값이라는 사실을 함께 밝혀 두었습니다.</p>')
A('<p>대라천은 오직 아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh) 품종만 사용합니다. 식약처 고시 '
  '대한민국약전외한약(생약)규격집은 아갈로차로 규정하고, 식품공전은 아갈로차와 말라켄시스 두 종을 함께 올려 두었습니다.</p>')
A('<p>A. agallocha Roxb.는 A. malaccensis의 이명이며 오늘날에는 말라켄시스를 정명으로 봅니다. 표기가 갈리는 이유가 '
  '여기에 있고, 대라천은 문서마다 다른 표기를 임의로 통일하지 않습니다.</p>')
A('<p>인용한 연구는 대라천이 수행한 것이 아니라 각 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>')
A('{{IMG:gcms-lab}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 세스퀴테르펜과 크로몬 중 무엇이 더 중요한가요?</h3>')
A('<p>A. 축이 다릅니다. 세스퀴테르펜은 향의 중심을 이루고, PEC 같은 크로몬은 침향을 구별하는 표지로 연구돼 왔습니다. '
  '어느 하나로 순위를 매길 수 있는 항목이 아닙니다.</p>')
A('<h3>Q. 이 성분들이 질병을 치료하나요?</h3>')
A('<p>A. 아닙니다. 인용한 연구는 쥐와 세포를 대상으로 한 실험이며, 다수가 임상시험과 독성 연구가 더 필요하다고 밝히고 있습니다. '
  '대라천 침향 제품은 일반식품이며 의약품이 아닙니다.</p>')
A('<h3>Q. 아가로스피롤은 무엇인가요?</h3>')
A('<p>A. 대라천 자료가 침향의 진정 성분으로 소개하는 세스퀴테르펜 계열 물질입니다. 진정이라는 표현은 '
  'Okugawa 연구팀의 1996년 쥐 실험 보고에 기댄 것이며, 사람에게서 확인된 결과가 아닙니다.</p>')
A('<h3>Q. β-selinene 수치로 산지를 알 수 있나요?</h3>')
A('<p>A. 알 수 없습니다. 한 연구의 시료에서 나온 값이고, 이후 다른 연구에서는 검출되지 않은 사례가 있습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 성분 서술은 대라천 공식 자료(zoellife.com)와 아래 논문에 근거합니다. '
  '각 연구가 보고한 범위를 본문에 함께 밝혔으며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", '
  '<em>Molecules</em> 23권 342 (2018) — ' + A1 + '</li>'
  '<li>Li W, Chen HQ, Wang H 외, "Natural products in agarwood and Aquilaria plants: chemistry, biological activities and '
  'biosynthesis", <em>Natural Product Reports</em> 38권 528~565쪽 (2021) — ' + A2 + '</li>'
  '<li>Ahn S, Ma CT, Choi JM 외, "Adiponectin-Secretion-Promoting Phenylethylchromones from the Agarwood of '
  'Aquilaria malaccensis", <em>Journal of Natural Products</em> 82권 259~264쪽 (2019) — ' + A5 + '</li>'
  '<li>Okugawa H, Ueda R, Matsumoto K 외, "Effect of Jinkoh-eremol and Agarospirol from Agarwood on the Central Nervous '
  'System in Mice", <em>Planta Medica</em> 62권 2~6쪽 (1996) — ' + A3 + '</li>'
  '<li>신광호 외, ' + KS + ', 대한본초학회지 26권 7~12쪽 (2011)</li>'
  '<li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li>'
  '<li><a href="/about-agarwood">침향 성분·연구 자료 — about-agarwood</a></li>'
  '<li><a href="/blog/the-science-of-warming-agarwood">따뜻한 성질의 과학 — the-science-of-warming-agarwood</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '침향 성분 두 집안, 세스퀴테르펜과 크로몬을 연구 범위까지',
    'excerpt': '침향 성분은 향의 중심을 이루는 세스퀴테르펜과 침향에 특히 많은 크로몬(PEC)으로 나뉩니다. 대라천이 두 성분군의 '
               '구조와 인용 논문을 정리하고, 각 연구가 쥐와 세포 가운데 무엇을 대상으로 했는지까지 함께 밝혔습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'resin-cross-section',
         'prompt': 'Photorealistic macro close-up of a cut cross-section of agarwood showing dark resin veins spreading through pale wood grain, placed on a neutral grey surface, single soft directional light, shallow depth of field, muted umber and ivory palette, editorial scientific still life, no text, no logo, no watermark, no people',
         'alt': '침향 성분이 자리한 수지 침착 단면',
         'caption': '성분은 나무가 상처를 견디며 쌓은 수지 안에 있습니다.'},
        {'key': 'gcms-lab',
         'prompt': 'Photorealistic still life of a laboratory bench with a row of small clear glass sample vials containing dark wood chips, a stainless analytical instrument blurred in the background, clean neutral lighting, shallow depth of field, muted grey and steel palette, editorial science photography, no text, no logo, no watermark, no people',
         'alt': 'GC-MS 분석을 위해 준비한 침향 시료 바이알',
         'caption': '성분은 향의 인상이 아니라 수치로 견줍니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A1', 'A2', 'A3', 'A5', 'K1'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '해요체 설명 문체를 보도자료 인칭으로 바꾸고, 각 연구의 실험 대상(쥐·세포)을 결과와 같은 문장에 붙여 범위를 고정. '
                 '국내 GC-MS 논문은 검색으로 서지정보 일치를 확인했으나 본문 열람에 실패해, β-selinene 수치를 대라천 자료가 '
                 '인용해 온 값으로 표기하고 그 사실을 확인/미확인 절에 명시. 학명 표기 갈림(약전 아갈로차 · 식품공전 2종)은 원문대로 유지.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
