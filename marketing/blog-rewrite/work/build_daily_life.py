import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-in-daily-life-through-history'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A1 = '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a>'

TABLE = (
 '<table><thead><tr><th>옛 기록의 쓰임</th><th>오늘의 형태</th><th>대라천 제품에서는</th></tr></thead><tbody>'
 '<tr><td>옷에 향이 배게 두기</td><td>옷장 향 주머니, 향낭</td><td>침향 원목·스틱을 옷장 한켠에</td></tr>'
 '<tr><td>잠자리에 향 뿌리기</td><td>리넨 워터, 필로 미스트</td><td>침향수를 분무해 은은하게</td></tr>'
 '<tr><td>방 안을 향으로 채우기</td><td>룸 스프레이, 디퓨저</td><td>침향수 가습기 취수, 침향 선향</td></tr>'
 '<tr><td>몸단장에 향 더하기</td><td>바디 미스트, 향 오일</td><td>침향 오일 소량 활용</td></tr>'
 '</tbody></table>'
)

SVG = (
 '<figure><svg viewBox="0 0 640 230" width="100%" role="img" '
 'aria-label="침향을 향으로 쓰는 세 형태의 사용 방식과 확인 항목을 정리한 도표">'
 '<rect x="0" y="0" width="640" height="230" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">향으로 쓰는 세 형태 — 방식과 확인 항목</text>'
 '<rect x="20" y="52" width="190" height="150" fill="none" stroke="#9a6a10" stroke-width="1"/>'
 '<text x="34" y="78" font-size="14" font-weight="700" fill="#9a6a10">침향수</text>'
 '<text x="34" y="104" font-size="12" fill="#2b2318">분무 · 가습기 취수</text>'
 '<text x="34" y="126" font-size="12" fill="#2b2318">음용 표기 하루 약 20ml</text>'
 '<text x="34" y="148" font-size="12" fill="#2b2318">개봉 후 냉장 보관</text>'
 '<rect x="226" y="52" width="190" height="150" fill="none" stroke="#9a6a10" stroke-width="1"/>'
 '<text x="240" y="78" font-size="14" font-weight="700" fill="#9a6a10">침향 선향</text>'
 '<text x="240" y="104" font-size="12" fill="#2b2318">간접 취향 전용</text>'
 '<text x="240" y="126" font-size="12" fill="#2b2318">직접 들이마시지 않음</text>'
 '<text x="240" y="148" font-size="12" fill="#2b2318">12세 미만·임산부 비권장</text>'
 '<rect x="432" y="52" width="188" height="150" fill="none" stroke="#2b2318" stroke-width="1"/>'
 '<text x="446" y="78" font-size="14" font-weight="700" fill="#2b2318">원목 스틱</text>'
 '<text x="446" y="104" font-size="12" fill="#2b2318">그대로 두어 향을 냄</text>'
 '<text x="446" y="126" font-size="12" fill="#2b2318">온열판에 소량 사용</text>'
 '<text x="446" y="148" font-size="12" fill="#2b2318">사르지 않는 방식</text>'
 '</svg><figcaption>향으로 쓰는 세 형태의 사용 방식 — 출처: 대라천 제품 안내 표기</figcaption></figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 옛 기록 속 침향은 의례용으로만 쓰이지 않았습니다. 성경은 왕의 옷에 밴 향으로, '
  '침상에 뿌린 향으로 침향을 적었습니다. 조엘라이프(주)(브랜드 대라천)는 이 대목을 오늘의 향 제품과 나란히 놓아 형태를 견주되, '
  '향이 사람에게 어떤 변화를 준다는 서술은 이 글에 넣지 않았습니다.</p>')

A('<h2>옛 기록은 옷과 침상의 향을 어떻게 적었을까요?</h2>')
A('<p>성경 시편은 왕의 모든 옷에 몰약과 침향과 육계의 향기가 있다고 적었습니다. 의례의 자리가 아니라 '
  '입는 옷에 밴 향으로 기록된 대목입니다.</p>')
A('<p>잠언은 침상에 요와 무늬 있는 이불을 펴고 몰약과 침향과 계피를 뿌렸다고 적었습니다. 잠자리라는 '
  '가장 사적인 공간이 향의 자리로 등장합니다.</p>')
A('<p>두 대목의 공통점은 향이 놓인 위치입니다. 제단이나 예식이 아니라 옷과 침구, 곧 몸에 닿는 물건입니다. '
  '향을 생활 안으로 들여놓은 기록으로 읽을 수 있습니다.</p>')
A('<p>다만 짚어 둘 점이 있습니다. 이 구절들의 침향은 원문에서 aloes로 적혀 있고, 오늘날의 침향나무인 Aquilaria로 읽는 것은 '
  '오래된 전통적 해석입니다. 백단향 같은 다른 향목으로 보는 학술적 견해도 함께 있습니다.</p>')
A('<p>두 구절이 놓인 문맥도 서로 다릅니다. 시편은 왕을 향한 찬사의 한복판에 향을 두었고, 잠언은 어떤 상황을 묘사하는 장면에서 '
  '향을 등장시킵니다. 같은 재료가 칭송과 묘사 양쪽에 쓰인 셈입니다.</p>')
A('<p>대라천은 번역어의 지시 대상을 확정하지 않습니다. 옛 기록에 등장하는 귀한 향 가운데 하나라는 선에서 '
  '이 구절들을 읽는 편이 정확합니다.</p>')

A('<h2>왜 오래 남는 향이 옷과 침구에 쓰였을까요?</h2>')
A('<p>옷과 이불은 오래 곁에 두는 물건입니다. 금세 옅어지는 향보다 늦게까지 남는 향이 이 자리에 어울립니다. '
  '침향이 놓인 위치를 실용적인 조건으로 설명할 수 있는 지점입니다.</p>')
A('<p>침향은 침향나무가 상처를 아물리는 동안 수지를 오래 쌓아 굳힌 부분입니다. Wang 연구팀은 2018년 '
  '<em>Molecules</em> 23권 342에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 정리한 총설을 실었습니다(' + A1 + ').</p>')
A('<p>대라천은 이 연구를 재료의 성분 계열을 설명하는 근거로만 인용합니다. 향이 오래 남는 이유를 성분과 연결해 '
  '단정하지 않으며, 제품의 효능과도 연결하지 않습니다.</p>')
A('<p>귀한 재료가 가까운 자리에 놓였다는 사실은 신분의 문제이기도 합니다. 시편이 적은 것은 왕의 옷이고, '
  '잠언이 적은 것은 무늬 있는 이불을 갖춘 침상입니다.</p>')
A('<p>모두가 이렇게 쓸 수 있었다는 뜻은 아닙니다. 옛 기록에 남은 향의 일상은 그 일상을 누릴 수 있던 사람들의 것이었고, '
  '이 점을 빼고 읽으면 기록이 실제보다 넓어집니다.</p>')

A('<h2>옛 쓰임과 오늘의 형태를 나란히 놓으면</h2>')
A('<p>기록에 적힌 쓰임을 오늘의 제품 형태와 견주면 아래와 같습니다. 왼쪽 칸은 문헌의 서술이고, '
  '오른쪽 두 칸은 오늘의 형태입니다.</p>')
A(TABLE)
A('<p>표의 가로줄을 읽으면 대응이 단순합니다. 옷에 향을 배게 하던 방식은 향 주머니로, 침상에 뿌리던 방식은 '
  '리넨 워터로 이어집니다. 도구가 달라졌을 뿐 놓이는 자리는 같습니다.</p>')
A('<p>다른 점도 분명합니다. 옛 기록의 향은 소수만 쓸 수 있었고, 오늘의 형태는 그렇지 않습니다. '
  '대라천은 이 차이를 접근성의 변화로만 적고, 향의 성질이 같아졌다는 뜻으로 쓰지 않습니다.</p>')
A('<p>표는 형태의 대응을 보여 주는 장치이며 새 근거가 아닙니다. 왼쪽 칸의 근거는 성경의 해당 구절이고, '
  '오른쪽 칸의 근거는 제품 안내 표기입니다.</p>')
A('{{IMG:linen-and-wood}}')

A('<h2>향으로 쓰는 세 형태는 어떻게 다를까요?</h2>')
A('<p>대라천 자료는 침향을 향으로 쓰는 형태를 셋으로 안내합니다. 침향수, 침향 선향, 침향 원목 스틱입니다.</p>')
A(SVG)
A('<p>침향수는 분무기나 가습기에 넣어 공간에 쓰는 형태입니다. 음용 표기는 하루 약 20ml이며, 개봉한 뒤에는 '
  '냉장 보관이 함께 적혀 있습니다.</p>')
A('<p>침향 선향은 향을 사른 뒤 간접적으로 즐기는 전용 제품입니다. 연기를 직접 들이마시는 방식은 권장되지 않습니다. '
  '12세 미만 어린이와 임산부에게도 권장되지 않는 제품입니다.</p>')
A('<p>침향 원목 스틱은 그대로 두어 향을 내거나 온열판에 소량 올려 쓰는 형태입니다. 사르지 않는 방식이라 '
  '앞의 둘과 다루는 방법이 다릅니다. 불을 쓰지 않으므로 사용하는 자리의 조건도 달라집니다.</p>')
A('<p>세 형태는 향이 나오는 방식부터 다릅니다. 침향수는 물방울로 퍼뜨리고, 선향은 사른 뒤 공기 중으로 퍼지며, '
  '원목 스틱은 재료가 그 자리에 놓인 채 향을 냅니다.</p>')
A('<p>세 형태 모두 제품별 안내 표기가 우선입니다. 대라천은 형태를 바꿔 쓰거나 표기를 넘겨 쓰는 방식을 안내하지 않습니다.</p>')

A('<h2>먹는 침향과 향으로 쓰는 침향은 같은가요?</h2>')
A('<p>원료는 같은 침향이지만 제품의 쓰임이 다릅니다. 선향과 원목 스틱은 향을 즐기는 용도이고, '
  '오일 캡슐과 환, 차는 섭취하는 제품입니다.</p>')
A('<p>이 구분은 표기에서도 갈립니다. 섭취 제품에는 섭취 기준이 적혀 있고, 향 제품에는 사용 방식과 '
  '권장되지 않는 대상이 적혀 있습니다. 서로 바꿔 적용할 수 있는 항목이 아닙니다.</p>')
A('<p>침향수는 두 쪽에 걸쳐 있는 형태입니다. 음용 표기와 공간 사용 표기가 함께 있으므로, '
  '어느 쪽으로 쓰든 해당 표기를 확인하는 절차가 먼저입니다.</p>')
A('<p>대라천은 같은 원료라는 사실을 근거로 쓰임을 넘나드는 안내를 하지 않습니다. 제품이 나뉘어 있는 이유는 '
  '표기가 나뉘어 있기 때문입니다.</p>')
A('<p>형태가 다르면 확인할 항목도 달라집니다. 섭취 제품은 양과 시점을 보고, 향 제품은 사용 방식과 대상 제한을 봅니다. '
  '표기의 종류 자체가 갈리는 지점입니다.</p>')
A('<p>옛 기록도 두 쓰임을 함께 남겼습니다. 옷과 침상의 향이 한쪽이고, 옛 의서에 실린 약재 항목이 다른 쪽입니다. '
  '기록 안에서도 두 경로는 구분돼 있었습니다. 오늘의 제품 구분은 그 오래된 구분을 표기로 옮겨 놓은 형태에 가깝습니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 성경 시편과 잠언의 해당 구절을 공개 자료에서 대조했고, 세 가지 향 제품의 사용 방식과 '
  '권장되지 않는 대상 표기를 제품 안내에서 확인했습니다.</p>')
A('<p>확인하지 않은 것을 분명히 적어 둡니다. 성경 번역어가 오늘날의 침향과 같은 향목인지 대라천은 확정하지 않았습니다. '
  '두 견해가 병존하는 상태 그대로를 옮겼습니다.</p>')
A('<p>향이 사람의 기분이나 수면에 어떤 변화를 주는지에 대해서도 대라천은 확인한 바가 없습니다. '
  '그래서 이 글에는 향을 맡으면 어떻게 된다는 서술이 들어 있지 않습니다.</p>')
A('<p>이전 자료에는 향으로 마음이 편안해진다는 취지의 서술이 있었으나, 확인 가능한 근거를 특정할 수 없어 '
  '이번 글에서는 싣지 않았습니다.</p>')
A('<p>표에 적은 옛 쓰임과 오늘 형태의 대응도 대라천이 이 글을 위해 묶은 것입니다. 문헌이 그렇게 대응시킨 것이 아니므로, '
  '다른 기준으로 묶으면 다른 표가 나옵니다. 표는 이해를 돕는 장치일 뿐 근거가 아닙니다.</p>')
A('<p>인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>')
A('{{IMG:wardrobe-sachet}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 옛 기록에 침향을 잠자리에 뿌렸다고 나오나요?</h3>')
A('<p>A. 성경 잠언에 침상에 몰약과 침향과 계피를 뿌렸다는 구절이 있습니다. 다만 번역어가 오늘날의 침향과 같은 향목인지에는 '
  '다른 견해가 함께 있습니다.</p>')
A('<h3>Q. 침향수는 어떻게 쓰나요?</h3>')
A('<p>A. 분무기나 가습기로 공간에 쓰는 방식과 하루 약 20ml 음용 방식이 함께 표기돼 있습니다. '
  '개봉한 뒤에는 냉장 보관 표기를 따르시면 됩니다.</p>')
A('<h3>Q. 침향 선향은 직접 들이마셔도 되나요?</h3>')
A('<p>A. 간접 취향 전용 제품입니다. 직접 들이마시는 방식은 권장되지 않으며, 12세 미만 어린이와 임산부에게도 '
  '권장되지 않습니다.</p>')
A('<h3>Q. 향으로 쓰는 침향과 먹는 침향은 다른가요?</h3>')
A('<p>A. 원료는 같지만 제품의 쓰임과 표기가 다릅니다. 각 제품의 안내에 맞게 사용하시기 바랍니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 문헌 서술과 제품 사용 방식은 대라천 공식 자료(zoellife.com)와 아래 출처에 근거합니다. '
  '소개한 문헌 내용은 해당 기록을 옮긴 것이며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", '
  '<em>Molecules</em> 23권 342 (2018) — ' + A1 + '</li>'
  '<li>고전 기록: 성경 시편(왕의 옷에 밴 향) · 잠언(침상에 뿌린 향)</li>'
  '<li><a href="/products">침향수·침향 선향 등 라인업</a></li>'
  '<li><a href="/about-agarwood">침향의 역사와 향 문화 — about-agarwood</a></li>'
  '<li><a href="/blog/agarwood-in-bible-and-buddhist-scriptures">성경과 불경 속 침향 — agarwood-in-bible-and-buddhist-scriptures</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '옷과 침상의 침향, 옛 기록의 향 쓰임을 오늘 형태와 견주다',
    'excerpt': '성경은 왕의 옷에 밴 향과 침상에 뿌린 향으로 침향을 적었습니다. 대라천이 그 대목을 오늘의 향 제품 형태와 '
               '나란히 놓아 견주고, 침향수·침향 선향·원목 스틱의 사용 표기와 권장되지 않는 대상까지 함께 정리했습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'linen-and-wood',
         'prompt': 'Photorealistic still life of neatly folded pale linen bedding on a wooden bench with a small dark resinous wood chip resting on top, soft diffused morning light, shallow depth of field, muted ivory and warm grey palette, editorial interior photography, no text, no logo, no watermark, no people',
         'alt': '침상에 뿌린 향이라는 옛 기록을 떠올리게 하는 리넨과 침향 조각',
         'caption': '옛 기록의 향은 제단이 아니라 몸에 닿는 물건에 놓였습니다.'},
        {'key': 'wardrobe-sachet',
         'prompt': 'Photorealistic still life of a small cloth sachet and a slim dark wooden stick placed on folded clothes inside an open wooden wardrobe shelf, warm soft indoor light, shallow depth of field, muted beige and walnut palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '옷장 한켠에 둔 향 주머니와 침향 원목 스틱',
         'caption': '옷에 향을 배게 하던 방식은 오늘의 향 주머니로 이어집니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A1'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '향이 마음을 다독인다·긴장을 푼다는 취지의 절 전체를 규격서 §F에 따라 삭제하고, 그 자리를 옛 기록의 신분 조건과 '
                 '제품 표기 서술로 대체. 해요체 권유 문체를 보도자료 인칭으로 전환하고 전해집니다·여겨졌다 등 회피 화법 제거. '
                 '선향 12세 미만·임산부 비권장 표기를 본문 절과 SVG로 끌어올림.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
