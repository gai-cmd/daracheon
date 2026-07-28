import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-in-five-incenses-ohyang'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A1 = '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a>'
A2 = '<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">https://doi.org/10.1039/D0NP00042F</a>'

TABLE = (
 '<table><thead><tr><th>향 이름</th><th>얻는 부위</th><th>향의 자리</th><th>첫인상</th></tr></thead><tbody>'
 '<tr><td>정향(丁香)</td><td>꽃봉오리</td><td>탑(첫인상)</td><td>톡 쏘고 화한 강렬함</td></tr>'
 '<tr><td>곽향(藿香)</td><td>잎</td><td>미들(중심)</td><td>상쾌한 풀 내음</td></tr>'
 '<tr><td>유향(乳香)</td><td>나무 수지</td><td>미들(중심)</td><td>맑고 은은함</td></tr>'
 '<tr><td>청목향(靑木香)</td><td>뿌리</td><td>베이스(여운)</td><td>흙 같은 묵직함</td></tr>'
 '<tr><td>침향(沈香)</td><td>침향나무 수지</td><td>베이스(여운)</td><td>가장 깊고 오래가는 그윽함</td></tr>'
 '</tbody></table>'
)

SVG = (
 '<figure><svg viewBox="0 0 640 260" width="100%" role="img" '
 'aria-label="오향 다섯 재료를 얻는 부위와 향의 자리로 나눈 비교 도표">'
 '<rect x="0" y="0" width="640" height="260" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">오향(五香) — 얻는 부위와 향의 자리</text>'
 '<text x="20" y="54" font-size="12" fill="#2b2318">막대 길이는 향이 남는 순서를 나타낸 배치이며, 측정값이 아닙니다.</text>'
 '<rect x="170" y="74" width="120" height="26" fill="#c49a3f"/>'
 '<text x="20" y="92" font-size="13" fill="#2b2318">정향 · 꽃봉오리</text>'
 '<text x="300" y="92" font-size="12" fill="#2b2318">탑</text>'
 '<rect x="170" y="108" width="240" height="26" fill="#c49a3f"/>'
 '<text x="20" y="126" font-size="13" fill="#2b2318">곽향 · 잎</text>'
 '<text x="420" y="126" font-size="12" fill="#2b2318">미들</text>'
 '<rect x="170" y="142" width="240" height="26" fill="#c49a3f"/>'
 '<text x="20" y="160" font-size="13" fill="#2b2318">유향 · 나무 수지</text>'
 '<text x="420" y="160" font-size="12" fill="#2b2318">미들</text>'
 '<rect x="170" y="176" width="380" height="26" fill="#9a6a10"/>'
 '<text x="20" y="194" font-size="13" fill="#2b2318">청목향 · 뿌리</text>'
 '<text x="560" y="194" font-size="12" fill="#2b2318">베이스</text>'
 '<rect x="170" y="210" width="450" height="26" fill="#2b2318"/>'
 '<text x="20" y="228" font-size="13" fill="#2b2318">침향 · 침향나무 수지</text>'
 '<text x="560" y="228" font-size="12" font-weight="700" fill="#fffdf9">베이스</text>'
 '</svg><figcaption>오향의 구성과 향이 남는 자리 — 분류는 본문 표의 세 번째 칸 기준</figcaption></figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 오향(五香)은 정향·유향·곽향·청목향·침향 다섯 재료를 함께 부르는 이름이고, '
  '침향은 그 가운데 가장 오래 남는 자리에 놓입니다. 다섯 가운데 유일하게 나무가 상처를 아물리는 과정을 거쳐야 얻어지는 재료이기도 합니다. '
  '조엘라이프(주)(브랜드 대라천)는 이 글에서 향의 구성과 얻는 부위만 다루며, 향이 사람에게 어떤 작용을 하는지는 다루지 않습니다.</p>')

A('<h2>오향은 무엇을 묶어 부르는 이름일까요?</h2>')
A('<p>오향은 옛 향 문화에서 함께 쓰이던 다섯 가지 향 재료를 한 이름으로 부른 말입니다. 낱개로도 각각 쓰였지만, '
  '다섯을 함께 두는 방식이 따로 이름을 얻을 만큼 자리를 잡았습니다.</p>')
A('<p>정향(丁香)은 못처럼 생긴 꽃봉오리에서 얻습니다. 톡 쏘며 화하게 퍼지는 첫인상이 강한 향입니다. '
  '유향(乳香)은 나무에서 흘러나온 수지를 굳힌 재료로, 맑고 은은한 쪽에 놓입니다.</p>')
A('<p>곽향(藿香)은 잎에서 나며 풀 내음이 살아 있습니다. 청목향(靑木香)은 뿌리에서 얻고 흙 같은 묵직함을 더합니다. '
  '네 재료 모두 식물의 서로 다른 부위에서 나옵니다.</p>')
A('<p>침향(沈香)만 조건이 다릅니다. 꽃이나 잎, 뿌리처럼 자라면 생기는 부위가 아니라, 침향나무가 상처를 입은 뒤 '
  '수지를 오래 쌓아 굳힌 부분에서만 나옵니다.</p>')
A('<p>부위가 다르면 채취 방식도 다릅니다. 꽃봉오리는 피기 전에 따야 하고, 뿌리는 캐야 하며, 수지는 흘러나온 뒤 굳혀야 합니다. '
  '한 조합 안에 서로 다른 채취 방식이 함께 들어 있는 셈입니다.</p>')
A('<p>다섯을 나란히 놓으면 이 차이가 먼저 눈에 들어옵니다. 넷은 채취의 문제이고, 하나는 시간의 문제입니다. '
  '대라천이 이 글에서 침향을 따로 떼어 설명하는 이유가 여기에 있습니다.</p>')

A('<h2>탑·미들·베이스로 보면 어떻게 나뉠까요?</h2>')
A('<p>향수의 층 개념을 빌리면 다섯의 자리가 정리됩니다. 처음 퍼지는 향을 탑, 중간을 채우는 향을 미들, '
  '마지막까지 남는 향을 베이스라고 부릅니다.</p>')
A('<p>정향은 탑에 가깝습니다. 존재감이 가장 먼저 드러나고 가장 먼저 옅어집니다. 곽향과 유향은 그 사이를 채우는 미들입니다. '
  '상쾌함과 맑음이 향의 중심을 잡습니다.</p>')
A('<p>침향은 베이스입니다. 다른 향이 옅어진 뒤에도 공간에 남습니다. 청목향은 그 베이스에 흙 같은 무게를 보탭니다. '
  '두 재료가 마지막 층을 함께 맡는 구조입니다.</p>')
A(SVG)
A('<p>층을 나누는 기준은 향이 얼마나 오래 남는가입니다. 분자가 가벼울수록 먼저 퍼지고 먼저 옅어지며, '
  '무거울수록 늦게까지 자리를 지킵니다. 다섯 재료가 서로 다른 자리를 맡는 구조가 여기서 나옵니다.</p>')
A('<p>순서를 뒤집어 읽으면 조합의 설계가 보입니다. 마지막까지 남을 재료를 먼저 정하고, 그 위에 중간과 첫인상을 얹는 방식입니다. '
  '침향과 청목향이 바닥을 맡은 뒤에야 정향의 강한 첫인상이 부담 없이 놓입니다.</p>')
A('<p>이 층 구분은 향을 이해하기 위해 빌려 온 틀이며, 오향을 쓰던 시대의 분류가 아닙니다. '
  '조향 방식과 느끼는 사람에 따라 달라질 수 있다는 점을 함께 적어 둡니다.</p>')

A('<h2>다섯 재료의 성격을 표로 견주면</h2>')
A('<p>얻는 부위와 향의 자리를 한 표에 놓으면 아래와 같습니다.</p>')
A(TABLE)
A('<p>표의 두 번째 칸을 세로로 읽으면 꽃봉오리, 잎, 나무 수지, 뿌리, 침향나무 수지가 차례로 나옵니다. '
  '식물의 거의 모든 부위가 한 조합 안에 들어와 있는 셈입니다.</p>')
A('<p>세 번째 칸을 읽으면 탑 하나, 미들 둘, 베이스 둘로 나뉩니다. 한쪽에 몰리지 않은 배치이며, '
  '다섯을 함께 쓰는 구성이 오래 유지된 배경으로 읽을 수 있습니다.</p>')
A('<p>부위와 자리 사이에 규칙이 있는 것은 아닙니다. 유향과 침향은 둘 다 수지에서 나오지만 자리가 서로 다르고, '
  '뿌리에서 나온 청목향은 수지인 침향과 같은 자리에 놓입니다.</p>')
A('<p>다만 표의 마지막 칸은 감각의 표현입니다. 대라천은 이 칸을 측정값이 아니라 서술로 두었고, '
  '사람에 따라 다르게 느껴질 수 있다는 점을 밝혀 둡니다.</p>')

A('<h2>침향은 왜 만들어지기 어려울까요?</h2>')
A('<p>침향은 침향나무가 상처를 입은 뒤 스스로를 지키는 과정에서 만들어집니다. 상처 부위에 수지가 쌓이고, '
  '그 수지가 목질 조직에 배어 굳어야 비로소 침향이라 부를 수 있는 부분이 됩니다.</p>')
A('<p>Li 연구팀은 2021년 <em>Natural Product Reports</em> 38권 528~565쪽에 침향과 아퀼라리아 식물의 천연물 화학과 '
  '생합성을 정리한 총설을 실었습니다(' + A2 + '). 수지가 만들어지는 경로를 다룬 연구입니다.</p>')
A('<p>Wang 연구팀은 2018년 <em>Molecules</em> 23권 342에 성분과 약리 활성을 정리한 총설을 실었습니다(' + A1 + '). '
  '대라천은 두 연구를 형성 과정과 성분 계열의 서술 근거로만 인용하며, 제품의 효능과 연결하지 않습니다.</p>')
A('<p>대라천 자료는 좋은 침향 하나가 여물기까지 최소 26년 이상이 걸린다고 밝힙니다. 꽃봉오리를 따거나 뿌리를 캐는 일과 '
  '견줄 수 없는 시간이며, 다섯 재료 가운데 침향만 이 조건을 요구합니다.</p>')
A('<p>식품공전은 침향의 기원 식물로 두 종을 등재하고 있고, 그중 하나가 Aquilaria agallocha Roxburgh입니다. '
  '이 학명은 오늘날 정명인 A. malaccensis의 이명으로 정리돼 있습니다. 대라천은 그 가운데 아갈로차 원료만을 '
  '100% 베트남산으로 사용합니다.</p>')
A('{{IMG:five-incense-materials}}')

A('<h2>다섯을 굳이 함께 쓴 이유는 무엇일까요?</h2>')
A('<p>한 가지 향만 강하게 나면 층이 단조로워집니다. 첫인상이 강한 재료만 쓰면 금세 옅어지고, '
  '무거운 재료만 쓰면 처음부터 끝까지 같은 인상이 이어집니다.</p>')
A('<p>다섯을 함께 두면 시간에 따라 앞에 나서는 재료가 바뀝니다. 정향의 화한 향이 먼저 스치고, '
  '곽향과 유향이 중간을 채우며, 침향이 마지막까지 남습니다.</p>')
A('<p>같은 조합을 한 번 피우는 동안에도 인상이 여러 번 바뀌는 구조입니다. 옛 향 문화가 다섯을 묶어 이름까지 붙인 배경으로 '
  '이 변화를 읽을 수 있습니다.</p>')
A('<p>조합의 순서가 정해져 있었는지는 이 글이 답하지 않습니다. 다섯을 함께 쓴 기록은 남아 있지만, '
  '비율이나 피우는 차례를 못 박은 기준은 대라천이 확인하지 못했습니다.</p>')
A('<p>다만 이 설명은 향의 층 구조에 대한 서술입니다. 대라천은 이 조합이 사람에게 어떤 변화를 준다는 서술을 '
  '이 글에 넣지 않았습니다. 확인되지 않은 내용이기 때문입니다.</p>')
A('<p>오향을 다룬 옛 기록은 조합의 구성과 쓰임을 남겼고, 그 조합이 무엇을 했는지는 남기지 않았습니다. '
  '이 글이 다루는 범위도 앞의 것까지입니다. 뒤의 것은 기록이 아니라 검증의 영역에 속합니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 오향의 구성 다섯 가지와 각 재료를 얻는 부위를 확인했습니다. 침향의 학명 표기와 식품공전 등재 사항, '
  '그리고 100% 베트남산 원료 사용은 자체 서류로 보유하고 있으며 요청하시면 확인해 드립니다.</p>')
A('<p>확인하지 않은 것을 분명히 적어 둡니다. 오향 조합의 항균이나 살충 활성에 관해서는, 서지정보를 특정할 수 있는 '
  '1차 출처를 대라천이 확인하지 못했습니다. 그래서 이 글에서는 관련 수치와 주장을 싣지 않았습니다.</p>')
A('<p>이전 자료에 유제놀 함량이나 살충 실험 결과가 인용된 적이 있으나, 저자와 연도, 저널을 특정할 수 없는 형태였습니다. '
  '대라천은 출처를 특정할 수 없는 수치를 본문에 두지 않는다는 기준을 이 글에 적용했습니다.</p>')
A('<p>최소 26년이라는 기간도 대라천 자료에 적힌 값이며, 모든 침향에 일반화되는 수치가 아닙니다. '
  '나무가 자란 환경과 상처의 조건에 따라 달라질 수 있는 항목입니다.</p>')
A('<p>인용한 두 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다. '
  '탑·미들·베이스 구분 역시 이해를 돕기 위한 틀이고, 옛 문헌의 분류가 아닙니다.</p>')
A('{{IMG:agarwood-base-note}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 오향은 지금도 그 이름으로 쓰나요?</h3>')
A('<p>A. 오향이라는 이름 그대로 쓰는 경우는 드뭅니다. 다만 정향과 유향 같은 재료는 오늘날에도 향 제품에 널리 쓰이고, '
  '침향도 선향이나 원목 스틱 형태로 이어지고 있습니다.</p>')
A('<h3>Q. 다섯 가운데 침향이 특별한 이유는 무엇인가요?</h3>')
A('<p>A. 나머지 넷은 꽃봉오리·잎·수지·뿌리에서 채취하지만, 침향은 나무가 상처를 아물리는 과정을 거쳐야 얻어집니다. '
  '대라천 자료 기준으로 좋은 침향은 최소 26년 이상이 걸립니다.</p>')
A('<h3>Q. 탑·미들·베이스는 옛 분류인가요?</h3>')
A('<p>A. 아닙니다. 향수의 층 개념을 빌려 온 설명 틀이며, 오향을 쓰던 시대의 분류가 아닙니다. '
  '느끼는 방식은 사람마다 다를 수 있습니다.</p>')
A('<h3>Q. 오향의 항균 효과에 관한 수치는 왜 없나요?</h3>')
A('<p>A. 서지정보를 특정할 수 있는 1차 출처를 확인하지 못해 싣지 않았습니다. 대라천은 출처를 확인할 수 없는 수치를 '
  '본문에 두지 않습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 서술은 대라천 공식 자료(zoellife.com)와 아래 출처에 근거합니다. '
  '소개한 연구 내용은 해당 연구팀의 결과이며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", '
  '<em>Molecules</em> 23권 342 (2018) — ' + A1 + '</li>'
  '<li>Li W, Chen HQ, Wang H 외, "Natural products in agarwood and Aquilaria plants: chemistry, biological activities and '
  'biosynthesis", <em>Natural Product Reports</em> 38권 528~565쪽 (2021) — ' + A2 + '</li>'
  '<li><a href="/about-agarwood">침향의 학명·산지 기준 — about-agarwood</a></li>'
  '<li><a href="/products">침향 선향·원목 스틱 라인업</a></li>'
  '<li><a href="/blog/how-to-describe-agarwood-scent">침향 향을 말로 표현하기 — how-to-describe-agarwood-scent</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '오향(五香) 다섯 재료와 침향의 자리, 부위부터 견주다',
    'excerpt': '오향은 정향·유향·곽향·청목향·침향을 묶어 부르는 이름입니다. 대라천이 다섯 재료를 얻는 부위와 향이 남는 자리를 '
               '표로 견주고, 다섯 가운데 침향만 상처와 시간을 거쳐야 얻어지는 이유를 연구 근거와 함께 정리했습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'five-incense-materials',
         'prompt': 'Photorealistic overhead still life of five small piles of natural aromatic raw materials arranged in a row on a pale linen cloth: dried clove buds, pale resin tears, dried green leaves, a dark root piece, and a dark resinous wood chip, soft diffused daylight, shallow depth of field, muted ivory and umber palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '오향을 이루는 다섯 향 재료를 나란히 놓은 모습',
         'caption': '다섯 재료는 꽃봉오리·잎·수지·뿌리로 얻는 부위가 서로 다릅니다.'},
        {'key': 'agarwood-base-note',
         'prompt': 'Photorealistic macro close-up of a single dark resin-saturated agarwood chip resting alone on a dark slate surface, deep brown and black resin veins visible, single soft directional light from the side, deep shadows, muted charcoal and umber palette, editorial still life photography, no text, no logo, no watermark, no people',
         'alt': '오향에서 가장 오래 남는 자리를 맡는 침향 조각',
         'caption': '침향만 상처와 시간을 거쳐야 얻어집니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A1', 'A2'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '서지정보를 특정할 수 없는 학술 인용(오향 항진균·살충 활성, 흰개미 48시간 살충률, 유제놀 함량)을 규격서 §0에 따라 '
                 '본문에서 제거하고, 제거 사실과 이유를 확인/미확인 절과 FAQ에 명시. 대신 A1·A2를 수지 형성 서술 근거로 인용. '
                 '학명은 원문 표기(Aquilaria agallocha Roxburgh)를 대소문자까지 그대로 유지.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
