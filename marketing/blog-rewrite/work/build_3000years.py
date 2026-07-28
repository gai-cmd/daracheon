import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = '3000-years-of-agarwood-history'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

# disclaimer 는 원문에서 그대로 잘라 붙인다 (바이트 동일 보존)
TAIL = src['content'][src['content'].rindex('<hr />'):]

A1 = '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a>'
K1 = '<a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">침향(沈香) 항목</a>'
K5 = '<a href="https://db.history.go.kr/ancient/level.do?levelId=sg_033r_0030_0010" target="_blank" rel="noopener">삼국사기 권33 잡지 거기(車騎)조</a>'
K6 = '<a href="https://db.history.go.kr/ancient/level.do?levelId=sg_033r_0050_0010" target="_blank" rel="noopener">같은 권 옥사(屋舍)조</a>'
K7 = '<a href="https://hkplus.dongguk.edu/hkplus/column.php?mode=view&amp;bbs_idx=1368" target="_blank" rel="noopener">「침향(沈香), 고귀하고 엄숙한 향기」</a>'

SVG = (
 '<figure><svg viewBox="0 0 640 260" width="100%" role="img" '
 'aria-label="침향 역사 기록을 갈래별로 나눈 문헌·구절 수 막대그래프">'
 '<rect x="0" y="0" width="640" height="260" fill="#fffdf9"/>'
 '<text x="20" y="34" font-size="17" font-weight="700" fill="#2b2318">이 글이 이름을 밝힌 문헌·구절 (단위: 건)</text>'
 '<rect x="150" y="62" width="240" height="28" fill="#9a6a10"/>'
 '<text x="20" y="82" font-size="14" fill="#2b2318">성경 구절</text>'
 '<text x="400" y="82" font-size="14" font-weight="700" fill="#9a6a10">5</text>'
 '<rect x="150" y="104" width="192" height="28" fill="#9a6a10"/>'
 '<text x="20" y="124" font-size="14" fill="#2b2318">불경</text>'
 '<text x="352" y="124" font-size="14" font-weight="700" fill="#9a6a10">4</text>'
 '<rect x="150" y="146" width="480" height="28" fill="#2b2318"/>'
 '<text x="20" y="166" font-size="14" fill="#2b2318">옛 의서</text>'
 '<text x="600" y="166" font-size="14" font-weight="700" fill="#fffdf9">10</text>'
 '<rect x="150" y="188" width="480" height="28" fill="#2b2318"/>'
 '<text x="20" y="208" font-size="14" fill="#2b2318">역사·무역 문헌</text>'
 '<text x="600" y="208" font-size="14" font-weight="700" fill="#fffdf9">10</text>'
 '<text x="20" y="242" font-size="12" fill="#2b2318">막대 길이는 본문에서 책 이름이나 구절을 직접 밝힌 건수를 셈한 값입니다.</text>'
 '</svg><figcaption>침향 역사 기록의 갈래별 분포 — 본문에 이름이 나온 건수 기준</figcaption></figure>'
)

TABLE = (
 '<table><thead><tr><th>문헌</th><th>기록된 침향 산지</th><th>오늘의 지역</th></tr></thead><tbody>'
 '<tr><td>교주이물지</td><td>교주(交州)의 밀향수</td><td>베트남 북부</td></tr>'
 '<tr><td>남방초목상(304년)</td><td>밀향수, 산지는 교지(交趾)</td><td>베트남 북부</td></tr>'
 '<tr><td>양서·남사·신당서</td><td>임읍(林邑), 환주 일남군</td><td>베트남 중부</td></tr>'
 '<tr><td>송사·본초도경</td><td>점성(占城)·교주</td><td>베트남 중부·북부</td></tr>'
 '<tr><td>원사</td><td>안남(安南)의 조공</td><td>베트남</td></tr>'
 '<tr><td>대명회전·향승</td><td>진납(眞臘)·점성</td><td>캄보디아·베트남 중부</td></tr>'
 '<tr><td>조선의 기록</td><td>안남·월남산을 정품으로 봄</td><td>베트남</td></tr>'
 '</tbody></table>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 침향(沈香)의 이름은 종교 경전과 옛 의서, '
  '그리고 나라 사이의 무역 기록에 나란히 남아 있습니다. 이 글은 그 기록들이 무엇을 적어 두었는지만 '
  '갈래별로 옮깁니다. 조엘라이프(주)(브랜드 대라천)는 옛 문헌의 문장을 제품의 효능 근거로 쓰지 않으며, '
  '이 글에 나오는 침향 역사 서술은 문헌이 남긴 기록 그 자체입니다.</p>')

A('<h2>침향은 왜 이름부터 가라앉는 향일까요?</h2>')
A('<p>침향은 향나무의 목재가 아닙니다. 침향나무가 상처를 입은 자리에 수지(樹脂, 나무가 내보내는 끈끈한 진)가 '
  '오래 쌓여 굳은 부분을 가리킵니다. 수지가 밴 조직은 밀도가 크게 올라가고, 물에 넣으면 뜨지 않고 가라앉습니다. '
  '가라앉을 침(沈) 자가 이름에 들어간 까닭이 여기에 있습니다.</p>')
A('<p>Wang 연구팀은 2018년 <em>Molecules</em> 23권 342에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 '
  '정리한 총설을 실었습니다(' + A1 + '). 이 총설은 침향이 상처 반응의 산물이라는 점과 그 안에 들어 있는 성분 계열을 '
  '다룹니다. 대라천은 이 연구를 성분 서술의 근거로만 인용하며, 제품의 효능과 연결하지 않습니다.</p>')
A('<p>귀한 재료였던 만큼 침향은 아무나 쓰는 향이 아니었습니다. 왕실과 귀족의 향으로, 또 신과 부처에게 올리는 '
  '공양의 향으로 쓰였습니다. 서로 멀리 떨어진 문화권의 기록에 같은 이름이 반복해 등장하는 배경입니다.</p>')
A('{{IMG:resin-formation}}')

A('<h2>성경은 침향을 어느 대목에 적어 두었을까요?</h2>')
A('<p>성경은 침향을 여러 권에 걸쳐 적었습니다. 민수기 24장 5~6절은 여호와께서 심으신 침향목이라는 표현을 담고 있습니다. '
  '시편 45편은 왕의 옷에서 나는 향으로 침향을 적었고, 잠언 7장 16~17절은 침상에 뿌린 향으로 적었습니다. '
  '아가 4장 13~14절은 귀한 향료를 나열하면서 침향을 그 안에 넣었습니다.</p>')
A('<p>신약에서는 요한복음 19장 39절이 예수의 장례에 몰약과 침향을 함께 썼다고 적었습니다. 다섯 대목 모두 '
  '침향이 값싸게 쓰이는 향이 아니라는 공통점을 보여 줍니다.</p>')
A('<p>다섯 대목이 놓인 자리를 보면 쓰임이 갈립니다. 시편과 아가는 향 자체를 귀하게 다루는 대목이고, '
  '잠언은 생활 공간에 뿌린 향으로 적었으며, 요한복음은 장례라는 가장 엄숙한 자리에 놓았습니다. '
  '같은 재료가 축복과 애도 양쪽에 모두 등장하는 셈입니다.</p>')
A('<p>한 가지는 분명히 해 둘 필요가 있습니다. 성경에서 침향으로 옮긴 원어가 오늘날의 침향과 같은 향목인지에 대해서는 '
  '백단향 등 다른 향목으로 보는 학술적 견해가 함께 있습니다. 대라천은 번역어의 지시 대상을 확정하지 않고, '
  '해당 구절이 존재한다는 사실만 옮깁니다.</p>')

A('<h2>불경 속 침향은 어떤 자리에 놓였을까요?</h2>')
A('<p>불경에서 침향은 공양의 맥락에 자리합니다. 법화경 법사공덕품은 여러 하늘의 향을 열거하고, 후대의 저술은 그 가운데 '
  '침향을 으뜸으로 꼽아 기렸습니다. 이 대목은 경전 구절을 그대로 옮긴 것이라기보다 뒷날의 상찬에 가깝다는 점을 함께 적어 둡니다.</p>')
A('<p>화엄경은 공덕을 나누는 회향의 상징으로 침향을 다루고, 약사경은 향 공양을 귀히 여기는 맥락에서 고급 향재의 하나로 놓습니다. '
  '대일경은 자비와 깨달음의 향으로 침향을 그립니다. 네 경전이 서로 다른 주제를 다루면서도 침향을 정성의 표시로 삼았습니다.</p>')
A('<p>공양물의 자리는 값어치만으로 정해지지 않습니다. 향을 사르는 행위 자체가 정성을 드러내는 형식이었고, '
  '오래 타면서 은은하게 퍼지는 향일수록 그 형식에 어울렸습니다. 침향이 여러 경전에서 반복해 호명된 배경에는 '
  '이런 쓰임의 조건이 함께 놓여 있습니다.</p>')
A('<p>동국대학교 HK+사업단 칼럼 ' + K7 + '은 침향이 불교 문화 안에서 차지한 자리를 이렇게 정리했습니다. '
  '대라천은 이 칼럼을 2차 출처로 표시해 인용합니다.</p>')
A(SVG)

A('<h2>옛 의서는 침향을 어떤 말로 적었을까요?</h2>')
A('<p>동양에서 침향은 향료이면서 약재였습니다. 동의보감은 침향의 성질이 뜨겁고 맛이 매우며 독이 없다고 적었고, '
  '기(氣)를 통하게 하며 속을 따뜻하게 해 냉통(冷痛)을 멎게 한다고 기록했습니다. 이 문장은 동의보감이 적어 둔 서술이며, '
  '오늘날의 임상 용어로 옮겨 읽을 수 있는 문장이 아닙니다.</p>')
A('<p>중국의 본초서에도 침향은 자주 올랐습니다. 도홍경의 명의별록과 본초경집주가 이른 시기의 기록에 해당하고, '
  '이시진의 본초강목과 손사막의 비급천금요방에도 항목이 있습니다. 해약본초, 증류본초, 태평혜민화제국방, 경악전서, '
  '중약대사전까지 이름을 이어 보면 열 권 남짓이 됩니다.</p>')
A('<p>이 책들에서 되풀이되는 표현을 추리면 기(氣)를 다스리는 약재라는 서술로 모입니다. 기를 통하게 하고, 속을 따뜻하게 하며, '
  '기를 아래로 내리고, 통증을 덜어 준다는 식입니다. 본초강목 등 일부 본초서는 마음을 가라앉힌다는 취지의 서술을 덧붙였습니다. '
  '한국민족문화대백과사전은 ' + K1 + '을 따로 두고 이 재료의 유래와 쓰임을 서술합니다. '
  '여러 세대의 책이 같은 재료를 항목으로 붙들었다는 사실은 그 자체로 하나의 기록입니다.</p>')

A('<h2>무역 기록이 가리키는 산지는 어디일까요?</h2>')
A('<p>침향은 나라와 나라 사이의 무역과 조공 기록에도 남았습니다. 눈에 띄는 것은 여러 문헌이 좋은 산지로 같은 지역을 '
  '거듭 지목한다는 점입니다. 편찬 시기가 수백 년씩 떨어진 책들이 같은 방향을 가리킬 때, 그 일치는 우연으로 설명하기 어렵습니다.</p>')
A(TABLE)
A('<p>표의 교지, 임읍, 교주, 점성, 안남, 월남은 모두 오늘날의 베트남 지역을 가리키는 옛 이름입니다. 시대가 바뀌고 나라 이름이 '
  '달라지는 동안에도 문헌이 지목한 산지는 한 지역으로 모였습니다. 조선의 기록도 안남·월남산 침향을 정품으로 적었습니다. '
  '대라천이 100% 베트남산 원목만 쓰는 기준은 이 기록의 흐름과 같은 자리에 놓여 있습니다.</p>')
A('{{IMG:old-trade-map}}')

A('<h2>신라의 기록에도 침향이 남아 있습니다</h2>')
A('<p>한반도의 기록으로 눈을 돌리면 삼국사기가 침향을 규제 대상으로 적어 둔 대목이 나옵니다. '
  + K5 + '는 진골이 수레의 재목(車材)에 자단과 침향을 쓰지 못한다고 규정했습니다. '
  + K6 + '는 진골부터 6두품까지 침대를 대모와 침향으로 장식하지 못하도록 정했습니다.</p>')
A('<p>금지 조항은 역설적인 증거가 됩니다. 쓰지 말라는 규정이 만들어졌다는 것은 그 재료를 실제로 쓰고 있었다는 뜻이기 때문입니다. '
  '신라의 신분 규정이 침향을 굳이 이름 붙여 제한한 대목에서, 이 향이 당시 최상위 계층의 사치품이었다는 사실이 드러납니다.</p>')
A('<p>규정의 대상도 눈여겨볼 만합니다. 두 조항은 수레의 재목과 침대 장식이라는, 매일 눈에 닿는 물건을 다룹니다. '
  '의례용 향으로만 쓰이던 재료였다면 이런 자리에 규정이 붙을 이유가 없습니다. 신라의 금령은 향을 사르는 자리보다 '
  '생활의 표면을 겨냥했습니다.</p>')
A('<p>대라천은 이 두 조항을 국사편찬위원회 한국사데이터베이스의 원문으로 확인했습니다. 다만 확인한 것은 조항의 존재이며, '
  '신라에 들어온 침향의 산지나 유통량은 이 사료가 답해 주지 않습니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 이 글에 이름을 올린 문헌의 기록 여부를 공개된 1차 출처에서 확인했습니다. 삼국사기의 두 조항은 '
  '국사편찬위원회 데이터베이스 원문으로, 침향 항목의 서술은 한국민족문화대백과사전으로 확인했습니다. '
  '불교 문화 안의 자리를 정리한 대목은 동국대학교 HK+사업단 칼럼을 2차 출처로 밝혀 인용했습니다.</p>')
A('<p>표에 적은 옛 지명과 오늘의 지역을 잇는 대응도 공개 자료로 대조한 결과입니다. 다만 대라천은 각 문헌의 편찬 연대나 '
  '판본 사이의 차이까지 검증하지는 않았습니다. 문헌학의 판단이 필요한 영역이고, 이 글의 범위를 벗어납니다.</p>')
A('<p>확인하지 않은 것도 분명히 적어 둡니다. 옛 문헌이 적은 성질과 쓰임이 오늘날의 기준에서 어떤 작용에 해당하는지, '
  '대라천은 확인한 바가 없습니다. 인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, '
  '제품의 효능을 뒷받침하는 자료가 아닙니다. 이 글은 침향 역사에 관한 읽을거리이고, 그 이상을 주장하지 않습니다. '
  '문헌이 무엇을 적었는가와 그 서술이 오늘 무엇을 뜻하는가는 끝까지 구분해 읽어 주시기 바랍니다.</p>')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 침향은 정말 그렇게 오래된 향인가요?</h3>')
A('<p>A. 성경과 불경, 동의보감을 비롯한 옛 의서, 그리고 여러 역사서의 무역·조공 기록에 침향의 이름이 거듭 나옵니다. '
  '문헌의 갈래가 서로 다르다는 점이 이 향의 내력이 짧지 않다는 사실을 보여 줍니다.</p>')
A('<h3>Q. 옛 문헌이 침향의 효능을 증명하나요?</h3>')
A('<p>A. 증명하지 않습니다. 옛 문헌은 그 시대 사람들이 침향을 어떻게 적었는지 보여 주는 자료입니다. '
  '동의보감이 기를 통하게 하는 약재로 적었다는 사실과, 오늘날 그 작용이 확인되었는가는 서로 다른 질문입니다.</p>')
A('<h3>Q. 옛 기록에서 좋은 침향의 산지는 어디였나요?</h3>')
A('<p>A. 교주이물지, 남방초목상, 송사, 원사 같은 문헌이 교지·임읍·점성·안남을 산지로 적었습니다. '
  '모두 오늘날의 베트남 지역에 해당하는 옛 지명입니다.</p>')
A('<h3>Q. 성경과 불경에 함께 나오는 이유는 무엇인가요?</h3>')
A('<p>A. 두 전통 모두 가장 귀한 향을 공양에 썼고, 침향은 구하기 어려운 향의 자리에 있었습니다. '
  '다만 성경의 번역어가 오늘날의 침향과 같은 향목인지에는 다른 견해가 함께 있습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 문헌 서술은 대라천 공식 자료(zoellife.com)와 아래 1차 출처에 근거합니다. '
  '소개한 문헌 내용은 각 문헌의 기록을 옮긴 것이며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li>'
  '<li><a href="https://db.history.go.kr/ancient/level.do?levelId=sg_033r_0030_0010" target="_blank" rel="noopener">삼국사기 권33 잡지 거기(車騎)조 — 국사편찬위원회 한국사데이터베이스</a></li>'
  '<li><a href="https://db.history.go.kr/ancient/level.do?levelId=sg_033r_0050_0010" target="_blank" rel="noopener">삼국사기 권33 잡지 옥사(屋舍)조 — 국사편찬위원회 한국사데이터베이스</a></li>'
  '<li><a href="https://hkplus.dongguk.edu/hkplus/column.php?mode=view&amp;bbs_idx=1368" target="_blank" rel="noopener">동국대학교 HK+사업단 칼럼 — 침향(沈香), 고귀하고 엄숙한 향기</a></li>'
  '<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", <em>Molecules</em> 23권 342 (2018) — ' + A1 + '</li>'
  '<li><a href="/about-agarwood">침향 기본 정보 — about-agarwood</a></li>'
  '<li><a href="/blog/agarwood-cultural-history">침향 문화사 — agarwood-cultural-history</a></li>'
  '<li><a href="/blog/agarwood-in-donguibogam">동의보감 침향 기록 — agarwood-in-donguibogam</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '침향 역사 3000년, 성경·불경·옛 의서가 남긴 기록',
    'excerpt': '침향 역사는 성경과 불경, 동의보감을 비롯한 옛 의서, 그리고 나라 사이의 무역 기록에 나뉘어 남아 있습니다. '
               '대라천이 문헌 갈래별로 그 기록을 원문대로 옮기고, 삼국사기가 남긴 신라의 침향 사용 규정까지 함께 짚었습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'resin-formation',
         'prompt': 'Photorealistic macro close-up of a cross-section of dark resinous agarwood, deep brown and black resin veins swirling through pale wood grain, resting on a neutral linen cloth, soft directional daylight, shallow depth of field, muted umber and ivory palette, editorial still life photography, no text, no logo, no watermark, no people',
         'alt': '침향 역사 서술의 출발점인 수지가 밴 침향 단면',
         'caption': '침향은 나무가 상처를 아물리며 만든 수지가 굳은 부분입니다.'},
        {'key': 'old-trade-map',
         'prompt': 'Photorealistic still life of an antique East Asian style hand-drawn coastal map on aged parchment with no legible lettering, a small brass compass and a dark resin fragment placed on top, dark walnut table, warm low-angle window light, muted ochre and sepia palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '옛 무역 기록이 침향 산지로 지목한 해안 지역을 떠올리게 하는 고지도',
         'caption': '여러 문헌이 지목한 산지는 오늘날의 베트남 일대로 모입니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A1', 'K1', 'K5', 'K6', 'K7'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '해요체 읽을거리 문체를 보도자료 인칭으로 전환하고 알려짐·여겨졌다 등 회피 화법을 문헌 주어 서술로 교체. '
                 '삼국사기 거기조·옥사조(K5·K6)와 Wang 2018(A1)을 새로 인용해 분량과 근거를 보강. '
                 '고려사절요 의종 5년 관음상 기술은 규격서 §A 사용 금지 항목이라 도입하지 않음.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path)
print('charsBefore', out['changelog']['charsBefore'], '-> charsAfter', out['changelog']['charsAfter'])
print('title', len(out['title']), '| excerpt', len(out['excerpt']))
