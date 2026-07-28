# -*- coding: utf-8 -*-
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(BASE, 'in/how-to-read-agarwood-certificates.json'), encoding='utf-8'))

SVG = (
'<figure>'
'<svg viewBox="0 0 660 250" width="100%" role="img" aria-label="침향 약전 규격 3개 항목 수치 비교 막대 그래프" '
'style="height:auto;font-family:sans-serif;background:#fffdf9">'
'<rect x="0" y="0" width="660" height="250" fill="#fffdf9"/>'
'<text x="24" y="32" fill="#2b2318" font-size="16" font-weight="bold">침향 약전 규격 — 대라천 관리 기준</text>'
'<text x="24" y="52" fill="#2b2318" font-size="12">가로축 0~20%, 막대 길이는 규격 수치</text>'
'<line x1="210" y1="66" x2="210" y2="200" stroke="#d9cdb8" stroke-width="1"/>'
'<rect x="210" y="76" width="160" height="26" fill="#9a6a10"/>'
'<text x="200" y="94" text-anchor="end" fill="#2b2318" font-size="13">건조감량</text>'
'<text x="380" y="94" fill="#2b2318" font-size="13">8.0% 이하</text>'
'<rect x="210" y="122" width="40" height="26" fill="#9a6a10"/>'
'<text x="200" y="140" text-anchor="end" fill="#2b2318" font-size="13">회분</text>'
'<text x="260" y="140" fill="#2b2318" font-size="13">2.0% 이하</text>'
'<rect x="210" y="168" width="360" height="26" fill="#c49a4a"/>'
'<text x="200" y="186" text-anchor="end" fill="#2b2318" font-size="13">묽은에탄올엑스</text>'
'<text x="580" y="186" fill="#2b2318" font-size="13">18.0% 이상</text>'
'<text x="24" y="228" fill="#2b2318" font-size="12">이 밖에 관능 규격: 흑갈색 · 달고 쓴맛 · 물에 가라앉음</text>'
'</svg>'
'<figcaption>대한민국약전외한약(생약)규격집의 침향 규격 항목. 단위는 %, 건조감량과 회분은 상한, 묽은에탄올엑스는 하한입니다.</figcaption>'
'</figure>'
)

TABLE = (
'<table><thead><tr><th>인증·서류</th><th>무엇을 증명하나</th><th>대라천 사례(번호)</th></tr></thead><tbody>'
'<tr><td>CITES</td><td>합법적 국제 거래 자원</td><td>부속서 등재 IIA-DNI-007</td></tr>'
'<tr><td>유전자(DNA)검사</td><td>진짜 품종(아갈로차)</td><td>DA-260507-1, 100% 일치</td></tr>'
'<tr><td>유기농(Organic)</td><td>친환경 재배·관리</td><td>TQC.19.1082-B(제품)/-A(원료)</td></tr>'
'<tr><td>HACCP</td><td>식품 위생·안전 관리</td><td>TQC.05.1082 (Codex)</td></tr>'
'<tr><td>ISO 22000:2018</td><td>식품안전경영시스템</td><td>HA 616</td></tr>'
'<tr><td>중금속 검사</td><td>유해 중금속 안전성</td><td>8종 전부 불검출(2023-08-24)</td></tr>'
'<tr><td>수지유도제 특허</td><td>식용 가능 수지 생산기술</td><td>특허 #12835 (2014 등록)</td></tr>'
'</tbody></table>'
)

LABTEST = (
'<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/'
'how-to-read-agarwood-certificates-labtest-1782959789113.png" '
'alt="실험실에서 침향 시료를 검사하는 장면 사진" />'
'<figcaption>유전자 검사와 중금속 검사는 눈으로 판단할 수 없는 항목을 수치로 남깁니다.</figcaption></figure>'
)

DISCLAIMER = (
"<hr />"
"<p style='font-size:13px;color:#7D7570'><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)와 "
"공식 문서·학술 논문에 근거해 작성되었습니다. 소개된 전통 문헌·연구 내용은 해당 출처의 기록이며 특정 효과를 보장하지 않습니다. "
"대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 예방·치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. "
"건강 상태에 따라 전문가와 상담하시기 바랍니다.</em></p>"
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 침향 인증서에서 확인할 항목은 세 가지입니다. 품종을 밝히는 유전자(DNA) 검사, '
  '합법적으로 확보한 자원임을 보여 주는 CITES, 재배와 제조 과정을 검증한 유기농·식품안전 인증입니다. '
  '조엘라이프(주)(브랜드 대라천)는 이 세 축의 서류를 발급 번호와 함께 보유하고 있으며, 요청하시면 사본으로 확인해 드립니다. '
  '서류의 모든 글자를 읽을 필요는 없습니다. 항목마다 발급 기관, 번호, 검사 날짜가 함께 적혀 있는지만 보면 됩니다.</p>')

# H2 1
A('<h2>침향 인증서는 결국 무엇을 증명하는 서류일까요?</h2>')
A('<p>침향은 겉모습과 향만으로 진위를 가리기 어려운 원료입니다. 색이 짙고 향이 좋다는 인상은 사람마다 다르게 읽힙니다. '
  '향을 입힌 값싼 나무도 처음 몇 초 동안은 그럴듯한 인상을 만들어 냅니다. 서류가 필요한 이유가 여기에 있습니다.</p>')
A('<p>인증서가 증명하는 항목은 크게 세 갈래로 나뉩니다. 첫째는 품종입니다. 이 원료가 침향의 기원식물에서 나왔는지를 유전자 수준에서 확인합니다. '
  '둘째는 합법성입니다. 국제적으로 보호받는 자원을 규정에 맞게 확보하고 거래했는지를 봅니다. '
  '셋째는 안전성입니다. 재배와 제조 과정에서 무엇을 관리했고 유해 물질 검사 결과가 어떠했는지를 확인합니다.</p>')
A('<p>대라천은 이 세 갈래를 각각 다른 기관의 서류로 채웁니다. 종이 한 장이 세 가지를 모두 증명하지는 않기 때문입니다. '
  'CITES 서류는 품질을 말해 주지 않고, 유전자 검사 결과는 위생 관리를 말해 주지 않습니다. '
  '서류를 펼쳤을 때 이 종이가 어디까지 말해 주는지를 먼저 구분하면 판단이 훨씬 빨라집니다. '
  '대라천이 서류를 항목별로 나누어 공개하는 이유도 같습니다.</p>')
A('{{IMG:certificate-papers}}')
A('<p>확인은 서류 전체를 한꺼번에 요구하는 데서 시작하지 않습니다. 세 갈래 가운데 어느 항목의 서류를 보고 싶은지 지정해 요청하면, 상대가 무엇을 가지고 있고 무엇을 가지고 있지 않은지가 곧바로 드러납니다.</p>')

# H2 2
A('<h2>CITES 서류는 무엇을 증명하나요?</h2>')
A('<p>CITES는 멸종위기에 놓인 야생 동식물의 국제 거래를 관리하는 협약입니다. 침향을 만들어 내는 아퀼라리아 속 나무도 이 협약의 관리 대상입니다. '
  '그래서 CITES 관련 서류는 해당 원목이 규정을 지켜 확보되고 거래된 자원이라는 사실을 보여 줍니다. '
  '협약의 부속서 체계와 규정 원문은 <a href="https://cites.org" target="_blank" rel="noopener">CITES 공식 사이트</a>에서 직접 확인할 수 있습니다.</p>')
A('<p>대라천은 CITES 부속서에 등재(IIA-DNI-007)돼 있으며, 베트남 동나이 산림청 관리대장으로 원목 이력을 관리합니다. '
  '등재번호가 있다는 것은 관리 체계 안에 들어와 있다는 뜻이고, 관리대장이 있다는 것은 어느 나무에서 나온 원목인지 되짚을 수 있다는 뜻입니다.</p>')
A('<p>다만 이 서류가 말해 주는 범위는 분명합니다. CITES는 합법성에 관한 증명이지 품질 등급이나 성분 함량에 관한 증명이 아닙니다. '
  'CITES 번호만 앞세우면서 품종 검사 결과와 안전성 시험 결과를 내놓지 않는다면, 확인해야 할 항목이 아직 두 개 남아 있는 셈입니다. '
  '대라천은 CITES 서류를 원료 확보 단계의 기록으로만 인용하고, 제품 품질의 근거로는 제시하지 않습니다.</p>')
A('<p>부속서 등재는 거래를 금지한다는 뜻이 아니라 관리 절차를 거쳐야 거래할 수 있다는 뜻입니다. 그래서 이 서류가 빠져 있는 침향은 절차 밖에서 들어왔을 가능성을 남깁니다.</p>')

# H2 3
A('<h2>유전자(DNA) 검사는 품종을 어떻게 확인하나요?</h2>')
A('<p>유전자 검사는 원료에서 DNA를 뽑아 표준 유전자형과 대조하는 방식입니다. 겉모습과 향처럼 사람의 감각에 기대는 판단과 달리, '
  '같은 시료를 다시 검사해도 같은 결과가 나옵니다. 판매자의 설명과 무관하게 결과가 남는다는 점이 이 검사의 쓸모입니다.</p>')
A('<p>대라천은 원목을 DowGene에 의뢰해 유전자 검사를 진행했고, Aquilaria agallocha 유전자형과 100% 일치한다는 결과를 확인했습니다'
  '(검사번호 DA-260507-1, DowGene DNA Testing). Aquilaria agallocha는 식약처 공식 문서가 침향의 기원식물로 올려 둔 학명이며, '
  '식물분류학에서 같은 종을 가리키는 정명으로는 Aquilaria malaccensis가 함께 쓰입니다.</p>')
A('<p>유전자 검사에도 증명의 경계가 있습니다. 이 결과는 품종을 확인해 줄 뿐, 수지가 얼마나 배었는지나 어떤 등급에 해당하는지까지 말해 주지는 않습니다. '
  '등급은 별도의 체계로 다루는 주제입니다. Wang Y 연구팀은 2021년 Molecules에 아퀼라리아 속의 분포와 성분, 침향 등급 체계, 수지 유도법을 '
  '정리한 리뷰를 발표했습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). '
  '대라천은 유전자 검사 결과를 품종 확인 용도로만 인용하며, 등급이나 효능의 근거로는 쓰지 않습니다.</p>')
A('<p>검사 결과를 볼 때는 검사번호와 검사 기관을 함께 확인합니다. 번호가 있어야 같은 결과를 다시 조회할 수 있고, 기관 이름이 있어야 누가 측정했는지가 기록으로 남습니다.</p>')

# H2 4
A('<h2>유기농·식품안전 인증은 어디까지 말해 주나요?</h2>')
A('<p>유기농(Organic) 인증은 농약과 화학비료에 기대지 않고 재배·관리했다는 확인입니다. 여기에 식품 위생 관리 체계 인증이 더해지면 '
  '재배부터 가공까지의 관리 상태를 서류로 따라갈 수 있습니다. 대라천이 보유한 대표 서류를 항목별로 정리하면 아래와 같습니다.</p>')
A(TABLE)
A('<p>표에서 눈여겨볼 줄은 중금속 검사입니다. 8종 불검출은 납(Pb)·카드뮴(Cd)·수은(Hg)·비소(As)·구리(Cu)·주석(Sn)·안티몬(Sb)·니켈(Ni)이 '
  '모두 검출되지 않았다는 2023년 8월 24일 검사 결과입니다. 검사 성적서를 볼 때는 항목 수와 검사 날짜를 함께 확인하는 편이 좋습니다. '
  '몇 종을 측정했는지, 언제 측정한 값인지에 따라 같은 불검출이라도 읽는 방식이 달라지기 때문입니다.</p>')
A(LABTEST)
A('<p>대라천은 인증서 사본에 적힌 발급 기관과 번호, 날짜를 가리지 않고 공개합니다. 위 표에 적은 번호는 사본에서 확인할 수 있는 값과 같으며, 요청하시면 사본으로 대조해 드립니다.</p>')

# H2 5
A('<h2>수지유도제 특허와 이력 관리는 무엇을 뜻하나요?</h2>')
A('<p>침향은 아퀼라리아 나무가 상처를 아물리는 과정에서 수지를 쌓아 만들어집니다. 이 과정을 사람이 안정적으로 돕는 기술이 수지 유도 기술입니다. '
  '인증서 묶음에서 특허 항목이 나오는 것도 이 대목입니다.</p>')
A('<p>대라천의 수지유도제 특허(#12835)는 2011년에 출원해 2014년에 등록됐습니다(등록결정 21889/QĐ-SHTT, 2014-04-08). '
  '식용 가능한 침향 수지를 만드는 기술에 관한 특허이며, 베트남 지식재산권청에 등록돼 20년간 유효합니다.</p>')
A('<p>대라천은 20~30년 유기농법으로 나무를 기르고, 20년 이상 자란 나무에 2~10년간 열대과일(노니) 발효액으로 수지를 내린 뒤 벌목해 손으로 채취합니다. '
  '원목마다 이 과정이 기록으로 남기 때문에 서류로 이력을 되짚을 수 있습니다.</p>')
A('<p>수지와 성분은 학계에서도 정리 대상이 된 주제입니다. Wang S 연구팀은 2018년 Molecules에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 '
  '총론으로 정리했습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). '
  '이 리뷰는 대라천이 수행한 연구가 아니며, 대라천 제품의 효능을 뒷받침하는 자료도 아닙니다.</p>')
A('{{IMG:lot-label}}')
A('<p>특허 등록은 그 기술이 공식 심사 절차를 통과했다는 기록입니다. 다만 특허는 기술의 등록 여부에 관한 기록이지 제품의 품질이나 효능을 판정한 결과가 아닙니다. 대라천은 특허 번호를 원료 생산 방식에 관한 설명으로만 인용합니다.</p>')

# H2 6
A('<h2>서류는 어떤 순서로 확인해야 할까요?</h2>')
A('<p>서류가 여러 장 쌓이면 어디부터 봐야 할지 막막해집니다. 순서를 정해 두면 간단해집니다.</p>')
A('<ol>'
  '<li><strong>학명·품종</strong> — 유전자 검사서나 성분분석서에 Aquilaria Agallocha Roxburgh가 적혀 있는지 봅니다.</li>'
  '<li><strong>합법성</strong> — CITES 관련 서류와 등재번호가 있는지 봅니다.</li>'
  '<li><strong>안전성</strong> — 유기농·HACCP 인증과 중금속 검사 결과가 있는지 봅니다.</li>'
  '<li><strong>이력</strong> — 제품에 Lot(로트) 번호가 붙어 이력을 조회할 수 있는지 봅니다.</li>'
  '</ol>')
A('<p>네 번째 단계에서는 규격도 함께 봅니다. 대라천은 모든 제품에 Lot 번호를 붙여 이력을 조회할 수 있게 하고, '
  '약전 규격(흑갈색·달고 쓴맛·물에 가라앉음, 건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상)을 관리 기준으로 삼습니다.</p>')
A(SVG)
A('<p>규격 항목 가운데 물에 가라앉는지 보는 관능 확인은 네 항목 중 하나일 뿐입니다. 침강 여부만으로 품종이나 등급이 정해지지는 않습니다. '
  '물컵 시연의 쓸모와 한계는 <a href="/blog/proof-in-water-cup-and-papers">물컵 침강 테스트와 서류 석 장</a>에서 따로 정리했습니다.</p>')

# H2 7
A('<h2>인증서 용어와 번호, 이만큼만 알면 됩니다</h2>')
A('<ul>'
  '<li><strong>CITES</strong>: 멸종위기 동식물의 국제 거래를 관리하는 협약입니다. 합법적으로 확보하고 거래한 자원이라는 뜻입니다.</li>'
  '<li><strong>DNA(유전자) 검사</strong>: 유전자형을 대조해 품종을 확인하는 검사입니다. 감각이 아니라 대조 결과로 남습니다.</li>'
  '<li><strong>Organic(유기농)</strong>: 농약과 화학비료에 기대지 않고 재배·관리했다는 인증입니다.</li>'
  '<li><strong>HACCP</strong>: 식품 제조 전 단계에서 위생과 안전을 관리하는 체계입니다.</li>'
  '<li><strong>Lot(로트) 번호</strong>: 생산 이력을 조회할 수 있는 고유 번호입니다.</li>'
  '</ul>')
A('<p>대라천이 갖춘 인증에는 앞의 표에 담지 않은 항목도 있습니다. ISO 13485:2016(YT 562)은 의료기기 품질 관리에 관한 국제 기준이고, '
  'ISO/IEC 17025:2017은 시험·교정 기관의 능력에 관한 기준입니다. '
  '이 밖에 OCOP 4-Star(결정번호 68/QĐ-UBND)와 US FDA 식품시설 등록(12466836220)도 보유하고 있습니다.</p>')
A('<p>인증이 많다는 사실 자체가 품질을 보장하지는 않습니다. 확인의 기준은 개수가 아니라 번호입니다. '
  '인증받았다는 문장만 있고 발급 기관과 번호, 사본이 따라오지 않는다면 판매자에게 번호를 요청하는 것이 가장 빠른 확인 방법입니다. '
  '대라천은 이 글에 적은 번호를 모두 공개하고 있으며, 사본 확인 요청에도 응합니다. '
  '더 많은 항목은 <a href="/brand-story">대라천 인증·품질 증명</a> 문서에 정리돼 있습니다.</p>')
A('<p>용어를 익히는 목적은 서류를 통째로 해독하는 데 있지 않습니다. 어떤 항목이 빠져 있는지 알아차리는 데 있습니다. 세 갈래 가운데 비어 있는 칸이 보이면 그 칸의 서류를 지목해 요청하면 됩니다.</p>')

# H2 8
A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 이 글에 적은 인증번호, 검사번호, 검사 날짜, 규격 수치를 인증서 사본과 시험성적서로 보유하고 있으며, 요청하시면 확인해 드립니다. '
  '유전자 검사는 DowGene이, 중금속 검사는 해당 시험 기관이 수행한 결과입니다. 대라천이 자체적으로 판정한 값이 아닙니다.</p>')
A('<p>반대로 대라천이 확인하지 않은 것도 분명히 밝힙니다. 이 글에 인용한 연구 논문은 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, '
  '대라천 제품의 효능을 뒷받침하는 자료가 아닙니다. 대라천 제품은 일반식품이며, 인증서와 검사 성적서는 원료의 품종과 안전성에 관한 기록일 뿐 '
  '질병의 예방이나 개선과는 관련이 없습니다.</p>')
A('<p>대라천이 서류로 확인하는 범위는 원료의 품종과 산지, 이력, 검사 항목까지입니다. 그 원료가 개인의 건강 상태에 어떤 영향을 주는지는 확인 대상이 아니며, 대라천은 그 부분을 서류로 설명하지 않습니다.</p>')
A('<p>이 구분을 굳이 한 절로 떼어 두는 이유는 단순합니다. 서류가 많아질수록 서류가 답해 주지 않는 영역도 함께 늘어나기 때문입니다. 대라천은 확인한 항목만 번호와 날짜로 제시하고, 확인하지 않은 영역은 확인하지 않았다고 적습니다.</p>')

# H2 9 FAQ
A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 인증번호가 진짜인지 어떻게 확인하나요?</h3>')
A('<p>A. 인증번호는 발급 기관이 관리합니다. 판매자가 인증서 사본과 번호를 함께 내놓을 수 있어야 대조가 가능합니다. '
  '번호 없이 인증받았다는 문장만 있다면 확인할 방법이 없습니다.</p>')
A('<h3>Q. 서류가 영어라서 못 읽겠습니다.</h3>')
A('<p>A. 모든 글자를 읽을 필요는 없습니다. CITES(합법), DNA(품종), Organic·HACCP(안전) 세 가지 키워드와 그 옆의 번호, '
  '그리고 검사 날짜만 확인해도 대부분의 판단이 가능합니다.</p>')
A('<h3>Q. 오일 함량이 높다고 적힌 서류면 더 좋은 건가요?</h3>')
A('<p>A. 함량 숫자 하나로 판단하기는 어렵습니다. 함량이 높게 적혀 있어도 어떤 오일을 어떻게 섞었는지는 그 숫자가 말해 주지 않습니다. '
  '대라천은 함량 표기보다 품종·산지·안전 서류를 먼저 대조할 것을 권합니다.</p>')
A('<h3>Q. 인증서에 적힌 날짜도 봐야 하나요?</h3>')
A('<p>A. 검사 결과에는 측정한 날짜가 함께 적힙니다. 대라천의 중금속 8종 불검출 결과에는 2023년 8월 24일이라는 날짜가 표기돼 있습니다. '
  '번호와 날짜를 함께 보면 어느 시점의 원료에 대한 결과인지 구분할 수 있습니다.</p>')
A('<h3>Q. 발급 기관을 모르겠을 때는 어떻게 하나요?</h3>')
A('<p>A. 서류마다 발급 주체가 다릅니다. CITES는 국제 협약 체계를 통해, 유기농·HACCP은 인증 기관(예: TQC GLOBAL)에서, '
  '유전자 검사는 검사 기관(예: DowGene)에서 나옵니다. 어느 기관이 발급했는지만 확인해도 서류의 성격을 가늠할 수 있습니다.</p>')
A('<h3>Q. 인증서가 많으면 진짜라고 봐도 되나요?</h3>')
A('<p>A. 서류는 판단의 근거이지 결론이 아닙니다. 학명·산지·서류를 한 세트로 묶어 보고, 각 서류에 번호와 발급 기관, 날짜가 함께 있는지까지 '
  '확인하는 편이 안전합니다.</p>')

# H2 10
A('<h2>근거·출처</h2>')
A('<p>이 글의 인증번호와 검사 결과는 대라천 공식 자료에 근거합니다. 품종 학명 기준은 식약처의 4대 공식 문서'
  '(대한민국약전외한약(생약)규격집 379p, 식품공전, 한약재 관능검사 해설서 708p, 원색 한약재감별도감)를 따릅니다.</p>')
A('<p>출처는 세 갈래로 나뉩니다. 대라천이 발급받아 보유한 인증서와 시험성적서, 식약처가 고시하거나 발간한 공식 문서, 그리고 외부 연구팀이 학술지에 발표한 리뷰 논문입니다. 앞의 둘은 대라천 원료에 관한 기록이고, 마지막 하나는 침향 일반에 관한 정리입니다. 세 갈래를 섞어 읽지 않도록 항목별로 나누어 적었습니다.</p>')
A('<ul>'
  '<li><a href="/brand-story">대라천 인증·품질 증명 (zoellife.com/brand-story)</a></li>'
  '<li><a href="/about-agarwood">진짜 침향 감별 기준 (zoellife.com/about-agarwood)</a></li>'
  '<li><a href="/products">대라천 제품·품질 규격 (zoellife.com/products)</a></li>'
  '<li><a href="https://cites.org" target="_blank" rel="noopener">CITES 멸종위기 야생동식물 국제거래협약 (cites.org)</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, “Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, '
  'Pharmacological Uses, Agarwood Grading System, and Induction Methods”, <em>Molecules</em> 26권 7708 (2021) — '
  '<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">doi.org/10.3390/molecules26247708</a></li>'
  '<li>Wang S, Yu Z, Wang C 외, “Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants”, '
  '<em>Molecules</em> 23권 342 (2018) — '
  '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">doi.org/10.3390/molecules23020342</a></li>'
  '<li>대라천 보유 추가 인증 — ISO 13485:2016(YT 562), ISO/IEC 17025:2017, OCOP 4-Star(결정번호 68/QĐ-UBND), '
  'US FDA 식품시설 등록(12466836220)</li>'
  '<li>식약처 고시 대한민국약전외한약(생약)규격집 379p / 식품공전</li>'
  '<li>식약처 발간 한약재 관능검사 해설서 708p / 원색 한약재감별도감(2009)</li>'
  '</ul>')
A(DISCLAIMER)

content = ''.join(C)

out = {
    "slug": "how-to-read-agarwood-certificates",
    "title": "침향 인증서 읽는 법 — CITES·DNA·유기농 서류 확인 순서",
    "excerpt": "침향 인증서는 품종·합법·안전 세 가지를 증명하는 서류입니다. 조엘라이프(주)는 CITES 등재번호, 유전자 검사 결과(DA-260507-1), 유기농·HACCP 인증번호를 보유하며, 어떤 순서로 무엇을 확인하면 되는지 번호와 함께 정리했습니다.",
    "tags": ["침향", "침향인증서", "CITES", "유전자검사", "유기농인증", "HACCP", "진짜침향", "대라천"],
    "content": content,
    "images": [
        {
            "key": "certificate-papers",
            "prompt": "Photorealistic overhead still life of a neat stack of official certificate documents with visible embossed seal impressions and stamp marks but no legible text, arranged on a warm walnut desk beside a few dark resinous agarwood chips and a brass magnifier, soft diffused daylight from the left, muted ivory and amber palette, shallow depth of field, editorial documentary photography, no readable text, no logo, no watermark, no people, no hands",
            "alt": "침향 인증서 서류 묶음과 침향 조각을 나란히 놓은 책상",
            "caption": "품종·합법·안전 세 갈래의 서류는 서로 다른 기관에서 나옵니다."
        },
        {
            "key": "lot-label",
            "prompt": "Photorealistic close-up of a small amber glass supplement bottle and a plain kraft carton on a linen surface, a blank white batch label strip visible on the carton side with no readable characters, natural warm side light, fine paper and glass texture, neutral cream background, shallow depth of field, editorial product photography, no text, no numbers, no logo, no watermark, no people",
            "alt": "로트 번호로 이력을 조회할 수 있는 침향 제품 포장",
            "caption": "대라천은 모든 제품에 Lot 번호를 붙여 이력을 조회할 수 있게 합니다."
        }
    ],
    "changelog": {
        "charsBefore": 0,
        "charsAfter": 0,
        "citationsAdded": ["A7", "A1", "K4"],
        "voiceFixes": 0,
        "notes": "전편 -요체를 보도자료 -습니다체로 통일하고 주어를 대라천/조엘라이프로 세움. 서류별 '증명 범위의 경계'를 명시하는 문단과 대라천 확인/미확인 책임 H2 신설, zoellife.com 절대경로를 내부 상대경로로 교체. 약전 규격 SVG 인포그래픽과 이미지 토큰 2종, A7·A1 인용 추가."
    }
}

path = os.path.join(BASE, 'out/how-to-read-agarwood-certificates.json')
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

strip = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', s)).strip()
han = lambda s: len(re.findall(r'[가-힣]', s))
print('title', len(out['title']), '| excerpt', len(out['excerpt']))
print('charsBefore', han(strip(src['content'])), '-> charsAfter', han(strip(content)))
