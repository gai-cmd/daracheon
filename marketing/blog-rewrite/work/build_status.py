import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'status-good-agarwood-psychology'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A1 = '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a>'
K1 = '<a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">침향(沈香) 항목</a>'

TABLE1 = (
 '<table><thead><tr><th>기록</th><th>침향이 놓인 자리</th><th>드러나는 층위</th></tr></thead><tbody>'
 '<tr><td>성경 시편</td><td>왕의 옷에서 나는 향</td><td>개인의 격</td></tr>'
 '<tr><td>여러 향품 목록</td><td>귀한 향의 하나로 열거</td><td>재화의 등급</td></tr>'
 '<tr><td>원사(元史)</td><td>안남의 침향 조공 기록</td><td>나라 사이의 관계</td></tr>'
 '</tbody></table>'
)

TABLE2 = (
 '<table><thead><tr><th>구분</th><th>옛 기록의 소비</th><th>오늘의 소비</th></tr></thead><tbody>'
 '<tr><td>쓰는 주체</td><td>왕실과 귀족</td><td>구매할 수 있는 누구나</td></tr>'
 '<tr><td>드러내는 것</td><td>신분과 격</td><td>취향과 선택</td></tr>'
 '<tr><td>귀한 이유</td><td>희소성과 오랜 시간</td><td>희소성과 오랜 시간</td></tr>'
 '<tr><td>진위 확인</td><td>확인할 방법이 마땅치 않음</td><td>학명·산지·서류로 확인</td></tr>'
 '</tbody></table>'
)

SVG = (
 '<figure><svg viewBox="0 0 640 240" width="100%" role="img" '
 'aria-label="대라천이 밝힌 농장 규모와 침향이 여무는 기간을 정리한 도표">'
 '<rect x="0" y="0" width="640" height="240" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">돈으로 앞당길 수 없는 항목</text>'
 '<text x="20" y="56" font-size="12" fill="#2b2318">아래 값은 대라천이 밝힌 수치입니다.</text>'
 '<rect x="20" y="76" width="190" height="128" fill="none" stroke="#9a6a10" stroke-width="1"/>'
 '<text x="36" y="118" font-size="28" font-weight="700" fill="#9a6a10">26년</text>'
 '<text x="36" y="150" font-size="12" fill="#2b2318">좋은 침향이 여물기까지</text>'
 '<text x="36" y="172" font-size="12" fill="#2b2318">걸리는 최소 기간</text>'
 '<rect x="226" y="76" width="190" height="128" fill="none" stroke="#9a6a10" stroke-width="1"/>'
 '<text x="242" y="118" font-size="28" font-weight="700" fill="#9a6a10">200ha</text>'
 '<text x="242" y="150" font-size="12" fill="#2b2318">베트남 5개 지역</text>'
 '<text x="242" y="172" font-size="12" fill="#2b2318">직영 농장 규모</text>'
 '<rect x="432" y="76" width="188" height="128" fill="none" stroke="#2b2318" stroke-width="1"/>'
 '<text x="448" y="118" font-size="28" font-weight="700" fill="#2b2318">400만</text>'
 '<text x="448" y="150" font-size="12" fill="#2b2318">기르고 있는</text>'
 '<text x="448" y="172" font-size="12" fill="#2b2318">침향나무 그루 수</text>'
 '</svg><figcaption>대라천이 밝힌 기간과 규모 — 품질 등급을 나타내는 값이 아닙니다</figcaption></figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 침향이 왕실과 귀족의 향으로 남은 이유는 신분 제도 때문만이 아닙니다. '
  '돈으로 시간을 앞당길 수 없는 재료였기 때문입니다. 조엘라이프(주)(브랜드 대라천)는 이 글에서 기록에 남은 자리와 '
  '그 자리가 생긴 조건을 정리하며, 소비를 권하는 문장은 넣지 않았습니다.</p>')

A('<h2>왜 향에 그만한 값이 매겨졌을까요?</h2>')
A('<p>지위를 드러내는 물건에는 공통점이 있습니다. 구하기 어렵고, 가진 사람이 적다는 조건입니다. '
  '비단과 옥, 금 그릇이 그 자리를 맡았습니다.</p>')
A('<p>침향은 여기에 조건이 하나 더 붙습니다. 침향나무가 상처를 아물리는 동안 수지를 오래 쌓아 굳혀야 '
  '얻어지는 재료라, 만드는 속도를 사람이 조절할 수 없습니다.</p>')
A('<p>Wang 연구팀은 2018년 <em>Molecules</em> 23권 342에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 정리한 '
  '총설을 실었습니다(' + A1 + '). 침향이 상처 반응의 산물이라는 점을 다룬 문헌입니다.</p>')
A('<p>대라천 자료는 좋은 침향 하나가 여물기까지 최소 26년 이상이 걸린다고 밝힙니다. 값을 더 치른다고 '
  '이 기간이 줄어들지는 않습니다.</p>')
A('<p>이 조건이 값의 성격을 정합니다. 만들 수 있는 물건의 값은 생산량으로 조절되지만, 기다려야 하는 물건의 값은 '
  '그렇지 않습니다.</p>')
A('<p>그래서 침향은 재화로서 특이한 자리에 놓였습니다. 부유함만으로는 확보할 수 없는 대상이었기 때문입니다.</p>')

A('<h2>기록은 침향을 어느 자리에 놓았을까요?</h2>')
A('<p>기록에 남은 자리는 개인의 격에서 나라 사이의 관계까지 걸쳐 있습니다.</p>')
A(TABLE1)
A('<p>성경 시편은 왕의 모든 옷에 몰약과 침향과 육계의 향기가 있다고 적었습니다. 왕이라는 자리와 향이 '
  '한 문장에 묶인 대목입니다. 향이 사람의 자리를 설명하는 방식으로 쓰였습니다.</p>')
A('<p>다만 성경 원문의 낱말을 오늘날의 침향으로 읽는 것은 오래된 전통적 해석입니다. 백단향 등 다른 향목으로 보는 '
  '견해도 함께 있어, 대라천은 어느 한쪽을 정답으로 적지 않습니다.</p>')
A('<p>원사(元史)에는 안남, 곧 오늘날의 베트남 지역이 침향을 조공했다는 기록이 있습니다. 조공은 나라 사이에 '
  '귀한 물건을 바치는 절차입니다.</p>')
A('<p>조공 목록에 올랐다는 사실은 국가가 관리하는 자원이었다는 뜻이기도 합니다. 개인의 취향을 넘어선 층위입니다. 한 사람의 소비가 아니라 나라의 목록에 오른 물건이었습니다.</p>')
A('<p>한국민족문화대백과사전도 ' + K1 + '을 따로 두고 이 재료의 유래와 쓰임을 서술합니다. 국내 자료에서 확인할 수 있는 출발점입니다.</p>')

A('<h2>보이지 않는 것이 왜 과시가 되었을까요?</h2>')
A('<p>금과 보석은 눈에 보입니다. 값을 아는 사람이면 누구나 알아봅니다. 향은 그렇지 않습니다. 형태도 무게도 눈에 잡히지 않습니다.</p>')
A('<p>향이 지위의 표시로 쓰였다는 사실은 이 점에서 흥미롭습니다. 보이지 않는 것이 어떻게 신호가 될 수 있었을까요. 답은 그 신호가 닿는 범위에 있습니다.</p>')
A('<p>조건은 거리입니다. 향은 가까이 다가온 사람에게만 닿습니다. 멀리서 보는 사람에게는 닿지 않습니다. 신호가 도달하는 범위 자체가 좁습니다.</p>')
A('<p>그래서 향은 대상을 가리는 신호가 됩니다. 아무에게나 보이는 표시가 아니라 안으로 들어온 사람만 아는 표시입니다. 범위가 좁다는 점이 오히려 신호의 값을 올립니다.</p>')
A('<p>격식과 친밀함이 한자리에 놓인다는 점도 여기서 나옵니다. 예를 갖춘 자리이면서 동시에 가까운 자리라야 '
  '향이 전달되기 때문입니다. 두 성격이 한 재료에 겹쳐 있는 셈입니다.</p>')
A('<p>대라천은 이 해석을 소비 행동에 대한 하나의 설명으로 적습니다. 옛 기록이 그 이유를 밝혀 둔 것은 아닙니다. 기록은 쓰임만 남기고 이유는 남기지 않았습니다.</p>')
A('{{IMG:royal-robe}}')

A('<h2>옛 소비와 오늘의 소비는 무엇이 다를까요?</h2>')
A('<p>두 시대의 소비를 나란히 놓으면 겹치는 칸과 갈리는 칸이 함께 보입니다.</p>')
A(TABLE2)
A('<p>겹치는 칸은 세 번째 줄입니다. 귀한 이유가 희소성과 오랜 시간이라는 점은 그대로입니다. '
  '재료의 조건은 시대가 바뀌어도 달라지지 않습니다. 나무가 수지를 쌓는 속도는 제도와 무관합니다.</p>')
A('<p>갈리는 칸은 첫 번째와 두 번째 줄입니다. 쓰는 주체가 신분으로 정해지지 않고, 드러내는 것도 '
  '신분에서 선택으로 옮겨 갔습니다. 같은 재료가 다른 의미를 싣게 된 대목입니다.</p>')
A('<p>대라천은 이 변화를 접근성의 문제로만 적습니다. 오늘의 소비가 옛 소비보다 낫다거나 못하다는 판단은 '
  '이 글에 담겨 있지 않습니다. 소비의 동기를 평가하는 일은 이 글의 범위 밖입니다.</p>')
A('<p>네 번째 줄은 다음 절에서 따로 다룹니다. 실질적으로 가장 크게 달라진 대목이기 때문입니다. 나머지 세 줄과 성격이 다릅니다.</p>')

A('<h2>무엇이 실제로 달라졌을까요?</h2>')
A('<p>가장 크게 달라진 것은 확인 방법입니다. 옛날에는 눈앞의 향이 진짜인지 가릴 방법이 마땅치 않았습니다. 향의 인상과 파는 사람의 말이 전부였습니다.</p>')
A('<p>지금은 학명과 산지, 검사 서류로 확인할 수 있습니다. 문서로 남는 정보라 사람이 달라져도 같은 값이 나옵니다. 인상이나 평판과는 성격이 다른 근거입니다.</p>')
A('<p>대라천은 식약처 식품공전에 등재된 침향 품종인 Aquilaria Agallocha Roxburgh 원료를 100% 베트남산으로 사용합니다. '
  '나무마다 고유번호를 붙여 자란 이력을 관리합니다. 어느 나무에서 온 원료인지 되짚을 수 있다는 뜻입니다.</p>')
A(SVG)
A('<p>대라천은 베트남 5개 지역에 약 200헥타르 규모의 직영 농장을 운영하며 약 400만 그루를 기른다고 밝힙니다. '
  '규모를 밝히는 이유는 이력을 관리하는 범위를 드러내기 위해서입니다.</p>')
A('<p>다만 규모와 기간은 품질의 등급을 나타내는 값이 아닙니다. 무엇을 얼마나 오래 관리하는지를 보여 주는 숫자입니다. 규모가 크다는 사실이 품질을 증명하지는 않습니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 학명과 산지, 농장 규모와 그루 수, 그리고 개별 고유번호 관리 체계를 자체 서류로 보유하고 있습니다. '
  '요청하시면 확인해 드립니다. 모두 문서로 대조할 수 있는 항목입니다.</p>')
A('<p>확인하지 않은 것도 적어 둡니다. 성경 번역어가 오늘날의 침향과 같은 향목인지 대라천은 확정하지 않았습니다. '
  '두 견해가 병존하는 상태 그대로를 옮겼습니다. 어느 쪽이 맞는지는 이 글이 답할 수 없는 질문입니다.</p>')
A('<p>향이 지위의 신호로 쓰인 이유에 대한 설명도 이 글의 해석입니다. 옛 기록은 향이 어디에 쓰였는지를 적었고, '
  '왜 그 자리에 놓였는지는 밝혀 두지 않았습니다. 해석과 기록을 구분해 읽어 주시기 바랍니다.</p>')
A('<p>이전 자료에는 침향을 선물 받은 사람들의 반응에 관한 서술이 있었습니다. 확인할 수 있는 출처를 특정할 수 없어 '
  '이번 글에서는 싣지 않았습니다.</p>')
A('<p>인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다. '
  '대라천 침향 제품은 일반식품이며 의약품이 아닙니다.</p>')
A('{{IMG:agarwood-gift-box}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 정말 왕과 귀족만 침향을 썼나요?</h3>')
A('<p>A. 기록에 남은 자리는 왕실과 귀족, 그리고 나라 사이의 조공입니다. 값과 희소성 때문에 널리 쓰이기 어려웠다는 '
  '조건이 함께 있었습니다.</p>')
A('<h3>Q. 조공은 무슨 뜻인가요?</h3>')
A('<p>A. 나라 사이에 귀한 물건을 바치는 절차입니다. 원사(元史)에 안남이 침향을 조공했다는 기록이 있어, '
  '국가가 관리하는 자원이었음을 보여 줍니다.</p>')
A('<h3>Q. 성경에도 침향이 나오나요?</h3>')
A('<p>A. 시편에 왕의 모든 옷에 몰약과 침향과 육계의 향기가 있다는 구절이 있습니다. 다만 번역어가 오늘날의 침향과 '
  '같은 향목인지에는 다른 견해가 함께 있습니다.</p>')
A('<h3>Q. 지금은 침향이 흔해졌나요?</h3>')
A('<p>A. 여무는 데 걸리는 시간은 그대로입니다. 크게 달라진 것은 학명과 산지, 서류로 진위를 확인할 수 있게 되었다는 점입니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 문헌 서술은 대라천 공식 자료(zoellife.com)와 아래 출처에 근거합니다. '
  '소개한 문헌 내용은 각 출처의 기록을 옮긴 것이며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li>'
  '<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", '
  '<em>Molecules</em> 23권 342 (2018) — ' + A1 + '</li>'
  '<li>역사 기록: 원사(元史) 안남 침향 조공 · 성경 시편</li>'
  '<li><a href="/about-agarwood">침향의 산지와 학명 — about-agarwood</a></li>'
  '<li><a href="/blog/agarwood-trade-tang-song-yuan-ming">당·송·원·명 무역 기록 — agarwood-trade-tang-song-yuan-ming</a></li>'
  '<li><a href="/blog/individual-tree-id-traceability">개별 고유번호 이력 — individual-tree-id-traceability</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '왕과 귀족의 향이었던 이유, 돈으로 앞당길 수 없던 시간',
    'excerpt': '침향이 왕실과 귀족의 향으로 남은 이유는 신분 제도만이 아니었습니다. 대라천이 기록에 남은 자리와 '
               '그 자리를 만든 조건을 정리하고, 옛 소비와 오늘의 소비 사이에서 무엇이 겹치고 무엇이 갈라지는지를 표로 나란히 견줬습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'royal-robe',
         'prompt': 'Photorealistic still life of a richly woven dark silk fabric draped over a wooden stand in dim light, deep folds catching a single soft highlight, no patterns resembling logos, muted indigo and gold palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '왕의 옷에서 나는 향으로 기록된 침향을 떠올리게 하는 비단',
         'caption': '향은 가까이 다가온 사람에게만 전해지는 신호였습니다.'},
        {'key': 'agarwood-gift-box',
         'prompt': 'Photorealistic still life of a plain dark wooden presentation box slightly open on a linen surface, a single dark resinous wood piece resting inside on pale cloth, soft directional light, shallow depth of field, muted walnut and ivory palette, editorial product photography, no text, no logo, no watermark, no people',
         'alt': '귀한 예물로 다뤄진 침향을 담은 나무 상자',
         'caption': '기록에 남은 자리는 개인의 격에서 나라 사이의 관계까지 걸쳐 있습니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A1', 'K1'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '나를 대접하는 마음·작은 사치 같은 구매 권유 문단을 삭제하고, 지위 소비의 조건 분석으로 축을 이동. '
                 '출처를 특정할 수 없는 선물 반응 일화는 규격서 §0에 따라 제외하고 그 사실을 확인/미확인 절에 명시. '
                 '향이 지위 신호가 된 이유는 이 글의 해석임을 밝혀 기록과 구분.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
