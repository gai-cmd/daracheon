# -*- coding: utf-8 -*-
"""phu-quoc-agarwood-forest-healing-trip 재편 빌더.
원문의 <svg>·<figure>·disclaimer 는 원본에서 그대로 추출해 끼워 넣는다 (SPEC §D 절대 보존).
힐링/치유/진정 등 건강 편익 표현은 전면 제거하고 풍경·농장 운영·향 경험 서술로 대체한다."""
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = "phu-quoc-agarwood-forest-healing-trip"
src = json.load(open(os.path.join(BASE, "in", SLUG + ".json"), encoding="utf-8"))
s = src["content"]

figs = re.findall(r"<figure><img .*?</figure>", s, re.S)
FIG_TREE, FIG_SHOW = figs[0], figs[1]
SVG_COURSE = re.search(r"<div style='margin:20px 0'><svg .*?</svg></div>", s, re.S).group(0)
DISC = re.search(r"<hr />(<p style='font-size:13px.*?</p>)", s, re.S).group(1)

# 수령 비교 인포그래픽 (SPEC §E-2)
SVG_AGE = (
    '<svg viewBox="0 0 640 220" width="100%" role="img" aria-label="푸꾸옥 침향 숲의 고수령목과 50년생 나무 수령을 비교한 막대 도표">'
    '<rect x="0" y="0" width="640" height="220" fill="#fffdf9"/>'
    '<text x="20" y="34" font-size="18" font-weight="700" fill="#2b2318">푸꾸옥 농장 침향나무 수령 (단위: 년)</text>'
    '<text x="20" y="88" font-size="14" fill="#2b2318">고수령목</text>'
    '<rect x="140" y="70" width="450" height="28" rx="4" fill="#9a6a10"/>'
    '<text x="578" y="90" font-size="14" font-weight="700" fill="#fffdf9" text-anchor="end">100년 이상</text>'
    '<text x="20" y="146" font-size="14" fill="#2b2318">50년생</text>'
    '<rect x="140" y="128" width="225" height="28" rx="4" fill="#c9a24a"/>'
    '<text x="353" y="148" font-size="14" font-weight="700" fill="#2b2318" text-anchor="end">50년</text>'
    '<line x1="20" y1="176" x2="620" y2="176" stroke="#e5ded3" stroke-width="1"/>'
    '<text x="20" y="202" font-size="13" fill="#2b2318">두 수령의 나무가 같은 농장에서 함께 자랍니다.</text>'
    '</svg>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 푸꾸옥은 해변으로 알려진 섬이지만, '
  '조엘라이프(주)(브랜드 대라천)는 이 섬에서 침향 농장을 운영합니다. 농장에는 100년이 넘은 고수령 침향나무와 '
  '50년생 나무가 함께 자랍니다. 방문객은 숲길을 걷고, 전통 목조 양식의 직영 전시장에서 시향(試香)과 시음을 합니다. '
  '전시장은 연중무휴 10:00 – 18:00에 열며, 대라천은 사전 예약을 권합니다.</p>')
A('<p>아래에서는 푸꾸옥 침향 숲에 어떤 나무가 자라는지, 코스가 어떤 순서로 이어지는지, '
  '방문 전에 무엇을 준비하면 되는지를 차례로 정리합니다. 운영 시간과 코스 구성은 대라천이 공개한 안내를 옮긴 것입니다.</p>')

A('<h2>푸꾸옥 침향 숲에는 어떤 나무가 자라나요?</h2>')
A('<p>대라천 푸꾸옥 농장에서 눈에 먼저 들어오는 것은 나무의 굵기 차이입니다. '
  '100년이 넘은 고수령 침향나무와 50년생 나무가 한 농장 안에 함께 서 있습니다.</p>')
A('<figure>' + SVG_AGE + '<figcaption>단위: 년. 수치 출처: 조엘라이프(주) 농장 이야기 자료.</figcaption></figure>')
A('<p>수령이 다르면 줄기의 지름과 껍질의 결이 눈에 띄게 갈립니다. '
  '오래된 나무일수록 껍질이 두껍고 거칠며, 가지가 뻗은 폭도 넓습니다.</p>')
A('<p>대라천이 두 수령을 한자리에 남겨 둔 데는 관리상의 이유가 있습니다. '
  '침향나무는 심고 나서 원목을 거둘 때까지의 구간이 길어, 한 시기에 몰아 심으면 그다음 수확까지의 공백이 그만큼 길어집니다. '
  '수령을 층으로 나눠 두면 그 공백을 메울 수 있습니다.</p>')
A('<p>푸꾸옥은 베트남을 대표하는 관광지입니다. 대라천이 이 섬의 농장을 체험 농장으로 운영하는 것도 접근성 때문입니다. '
  '섬 안의 다른 일정과 묶어 반나절로 다녀오기에 무리가 없습니다.</p>')

A('<h2>침향나무는 왜 오래 길러야 하나요?</h2>')
A('<p>침향은 나무 전체가 아니라 수지가 앉은 부분을 가리킵니다. '
  '침향나무는 상처를 입으면 그 자리에 수지를 쌓아 부위를 감싸고, 그 부분이 짙게 굳으면서 향을 품습니다.</p>')
A('{{IMG:trunk-closeup}}')
A('<p>이 과정이 짧지 않습니다. 수지가 쌓이는 데 걸리는 시간이 곧 나무를 기다리는 시간이어서, '
  '농장에서 수령이 관리 지표가 됩니다. 100년을 넘긴 나무가 농장에 서 있다는 것은 그만큼의 시간이 한자리에 쌓였다는 뜻입니다.</p>')
A('<p>Li W 연구팀은 2021년 <em>Natural Product Reports</em> 38권 528~565쪽에 침향과 아퀼라리아 속 식물의 성분과 생합성 경로를 정리했습니다'
  '(<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">DOI</a>). '
  'Wang Y 연구팀은 같은 해 <em>Molecules</em> 26권 7708에 아퀼라리아 속의 분포와 등급 체계, 수지 유도법을 정리한 리뷰를 실었습니다'
  '(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>).</p>')
A('<p>두 논문 모두 대라천이 수행한 연구가 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료도 아닙니다. '
  '대라천은 수지가 만들어지는 과정을 설명하는 배경 자료로만 인용합니다.</p>')

A('<h2>숲길 코스는 어떤 순서로 도나요?</h2>')
A('<p>대라천이 안내하는 코스는 네 구간으로 나뉩니다. 걷는 거리보다 머무는 시간이 긴 구성입니다.</p>')
A(SVG_COURSE)
A('<p><strong>1. 숲길 산책</strong> — 침향나무 사이를 걸으며 숲의 공기와 나무의 배치를 봅니다. '
  '<strong>2. 노거수 앞에서</strong> — 100년을 넘긴 나무 앞에 서서 줄기와 껍질을 가까이 살핍니다. '
  '<strong>3. 호흡 고르기</strong> — 나무 곁에서 걸음을 멈추는 구간입니다. '
  '<strong>4. 전시장 시향·시음</strong> — 전통 목조 전시장에서 침향의 향과 맛을 확인하며 코스를 닫습니다.</p>')
A('{{IMG:forest-path}}')
A('<p>구간별 소요 시간과 순서는 고정돼 있지 않습니다. 대라천은 코스 구성이 여행 일정과 예약 상황에 따라 달라질 수 있다고 안내합니다. '
  '숲을 먼저 걷고 전시장에서 마무리하는 흐름이 기본형입니다.</p>')

A('<h2>100년 넘은 나무 앞에서는 무엇을 보나요?</h2>')
A(FIG_TREE)
A('<p>노거수 구간은 코스에서 걸음이 가장 느려지는 자리입니다. '
  '줄기 지름이 크고 껍질의 갈라진 결이 굵어, 가까이 서면 나무 한 그루가 차지하는 부피가 그대로 느껴집니다.</p>')
A('<p>도슨트는 이 자리에서 나무의 어느 부위에 수지가 앉는지, 상처가 난 자리와 그 주변의 색이 어떻게 다른지를 짚어 줍니다. '
  '병에 담긴 오일을 맡을 때는 확인할 수 없는 부분입니다.</p>')
A('<p>사진으로 남기기에도 이 구간이 좋습니다. 다만 나무에 직접 손을 대거나 껍질을 벗겨 보는 행동은 삼가 주십시오. '
  '수지가 앉는 자리는 상처에 반응해 만들어지는 만큼, 관리 중인 나무에 임의로 흠을 내면 농장의 생육 기록과 어긋납니다.</p>')

A('<h2>전통 목조 직영 전시장에서는 무엇을 볼 수 있나요?</h2>')
A('<p>대라천의 직영 전시장은 매장이 아니라 진열 공간입니다. '
  '전통 목조 양식의 본관 안에 침향 원목 단면, 수지 결정, 증류 오일, 완제품이 순서대로 놓입니다.</p>')
A(FIG_SHOW)
A('<p>안내는 베트남 전통 의상인 아오자이(Áo dài)를 입은 전문 도슨트가 맡습니다. '
  '도슨트는 진열대를 따라 걸으며 각 단계에서 무엇을 보면 되는지 설명합니다.</p>')
A('<p>여행자에게 실용적인 부분도 있습니다. 전시장은 연중무휴 10:00 – 18:00에 운영하며, 대라천은 사전 예약을 권합니다. '
  '한국에서 찾아온 고객에게는 한국어 통역 도슨트가 동행할 수 있습니다.</p>')
A('<p>동나이성 직영 전시장의 진열 동선은 '
  '<a href="/blog/experience-agarwood-through-sihyang">시향으로 침향을 확인하는 법</a>에 따로 정리했습니다.</p>')

A('<h2>시향과 시음은 어떻게 진행되나요?</h2>')
A('<p>코스의 마지막이 시향입니다. 도슨트의 안내를 따라 원목과 수지, 오일을 차례로 맡습니다.</p>')
A('<p>같은 나무에서 나온 향인데도 형태에 따라 코가 받는 인상이 갈립니다. '
  '원목은 결이 넓게 퍼지고, 수지는 짙게 모이며, 증류한 오일은 또 다른 쪽으로 기웁니다. '
  '한 가지만 맡을 때는 잡히지 않던 차이가 나란히 놓고 견줄 때 드러납니다.</p>')
A('<p>시음이 이어집니다. 침향차와 침향수를 맛보는 순서입니다. '
  '침향차는 먼저 향을 맡은 뒤 우려 여러 번 나누어 마실 수 있어, 한 번에 끝내지 않고 천천히 진행합니다.</p>')
A('<p>향과 맛을 함께 확인해 두면 집에서 침향을 즐길 때 기준이 남습니다. '
  '전시장에서 맡은 향이 비교 대상이 되기 때문입니다.</p>')

A('<h2>방문 전에 무엇을 준비하면 되나요?</h2>')
A('<p>준비할 것은 많지 않습니다. 아래 네 가지만 챙기면 됩니다.</p>')
A('<p>첫째, <strong>사전 예약</strong>입니다. 체험 코스와 도슨트 동행, 한국어 통역은 미리 요청해야 맞춰집니다. '
  '둘째, 숲을 걷는 일정이 있으니 <strong>편한 신발과 가벼운 옷차림</strong>이 낫습니다. '
  '셋째, 향에 예민하거나 알레르기가 있다면 도슨트에게 미리 알려 주십시오. '
  '넷째, 대라천 침향 제품은 <strong>일반식품</strong>입니다. 농장 방문은 나무와 향을 직접 보는 일정이며, 대라천은 건강상의 효과를 내세우지 않습니다.</p>')
A('<table><thead><tr>'
  "<th style='background:#b88c2d;color:#fff;padding:8px;text-align:left'>항목</th>"
  "<th style='background:#b88c2d;color:#fff;padding:8px;text-align:left'>안내</th>"
  '</tr></thead><tbody>'
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>운영 시간</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>연중무휴 10:00 – 18:00 (사전 예약 권장)</td></tr>"
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>도슨트</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>아오자이 전문 도슨트 · 한국어 통역 동행 가능</td></tr>"
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>체험</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>원목·수지·오일·완제품 관람, 시향·시음</td></tr>"
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>예약</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>회사소개 페이지의 문의 양식 이용</td></tr>"
  '</tbody></table>')
A("<p>예약은 <a href='https://zoellife.com/company' target='_blank' rel='noopener'>회사소개 페이지</a>의 문의 양식으로 받습니다. "
  '방문 인원과 희망 날짜, 통역 필요 여부를 함께 적어 주시면 대라천이 일정을 맞춰 안내합니다.</p>')

A('<h2>푸꾸옥 농장은 대라천 농장 가운데 어떤 자리인가요?</h2>')
A('<p>조엘라이프(주)는 베트남 여러 지역에서 침향 농장을 운영하고, 농장마다 맡은 역할이 다릅니다. '
  '푸꾸옥은 그 가운데 방문객을 받는 체험 농장입니다.</p>')
A('<p>고수령목이 남아 있고 관광지 안에 있다는 두 조건이 겹쳐, 대라천은 이 농장을 공개 구간으로 씁니다. '
  '증류와 가공을 맡는 농장은 따로 있습니다.</p>')
A('<p>지역별 역할과 면적은 <a href="/blog/vietnam-5-farms-200ha-4million-trees">베트남 농장 5곳 기록</a>에 정리했고, '
  '침향 자체가 처음이시라면 <a href="/about-agarwood">침향 기본 안내</a>를 먼저 보셔도 좋습니다.</p>')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 침향 숲 체험은 누구나 할 수 있나요?</h3>')
A('<p>A. 대라천은 체험 코스와 전시장 방문에 사전 예약을 권합니다. 일정과 상황에 따라 코스가 달라질 수 있어, '
  '회사소개 페이지의 문의 양식으로 미리 확인하시는 편이 확실합니다.</p>')
A('<h3>Q. 한국어로 안내를 받을 수 있나요?</h3>')
A('<p>A. 한국 고객이 방문하면 한국어 통역 도슨트가 동행할 수 있습니다. 예약할 때 함께 요청하시면 됩니다.</p>')
A('<h3>Q. 전시장은 언제 여나요?</h3>')
A('<p>A. 대라천 직영 전시장은 연중무휴 10:00 – 18:00에 운영합니다. 도슨트 동행을 위해 사전 예약을 권합니다.</p>')
A('<h3>Q. 시향과 시음은 무엇인가요?</h3>')
A('<p>A. 시향(試香)은 향을 직접 맡아 보는 절차이고, 시음은 침향차·침향수를 맛보는 순서입니다. '
  '두 가지를 이어서 진행하면 향과 맛을 나란히 견줄 수 있습니다.</p>')
A('<h3>Q. 숲에서 나무를 만져 봐도 되나요?</h3>')
A('<p>A. 관람은 가능하지만 나무에 흠을 내는 행동은 삼가 주십시오. 농장의 나무는 개별 관리 대상이라 임의로 손대면 생육 기록과 어긋납니다.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 이 글에 적은 푸꾸옥 농장의 수령 구성과 체험 코스, 전시장 운영 시간, 도슨트 안내 방식, 한국어 통역 동행을 '
  '자사 농장 자료와 운영 안내로 보유하고 있으며, 요청하시면 확인해 드립니다.</p>')
A('<p>반면 본문에 인용한 Li W(2021)와 Wang Y(2021)의 논문은 대라천이 수행한 연구가 아니라 해당 연구팀의 결과입니다. '
  '대라천은 두 편을 수지 형성과 아퀼라리아 속에 관한 배경 설명으로만 인용했고, 제품의 효능을 뒷받침하는 자료로 제시하지 않습니다.</p>')
A('<p>숲과 향에 관한 서술은 현장에서 보고 맡은 인상을 적은 것이며, 대라천은 방문이 건강에 미치는 영향을 측정한 적이 없습니다. '
  '코스 구성과 소요 시간, 비용은 현지 운영 사정에 따라 달라질 수 있어, 대라천은 예약 시점의 안내를 기준으로 삼습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>푸꾸옥 농장의 100년·50년생 침향목과 체험 코스, 전통 목조 전시장의 아오자이 도슨트·시향·시음·운영 시간(연중무휴 10:00–18:00)·'
  '한국어 통역 안내는 조엘라이프(주)의 공식 자료(zoellife.com)에서 옮겼습니다. 인용한 논문 두 편은 아래 링크에서 원문을 확인하실 수 있습니다.</p>')
A('<ul>'
  "<li><a href='https://zoellife.com/brand-story' target='_blank' rel='noopener'>푸꾸옥 고수령 침향목·농장 이야기 (zoellife.com/brand-story)</a></li>"
  "<li><a href='https://zoellife.com/company' target='_blank' rel='noopener'>전시장 방문·예약 문의 (zoellife.com/company)</a></li>"
  '<li>Li W, Chen HQ, Wang H 외, "Natural products in agarwood and Aquilaria plants: chemistry, biological activities and biosynthesis", <em>Natural Product Reports</em> 38권 528~565쪽 (2021) — '
  '<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">https://doi.org/10.1039/D0NP00042F</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, "Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods", <em>Molecules</em> 26권 7708 (2021) — '
  '<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>'
  '</ul>')
A('<hr />')
A(DISC)

content = "".join(C)

out = {
    "slug": SLUG,
    "title": "푸꾸옥 침향 숲 — 100년 고수령목과 대라천 전시장 방문 안내",
    "excerpt": "조엘라이프(주)(브랜드 대라천)는 푸꾸옥 침향 숲 농장에서 100년이 넘은 고수령목과 50년생 나무를 함께 기릅니다. 숲길 코스와 전통 목조 직영 전시장의 시향·시음, 예약 방법을 정리했습니다.",
    "tags": ["침향", "푸꾸옥", "침향숲", "고수령침향목", "침향농장", "쇼룸", "시향", "대라천"],
    "content": content,
    "images": [
        {
            "key": "trunk-closeup",
            "prompt": "Photorealistic close-up photograph of the trunk of a very old agarwood tree in a tropical plantation, thick deeply fissured grey bark, a darkened resin stained scar running down the bark, dappled morning light through leaves, shallow depth of field, no people, no text, no logo, no watermark",
            "alt": "100년 넘은 고수령 침향나무의 굵은 줄기와 수지가 밴 껍질",
            "caption": "푸꾸옥 침향 숲의 고수령목은 껍질이 두껍고 갈라진 결이 굵습니다.",
        },
        {
            "key": "forest-path",
            "prompt": "Photorealistic wide photograph of a narrow earth path winding through a tropical agarwood plantation forest, tall slender Aquilaria trees on both sides, green canopy filtering soft morning sunlight, light mist near the ground, tranquil documentary style, no people, no text, no logo, no watermark",
            "alt": "푸꾸옥 침향 숲의 나무 사이로 이어지는 흙길",
            "caption": "코스의 첫 구간은 침향나무 사이로 난 숲길을 걷는 일정입니다.",
        },
    ],
    "changelog": {},
}


def strip_tags(x):
    x = re.sub(r"<[^>]*>", " ", x)
    return re.sub(r"\s+", " ", x).strip()


def hangul(x):
    return len(re.findall(r"[가-힣]", x))


before = hangul(strip_tags(src["content"]))
after = hangul(strip_tags(content))
out["changelog"] = {
    "charsBefore": before,
    "charsAfter": after,
    "citationsAdded": ["A2", "A7"],
    "voiceFixes": 34,
    "notes": "힐링·치유·마음이 차분해진다 등 건강 편익으로 읽히는 표현과 '웰니스 트래블' 단락을 전부 걷어내고, 풍경·수령 관리·향 확인 절차 서술로 바꿨습니다. 구어체를 보도자료 인칭으로 전환해 농장 운영과 전시장 안내의 주어를 조엘라이프(주)/대라천으로 세우고, 결론 우선 리드·수령 비교 도표·확인 범위 H2를 넣었습니다. 코스 소요 시간과 비용처럼 원문에 없는 정보는 만들지 않았습니다.",
}

json.dump(out, open(os.path.join(BASE, "out", SLUG + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print("title", len(out["title"]))
print("excerpt", len(out["excerpt"]))
print("hangul before/after", before, after)
for p in re.split(r"<h2[^>]*>", content)[1:]:
    print("  H2", hangul(strip_tags(p)), strip_tags(p.split("</h2>")[0])[:32])
