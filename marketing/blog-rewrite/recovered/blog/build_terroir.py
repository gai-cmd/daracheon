import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(BASE, 'in/terroir-shapes-agarwood-5-vietnam-farms.json')))

def korean_chars(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return len(re.sub(r'\s+', '', t))

# preserve the source farm-location SVG byte-identically (spec D: <svg> 내부 바이트 동일)
MAP_SVG = re.findall(r'<svg.*?</svg>', src['content'], flags=re.S)
assert len(MAP_SVG) == 1, MAP_SVG
MAP_SVG = MAP_SVG[0]

title = "침향에도 떼루아가 있나요 — 베트남 5개 농장의 땅과 향"

excerpt = ("조엘라이프(주)는 베트남 하띤·람동·푸꾸옥·냐짱·동나이 다섯 곳에서 아갈로차 한 품종을 기릅니다. "
           "침향 떼루아라 부를 만한 농장별 재배 조건과 대라천의 관능 묘사, 그리고 학술 문헌이 실제로 확인한 범위를 구분해 정리했습니다.")

content = """<p class="lead"><strong>결론부터.</strong> 조엘라이프(주)(브랜드 대라천)는 베트남 하띤·람동·푸꾸옥·냐짱·동나이 다섯 곳에서 아퀼라리아 아갈로차 한 품종만 기릅니다. 다섯 농장은 토양과 기후, 나무의 수령이 서로 다릅니다. 다만 침향 떼루아라는 표현에는 선을 그어야 합니다. 이 글의 농장별 향 묘사는 대라천의 재배 기록과 관능 묘사이며, 특정 토양이 특정 향을 만든다는 인과는 대라천이 시험으로 확인한 사실이 아닙니다.</p><p>아래에서는 다섯 농장의 위치와 규모, 대라천이 기록한 재배 조건, 그리고 성분에 관해 학술 문헌이 다룬 범위를 차례로 구분해 정리합니다. 면적과 그루 수, 수령은 조엘라이프(주)의 농장 관리 기록에 적힌 값입니다.</p>

<h2>침향 떼루아라는 말을 어디까지 쓸 수 있나요?</h2><p>와인과 커피에서 떼루아는 같은 품종이라도 자란 땅과 기후에 따라 결과물이 달라진다는 뜻으로 쓰입니다. 침향에 이 말을 옮겨 쓸 때는 확인된 부분과 확인되지 않은 부분을 갈라야 합니다.</p><p>침향의 성분 조성이 하나로 고정된 값이 아니라는 점은 여러 연구팀이 다뤘습니다. Wang 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 지리적 분포와 휘발성·비휘발성 성분, 침향 등급 체계, 수지 유도법을 종합 정리했습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). Wang 연구팀은 2025년 <em>Journal of Essential Oil Research</em>에 추출 방법이 침향 오일의 수율과 화학 조성, 생물 활성에 미치는 영향을 검토했습니다(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>).</p><p>산지가 다른 침향을 직접 견주어 본 국내 연구도 있습니다. 신광호 연구팀은 2011년 <em>대한본초학회지</em>에 베트남산·인도네시아산·미얀마산 침향 시료를 GC-MS로 분석한 결과를 실었고, 시료에 따라 주요 성분의 함량이 다르게 나타났다고 보고했습니다(<a href="https://koreascience.kr/article/JAKO201122238508185.pdf" target="_blank" rel="noopener">원문 PDF</a>).</p><p>세 논문 모두 대라천이 수행한 연구가 아니라 해당 연구팀의 결과입니다. 그리고 신광호 연구팀이 견준 대상은 국가 단위의 산지이지 대라천 농장 다섯 곳이 아닙니다. 세 논문 어느 쪽도 '어떤 토양이 어떤 향을 만든다'를 검증한 자료가 아닙니다. 대라천은 이 문헌들을 성분 조성이 조건에 따라 달라진다는 배경 설명으로만 인용하고, 농장별 향의 차이는 아래에서 자사 기록과 관능 묘사로 구분해 적습니다.</p>

<h2>대라천의 다섯 농장은 어디에 있나요?</h2><p>조엘라이프(주)는 베트남 다섯 지역에 약 200헥타르(약 60만 평), 약 400만 그루 규모의 직영 농장을 운영합니다. 위치를 개념도로 표시하면 다음과 같습니다.</p><figure>__MAP_SVG__<figcaption>대라천 직영 농장 다섯 곳의 개념도. 지역명과 특징은 조엘라이프(주)의 농장 관리 기록에서 옮겼습니다.</figcaption></figure><p>다섯 곳 가운데 람동 농장 한 곳이 약 158헥타르를 차지하고, 나머지 면적이 하띤·푸꾸옥·냐짱·동나이에 나뉘어 있습니다. 농장 규모와 지역별 역할은 <a href="/blog/vietnam-5-farms-200ha-4million-trees">베트남 직영 농장 다섯 곳</a>에 따로 정리했습니다.</p><p>지도의 위치는 개념도이며 실제 좌표가 아닙니다. 다섯 지역이 베트남 북부에서 남부까지 흩어져 있다는 사실만 이 그림에서 읽으시면 됩니다.</p><p>다섯 지역은 위도와 고도가 제각각입니다. 하띤은 북부 내륙, 냐짱과 람동은 중남부, 동나이는 남부 평지, 푸꾸옥은 남서쪽 섬에 있습니다. 대라천이 한 지역을 골라 규모를 키우는 대신 이렇게 흩어 심은 이유는 뒤에서 따로 설명합니다.</p><p>농장은 모두 조엘라이프(주)가 직접 관리합니다. 임차한 땅에서 원목을 사들이는 구조가 아니어서, 대라천은 나무마다 심은 시점과 자란 위치를 자사 기록으로 대조할 수 있습니다.</p>

<h2>농장별 재배 조건은 어떻게 다른가요?</h2><p>대라천이 농장 관리 기록에 남긴 조건과, 그 조건에서 얻은 원료에 대라천이 붙인 관능 묘사를 나란히 놓았습니다. 오른쪽 열은 성분 분석 결과가 아니라 대라천의 감각적 서술입니다.</p><table><thead><tr><th style='background:#b88c2d;color:#fff;padding:8px;text-align:left'>농장</th><th style='background:#b88c2d;color:#fff;padding:8px;text-align:left'>대라천이 기록한 땅·기후 조건</th><th style='background:#b88c2d;color:#fff;padding:8px;text-align:left'>대라천의 관능 묘사</th></tr></thead><tbody><tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>하띤 (Ha Tinh)</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>예로부터 야생 침향이 나던 전통 산지</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>깊고 묵직한 정통의 향</td></tr><tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>람동 (Lam Dong)</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>고지대의 서늘한 기후, 비옥한 토양 (약 158ha)</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>균일하고 건강하게 자란 결</td></tr><tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>푸꾸옥 (Phu Quoc)</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>100년 이상 고수령 침향목과 50년생 공존</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>세월이 밴 밀도 높은 향</td></tr><tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>냐짱 (Nha Trang)</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>오랜 관리로 굵게 자란 성목</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>밀도 있는 안정된 향</td></tr><tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>동나이 (Dong Nai)</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>미네랄 풍부한 현무암 토양</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>깊고 묵직하며 지속력 좋은 오일향</td></tr></tbody></table><p>왼쪽 두 열은 대라천이 문서로 대조할 수 있는 항목입니다. 오른쪽 열은 그렇지 않습니다. 향에 대한 표현은 사람마다 다르게 느껴지며, 대라천은 이 묘사를 품질의 우열을 가리는 기준으로 제시하지 않습니다.</p><p>표를 읽는 순서를 뒤집어 보셔도 좋습니다. 오른쪽 열의 묘사에서 왼쪽 조건을 역으로 추론하는 방식은 성립하지 않습니다. 대라천이 문서로 대조할 수 있는 것은 어디까지나 왼쪽이고, 오른쪽은 그 원료를 다룬 사람의 서술입니다.</p>

<h2>동나이와 푸꾸옥은 조건이 어떻게 다른가요?</h2><p>동나이 농장은 현무암 토양 위에 조성됐습니다. 현무암 토양은 미네랄이 많고 물이 잘 빠지며 공기가 잘 통해, 뿌리가 뻗기에 유리한 조건입니다. 대라천은 이 농장의 수지 밀도가 높은 편이고 오일로 뽑았을 때 향이 오래 남는다고 기록하고 있습니다. 다만 이 기록은 대라천의 자체 관찰이며, 현무암 토양과 향 지속력의 인과를 계량한 시험 결과가 아닙니다.</p>{{IMG:basalt-soil}}<p>푸꾸옥 농장에는 100년이 넘는 고수령 침향목과 50년생 나무가 함께 있습니다. 수지는 오랜 시간에 걸쳐 조금씩 쌓이므로, 수령이 높은 나무일수록 수량이 적고 대체하기 어렵습니다. 희소성은 시간이라는 조건에서 곧바로 따라 나오는 결과입니다.</p><p>두 농장을 나란히 놓으면 조건의 축이 서로 다르다는 점이 드러납니다. 동나이는 토양, 푸꾸옥은 시간입니다. 대라천은 두 축을 각각 기록할 뿐, 어느 쪽이 더 나은 원료를 만든다고 정리하지 않습니다.</p>{{IMG:old-growth-phuquoc}}<figure><svg viewBox="0 0 640 260" width="100%" role="img" aria-label="대라천 직영 농장의 면적과 푸꾸옥 농장 침향목 수령을 나타낸 도표"><rect x="0" y="0" width="640" height="260" fill="#fffdf9"/><text x="20" y="32" font-size="18" font-weight="700" fill="#2b2318">농장 면적(ha)과 푸꾸옥 침향목 수령(년)</text><text x="20" y="72" font-size="13" fill="#2b2318">다섯 농장 합계</text><rect x="170" y="58" width="420" height="22" rx="4" fill="#9a6a10"/><text x="580" y="75" font-size="13" font-weight="700" fill="#fffdf9" text-anchor="end">약 200 ha</text><text x="20" y="110" font-size="13" fill="#2b2318">람동 농장</text><rect x="170" y="96" width="332" height="22" rx="4" fill="#c9a24a"/><text x="492" y="113" font-size="13" font-weight="700" fill="#2b2318" text-anchor="end">약 158 ha</text><line x1="20" y1="138" x2="620" y2="138" stroke="#e5ded3" stroke-width="1"/><text x="20" y="172" font-size="13" fill="#2b2318">푸꾸옥 노거수</text><rect x="170" y="158" width="420" height="22" rx="4" fill="#9a6a10"/><text x="580" y="175" font-size="13" font-weight="700" fill="#fffdf9" text-anchor="end">100년 이상</text><text x="20" y="210" font-size="13" fill="#2b2318">푸꾸옥 병존 수령</text><rect x="170" y="196" width="210" height="22" rx="4" fill="#c9a24a"/><text x="370" y="213" font-size="13" font-weight="700" fill="#2b2318" text-anchor="end">50년생</text><text x="20" y="244" font-size="13" fill="#2b2318">식재 그루 수 합계</text><text x="170" y="247" font-size="20" font-weight="700" fill="#9a6a10">약 400만 그루</text></svg><figcaption>단위: 면적은 헥타르(ha), 수령은 연(年). 수치 출처: 조엘라이프(주)의 농장 관리 기록.</figcaption></figure>

<h2>하띤·람동·냐짱의 조건은 무엇인가요?</h2><p>하띤은 야생 침향이 나던 전통 산지에 자리합니다. 대라천은 이 지역의 기후와 토양을 농장 조성의 기준으로 삼았고, 그곳에서 얻은 원료를 깊고 묵직한 향으로 묘사합니다. 산지의 내력은 대라천 자료가 밝히는 조성 배경이며, 향의 품질을 보증하는 근거는 아닙니다.</p><p>람동은 약 158헥타르에 이르는 대라천의 최대 거점입니다. 고지대라 기후가 서늘하고 토양이 비옥합니다. 넓은 부지 덕분에 나무를 구역별로 나누어 관리하고 수확 시점을 조절하기에 유리합니다.</p><p>냐짱에는 오랜 관리 끝에 굵게 자란 성목이 자리합니다. 줄기 직경이 굵다는 것은 그만큼 생장 기간이 쌓였다는 뜻이고, 수지가 침착될 목질부가 넓다는 뜻이기도 합니다. 수령과 굵기는 대라천이 식재 기록으로 확인할 수 있는 항목입니다.</p><p>세 농장을 묶어 보면 대라천이 기록하는 항목이 무엇인지 분명해집니다. 산지의 내력, 고도와 기후, 부지 면적, 줄기 굵기와 수령입니다. 향에 대한 표현은 이 항목들에서 자동으로 도출되지 않으며, 대라천은 둘을 같은 칸에 적지 않습니다.</p><figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/terroir-shapes-agarwood-5-vietnam-farms-highland-1782976576658.png" alt="침향 떼루아를 이루는 고지대 서늘한 기후의 침향 농장 능선 풍경" /><figcaption>람동 농장은 고지대의 서늘한 기후에 자리합니다.</figcaption></figure>

<h2>같은 아갈로차인데 왜 다르게 느껴질까요?</h2><p>다섯 농장의 나무는 모두 대라천이 원료로 쓰는 같은 품종, 아퀼라리아 아갈로차 록스버그(Aquilaria agallocha Roxb.)입니다. 아갈로차는 오래 쓰여 온 이름이고, 식물학적으로는 정명(正名)인 아퀼라리아 말라켄시스(A. malaccensis)의 이명(異名)으로 정리됩니다.</p><p>품종이 같아도 심은 땅과 기후, 자란 햇수는 농장마다 다릅니다. 향의 차이를 그중 어떤 요인이 얼마나 만들었는지는 대라천이 시험으로 분리해 확인한 적이 없습니다. 대라천이 문서로 말할 수 있는 것은 조건이 다르다는 사실까지입니다.</p><p>그래서 대라천은 모든 아갈로차 나무에 개별 고유번호를 붙입니다. 어느 농장에서 몇 해를 자랐는지 이력을 남겨 두면, 향을 두고 하는 이야기와 원료의 실제 내력을 분리해 확인할 수 있습니다. 개별 나무 이력 관리 방식은 <a href="/blog/individual-tree-id-traceability">개별 고유번호 이력 관리</a>에서 확인하실 수 있습니다.</p><p>품종이 하나로 고정돼 있다는 점은 오히려 비교를 쉽게 만듭니다. 원료 사이의 차이를 품종 탓으로 돌릴 수 없으니, 남는 변수는 땅과 시간과 작업 방식입니다. 대라천이 농장별 기록을 남기는 이유가 여기에 있습니다.</p>

<h2>대라천은 왜 다섯 곳에 나눠 심었나요?</h2><p>한곳에 몰아 심지 않은 이유를 대라천은 세 가지로 정리합니다. 첫째, 지역마다 조건이 다른 원료를 확보하기 위해서입니다. 둘째, 침향은 만들어지기까지 오랜 시간이 걸리고 생성 확률도 낮은 자원이라, 심는 지역을 나누면 수확 시점을 분산할 수 있습니다. 셋째, 한 지역의 기후 변화나 병해가 전체 물량을 한꺼번에 끊지 못하게 하기 위해서입니다.</p><p>세 가지 모두 향의 우열이 아니라 원료 수급에 관한 판단입니다. 대라천이 다섯 곳을 운영하는 근거는 각 농장의 향이 특별해서가 아니라, 20년 넘게 기다려야 하는 작물을 끊기지 않게 대기 위한 준비에 가깝습니다. 지역을 나눠 심으면 한 해의 작황이 전체를 좌우하지 않습니다.</p><p>와인이 산지와 빈티지를 라벨에 적듯, 대라천은 나무마다 자란 땅과 햇수를 기록합니다. 이 기록이 있어야 원료가 어디서 왔는지 뒤늦게라도 확인할 수 있습니다.</p><p>산지를 뭉뚱그려 말하는 쪽과 지역과 농장을 특정해 말하는 쪽은 확인 가능성에서 갈립니다. 대라천은 후자를 택했고, 그 선택의 결과가 다섯 곳으로 나뉜 농장과 나무 단위 이력입니다.</p>

<h2>자주 묻는 질문</h2><h3>Q. 침향 떼루아는 과학적으로 증명된 개념인가요?</h3><p>A. 아닙니다. 침향의 성분 조성이 조건에 따라 달라진다는 점은 학술 문헌이 다루지만, 특정 토양이 특정 향을 만든다는 인과는 대라천이 확인한 사실이 아닙니다. 이 글의 농장별 향 묘사는 대라천의 관능 묘사입니다.</p><h3>Q. 어느 농장의 침향이 가장 좋은가요?</h3><p>A. 대라천은 다섯 농장에 품질 순위를 매기지 않습니다. 향에 대한 선호는 사람마다 다르고, 대라천이 기록으로 구분하는 것은 재배 조건과 수령까지입니다.</p><h3>Q. 현무암 토양은 무엇이 다른가요?</h3><p>A. 미네랄이 많고 물이 잘 빠지며 공기가 잘 통합니다. 대라천은 동나이 농장의 토양 조건을 이렇게 기록하고 있으며, 이 조건과 향의 관계를 계량한 시험 자료는 제시하지 않습니다.</p><h3>Q. 100년 넘은 나무는 무엇이 다른가요?</h3><p>A. 수지는 오랜 시간에 걸쳐 쌓이므로 수령이 높을수록 수량이 적습니다. 푸꾸옥 농장에는 100년 이상 된 나무와 50년생 나무가 함께 있습니다.</p><h3>Q. 다섯 농장의 품종은 서로 다른가요?</h3><p>A. 같습니다. 다섯 곳 모두 아퀼라리아 아갈로차 록스버그(Aquilaria agallocha Roxb.) 한 품종이며, 대라천은 나무마다 개별 고유번호를 붙여 산지와 수령을 기록합니다.</p>

<h2>대라천이 확인한 것과 확인하지 않은 것</h2><p>대라천은 이 글에 적은 농장 수와 면적(약 200헥타르), 그루 수(약 400만 그루), 람동 농장 면적(약 158헥타르), 푸꾸옥 농장의 수령 구성을 농장 관리 기록과 식재 기록으로 보유하고 있으며, 요청하시면 확인해 드립니다. 다섯 농장이 아퀼라리아 아갈로차 한 품종이라는 점도 같은 기록으로 대조합니다.</p><p>반대로 대라천이 확인하지 않은 항목을 밝힙니다. 농장별 향의 묘사는 관능 서술이며 성분 분석 결과가 아닙니다. 토양이나 기후가 향의 어떤 요소를 얼마나 좌우하는지 대라천은 시험으로 분리해 확인하지 않았습니다. 본문에 인용한 Wang Y(2021), Wang X(2025), 신광호 외(2011)의 논문은 대라천이 수행한 연구가 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료로 제시하지 않습니다. 신광호 연구팀의 연구는 국가 단위 산지를 견준 자료이므로, 대라천 농장별 차이의 근거로는 쓰지 않습니다. 침향을 처음 접하신다면 <a href="/about-agarwood">침향 기본 안내</a>를 먼저 보시길 권합니다.</p><p>떼루아라는 말은 이 글에서 비유로만 씁니다. 와인의 떼루아처럼 산지별 특성이 체계로 정리돼 있다는 뜻이 아니라, 대라천이 다섯 곳의 조건을 각각 기록하고 있다는 뜻입니다. 그 이상은 대라천이 자료로 뒷받침하지 않습니다.</p>

<h2>근거·출처</h2><p>농장 수와 면적, 그루 수, 지역별 재배 조건과 수령은 조엘라이프(주)의 농장 관리 기록과 브랜드 스토리 자료에서 옮겼습니다. 성분 조성이 조건에 따라 달라진다는 배경 설명은 아래 세 논문에 근거하며, 세 편 모두 대라천 농장별 향의 차이를 검증한 자료가 아닙니다.</p><ul><li><a href="https://zoellife.com/brand-story" target="_blank" rel="noopener">베트남 5개 직영 농장 이야기 (zoellife.com/brand-story)</a></li><li><a href="https://zoellife.com/process" target="_blank" rel="noopener">농장부터 완제품까지 (zoellife.com/process)</a></li><li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li><li>Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities", <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li><li>신광호, 최규열, 조성용 외, "GC-MS를 이용한 침향류의 성분 비교 연구", <em>대한본초학회지</em> 26권 (2011) — <a href="https://koreascience.kr/article/JAKO201122238508185.pdf" target="_blank" rel="noopener">https://koreascience.kr/article/JAKO201122238508185.pdf</a></li></ul>

<hr /><p style='font-size:13px;color:#7D7570'><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)와 학술 문헌에 근거해 작성되었습니다. 농장별 향 특성은 토양·기후 등을 바탕으로 한 기대치이며, 향과 반응의 느낌에는 개인차가 있습니다. 대라천 침향 제품은 일반식품으로 질병의 예방·치료를 위한 의약품이 아닙니다.</em></p>"""

content = re.sub(r'\n+', '', content).replace('__MAP_SVG__', MAP_SVG)
assert MAP_SVG in content

images = [
    {
        "key": "basalt-soil",
        "prompt": "Photorealistic close-up photograph of dark reddish-brown basaltic volcanic soil at the base of a young Aquilaria tree, crumbly mineral-rich earth with small porous volcanic stones, exposed surface roots, tropical plantation rows blurred in the background, warm natural daylight, documentary style, no people, no text, no logo, no watermark",
        "alt": "침향 떼루아를 이야기할 때 언급되는 동나이 농장의 미네랄 풍부한 현무암 토양",
        "caption": "동나이 농장의 현무암 토양은 물이 잘 빠지고 공기가 잘 통합니다."
    },
    {
        "key": "old-growth-phuquoc",
        "prompt": "Photorealistic photograph of a very old large-trunk agarwood tree in a tropical island plantation, deeply furrowed thick bark, wide buttressed base, younger slender trees of the same species standing behind it, dappled sunlight through the canopy, humid green undergrowth, documentary style, no people, no text, no logo, no watermark",
        "alt": "푸꾸옥 농장의 100년 이상 고수령 침향목과 뒤편의 50년생 나무",
        "caption": "푸꾸옥 농장에는 100년 이상 된 나무와 50년생 나무가 함께 있습니다."
    }
]

out = {
    "slug": src["slug"],
    "title": title,
    "excerpt": excerpt,
    "tags": src["tags"],
    "content": content,
    "images": images,
    "changelog": {
        "charsBefore": korean_chars(src["content"]),
        "charsAfter": korean_chars(content),
        "citationsAdded": ["A4", "A7", "신광호 외 2011 (대한본초학회지, 원문 유지)"],
        "voiceFixes": 46,
        "notes": ("신광호 외 2011(대한본초학회지) 인용을 연도·저자·저널과 함께 연구팀 귀속으로 복원하고, "
                  "견준 대상이 국가 단위 산지이지 대라천 농장 다섯 곳이 아니라는 한계를 명시했습니다. "
                  "성분 조성이 조건에 따라 달라진다는 배경은 A7·A4 연구팀에 함께 귀속했습니다. "
                  "농장별 향 서술은 대라천의 관능 묘사로 표 열 이름과 본문에서 명시 구분하고, 토양-향 인과를 확인하지 않았다는 진술을 전용 H2로 넣었습니다. "
                  "원본 농장 지도 SVG는 바이트 그대로 보존하고 면적·수령 비교 SVG를 추가했습니다.")
    }
}

path = os.path.join(BASE, 'out/terroir-shapes-agarwood-5-vietnam-farms.json')
with open(path, 'w') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print('written', path)
print('title len', len(title), '| excerpt len', len(excerpt))
print('charsBefore', out['changelog']['charsBefore'], '-> charsAfter', out['changelog']['charsAfter'])
