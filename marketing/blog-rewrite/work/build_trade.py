import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-trade-tang-song-yuan-ming'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A7 = '<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a>'
K1 = '<a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">침향(沈香) 항목</a>'

TABLE = (
 '<table><thead><tr><th>시대</th><th>문헌</th><th>기록된 산지</th></tr></thead><tbody>'
 '<tr><td>고대</td><td>교주이물지</td><td>교주(交州)</td></tr>'
 '<tr><td>고대</td><td>남방초목상(304년)</td><td>교지(交趾)</td></tr>'
 '<tr><td>당</td><td>남월지 · 당본초</td><td>교주</td></tr>'
 '<tr><td>당</td><td>양서 · 남사 · 신당서</td><td>임읍(林邑), 환주 일남군</td></tr>'
 '<tr><td>송</td><td>송사 · 송회요 · 본초도경</td><td>점성(占城) · 교주</td></tr>'
 '<tr><td>원</td><td>원사</td><td>안남(安南) 조공</td></tr>'
 '<tr><td>명</td><td>대명회전 · 향승</td><td>진납(眞臘) · 점성</td></tr>'
 '</tbody></table>'
)

SVG = (
 '<figure><svg viewBox="0 0 640 250" width="100%" role="img" '
 'aria-label="시대별로 문헌에 적힌 침향 산지 지명이 바뀌어 온 흐름을 나타낸 도표">'
 '<rect x="0" y="0" width="640" height="250" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">시대별 산지 지명 — 이름은 바뀌고 땅은 겹칩니다</text>'
 '<line x1="60" y1="210" x2="610" y2="210" stroke="#2b2318" stroke-width="1"/>'
 '<circle cx="90" cy="210" r="6" fill="#9a6a10"/>'
 '<text x="62" y="234" font-size="12" fill="#2b2318">고대</text>'
 '<text x="62" y="196" font-size="12" font-weight="700" fill="#9a6a10">교주·교지</text>'
 '<circle cx="230" cy="210" r="6" fill="#9a6a10"/>'
 '<text x="216" y="234" font-size="12" fill="#2b2318">당</text>'
 '<text x="196" y="196" font-size="12" font-weight="700" fill="#9a6a10">임읍·교주</text>'
 '<circle cx="370" cy="210" r="6" fill="#9a6a10"/>'
 '<text x="356" y="234" font-size="12" fill="#2b2318">송</text>'
 '<text x="336" y="196" font-size="12" font-weight="700" fill="#9a6a10">점성·교주</text>'
 '<circle cx="490" cy="210" r="6" fill="#c49a3f"/>'
 '<text x="476" y="234" font-size="12" fill="#2b2318">원</text>'
 '<text x="466" y="196" font-size="12" font-weight="700" fill="#9a6a10">안남</text>'
 '<circle cx="600" cy="210" r="6" fill="#2b2318"/>'
 '<text x="586" y="234" font-size="12" fill="#2b2318">명</text>'
 '<text x="556" y="196" font-size="12" font-weight="700" fill="#2b2318">진납·점성</text>'
 '<text x="20" y="74" font-size="12" fill="#2b2318">진납을 제외한 지명은 모두 오늘날의 베트남 지역에 해당합니다.</text>'
 '<text x="20" y="96" font-size="12" fill="#2b2318">막대가 아니라 시점 배치이며, 문헌의 편찬 연대를 재현한 축척이 아닙니다.</text>'
 '</svg><figcaption>시대별 산지 지명의 변화 — 출처: 본문 표에 정리한 문헌 기록</figcaption></figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 고대부터 명까지 침향 산지를 적은 문헌들은 서로 다른 지명을 쓰지만, '
  '진납을 빼면 가리키는 땅이 겹칩니다. 교주·교지·임읍·점성·안남은 모두 오늘날의 베트남 지역을 부르던 이름입니다. '
  '조엘라이프(주)(브랜드 대라천)는 이 글에서 문헌이 적은 지명과 그 대응만 옮기며, 산지에 따른 우열을 주장하지 않습니다.</p>')

A('<h2>침향은 왜 무역품이 되었을까요?</h2>')
A('<p>침향은 자연에서 드물게 만들어집니다. 침향나무가 상처를 입고, 그 자리에 수지가 오래 쌓여 굳어야 얻어지는 재료입니다. '
  '나는 곳이 한정된 이유가 여기에 있습니다.</p>')
A('<p>나는 곳과 쓰는 곳이 다르면 물건은 이동합니다. 침향은 왕실과 종교의례에서 쓰였고, 그 수요는 산지에서 멀리 떨어진 곳에 '
  '있었습니다. 무역품이 될 조건이 갖춰져 있었습니다.</p>')
A('<p>사고파는 거래만 있었던 것도 아닙니다. 나라 사이에 바치는 조공품 목록에도 침향이 올랐습니다. '
  '원사가 남긴 안남의 조공 기록이 그 사례입니다.</p>')
A('<p>거래와 조공은 성격이 다릅니다. 앞의 것은 값을 매기는 일이고, 뒤의 것은 관계를 표시하는 일입니다. '
  '침향은 두 경로 모두에 이름을 올렸습니다.</p>')
A('<p>귀한 물건일수록 오가는 경로가 기록으로 남습니다. 값을 매기려면 어디서 왔는지를 적어야 하고, '
  '조공으로 바치려면 무엇을 얼마나 보냈는지를 적어야 하기 때문입니다.</p>')
A('<p>그래서 침향의 기록은 향 문화 자료뿐 아니라 역사서와 제도 문서에도 흩어져 남았습니다. '
  '이 글이 여러 갈래의 문헌을 함께 다루는 이유입니다. 향에 관한 책만 봐서는 이동의 자취가 보이지 않습니다.</p>')

A('<h2>가장 이른 산지 기록은 무엇일까요?</h2>')
A('<p>산지를 적은 이른 기록으로 교주이물지가 꼽힙니다. 이 책은 교주(交州)의 밀향수를 이야기합니다. '
  '밀향수는 침향이 만들어지는 나무를 부르던 옛 이름입니다.</p>')
A('<p>그다음이 남방초목상(304년)입니다. 이 책은 침향이 곧 밀향수이며 산지는 교지(交趾)라고 적었습니다. '
  '재료와 나무, 그리고 지역이 한 문장 안에 함께 묶인 형태입니다.</p>')
A('<p>이른 기록들이 이미 산지를 특정했다는 점이 눈에 띕니다. 흔한 재료라면 어디서 났는지까지 적을 이유가 적습니다. '
  '산지를 적었다는 사실 자체가 이 재료의 위치를 보여 줍니다.</p>')
A('<p>다만 두 문헌의 편찬 연대와 판본 사이의 차이를 대라천이 검증하지는 않았습니다. '
  '문헌학의 판단이 필요한 영역이며, 이 글은 기록된 지명을 옮기는 데까지만 다룹니다.</p>')
A('<p>밀향수라는 이름도 눈여겨볼 만합니다. 오늘날에는 나무와 그 나무에서 얻는 재료를 다른 말로 부르지만, '
  '이른 기록은 둘을 한 이름으로 묶어 적었습니다. 재료와 원천을 구분하기 전 단계의 서술입니다.</p>')
A('<p>한국민족문화대백과사전도 ' + K1 + '을 따로 두고 이 재료의 유래와 쓰임을 서술합니다. '
  '국내 자료에서 확인할 수 있는 출발점입니다.</p>')

A('<h2>당·송·원·명은 어디를 적었을까요?</h2>')
A('<p>시대가 흐르며 침향을 적은 문헌은 늘어납니다. 시대와 문헌, 그리고 기록된 산지를 한 표에 놓으면 아래와 같습니다.</p>')
A(TABLE)
A('<p>당에 해당하는 줄이 둘입니다. 남월지와 당본초는 교주를 적었고, 양서·남사·신당서는 임읍과 환주 일남군을 적었습니다. '
  '같은 시대 안에서도 문헌에 따라 지명이 갈립니다.</p>')
A('<p>송에서는 송사와 송회요, 본초도경이 점성과 교주를 적었습니다. 역사서와 본초서가 같은 지역을 가리킨 사례입니다. '
  '원사는 안남의 조공을 적었고, 명의 대명회전과 향승은 진납과 점성을 적었습니다.</p>')
A('<p>표의 오른쪽 칸만 세로로 읽으면 지명이 계속 바뀝니다. 그런데 그 지명들이 가리키는 땅은 대체로 한 방향으로 모입니다. '
  '다음 절에서 그 이유를 다룹니다.</p>')
A('{{IMG:old-trade-ledger}}')

A('<h2>왜 문헌마다 지명이 다를까요?</h2>')
A('<p>이유는 단순합니다. 시대마다 그 지역을 부르는 이름이 달랐기 때문입니다. 땅이 옮겨 간 것이 아니라 '
  '이름이 바뀐 것입니다.</p>')
A(SVG)
A('<p>고대의 기록은 교주와 교지를 썼고, 당 무렵의 문헌은 임읍과 환주 일남군을 썼습니다. 송은 점성과 교주를, '
  '원은 안남을, 명은 진납과 점성을 썼습니다.</p>')
A('<p>이 가운데 진납은 오늘날의 캄보디아 일대에 해당합니다. 나머지 교주·교지·임읍·점성·안남·월남은 '
  '오늘날의 베트남 지역을 가리키는 옛 이름입니다.</p>')
A('<p>조선의 기록도 안남과 월남, 곧 베트남산 침향을 정품으로 적었습니다. 시대와 나라가 바뀌는 동안에도 '
  '문헌이 지목한 방향은 크게 흔들리지 않았습니다.</p>')
A('<p>지명이 바뀐 배경에는 왕조의 교체와 행정 구역의 개편이 있습니다. 같은 해안을 두고도 부르는 쪽이 달라지면 '
  '문서에 남는 이름이 달라집니다.</p>')
A('<p>대라천은 이 일치를 산지의 우열이 아니라 기록의 흐름으로 읽습니다. 대라천이 100% 베트남산 원목만 쓰는 기준은 '
  '이 흐름과 같은 자리에 놓여 있습니다. 다만 기록이 한 방향을 가리켰다는 사실이 곧 품질의 증명은 아닙니다.</p>')

A('<h2>오늘의 연구는 분포를 어떻게 다룰까요?</h2>')
A('<p>산지를 다루는 방식은 지금도 이어집니다. 기준이 지명에서 종과 분포로 옮겨 갔을 뿐입니다.</p>')
A('<p>Wang 연구팀은 2021년 <em>Molecules</em> 26권 7708에 아퀼라리아 속의 분포와 휘발성·비휘발성 성분, 약리적 쓰임, '
  '등급 체계, 수지 유도법을 정리한 총설을 실었습니다(' + A7 + ').</p>')
A('<p>이 총설이 다루는 분포는 식물 종이 자생하는 범위이고, 옛 문헌이 적은 산지는 거래가 이루어진 지역입니다. '
  '두 층위가 겹칠 수는 있어도 같은 개념은 아닙니다.</p>')
A('<p>대라천은 이 연구를 분포 서술의 근거로만 인용하며, 옛 문헌의 산지 기록을 이 연구가 뒷받침한다는 뜻으로 쓰지 않습니다. '
  '제품의 효능과도 연결하지 않습니다.</p>')
A('<p>기록의 성격도 다릅니다. 옛 문헌은 거래된 결과를 적었고, 오늘의 연구는 종이 자랄 수 있는 조건을 다룹니다. '
  '앞의 것은 사람의 활동이 남긴 자취이고, 뒤의 것은 식물의 분포입니다.</p>')
A('<p>옛 기록과 오늘의 연구를 나란히 두는 이유는 하나입니다. 같은 주제를 서로 다른 방법으로 다뤄 왔다는 사실을 '
  '보여 주기 위해서입니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 표에 적은 문헌 이름과 지명, 그리고 옛 지명과 오늘 지역의 대응을 공개 자료에서 대조했습니다. '
  '100% 베트남산 원목 사용은 수입 서류로 보유하고 있으며, 요청하시면 확인해 드립니다.</p>')
A('<p>확인하지 않은 것을 분명히 적어 둡니다. 각 문헌의 편찬 연대와 판본 차이, 그리고 기록된 거래량은 '
  '대라천이 검증하지 않았습니다.</p>')
A('<p>이전 자료에는 특정 국가에서 난 침향을 낮게 평가한 문헌이 있다는 서술이 있었습니다. 그러나 어느 문헌의 어느 대목인지 '
  '특정할 수 없어, 이번 글에서는 해당 서술을 싣지 않았습니다.</p>')
A('<p>문헌이 산지를 구분해 적었다는 사실까지는 표로 확인할 수 있습니다. 그 구분이 품질의 우열을 뜻하는지는 '
  '문헌이 답해 주지 않는 질문입니다.</p>')
A('<p>표에 넣은 시대 구분도 이해를 돕기 위한 정리입니다. 문헌이 스스로 시대를 표시한 것이 아니라, '
  '통용되는 시대 구분에 맞춰 대라천이 배치한 값입니다.</p>')
A('<p>인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>')
A('{{IMG:vietnam-coast}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 침향의 첫 한문 기록은 무엇인가요?</h3>')
A('<p>A. 교주이물지가 이른 기록으로 꼽히며, 교주의 밀향수를 이야기합니다. 남방초목상(304년)은 침향이 밀향수이고 '
  '산지가 교지라고 적었습니다.</p>')
A('<h3>Q. 교지·임읍·점성·안남은 지금의 어디인가요?</h3>')
A('<p>A. 모두 오늘날의 베트남 지역을 가리키는 옛 이름입니다. 다만 명의 문헌에 나오는 진납은 '
  '오늘날의 캄보디아 일대에 해당합니다.</p>')
A('<h3>Q. 여러 나라 기록이 같은 지역을 적은 이유는 무엇인가요?</h3>')
A('<p>A. 이 글은 문헌이 같은 방향을 가리킨다는 사실까지만 확인합니다. 그 이유가 산지의 조건인지 교역로의 구조인지는 '
  '대라천이 확인한 바가 없습니다.</p>')
A('<h3>Q. 침향은 어떤 방식으로 나라 사이를 오갔나요?</h3>')
A('<p>A. 사고파는 무역품이면서 조공품으로도 오갔습니다. 원사에 안남의 조공 기록이, 대명회전과 향승에 '
  '진납·점성 관련 기록이 남아 있습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 문헌 서술은 대라천 공식 자료(zoellife.com)와 아래 출처에 근거합니다. '
  '소개한 문헌 내용은 각 문헌의 기록을 옮긴 것이며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, '
  'Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — ' + A7 + '</li>'
  '<li>고전 문헌: 교주이물지 · 남방초목상 · 남월지 · 당본초 · 양서 · 남사 · 신당서 · 송사 · 송회요 · 본초도경 · 원사 · 대명회전 · 향승</li>'
  '<li><a href="/about-agarwood">침향의 산지와 문헌 기록 — about-agarwood</a></li>'
  '<li><a href="/blog/vietnam-vs-indonesia-agarwood-origin">베트남산과 인도네시아산 — vietnam-vs-indonesia-agarwood-origin</a></li>'
  '<li><a href="/blog/3000-years-of-agarwood-history">침향 역사 3000년 — 3000-years-of-agarwood-history</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '당·송·원·명 침향 무역 기록, 지명은 바뀌고 땅은 겹친다',
    'excerpt': '침향 무역을 적은 문헌들은 교주·교지·임읍·점성·안남처럼 서로 다른 지명을 씁니다. 대라천이 시대별 문헌과 산지를 '
               '시대별 표로 정리하고, 진납을 뺀 나머지 지명이 오늘날의 어느 지역에 해당하는지 하나씩 대응시켰습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'old-trade-ledger',
         'prompt': 'Photorealistic still life of an antique East Asian hand-stitched ledger book lying open with blank aged pages, no legible characters, beside a small brass weight and a dark resin fragment on a dark wooden desk, warm low-angle light, muted sepia and umber palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '침향 무역 기록을 떠올리게 하는 옛 장부와 침향 조각',
         'caption': '거래와 조공 기록은 역사서와 제도 문서에 함께 남았습니다.'},
        {'key': 'vietnam-coast',
         'prompt': 'Photorealistic wide landscape of a misty tropical coastal inlet with dense green forested hills meeting calm water at dawn, no boats, no buildings, no people, soft diffused morning light, muted green and grey palette, editorial travel photography, no text, no logo, no watermark',
         'alt': '옛 문헌이 침향 산지로 적은 지역에 해당하는 동남아시아 해안 풍경',
         'caption': '진납을 뺀 옛 지명은 오늘날의 베트남 지역에 해당합니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A7', 'K1'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '문헌-산지 표를 시대 축으로 재편해 3000-years 글의 표와 구조를 분리하고, 알려져 있고·전해요·여겨졌다 등 '
                 '회피 화법을 문헌 주어 서술로 교체. 출처를 특정할 수 없는 특정 국가 침향 폄하 서술은 규격서 §0에 따라 제외하고 '
                 '그 사실을 확인/미확인 절에 명시. A7(분포·등급 총설)을 오늘의 분포 연구 축으로 추가.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
