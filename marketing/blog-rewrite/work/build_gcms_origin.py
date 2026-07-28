import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'origin-changes-agarwood-compounds-gcms'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A7 = '<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a>'
A4 = '<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a>'
KS = '<a href="https://koreascience.kr/article/JAKO201122238508185.pdf" target="_blank" rel="noopener">GC-MS를 이용한 침향류의 성분 비교 연구</a>'

SVG = (
 '<figure><svg viewBox="0 0 640 230" width="100%" role="img" '
 'aria-label="국내 GC-MS 연구가 보고한 베트남산 침향 두 시료의 베타셀리넨 함량 막대그래프">'
 '<rect x="0" y="0" width="640" height="230" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">베트남산 β-selinene 함량 (단위: %)</text>'
 '<line x1="150" y1="56" x2="150" y2="160" stroke="#2b2318" stroke-width="1"/>'
 '<rect x="150" y="66" width="386" height="34" fill="#9a6a10"/>'
 '<text x="20" y="89" font-size="14" fill="#2b2318">베트남 시료 A</text>'
 '<text x="546" y="89" font-size="14" font-weight="700" fill="#9a6a10">6.861</text>'
 '<rect x="150" y="112" width="422" height="34" fill="#9a6a10"/>'
 '<text x="20" y="135" font-size="14" fill="#2b2318">베트남 시료 B</text>'
 '<text x="582" y="135" font-size="14" font-weight="700" fill="#9a6a10">7.497</text>'
 '<text x="150" y="178" font-size="12" fill="#2b2318">0</text>'
 '<text x="600" y="178" font-size="12" fill="#2b2318">8</text>'
 '<text x="20" y="202" font-size="12" fill="#2b2318">네 시료 모두에서 β-selinene이 검출됐고, 값은 시료마다 달랐습니다.</text>'
 '<text x="20" y="222" font-size="12" fill="#2b2318">출처: 신광호 외, 대한본초학회지 26권 7~12쪽 (2011) — 대라천 자료가 인용한 값</text>'
 '</svg><figcaption>한 연구가 보고한 베트남산 두 시료의 β-selinene 함량 — 품질 등급이 아닙니다</figcaption></figure>'
)

TABLE = (
 '<table><thead><tr><th>농장</th><th>환경</th><th>규모·특징</th></tr></thead><tbody>'
 '<tr><td>하띤(Ha Tinh)</td><td>전통 산지</td><td>자연발생 침향 가능성, 5년차 나무에 개미집</td></tr>'
 '<tr><td>람동(Lam Dong)</td><td>서늘한 고지대</td><td>약 158헥타르, R&amp;D·오일 추출·묘목 육성</td></tr>'
 '<tr><td>푸꾸옥(Phu Quoc)</td><td>섬</td><td>130년생과 50년생 고수령목, 관광·체험</td></tr>'
 '<tr><td>냐짱(Nha Trang)</td><td>해안</td><td>오랜 관리로 굵게 자란 침향나무</td></tr>'
 '<tr><td>동나이(Dong Nai)</td><td>현무암 토양</td><td>미네랄·배수·통기 우수, 직영 공장 전통 증기증류</td></tr>'
 '</tbody></table>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 국내 GC-MS 연구는 베트남·인도네시아·미얀마 시료 네 점 모두에서 β-selinene을 '
  '검출했고, 베트남 시료의 값은 6.861%와 7.497%로 서로 달랐습니다. 같은 성분이 어디서나 나오되 양은 시료마다 갈린다는 뜻입니다. '
  '조엘라이프(주)(브랜드 대라천)는 이 수치를 성분 구성의 차이로만 읽으며, 품질의 우열이나 건강상의 효과로 옮기지 않습니다.</p>')

A('<h2>GC-MS는 무엇을 어떻게 재나요?</h2>')
A('<p>GC-MS는 기체크로마토그래피와 질량분석기를 이어 붙인 장비입니다. 앞쪽에서 섞여 있는 성분을 하나씩 시간차로 흘려보내 '
  '갈라내고, 뒤쪽에서 각 성분의 질량을 재어 정체를 판정합니다.</p>')
A('<p>질량 패턴은 성분마다 다릅니다. 그래서 어떤 물질이 들어 있는지를 이름으로 특정하고, 전체 가운데 몇 퍼센트인지를 '
  '수치로 적을 수 있습니다.</p>')
A('<p>이 방식의 장점은 분명합니다. 향이 깊다거나 묵직하다는 인상 대신, 같은 기준으로 잰 숫자를 놓고 견줄 수 있습니다. '
  '말로 표현한 인상은 사람마다 갈리지만, 퍼센트는 같은 자리에서 비교됩니다.</p>')
A('<p>한계도 함께 있습니다. GC-MS가 답하는 것은 무엇이 얼마나 들어 있는가입니다. 그 성분이 사람에게 무엇을 하는가는 '
  '다른 방법으로 확인해야 할 질문입니다.</p>')
A('<p>측정 결과에는 조건이 따라붙습니다. 어떤 시료를 어떻게 준비했는지, 어느 부위를 썼는지에 따라 값이 달라질 수 있습니다. '
  '그래서 같은 성분을 다룬 연구들끼리도 수치가 바로 견줘지지 않는 경우가 있습니다.</p>')
A('<p>대라천은 이 구분을 이 글 전체에서 유지합니다. 숫자가 나온다고 해서 효과가 확인된 것은 아닙니다.</p>')

A('<h2>산지가 성분을 바꾼다는 근거는 무엇일까요?</h2>')
A('<p>국내 연구로 신광호 외의 ' + KS + '가 있습니다. 대한본초학회지 26권 7~12쪽(2011)에 실렸고, '
  '베트남 2종과 인도네시아, 미얀마 시료를 GC-MS로 견줬습니다.</p>')
A('<p>네 시료 모두에서 β-selinene이 검출됐습니다. β-selinene은 세스퀴테르펜 계열의 향 성분입니다. '
  '검출 여부는 공통이었지만 양은 시료마다 달랐습니다.</p>')
A(SVG)
A('<p>대라천 자료가 인용해 온 값은 베트남 시료에서 6.861%와 7.497%입니다. 같은 베트남 시료 사이에서도 차이가 나타났다는 점이 '
  '이 결과에서 가장 눈여겨볼 대목입니다.</p>')
A('<p>같은 나라 안에서도 값이 갈린다면, 산지 이름 하나로 성분을 예측할 수 없다는 뜻이 됩니다. '
  '이 연구가 보여 주는 것은 산지가 성분에 영향을 준다는 방향까지입니다.</p>')
A('<p>이후 다른 연구에서는 베트남 시료에서 β-selinene이 검출되지 않은 사례도 있습니다. 한 연구의 시료에서 나온 값이라는 '
  '조건을 함께 읽어야 하는 이유입니다.</p>')

A('<h2>이 숫자를 오해하지 않으려면</h2>')
A('<p>6.861%나 7.497%는 그 시료에 해당 성분이 그만큼 들어 있었다는 사실입니다. 그 이상도 이하도 아닙니다.</p>')
A('<p>수치가 크다고 몸에 더 좋다는 뜻이 아니며, 질병을 낫게 한다는 뜻은 더더욱 아닙니다. '
  '성분 함량과 건강상의 효과는 서로 다른 층위의 문제입니다.</p>')
A('<p>효과를 말하려면 사람을 대상으로 한 임상시험과 안전성 연구가 필요합니다. GC-MS 데이터는 그 자리를 대신하지 못합니다. '
  '성분이 있다는 사실과 그 성분이 무엇을 한다는 주장 사이에는 별도의 검증 단계가 놓여 있습니다.</p>')
A('<p>품질의 우열도 이 수치로 정할 수 없습니다. 어떤 성분이 많을수록 좋은 침향이라는 기준 자체가 '
  '연구로 확립돼 있지 않기 때문입니다.</p>')
A('<p>수치를 근거로 산지를 판정하는 일도 이 연구가 뒷받침하지 않습니다. 같은 성분이 세 산지 시료 모두에서 나왔기 때문에, '
  '검출 여부만으로는 산지를 가릴 수 없습니다.</p>')
A('<p>대라천 침향 제품은 일반식품이며 질병의 예방이나 치료를 위한 의약품이 아닙니다. 이 글의 수치는 '
  '성분 구성을 설명하는 자료일 뿐이며, 그 범위를 넘어서면 근거 없는 문장이 됩니다.</p>')
A('{{IMG:gcms-vials}}')

A('<h2>환경이 다르면 무엇이 달라질까요?</h2>')
A('<p>식물은 자라는 환경에 따라 만들어 내는 물질의 비율이 달라질 수 있습니다. 토양과 기후, 고도가 그 조건에 듭니다.</p>')
A('<p>Wang 연구팀은 2021년 <em>Molecules</em> 26권 7708에 아퀼라리아 속의 분포와 성분, 등급 체계, 수지 유도법을 정리한 '
  '총설을 실었습니다(' + A7 + '). 종의 분포와 유도 방식이 성분과 이어지는 지점을 다룬 문헌입니다.</p>')
A('<p>대라천은 베트남 다섯 지역에 직영 농장을 두고 있습니다. 농장마다 환경이 다릅니다.</p>')
A(TABLE)
A('<p>대라천은 베트남 5개 지역 약 200헥타르(약 60만 평)에 400만 그루를 기른다고 밝힙니다. 환경이 성분에 미치는 영향을 '
  '실제로 견줘 볼 수 있는 규모입니다.</p>')
A('<p>다만 대라천은 농장별 성분 데이터를 이 글에 싣지 않았습니다. 농장 사이의 차이를 GC-MS로 견준 결과를 '
  '아직 공개하지 않았기 때문입니다.</p>')

A('<h2>재배와 수지 유도는 성분에 어떻게 닿을까요?</h2>')
A('<p>대라천은 20~30년에 걸친 유기농법으로 침향나무를 기른다고 밝힙니다. 20년 이상 자란 나무에 2~10년간 '
  '열대과일(노니) 발효액으로 수지를 유도하는 특허 기술도 함께 씁니다.</p>')
A('<p>벌목한 뒤에는 사람 손으로 하나하나 채취합니다. 수지가 밴 부분과 그렇지 않은 부분을 갈라내는 작업이라 '
  '기계로 대체하기 어려운 공정입니다.</p>')
A('<p>브랜드가 쓰는 219,000시간이라는 표현은 25년을 시간 단위로 바꾼 값입니다. 기다림의 길이를 수치로 옮긴 문구입니다.</p>')
A('<p>추출 공정도 성분 조성에 영향을 줍니다. Wang 연구팀은 2025년 <em>Journal of Essential Oil Research</em> 37권 '
  '110~144쪽에 추출법이 수율과 화학 조성, 생물 활성에 미치는 영향을 정리한 총설을 실었습니다(' + A4 + ').</p>')
A('<p>대라천은 이 연구들을 공정 설명의 근거로만 인용합니다. 재배 기간이나 유도 방식이 특정 성분 값을 만든다는 주장은 '
  '이 글에 담겨 있지 않습니다.</p>')

A('<h2>옛 문헌도 산지를 적었습니다</h2>')
A('<p>산지를 따지는 일은 성분 분석이 등장하기 훨씬 전부터 있었습니다. 남방초목상(304년)은 침향의 산지를 교지(交趾)로 적었습니다.</p>')
A('<p>여러 중국과 조선의 문헌은 임읍·교주·점성·안남·월남을 침향의 산지로 꼽았습니다. 이 지명들은 오늘날의 베트남 지역에 해당합니다.</p>')
A('<p>옛 문헌이 산지를 적은 기준은 향과 쓰임에 대한 경험이었고, 오늘의 GC-MS는 성분의 비율을 봅니다. '
  '두 방식은 같은 대상을 서로 다른 방법으로 다룹니다.</p>')
A('<p>대라천은 이 둘을 나란히 두되, 옛 기록이 오늘의 수치를 뒷받침한다거나 그 반대라는 식으로 잇지 않습니다. '
  '검증의 방식이 다른 자료를 하나의 근거로 합칠 수 없기 때문입니다.</p>')
A('<p>옛 기록이 남긴 것은 어디에서 온 침향이 좋게 다뤄졌는가입니다. 그 판단의 근거가 무엇이었는지까지는 '
  '문헌이 자세히 남기지 않았습니다.</p>')
A('<p>대라천이 100% 베트남산 원목만 쓰고 아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh) 품종만 사용하는 기준은 '
  '회사가 밝히는 소싱 원칙이며, 성분 수치로 도출한 결론이 아닙니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 인용한 국내 GC-MS 연구의 저자와 저널, 권과 쪽수, 연도가 일치하는지 공개 데이터베이스에서 대조했습니다. '
  '농장 규모와 품종, 산지는 자체 서류로 보유하고 있으며 요청하시면 확인해 드립니다.</p>')
A('<p>확인하지 못한 것도 적어 둡니다. 해당 연구의 본문 전문은 작성 시점에 열람에 실패했습니다. '
  '그래서 β-selinene 수치는 대라천 자료가 인용해 온 값이라는 사실을 함께 밝혀 두었습니다.</p>')
A('<p>이전 자료에는 특정 국가 침향의 품질을 낮게 평가하는 서술과, 다른 나라의 수출 허가 관행에 관한 설명이 있었습니다. '
  '어느 문헌과 어느 공식 문서에 근거하는지 특정할 수 없어 이번 글에서는 싣지 않았습니다.</p>')
A('<p>농장별 성분 차이, 재배 기간과 성분 값의 관계, 그리고 β-selinene 함량과 품질의 관계 역시 대라천이 확인한 바가 없습니다.</p>')
A('<p>표에 적은 농장별 환경 서술도 대라천 자료의 소개 문구이며, 측정으로 견준 값이 아닙니다. '
  '토양이나 고도가 성분에 미친 영향을 수치로 확인한 자료는 이 글에 없습니다.</p>')
A('<p>인용한 연구는 대라천이 수행한 것이 아니라 각 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>')
A('{{IMG:basalt-soil-farm}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. β-selinene은 무엇인가요?</h3>')
A('<p>A. 세스퀴테르펜 계열의 향 성분입니다. 국내 GC-MS 연구에서 베트남·인도네시아·미얀마 세 산지의 네 시료 모두에서 '
  '검출됐다고 보고된 성분입니다.</p>')
A('<h3>Q. 함량이 높으면 더 좋은 침향인가요?</h3>')
A('<p>A. 단정할 수 없습니다. 어떤 성분이 많을수록 좋다는 기준 자체가 연구로 확립돼 있지 않습니다.</p>')
A('<h3>Q. 6.861%와 7.497%는 대라천 제품의 수치인가요?</h3>')
A('<p>A. 아닙니다. 국내 GC-MS 연구가 베트남산 침향 시료에서 보고한 값이며, 대라천 제품을 분석한 결과가 아닙니다.</p>')
A('<h3>Q. 산지만 알면 성분을 예측할 수 있나요?</h3>')
A('<p>A. 없습니다. 같은 베트남 시료 사이에서도 값이 갈렸고, 이후 연구에서는 검출되지 않은 사례도 있습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 성분 서술은 대라천 공식 자료(zoellife.com)와 아래 출처에 근거합니다. '
  '각 연구가 보고한 범위를 본문에 밝혔으며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li>신광호 외, ' + KS + ', 대한본초학회지 26권 7~12쪽 (2011)</li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile '
  'Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — '
  + A7 + '</li>'
  '<li>Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of '
  'extraction methods on yield, chemical composition, and biological activities", <em>Journal of Essential Oil Research</em> '
  '37권 110~144쪽 (2025) — ' + A4 + '</li>'
  '<li><a href="/about-agarwood">침향 성분·연구 자료 — about-agarwood</a></li>'
  '<li><a href="/blog/agarwood-active-compounds-explained">세스퀴테르펜과 크로몬 — agarwood-active-compounds-explained</a></li>'
  '<li><a href="/blog/vietnam-5-farms-200ha-4million-trees">베트남 5개 농장 — vietnam-5-farms-200ha-4million-trees</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '산지가 성분을 바꿀까, GC-MS가 보고한 β-selinene 수치',
    'excerpt': '국내 GC-MS 연구는 베트남·인도네시아·미얀마 시료 네 점 모두에서 β-selinene을 검출했고 베트남 시료 값은 '
               '6.861%와 7.497%로 서로 달랐습니다. 대라천이 이 수치가 무엇을 말하고 무엇을 말하지 못하는지 함께 정리했습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'gcms-vials',
         'prompt': 'Photorealistic still life of several small clear laboratory vials holding dark wood fragments arranged in a row on a clean grey lab bench, soft even lighting, shallow depth of field, muted steel and charcoal palette, editorial science photography, no text, no logo, no watermark, no people',
         'alt': 'GC-MS 분석을 앞둔 산지별 침향 시료',
         'caption': '같은 기준으로 재야 시료 사이를 견줄 수 있습니다.'},
        {'key': 'basalt-soil-farm',
         'prompt': 'Photorealistic landscape of a tropical tree plantation growing in reddish-brown volcanic soil, rows of slender trees receding into morning haze, no people, no buildings, no signage, soft diffused daylight, muted red-brown and green palette, editorial agricultural photography, no text, no logo, no watermark',
         'alt': '현무암 토양에서 자라는 침향나무 농장',
         'caption': '토양과 기후는 나무가 만드는 성분의 비율에 닿는 조건입니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A4', 'A7'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '출처를 특정할 수 없는 두 서술(특정 국가 침향 폄하, 타국 CITES 허가 관행)을 규격서 §0에 따라 제외하고 그 사실을 '
                 '확인/미확인 절에 명시. GC-MS 논문은 검색으로 서지정보 일치를 확인했으나 본문 열람에 실패해 수치의 출처 성격을 명시. '
                 '같은 베트남 시료 사이에서도 값이 갈린다는 점을 새 논점으로 세워 산지 이름만으로 성분을 예측할 수 없음을 밝힘.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
