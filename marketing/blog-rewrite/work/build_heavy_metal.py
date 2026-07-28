import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'heavy-metal-free-safety-testing'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG), encoding='utf-8'))

DISC = re.findall(r'<p style[^>]*><em>※.*?</em></p>', src['content'], re.S)[-1]
TAIL = '<hr />' + DISC

A7 = '<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a>'
CT = '<a href="https://cites.org" target="_blank" rel="noopener">CITES 공식 사이트</a>'

TABLE = (
 '<table><thead><tr><th>번호</th><th>중금속(기호)</th><th>결과(2023-08-24)</th></tr></thead><tbody>'
 '<tr><td>1</td><td>납 (Pb)</td><td>불검출</td></tr>'
 '<tr><td>2</td><td>카드뮴 (Cd)</td><td>불검출</td></tr>'
 '<tr><td>3</td><td>수은 (Hg)</td><td>불검출</td></tr>'
 '<tr><td>4</td><td>비소 (As)</td><td>불검출</td></tr>'
 '<tr><td>5</td><td>구리 (Cu)</td><td>불검출</td></tr>'
 '<tr><td>6</td><td>주석 (Sn)</td><td>불검출</td></tr>'
 '<tr><td>7</td><td>안티몬 (Sb)</td><td>불검출</td></tr>'
 '<tr><td>8</td><td>니켈 (Ni)</td><td>불검출</td></tr>'
 '</tbody></table>'
)

SVG = (
 '<figure><svg viewBox="0 0 640 250" width="100%" role="img" '
 'aria-label="안전성 시험과 품질 인증이 무엇을 증명하고 무엇을 증명하지 않는지 나눈 도표">'
 '<rect x="0" y="0" width="640" height="250" fill="#fffdf9"/>'
 '<text x="20" y="32" font-size="17" font-weight="700" fill="#2b2318">검사와 인증이 말하는 것 · 말하지 않는 것</text>'
 '<rect x="20" y="52" width="290" height="176" fill="none" stroke="#9a6a10" stroke-width="1"/>'
 '<text x="36" y="80" font-size="14" font-weight="700" fill="#9a6a10">말하는 것 — 안전과 진품성</text>'
 '<text x="36" y="108" font-size="12" fill="#2b2318">중금속 8종 불검출 (2023-08-24)</text>'
 '<text x="36" y="132" font-size="12" fill="#2b2318">ISO/IEC 17025:2017 체계 시험</text>'
 '<text x="36" y="156" font-size="12" fill="#2b2318">DNA 유전형 100% 일치</text>'
 '<text x="36" y="180" font-size="12" fill="#2b2318">HACCP · ISO 22000:2018 · GMP</text>'
 '<text x="36" y="204" font-size="12" fill="#2b2318">Lot 번호 이력 조회</text>'
 '<rect x="330" y="52" width="290" height="176" fill="none" stroke="#2b2318" stroke-width="1"/>'
 '<text x="346" y="80" font-size="14" font-weight="700" fill="#2b2318">말하지 않는 것</text>'
 '<text x="346" y="108" font-size="12" fill="#2b2318">질병의 예방이나 치료</text>'
 '<text x="346" y="132" font-size="12" fill="#2b2318">건강상의 효과</text>'
 '<text x="346" y="156" font-size="12" fill="#2b2318">섭취 후의 변화</text>'
 '<text x="346" y="180" font-size="12" fill="#2b2318">다른 제품과의 우열</text>'
 '<text x="346" y="204" font-size="12" fill="#2b2318">향이나 성분의 품질 등급</text>'
 '</svg><figcaption>안전성 시험과 품질 인증의 범위 — 대라천 공식 자료 기준</figcaption></figure>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 조엘라이프(주)(브랜드 대라천)는 2023년 8월 24일 시험에서 납과 카드뮴, 수은을 포함한 '
  '중금속 8종이 모두 불검출됐다고 밝힙니다. 이 시험은 국제 공인 기준인 ISO/IEC 17025:2017 체계 안에서 진행됐습니다. '
  '다만 안전성 시험이 증명하는 것은 안전과 진품성이며, 건강상의 효과는 이 결과가 말해 주지 않습니다.</p>')

A('<h2>안전성 시험은 무엇을 확인하는 절차일까요?</h2>')
A('<p>안전성 시험은 제품에 해로운 성분이 기준을 넘지 않는지 확인하는 절차입니다. 있어야 할 것을 재는 검사가 아니라 '
  '없어야 할 것을 확인하는 검사입니다. 통과가 기본이고, 통과하지 못하면 출고할 수 없습니다.</p>')
A('<p>침향은 오래 자란 나무에서 나옵니다. 나무가 서 있던 토양의 성분이 원료를 거쳐 제품까지 넘어올 가능성을 '
  '배제할 수 없는 구조입니다. 자연 원료를 쓰는 제품이 공통으로 안는 조건입니다.</p>')
A('<p>그래서 확인이 필요합니다. 입에 넣는 오일 캡슐과 침향단, 침향수는 물론이고 몸에 오래 닿는 팔찌와 묵주도 '
  '같은 이유로 대상이 됩니다. 몸에 닿는 시간이 길수록 확인의 필요도 커집니다.</p>')
A('<p>대라천은 이 과정을 공식 문서로 남깁니다. 그 가운데 대표적인 결과가 중금속 8종 불검출입니다.</p>')
A('<p>검사 결과를 문서로 남기는 일에는 또 다른 의미가 있습니다. 언제, 어떤 방법으로, 무엇을 쟀는지가 남아야 '
  '나중에 그 결과를 되짚어 볼 수 있기 때문입니다.</p>')
A('<p>기록이 없으면 같은 결과도 확인할 방법이 사라집니다. 어느 시점의 어떤 시료였는지가 남지 않으면 '
  '그 값은 다시 견줄 수 없는 숫자가 됩니다.</p>')

A('<h2>중금속 8종 시험 결과는 무엇이었나요?</h2>')
A('<p>대라천이 밝힌 2023년 8월 24일 시험의 대상은 여덟 가지입니다. 납(Pb), 카드뮴(Cd), 수은(Hg), 비소(As), '
  '구리(Cu), 주석(Sn), 안티몬(Sb), 니켈(Ni)입니다.</p>')
A(TABLE)
A('<p>앞의 넷은 흔히 대표적인 중금속으로 함께 묶이는 성분이고, 뒤의 넷도 관리 대상이 되는 금속입니다. '
  '여덟 가지 모두 결과는 불검출이었습니다.</p>')
A('<p>이 성분들은 토양이나 제조 과정에서 미량으로 섞여 들어올 수 있습니다. 그래서 먹는 제품이라면 '
  '확인하는 것이 기본 절차에 듭니다.</p>')
A('<p>표의 오른쪽 칸이 모두 같은 값이라는 점 때문에 오히려 놓치기 쉬운 정보가 있습니다. 이 결과가 언제, '
  '어떤 체계 안에서 나온 값인가입니다. 다음 두 절이 그 조건을 다룹니다.</p>')
A('{{IMG:lab-testing}}')

A('<h2>불검출은 0과 같은 말일까요?</h2>')
A('<p>같은 말이 아닙니다. 불검출은 시험이 찾아낼 수 있는 최소 기준인 검출 한계보다 낮아서 잡히지 않았다는 뜻입니다.</p>')
A('<p>저울에 비유하면 이해가 쉽습니다. 아무리 예민한 저울도 눈금 아래의 무게는 표시하지 못합니다. '
  '표시되지 않았다는 사실과 무게가 0이라는 사실은 다릅니다. 저울의 성능이 답의 범위를 정합니다.</p>')
A('<p>그러므로 불검출은 절대적인 0을 증명한 값이 아닙니다. 공인된 방법으로 검사했더니 나오지 않았다는 결과입니다. 이 차이를 적어 두지 않으면 결과가 과장되기 쉽습니다.</p>')
A('<p>그럼에도 이 값이 의미를 갖는 이유는 조건이 분명하기 때문입니다. 어떤 방법으로, 어떤 한계 아래에서 쟀는지가 '
  '문서에 남아 있으면 결과를 다른 시험과 견줄 수 있습니다.</p>')
A('<p>대라천이 시험 일자와 체계를 함께 밝히는 이유가 여기에 있습니다. 불검출이라는 낱말만으로는 '
  '아무것도 확인할 수 없습니다.</p>')
A('<p>검출 한계는 시험 방법마다 다릅니다. 더 예민한 방법을 쓰면 같은 시료에서도 미량이 잡힐 수 있습니다. '
  '그래서 결과를 견줄 때는 어떤 방법을 썼는지가 함께 따라와야 합니다. 방법이 빠진 결과는 견줄 대상이 없습니다.</p>')

A('<h2>ISO/IEC 17025:2017은 무엇을 인정하는 기준일까요?</h2>')
A('<p>ISO/IEC 17025:2017은 시험과 교정을 수행하는 기관의 능력을 판정하는 국제 기준입니다. 제품을 인증하는 기준이 아니라 '
  '시험실을 판정하는 기준입니다.</p>')
A('<p>이 구분이 중요합니다. 이 기준이 말하는 것은 그 시험실이 절차를 지켜 정확하게 측정할 자격을 갖췄다는 사실입니다. '
  '제품에 어떤 성질이 있다는 뜻이 아닙니다. 시험실의 자격과 제품의 성질은 서로 다른 대상입니다.</p>')
A('<p>대라천은 TSL 안전성시험에서 이 기준을 따른다고 밝힙니다. 자체 설비로 임의로 잰 값이 아니라 '
  '공인 체계 안에서 나온 결과라는 의미입니다. 결과를 제3자가 검토할 수 있는 형태로 만든 것입니다.</p>')
A('<p>측정값의 신뢰도는 장비만으로 정해지지 않습니다. 시료를 어떻게 다루고, 결과를 어떻게 기록하며, '
  '이상이 생겼을 때 어떻게 처리하는지까지 절차로 정해져 있어야 합니다.</p>')
A('<p>그 절차 전반을 판정하는 것이 이 기준의 역할입니다. 시험 결과를 읽을 때 어느 체계에서 나왔는지를 '
  '함께 봐야 하는 이유입니다.</p>')
A('<p>같은 항목을 쟀더라도 어느 시험실에서 어떤 절차로 쟀는가에 따라 결과의 무게가 달라집니다. '
  '공인 체계는 그 무게를 판단할 근거를 제공합니다.</p>')

A('<h2>안전 말고 무엇을 더 증명할까요?</h2>')
A('<p>대라천은 안전성과 진품성을 여러 각도에서 밝힙니다. 유전자검사에서 아퀼라리아 아갈로차 유전형과 '
  '100% 일치한다는 결과가 그 하나입니다.</p>')
A('<p>국제 거래 쪽에는 CITES가 있습니다. 멸종위기에 놓인 종의 국제 거래를 관리하는 협약이며(' + CT + '), '
  '대라천은 부속서 등재와 관리대장에 따른 관리를 밝힙니다.</p>')
A('<p>제조 과정에는 HACCP과 ISO 22000:2018이, 품질경영에는 ISO 13485:2016이 적용된다고 밝힙니다. '
  '여기에 Organic 유기농 인증과 건강기능성식품 GMP, OCOP 4-Star, US FDA 식품시설 등록이 더해집니다.</p>')
A('<p>기술 쪽에는 수지유도제 특허가 있습니다. 대라천은 이 특허를 2011년에 출원해 2014년에 등록받았다고 밝히며, '
  '20년 이상 자란 나무에 열대과일 발효액으로 수지를 유도하는 기술입니다. 특허 번호는 #12835입니다.</p>')
A('<p>수지 유도라는 방식 자체는 학계에서도 다뤄집니다. Wang 연구팀은 2021년 <em>Molecules</em> 26권 7708에 '
  '아퀼라리아 속의 분포와 성분, 등급 체계, 수지 유도법을 정리한 총설을 실었습니다(' + A7 + ').</p>')
A('<p>여기에 나무마다 붙인 개별 고유번호와 Lot 이력을 더하면, 어떤 원료가 어떤 경로로 제품이 되었는지를 '
  '여러 겹으로 되짚을 수 있습니다.</p>')

A('<h2>약전 규격은 무엇을 정해 두었을까요?</h2>')
A('<p>약전 규격은 침향이 갖춰야 할 최소한의 조건을 정해 둔 기준입니다. 성상으로는 흑갈색을 띠고 '
  '달고 쓴맛이 나며 물에 가라앉아야 합니다.</p>')
A('<p>수치 기준도 있습니다. 건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상입니다. '
  '대라천은 이 기준을 충족한다고 밝힙니다. 세 항목 모두 숫자로 정해져 있어 통과 여부가 갈립니다.</p>')
A('<p>건조감량은 말렸을 때 줄어드는 무게의 비율이고, 회분은 태우고 남는 무기물의 비율입니다. '
  '묽은에탄올엑스는 에탄올로 뽑아낼 수 있는 성분의 양을 가리킵니다. 재료의 상태를 간접적으로 보여 주는 지표입니다.</p>')
A('<p>세 항목 모두 품질의 우열을 매기는 값이 아니라 통과해야 할 하한과 상한입니다. 기준을 넘겼다는 사실이 '
  '더 좋은 제품이라는 뜻으로 이어지지는 않습니다.</p>')
A('<p>모든 제품은 Lot 번호로 이력을 조회할 수 있습니다. 어떤 제품이 어떤 검사를 거쳤는지 되짚을 수 있는 통로입니다.</p>')
A('<p>약전 규격과 안전성 시험은 서로 다른 항목을 봅니다. 앞의 것은 침향이라는 재료의 조건을 보고, '
  '뒤의 것은 해로운 성분이 섞이지 않았는지를 봅니다.</p>')

A('<h2>안전과 효능은 왜 다를까요?</h2>')
A('<p>이 글에서 가장 중요한 구분입니다. 중금속 8종 불검출과 ISO/IEC 17025:2017, HACCP은 모두 안전과 진품성에 관한 정보입니다. 효능에 관한 정보가 아닙니다.</p>')
A(SVG)
A('<p>왼쪽 상자가 말하는 것은 해로운 성분이 검출되지 않았고, 표시된 품종이 맞으며, 제조 과정이 관리된다는 사실입니다. 모두 문서로 확인할 수 있는 항목입니다.</p>')
A('<p>오른쪽 상자는 이 검사들이 말하지 않는 영역입니다. 질병의 예방이나 치료, 건강상의 효과, 섭취 후의 변화가 여기에 듭니다.</p>')
A('<p>안전하다는 결과가 효과가 있다는 결론으로 이어지지 않습니다. 두 질문은 확인하는 방법 자체가 다릅니다. '
  '효과를 말하려면 사람을 대상으로 한 임상시험이 필요합니다.</p>')
A('<p>대라천 침향 제품은 일반식품이며 질병의 예방이나 치료를 위한 의약품이 아닙니다. 안전성 시험은 '
  '출발점을 확인하는 절차이지 결과를 약속하는 문서가 아닙니다.</p>')
A('<p>두 영역을 섞어 읽으면 검사 결과가 광고 문구로 바뀝니다. 대라천이 이 구분을 문서와 본문 양쪽에 '
  '반복해 적어 두는 이유입니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 중금속 8종 시험 결과와 시험 일자, 적용된 시험 체계를 공식 문서로 보유하고 있습니다. '
  '유전자검사 결과와 각종 인증, 특허 등록 사항도 마찬가지이며 요청하시면 확인해 드립니다.</p>')
A('<p>확인하지 않은 것도 분명히 적어 둡니다. 이 시험은 특정 시점의 시료를 대상으로 한 결과입니다. '
  '모든 생산분에 같은 결과가 나온다는 보장을 이 문서 하나가 대신하지는 않습니다.</p>')
A('<p>수상과 인정 역시 브랜드 활동에 대한 평가이며 제품의 효능과 무관합니다. 베트남 농업 황금브랜드 2025와 '
  'Asia Excellent Brand 2025, 한국디자인진흥원 라이프스타일 브랜드 인증이 여기에 해당합니다.</p>')
A('<p>대라천은 자사 제품의 섭취 후 변화를 확인한 자료를 보유하고 있지 않습니다. 그러한 시험을 수행한 적이 없기 때문입니다. 안전성 시험은 그 질문을 다루는 절차가 아닙니다.</p>')
A('<p>인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>')
A('{{IMG:certificate-documents}}')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 중금속 불검출은 정확히 무슨 뜻인가요?</h3>')
A('<p>A. 2023년 8월 24일 시험에서 여덟 가지 성분이 검출 한계보다 낮아 잡히지 않았다는 의미입니다. '
  '수학적인 0을 증명한 값은 아닙니다.</p>')
A('<h3>Q. ISO/IEC 17025:2017이 있으면 효과도 보장되나요?</h3>')
A('<p>A. 아닙니다. 이 기준은 시험실의 측정 능력을 판정하는 기준이며, 제품의 건강상 효과와는 관계가 없습니다.</p>')
A('<h3>Q. 시험 결과는 어떻게 확인할 수 있나요?</h3>')
A('<p>A. 대라천은 모든 제품에 Lot 번호를 부여해 이력을 조회할 수 있도록 하고 있으며, 요청하시면 시험 문서를 확인해 드립니다.</p>')
A('<h3>Q. 한 번의 시험으로 모든 제품이 안전하다고 볼 수 있나요?</h3>')
A('<p>A. 그렇게 볼 수 없습니다. 시험은 특정 시점의 시료를 대상으로 하며, 생산분마다 이력을 따로 관리합니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>이 글의 시험 결과와 인증 사항은 대라천 공식 자료(zoellife.com)에 근거합니다. '
  '소개한 연구 내용은 해당 연구팀의 결과이며, 특정 효과를 주장하지 않습니다.</p>')
A('<ul>'
  '<li>대라천 시험 자료: 중금속 8종 불검출(2023-08-24) · ISO/IEC 17025:2017 체계 · DNA 유전형 100% 일치 · 수지유도제 특허 #12835</li>'
  '<li><a href="https://cites.org" target="_blank" rel="noopener">CITES — 멸종위기 야생동식물 국제거래협약</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile '
  'Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — '
  + A7 + '</li>'
  '<li><a href="/about-agarwood">침향 성분·연구·문헌 자료 — about-agarwood</a></li>'
  '<li><a href="/blog/how-to-read-agarwood-certificates">서류 읽는 법 — how-to-read-agarwood-certificates</a></li>'
  '<li><a href="/blog/individual-tree-id-traceability">개별 고유번호 이력 — individual-tree-id-traceability</a></li>'
  '</ul>')

content = ''.join(C) + TAIL

def strip(h):
    t = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', t))

out = {
    'slug': SLUG,
    'title': '중금속 8종 불검출, 안전성 시험이 말하는 것과 말하지 않는 것',
    'excerpt': '대라천은 2023년 8월 24일 시험에서 중금속 8종이 모두 불검출됐다고 밝힙니다. 이 결과가 ISO/IEC 17025:2017 '
               '체계에서 무엇을 확인한 값인지, 그리고 어디까지는 말해 주지 않는지를 함께 정리했습니다.',
    'tags': src['tags'],
    'content': content,
    'images': [
        {'key': 'lab-testing',
         'prompt': 'Photorealistic still life of a clean analytical laboratory bench with sample preparation glassware and a rack of small vials, stainless instrument out of focus behind, cool neutral lighting, shallow depth of field, muted steel and white palette, editorial science photography, no text, no logo, no watermark, no people',
         'alt': '중금속 8종 안전성 시험이 이루어지는 시험실 환경',
         'caption': '시험 결과는 어느 체계에서 나왔는지와 함께 읽어야 합니다.'},
        {'key': 'certificate-documents',
         'prompt': 'Photorealistic overhead still life of a neat stack of plain official-looking documents with blank unreadable pages and a small magnifying glass resting on top, on a dark wooden desk, warm side light, shallow depth of field, muted ivory and walnut palette, editorial photography, no text, no logo, no watermark, no people',
         'alt': '시험 성적서와 인증 서류를 확인하는 모습',
         'caption': '문서에 남은 조건이 결과를 되짚을 수 있게 합니다.'},
    ],
    'changelog': {
        'charsBefore': len(strip(src['content'])),
        'charsAfter': len(strip(content)),
        'citationsAdded': ['A7', 'K4'],
        'voiceFixes': len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는)', strip(content))),
        'notes': '중금속 8종 목록이 세 절에 반복되던 구조를 하나로 합치고, 안전과 효능의 구분을 SVG 대비 도표로 승격. '
                 '불검출이 수학적 0이 아니라는 설명과 시험이 특정 시점 시료 대상이라는 한계를 본문과 FAQ에 명시. '
                 '수상·인정 항목은 효능과 무관하다는 점을 확인/미확인 절로 이동.',
    },
}

path = os.path.join(BASE, 'out/%s.json' % SLUG)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
