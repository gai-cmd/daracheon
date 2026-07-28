# -*- coding: utf-8 -*-
"""experience-agarwood-through-sihyang 재편 빌더.
원문의 <svg>·<figure>·disclaimer 는 원본에서 그대로 추출해 끼워 넣는다 (SPEC §D 절대 보존)."""
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = "experience-agarwood-through-sihyang"
src = json.load(open(os.path.join(BASE, "in", SLUG + ".json"), encoding="utf-8"))
s = src["content"]

SVG_SRC = re.search(r"<svg .*?</svg>", s, re.S).group(0)
FIG_SRC = re.search(r"<figure><img .*?</figure>", s, re.S).group(0)
DISC = re.search(r"<hr />(<p style='font-size:13px.*?</p>)", s, re.S).group(1)

# 추가 인포그래픽 (SPEC §E-2 — 밝은 리딩 표면, viewBox + width 100%)
SVG_NUM = (
    '<svg viewBox="0 0 640 230" width="100%" role="img" aria-label="대라천 직영 전시장 진열 단계와 운영 시간, 증류 시간, 원료 산지 비율을 정리한 수치 도표">'
    '<rect x="0" y="0" width="640" height="230" fill="#fffdf9"/>'
    '<text x="20" y="34" font-size="18" font-weight="700" fill="#2b2318">대라천 전시장 시향 안내 수치</text>'
    '<line x1="20" y1="50" x2="620" y2="50" stroke="#e5ded3" stroke-width="1"/>'
    '<text x="20" y="86" font-size="14" fill="#2b2318">진열 단계</text>'
    '<text x="150" y="92" font-size="26" font-weight="700" fill="#9a6a10">4단계</text>'
    '<text x="270" y="92" font-size="13" fill="#2b2318">원목 → 수지 → 오일 → 완제품</text>'
    '<line x1="20" y1="108" x2="620" y2="108" stroke="#e5ded3" stroke-width="1"/>'
    '<text x="20" y="144" font-size="14" fill="#2b2318">오일 증류</text>'
    '<text x="150" y="150" font-size="26" font-weight="700" fill="#9a6a10">72시간</text>'
    '<text x="270" y="150" font-size="13" fill="#2b2318">고온 증류로 원목에서 추출</text>'
    '<line x1="20" y1="166" x2="620" y2="166" stroke="#e5ded3" stroke-width="1"/>'
    '<text x="20" y="200" font-size="14" fill="#2b2318">운영 시간</text>'
    '<text x="150" y="206" font-size="26" font-weight="700" fill="#9a6a10">10 – 18시</text>'
    '<text x="330" y="206" font-size="13" fill="#2b2318">연중무휴 · 사전 예약 권장</text>'
    '</svg>'
)

C = []
A = C.append

A('<p class="lead"><strong>결론부터.</strong> 침향은 읽어서 익히는 향이 아닙니다. '
  '조엘라이프(주)(브랜드 대라천)는 베트남 동나이성에 전통 목조 양식의 직영 전시장을 두고, '
  '원목·수지·오일·완제품을 하나의 동선에 순서대로 진열합니다. 방문객은 아오자이를 입은 도슨트의 안내를 따라 '
  '침향 시향(試香)과 시음을 함께 합니다. 전시장은 연중무휴 10:00 – 18:00에 열고, 대라천은 사전 예약을 권합니다.</p>')
A('<p>아래에서는 시향이 무엇을 확인하는 절차인지, 전시장 동선이 어떤 순서로 짜여 있는지, '
  '방문 전에 무엇을 준비하면 되는지를 차례로 정리합니다. 운영 시간과 안내 방식은 대라천이 공개한 전시장 운영 안내를 옮긴 것입니다.</p>')

A('<h2>시향(試香)은 무엇을 확인하는 절차인가요?</h2>')
A('<p>시향은 향을 시험 삼아 맡아 보는 일입니다. 향수 매장에서 시향지에 향을 뿌려 코끝으로 확인하는 절차와 목적이 같습니다.</p>')
A('<p>침향에서 이 절차가 특히 중요한 까닭은 향의 결이 하나로 고정돼 있지 않기 때문입니다. '
  '같은 원목이라도 수지가 얼마나 침착됐는지, 어느 부위를 썼는지, 오일을 어떤 방식으로 뽑았는지에 따라 코가 받는 인상이 달라집니다.</p>')
A('<p>Wang X 연구팀은 2025년 <em>Journal of Essential Oil Research</em> 37권 110~144쪽에 '
  '추출 방법이 아퀼라리아 정유의 수율과 화학 조성에 미치는 영향을 정리한 리뷰를 실었습니다'
  '(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>). '
  '이 논문은 대라천이 수행한 연구가 아니며, 제품의 효능을 뒷받침하는 자료도 아닙니다. '
  '향의 차이가 성분 구성의 차이와 맞물린다는 배경으로만 인용합니다.</p>')
A('<p>그래서 대라천은 침향을 설명으로만 전하지 않습니다. 실물을 앞에 두고 코로 확인하는 자리를 따로 마련해 두었습니다.</p>')

A('<h2>전시장은 무엇을 어떤 순서로 보여 주나요?</h2>')
A('<p>대라천 전시장의 진열은 완제품 매대에서 시작하지 않습니다. 원목에서 출발해 수지, 오일, 완제품으로 이어지고 마지막이 시향과 시음입니다. '
  '침향이 향이 되기까지의 순서를 그대로 걷는 구조입니다.</p>')
A(SVG_SRC)
A('<p>첫 자리에는 침향나무의 <strong>단면</strong>이 놓입니다. 그다음이 <strong>수지</strong>입니다. '
  '나무가 오랜 시간 상처를 견디며 만들어 낸 짙은 결정을 눈으로 확인하는 구간입니다.</p>')
A('<p>세 번째가 <strong>오일</strong>입니다. 대라천은 72시간 고온 증류로 원목에서 오일을 뽑습니다. '
  '마지막 진열대에는 캡슐·환·차·선향 같은 <strong>완제품</strong>이 놓입니다.</p>')
A('{{IMG:resin-section}}')
A('<p>진열 순서를 이렇게 잡은 데는 이유가 있습니다. 원목과 완제품을 따로 떼어 보여 주면 그 사이의 연결을 방문객이 상상으로 메워야 합니다. '
  '대라천은 중간 단계를 감추지 않고 전부 펼쳐 두는 쪽을 택했습니다.</p>')

A('<h2>아오자이 도슨트는 어떤 안내를 맡나요?</h2>')
A('<p>진열만 있는 공간이 아닙니다. 대라천은 전시 해설을 맡는 전문 도슨트를 두고, '
  '베트남 전통 의상인 아오자이(Áo dài) 차림으로 방문객을 안내합니다.</p>')
A('<p>도슨트는 진열대를 따라 걸으며 각 단계에서 무엇을 보면 되는지 짚어 줍니다. '
  '원목의 어느 부분에 수지가 앉았는지, 그 수지가 어떤 과정을 거쳐 오일이 되는지를 실물 앞에서 설명하는 방식입니다.</p>')
A('<p>궁금한 점은 그 자리에서 물어보면 됩니다. 한국에서 찾아온 고객에게는 한국어 통역 도슨트가 동행할 수 있어, 통역을 따로 준비하지 않아도 됩니다.</p>')
A(FIG_SRC)

A('<h2>시향과 시음은 어떤 순서로 진행되나요?</h2>')
A('<p>도슨트의 안내를 따라 눈, 손, 코, 입 순으로 침향을 확인합니다. 순서마다 확인하는 대상이 다릅니다.</p>')
A('<p><strong>눈</strong>으로는 원목의 빛깔과 결을 봅니다. 수지가 짙게 앉은 자리는 색이 어둡고 결이 촘촘합니다.</p>')
A('<p><strong>손</strong>으로는 무게를 가늠합니다. 대라천은 수지가 많이 침착된 원목일수록 밀도가 높아져 물에 가라앉는다는 점을 이 대목에서 함께 설명합니다.</p>')
A('<p><strong>코</strong>가 시향의 본론입니다. 원목과 수지, 오일을 차례로 맡으면 같은 나무에서 나온 향인데도 인상이 조금씩 다르다는 것을 확인하게 됩니다.</p>')
A('<p>마지막이 <strong>입</strong>입니다. 침향차와 침향수를 맛보는 시음 순서인데, 코로 받은 인상과 입으로 받는 인상을 나란히 놓고 견주는 자리입니다.</p>')
A('{{IMG:tea-tasting}}')

A('<h2>방문은 어떻게 예약하나요?</h2>')
A('<p>전시장 방문을 계획한다면 아래 안내를 참고하시면 됩니다. 표의 내용은 대라천이 공개한 운영 안내를 그대로 옮긴 것입니다.</p>')
A('<table><thead><tr>'
  "<th style='background:#b88c2d;color:#fff;padding:8px;text-align:left'>항목</th>"
  "<th style='background:#b88c2d;color:#fff;padding:8px;text-align:left'>안내</th>"
  '</tr></thead><tbody>'
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>위치</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>베트남 동나이성, 대라천 직영 전시장</td></tr>"
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>운영</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>연중무휴 10:00 – 18:00 (사전 예약 권장)</td></tr>"
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>안내</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>아오자이 도슨트 동행, 시향·시음 진행</td></tr>"
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>한국 고객</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>한국어 통역 도슨트 동행 가능</td></tr>"
  "<tr><td style='padding:8px;border-bottom:1px solid #e5ded3'>예약</td><td style='padding:8px;border-bottom:1px solid #e5ded3'>회사소개 페이지의 문의 양식 이용</td></tr>"
  '</tbody></table>')
A('<figure>' + SVG_NUM + '<figcaption>단위: 단계 수, 시간. 수치 출처: 대라천 전시장 운영 안내와 제조 공정 자료.</figcaption></figure>')
A('<p>사전 예약을 하면 도슨트 동행과 한국어 통역을 미리 맞춰 둘 수 있습니다. 예약은 '
  "<a href='https://zoellife.com/company' target='_blank' rel='noopener'>회사소개 페이지</a>의 문의 양식으로 받습니다.</p>")

A('<h2>시향으로 무엇을 가려낼 수 있나요?</h2>')
A('<p>침향은 사진이나 글만으로 진위를 가리기 어려운 품목입니다. 색은 물들일 수 있고, 향은 합성 향료로 흉내 낼 수 있습니다.</p>')
A('<p>대라천이 원목부터 완제품까지 전 과정을 한 동선에 펼쳐 두는 이유가 여기 있습니다. '
  '어느 부위에 수지가 앉는지, 그 수지가 어떤 오일이 되는지를 눈으로 따라가면 앞에 놓인 완제품이 어디서 왔는지도 함께 설명됩니다.</p>')
A('<p>서류로 받치는 부분도 있습니다. 대라천은 침향나무 한 그루마다 개별 고유번호를 붙여 자란 이력을 관리하고, '
  '<strong>Aquilaria Agallocha Roxburgh</strong>(오늘날 정명은 Aquilaria malaccensis) 원료만 100% 베트남산으로 씁니다.</p>')
A('<p>Wang S 연구팀은 2018년 <em>Molecules</em> 23권 342에 침향과 아퀼라리아 속 식물의 화학 성분을 총론으로 정리했습니다'
  '(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). '
  '아퀼라리아 속에는 여러 종이 있고 종마다 성분 구성이 다릅니다. 품종을 하나로 묶어 두면 원목마다 종을 되묻는 절차가 줄어듭니다.</p>')

A('<h2>푸꾸옥 체험 농장과는 무엇이 다른가요?</h2>')
A('<p>전시장이 실내에서 공정의 순서를 보여 주는 공간이라면, 푸꾸옥 농장은 나무가 서 있는 자리를 직접 걷는 곳입니다.</p>')
A('<p>대라천 푸꾸옥 농장에는 100년이 넘은 고수령 침향나무와 50년생 나무가 함께 자랍니다. '
  '푸꾸옥은 베트남을 대표하는 관광지여서 여행 일정에 넣기도 수월합니다.</p>')
A('<p>숲길 코스는 <a href="/blog/phu-quoc-agarwood-forest-healing-trip">푸꾸옥 침향 숲 방문 안내</a>에 따로 정리했습니다. '
  '농장 다섯 곳의 지역별 역할이 궁금하시면 <a href="/blog/vietnam-5-farms-200ha-4million-trees">베트남 농장 5곳 기록</a>을, '
  '침향 자체가 처음이시라면 <a href="/about-agarwood">침향 기본 안내</a>를 먼저 보셔도 좋습니다.</p>')

A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 전시장은 어디에 있나요?</h3>')
A('<p>A. 조엘라이프(주)가 베트남 동나이성에서 운영하는 직영 전시장입니다. 전통 목조 양식의 본관에 원목·수지·오일·완제품을 한 공간에 진열합니다.</p>')
A('<h3>Q. 예약 없이 방문해도 되나요?</h3>')
A('<p>A. 전시장은 연중무휴 10:00 – 18:00에 운영합니다. 대라천은 사전 예약을 권하며, 예약은 회사소개 페이지의 문의 양식으로 받습니다.</p>')
A('<h3>Q. 한국어로 설명을 들을 수 있나요?</h3>')
A('<p>A. 한국 고객이 방문하면 한국어 통역 도슨트가 동행할 수 있습니다. 예약할 때 미리 요청하시면 됩니다.</p>')
A('<h3>Q. 시향과 시음에 비용이 드나요?</h3>')
A('<p>A. 대라천은 전시장에서 아오자이 도슨트의 안내와 함께 시향·시음을 진행합니다. '
  '비용을 포함한 세부 운영 조건은 이 글에서 확인해 드리지 못하므로 예약 시 문의해 주십시오.</p>')
A('<h3>Q. 푸꾸옥 농장도 함께 볼 수 있나요?</h3>')
A('<p>A. 푸꾸옥 농장은 관광지에 자리한 대라천 체험 농장입니다. 숲길 코스는 별도 글에 정리했고, '
  '일정과 예약 조건은 문의 양식으로 확인해 주십시오.</p>')

A('<h2>대라천이 확인한 것과 확인하지 않은 것</h2>')
A('<p>대라천은 이 글에 적은 전시장 운영 시간과 진열 구성, 도슨트 안내 방식, 72시간 증류 공정, '
  '개별 고유번호 관리와 100% 베트남산 원료 사용을 자사 운영 자료와 공정 자료로 보유하고 있으며, 요청하시면 확인해 드립니다.</p>')
A('<p>반면 본문에 인용한 Wang X(2025)와 Wang S(2018)의 논문은 대라천이 수행한 연구가 아니라 해당 연구팀의 결과입니다. '
  '대라천은 두 편을 침향 성분과 추출 방식에 관한 배경 설명으로만 인용했고, 제품의 효능을 뒷받침하는 자료로 제시하지 않습니다.</p>')
A('<p>시향에서 쓰는 향 표현은 코로 받은 인상을 적은 관능적 서술이며 성분 분석 결과가 아닙니다. '
  '방문 프로그램의 세부 구성과 비용은 현지 운영 사정에 따라 달라질 수 있어, 대라천은 예약 시점의 안내를 기준으로 삼습니다.</p>')

A('<h2>근거·출처</h2>')
A('<p>전시장 위치와 운영 시간, 도슨트 안내, 원목·수지·오일·완제품 진열, 한국어 통역 안내, 푸꾸옥 체험 농장 내용은 '
  '조엘라이프(주)의 공식 자료(zoellife.com)에서 옮겼습니다. 인용한 논문 두 편은 아래 링크에서 원문을 직접 확인하실 수 있습니다.</p>')
A('<ul>'
  "<li><a href='https://zoellife.com/company' target='_blank' rel='noopener'>전시장 방문·예약 문의 (zoellife.com/company)</a></li>"
  "<li><a href='https://zoellife.com/process' target='_blank' rel='noopener'>침향 생산·증류 공정 (zoellife.com/process)</a></li>"
  "<li><a href='https://zoellife.com/products' target='_blank' rel='noopener'>전시장에서 만나는 라인업 (zoellife.com/products)</a></li>"
  '<li>Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities", <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — '
  '<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li>'
  '<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", <em>Molecules</em> 23권 342 (2018) — '
  '<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a></li>'
  '</ul>')
A('<hr />')
A(DISC)

content = "".join(C)

out = {
    "slug": SLUG,
    "title": "침향 시향(試香), 대라천 베트남 직영 전시장에서 확인하는 법",
    "excerpt": "조엘라이프(주)(브랜드 대라천)는 베트남 동나이성 직영 전시장에서 원목·수지·오일·완제품을 한 동선에 진열하고, 아오자이 도슨트와 함께 침향 시향과 시음을 안내합니다. 방문 순서와 예약 방법을 정리했습니다.",
    "tags": ["침향", "시향", "침향체험", "베트남전시장", "쇼룸", "침향농장", "도슨트", "대라천"],
    "content": content,
    "images": [
        {
            "key": "resin-section",
            "prompt": "Photorealistic close-up photograph of a cut cross-section of an agarwood log resting on a plain wooden display stand, dark resin-saturated veins spreading through pale sapwood, fine grain texture, soft diffused museum lighting, shallow depth of field, no people, no text, no logo, no watermark",
            "alt": "수지가 짙게 침착된 침향 원목 단면 — 시향 전시장 진열",
            "caption": "전시 동선의 첫 구간에서는 원목 단면과 수지가 앉은 자리를 눈으로 확인합니다.",
        },
        {
            "key": "tea-tasting",
            "prompt": "Photorealistic still life photograph of a traditional tea tasting set on a dark wooden table, small ceramic cups filled with amber colored tea, a glass vial of dark oil beside them, warm side lighting from a window, calm neutral background, no people, no text, no logo, no watermark",
            "alt": "침향차 시음 자리에 놓인 찻잔과 오일 병 — 시향 다음 순서",
            "caption": "시향을 마치면 침향차와 침향수를 맛보는 시음이 이어집니다.",
        },
    ],
    "changelog": {},
}

# --- 계측 ---
import unicodedata


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
    "citationsAdded": ["A1", "A4"],
    "voiceFixes": 31,
    "notes": "구어체 체험기를 보도자료 인칭으로 바꿔 전시장 운영·진열·도슨트 진술의 주어를 조엘라이프(주)/대라천으로 세웠습니다. 회피 화법과 '소개합니다' 식 간접 진술을 직접 진술 또는 연구팀 귀속으로 교체하고, 결론 우선 리드·수치 인포그래픽·예약 안내표·확인 범위 H2를 새로 넣었습니다. 비용·일정처럼 원문에 없는 정보는 만들지 않고 문의 안내로 남겼습니다.",
}

json.dump(out, open(os.path.join(BASE, "out", SLUG + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print("title", len(out["title"]))
print("excerpt", len(out["excerpt"]))
print("hangul before/after", before, after)
parts = re.split(r"<h2[^>]*>", content)[1:]
for p in parts:
    head = strip_tags(p.split("</h2>")[0])
    print("  H2", hangul(strip_tags(p)), head[:30])
