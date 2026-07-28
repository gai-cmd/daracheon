import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-in-bible-and-buddhist-scriptures'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A1 = '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a>'
K1 = '<a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">침향(沈香) 항목</a>'
K7 = '<a href="https://hkplus.dongguk.edu/hkplus/column.php?mode=view&amp;bbs_idx=1368" target="_blank" rel="noopener">「침향(沈香), 고귀하고 엄숙한 향기」</a>'

TABLE = (
 '<table><thead><tr><th>경전</th><th>구절·편명</th><th>침향이 놓인 장면</th></tr></thead><tbody>'
 '<tr><td>성경</td><td>민수기 24:5-6</td><td>여호와께서 심으신 침향목</td></tr>'
 '<tr><td>성경</td><td>시편 45편</td><td>왕의 옷에서 나는 향</td></tr>'
 '<tr><td>성경</td><td>잠언 7:16-17</td><td>침상에 뿌린 향</td></tr>'
 '<tr><td>성경</td><td>아가 4:13-14</td><td>귀한 향료의 하나로 열거</td></tr>'
 '<tr><td>성경</td><td>요한복음 19:39</td><td>예수의 장사에 몰약과 함께 사용</td></tr>'
 '<tr><td>불경</td><td>법화경 법사공덕품</td><td>천향 가운데 으뜸으로 꼽힌 자리</td></tr>'
 '<tr><td>불경</td><td>화엄경</td><td>회향, 곧 공덕을 나누는 마음의 상징</td></tr>'
 '<tr><td>불경</td><td>약사경</td><td>향 공양에 쓰인 귀한 향재</td></tr>'
 '<tr><td>불경</td><td>대일경</td><td>자비와 깨달음의 향</td></tr>'
 '</tbody></table>'
)

SVG = (
 '<figure><svg viewBox="0 0 640 240" width="100%" role="img" '
 'aria-label="성경과 불경에서 침향이 놓인 장면을 유형별로 센 막대그래프">'
 '<rect x="0" y="0" width="640" height="240" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">침향이 놓인 장면의 유형 (단위: 대목)</text>'
 '<text x="20" y="54" font-size="12" fill="#2b2318">이 글이 표로 정리한 아홉 대목을 장면 성격으로 나눈 값입니다.</text>'
 '<rect x="190" y="72" width="270" height="28" fill="#9a6a10"/>'
 '<text x="20" y="92" font-size="14" fill="#2b2318">공양·예를 갖춘 자리</text>'
 '<text x="470" y="92" font-size="14" font-weight="700" fill="#9a6a10">3</text>'
 '<rect x="190" y="112" width="270" height="28" fill="#9a6a10"/>'
 '<text x="20" y="132" font-size="14" fill="#2b2318">귀함의 상징</text>'
 '<text x="470" y="132" font-size="14" font-weight="700" fill="#9a6a10">3</text>'
 '<rect x="190" y="152" width="180" height="28" fill="#2b2318"/>'
 '<text x="20" y="172" font-size="14" fill="#2b2318">생활 공간의 향</text>'
 '<text x="380" y="172" font-size="14" font-weight="700" fill="#2b2318">2</text>'
 '<rect x="190" y="192" width="90" height="28" fill="#2b2318"/>'
 '<text x="20" y="212" font-size="14" fill="#2b2318">풍경 묘사</text>'
 '<text x="290" y="212" font-size="14" font-weight="700" fill="#2b2318">1</text>'
 '</svg><figcaption>아홉 대목의 장면 유형 분포 — 분류 기준은 본문 표의 오른쪽 칸</figcaption></figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 성경과 불경은 침향을 각각 다섯 대목과 네 경전에 적었고, 그 자리는 '
  '대부분 예를 갖추는 장면입니다. 조엘라이프(주)(브랜드 대라천)는 이 대목들을 구절 단위로 옮기되, '
  '성경의 번역어가 오늘날의 침향과 같은 향목인지는 확정하지 않습니다. 경전 기록은 문화적 쓰임을 보여 주는 자료이며, '
  '건강상의 효과를 뒷받침하지 않습니다.</p>')

A('<h2>서로 먼 두 경전에 왜 같은 향이 나올까요?</h2>')
A('<p>침향은 침향나무가 상처를 아물리는 동안 내보낸 수지가 오래 쌓여 굳은 부분입니다. 나무가 자라기만 해서는 생기지 않고, '
  '상처와 시간이라는 조건이 함께 갖춰져야 합니다. 자연에서 드물게 만들어지는 이유가 여기에 있습니다.</p>')
A('<p>Wang 연구팀은 2018년 <em>Molecules</em> 23권 342에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 정리한 총설을 '
  '실었습니다(' + A1 + '). 이 총설은 침향이 상처 반응의 산물이라는 점을 다룹니다. '
  '대라천은 이 연구를 형성 조건의 근거로만 인용하며, 경전 해석과 연결하지 않습니다.</p>')
A('<p>구하기 어려운 재료는 아끼는 자리에 놓입니다. 오래 타면서 은은하게 퍼지는 향은 예를 갖추는 절차에 어울렸고, '
  '값이 비쌀수록 정성의 크기를 드러내는 수단이 되었습니다. 교류가 많지 않던 문화권이 같은 재료를 골라 든 배경입니다.</p>')
A('<p>한국민족문화대백과사전도 ' + K1 + '을 따로 두고 이 재료의 유래와 쓰임을 서술합니다. '
  '대라천은 두 경전의 기록을 비교하면서, 어느 종교의 해석이 옳은지에 대해서는 어떤 입장도 밝히지 않습니다.</p>')

A('<h2>성경은 침향을 어느 대목에 적었을까요?</h2>')
A('<p>성경에서 침향이 나오는 대목은 다섯 곳입니다. 민수기 24장 5~6절은 복된 풍경을 노래하면서 여호와께서 심으신 침향목이라는 '
  '표현을 담고 있습니다. 여기서 침향은 좋은 땅을 그리는 배경으로 놓입니다.</p>')
A('<p>시편 45편은 왕의 옷에서 나는 향으로 침향을 적었습니다. 사람의 품격을 향으로 드러내는 방식입니다. '
  '잠언 7장 16~17절은 침상에 뿌린 향으로 적어, 생활 공간 안으로 향을 들여옵니다.</p>')
A('<p>아가 4장 13~14절은 여러 귀한 향료를 나열하면서 그 목록 안에 침향을 넣었습니다. 단독으로 특별하다기보다 '
  '귀한 것들과 같은 급으로 묶인 자리입니다. 목록 안에서 이름이 불린다는 것은 그 목록의 격을 함께 나눠 가진다는 뜻입니다.</p>')
A('<p>다섯 대목은 한 권에 몰려 있지 않고 구약과 신약에 걸쳐 흩어져 있습니다. 편찬 시기가 다른 문서들이 각각 이 재료를 '
  '불러들였다는 뜻이며, 한 저자의 취향으로 설명되지 않는 분포입니다.</p>')
A('<p>요한복음 19장 39절은 예수의 장례에 몰약과 침향을 함께 썼다고 적었습니다. 다섯 대목 가운데 가장 무거운 자리이며, '
  '기쁨과 애도 양쪽에 같은 재료가 놓였다는 사실을 보여 줍니다.</p>')

A('<h2>성경의 번역어는 오늘의 침향과 같을까요?</h2>')
A('<p>이 질문은 짚고 넘어가야 합니다. 성경 원문의 낱말은 히브리어 아할림이고, 영어 성경은 이를 aloes로 옮겼습니다. '
  '이 낱말을 오늘날의 침향나무 속인 Aquilaria로 읽는 것은 오래 이어져 온 전통적 해석입니다.</p>')
A('<p>다만 학자에 따라 백단향 같은 다른 향목으로 보는 견해도 함께 있습니다. 두 견해가 병존한다는 사실 자체가 '
  '현재의 상태이며, 대라천은 어느 한쪽을 정답으로 적지 않습니다.</p>')
A('<p>이 구분이 중요한 이유가 있습니다. 번역어의 지시 대상을 확정해 버리면, 성경의 권위가 오늘의 제품 쪽으로 '
  '옮겨 붙는 문장이 만들어지기 때문입니다. 대라천은 그 다리를 놓지 않습니다.</p>')
A('<p>번역어 문제는 성경에만 있는 일도 아닙니다. 옛 문헌이 적은 재료 이름은 오늘의 분류 체계와 일대일로 대응하지 않는 경우가 많고, '
  '같은 이름이 지역에 따라 다른 나무를 가리킨 사례도 있습니다.</p>')
A('<p>그래서 이 글은 성경에 해당 구절이 있다는 사실까지만 적습니다. 그 구절의 낱말이 정확히 어떤 나무를 가리키는지는 '
  '경전이 답해 주지 않는 질문입니다.</p>')
A('{{IMG:scroll-and-resin}}')

A('<h2>불경은 침향을 어떤 자리에 두었을까요?</h2>')
A('<p>불교 경전에서 침향은 공양의 맥락에 자리합니다. 법화경 법사공덕품은 여러 하늘의 향을 열거하고, 후대의 저술은 '
  '그 가운데 침향을 으뜸으로 꼽아 왔습니다. 이 대목은 경전 구절 자체라기보다 뒷날의 상찬에 가깝다는 점을 함께 적어 둡니다.</p>')
A('<p>화엄경은 향을 회향의 상징으로 다룹니다. 회향은 자신이 쌓은 공덕을 다른 이에게 돌리는 일을 뜻하고, '
  '향기가 사방으로 퍼지는 성질이 그 뜻과 겹쳐 읽혔습니다.</p>')
A('<p>약사경은 향을 사르는 공양을 강조하며 좋은 향재 가운데 침향을 함께 놓습니다. 대일경은 향을 자비와 깨달음을 '
  '상징하는 존재로 그립니다. 네 경전은 서로 다른 주제를 다루면서도 침향을 정성의 표시로 삼았습니다.</p>')
A('<p>네 경전에서 침향은 향 자체가 주인공인 자리에 놓이지 않습니다. 공덕을 나누는 마음, 정성을 올리는 절차, 깨달음이라는 '
  '주제는 먼저 세워져 있고 향은 그 뜻을 실어 나르는 매개로 등장합니다.</p>')
A('<p>동국대학교 HK+사업단 칼럼 ' + K7 + '은 침향이 불교 문화 안에서 차지한 자리를 이렇게 정리했습니다. '
  '대라천은 이 칼럼을 2차 출처로 밝혀 인용합니다.</p>')

A('<h2>아홉 대목을 한 표로 겹쳐 보면</h2>')
A('<p>두 경전의 기록을 구절 단위로 나란히 놓으면 아래와 같습니다.</p>')
A(TABLE)
A(SVG)
A('<p>장면의 성격으로 나누면 예를 갖추는 자리가 가장 많습니다. 장례와 공양, 왕을 향한 예가 여기에 듭니다. '
  '그다음이 귀함의 상징이고, 생활 공간의 향과 풍경 묘사가 나머지를 채웁니다.</p>')
A('<p>표를 세로로 훑으면 성경 쪽이 다섯, 불경 쪽이 넷입니다. 다만 성경은 구절 단위이고 불경은 경전 단위라 세는 기준이 서로 다릅니다. '
  '두 숫자를 그대로 견주면 안 되는 이유입니다.</p>')
A('<p>분류 기준은 표의 오른쪽 칸이며, 대라천이 새 사실을 더한 것이 아니라 같은 아홉 대목을 다시 묶은 값입니다. '
  '다르게 묶으면 숫자도 달라집니다.</p>')

A('<h2>공통점은 무엇이고, 공통점이 아닌 것은 무엇일까요?</h2>')
A('<p>공통점은 두 가지로 좁혀집니다. 첫째, 침향은 중요한 순간에 등장합니다. 왕의 옷, 장례, 공양처럼 '
  '정성이 가장 필요한 자리입니다. 둘째, 흔한 향이 아니라 아끼는 향으로 쓰였습니다.</p>')
A('<p>공통점이 아닌 것도 분명히 해 둘 필요가 있습니다. 두 경전은 침향의 성질이나 작용을 설명하지 않습니다. '
  '어디에 썼는지를 적었을 뿐, 무엇을 했는지는 적지 않았습니다.</p>')
A('<p>서로 다른 문화가 같은 재료를 골랐다는 사실도 그 재료의 작용을 증명하지 않습니다. 희소성과 향의 지속성이라는 '
  '조건만으로도 같은 선택이 나올 수 있기 때문입니다.</p>')
A('<p>정성의 크기를 드러내는 수단은 시대마다 달랐습니다. 구하기 어려운 재료가 그 자리를 맡는 구조는 향에만 있는 것이 아니며, '
  '금속과 직물에서도 같은 방식이 반복됐습니다.</p>')
A('<p>대라천이 이 절을 따로 두는 이유는 하나입니다. 여러 경전에 등장한다는 사실이 효능의 근거처럼 읽히는 문장을 '
  '만들지 않기 위해서입니다. 기록의 폭과 작용의 크기는 별개의 문제이며, 이 글은 앞의 것만 다룹니다. '
  '뒤의 것은 경전이 답할 수 있는 질문이 아니기 때문입니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 이 글에 적은 구절과 경전 이름을 공개 자료에서 대조했습니다. 불교 문화 안의 자리를 정리한 대목은 '
  '동국대학교 HK+사업단 칼럼을 2차 출처로 밝혀 인용했고, 침향 항목의 서술은 한국민족문화대백과사전으로 확인했습니다.</p>')
A('<p>확인하지 않은 것도 적어 둡니다. 성경 번역어의 지시 대상, 각 경전의 판본 사이 표현 차이, 후대 상찬이 형성된 시점을 '
  '대라천은 확정하지 않았습니다. 문헌학과 종교학의 판단이 필요한 영역입니다.</p>')
A('<p>장면 유형을 나눈 분류도 대라천이 이 글을 위해 만든 것입니다. 경전이 그렇게 나눈 것이 아니므로, '
  '다른 기준으로 묶으면 다른 그림이 나온다는 점을 함께 적어 둡니다. 표와 그래프는 읽기를 돕는 장치일 뿐 새 근거가 아니며, '
  '근거는 어디까지나 각 경전의 해당 대목입니다.</p>')
A('<p>인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다. '
  '이 글은 침향의 문화적 쓰임을 다룬 읽을거리이고, 그 이상을 주장하지 않습니다.</p>')
A('{{IMG:incense-offering}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 성경에 침향이 정말 나오나요?</h3>')
A('<p>A. 민수기 24장 5~6절, 시편 45편, 잠언 7장 16~17절, 아가 4장 13~14절, 요한복음 19장 39절 다섯 대목입니다. '
  '다만 번역어가 오늘날의 침향과 같은 향목인지에는 다른 견해가 함께 있습니다.</p>')
A('<h3>Q. 불경에서 침향은 어떤 자리인가요?</h3>')
A('<p>A. 법화경 법사공덕품에서는 후대에 천향 가운데 으뜸으로 꼽혔고, 화엄경은 회향의 상징으로, 약사경은 향 공양의 향재로, '
  '대일경은 자비와 깨달음의 향으로 적었습니다.</p>')
A('<h3>Q. 왜 하필 침향이 종교의 향이 되었나요?</h3>')
A('<p>A. 자연에서 드물게 만들어지고 향이 오래간다는 조건이 예를 갖추는 절차에 맞았습니다. '
  '다만 이 설명은 쓰임의 배경일 뿐, 경전이 밝힌 이유는 아닙니다.</p>')
A('<h3>Q. 경전 기록이 침향의 효능을 증명하나요?</h3>')
A('<p>A. 증명하지 않습니다. 경전은 침향을 어디에 썼는지를 적었고, 그 재료가 무엇을 했는지는 적지 않았습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 경전 서술은 대라천 공식 자료(zoellife.com)와 아래 출처에 근거합니다. '
  '소개한 구절은 각 경전의 기록을 옮긴 것이며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li>'
  '<li><a href="https://hkplus.dongguk.edu/hkplus/column.php?mode=view&amp;bbs_idx=1368" target="_blank" rel="noopener">동국대학교 HK+사업단 칼럼 — 침향(沈香), 고귀하고 엄숙한 향기</a></li>'
  '<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", '
  '<em>Molecules</em> 23권 342 (2018) — ' + A1 + '</li>'
  '<li>경전: 민수기 · 시편 · 잠언 · 아가 · 요한복음 · 법화경 법사공덕품 · 화엄경 · 약사경 · 대일경</li>'
  '<li><a href="/about-agarwood">침향 기본 정보 — about-agarwood</a></li>'
  '<li><a href="/blog/3000-years-of-agarwood-history">침향 역사 3000년 — 3000-years-of-agarwood-history</a></li>'
  '<li><a href="/blog/agarwood-cultural-history">침향 문화사 — agarwood-cultural-history</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '성경과 불경 속 침향, 아홉 대목을 구절별로 정리하다',
    'excerpt': '성경은 침향을 다섯 대목에, 불경은 네 경전에 적었습니다. 대라천이 아홉 대목을 구절 단위로 옮기고 '
               '장면 성격으로 분류했습니다. 성경의 번역어가 오늘날의 침향과 같은 향목인지에 대해 나뉘어 있는 두 견해도 나란히 밝혔습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'scroll-and-resin',
         'prompt': 'Photorealistic still life of an aged blank parchment scroll partially unrolled on a dark walnut table beside a small dark resinous wood fragment, no legible writing anywhere, warm low-angle window light, deep shadows, muted sepia and umber palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '성경 속 침향 구절의 번역어 문제를 떠올리게 하는 고문서와 침향 조각',
         'caption': '번역어가 어떤 나무를 가리키는지는 경전이 답해 주지 않습니다.'},
        {'key': 'incense-offering',
         'prompt': 'Photorealistic still life of a simple brass incense burner with a single thin thread of smoke rising in a dim quiet interior, plain stone altar surface, no religious symbols or figures visible, soft directional light, muted charcoal and warm gold palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '공양의 자리에 놓인 향을 떠올리게 하는 향로',
         'caption': '두 경전 모두 침향을 예를 갖추는 자리에 두었습니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A1', 'K1', 'K7'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '성경·불경 절이 각각 두 번 반복되던 구조를 장면 축으로 재편해 중복을 제거하고, '
                 '기록되어 있습니다·전해집니다·여겨졌어요 등 회피 화법을 경전 주어 서술로 교체. '
                 '번역어(아할림·aloes) 쟁점을 독립 H2로 승격하고, 여러 경전 등장이 효능 근거로 읽히지 않도록 공통점 아닌 것 절을 신설.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
