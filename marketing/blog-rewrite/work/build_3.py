import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = "why-agarwood-sinks-in-water"
src = json.load(open(os.path.join(BASE, "in", SLUG + ".json"), encoding="utf-8"))
sc = src["content"]

SVG = re.search(r"<svg .*?</svg>", sc, re.S).group()
SVG = SVG.replace('<svg viewBox="0 0 420 180"', '<svg viewBox="0 0 420 180" width="100%"', 1)
IMG = re.search(r"<img[^>]*/>", sc).group()
DISC = re.search(r'<p style="font-size:13px;color:#7D7570">.*?</p>', sc, re.S).group()

P = []
A = P.append

A('<p class="lead"><strong>결론부터.</strong> 물에 가라앉는 침향은 밀도가 물보다 높다는 뜻이고, 밀도는 수지가 얼마나 배었는지와 이어집니다. 침향(沈香)이라는 이름 자체가 그 성질에서 나왔고, 식약처가 펴낸 대한민국약전외한약(생약)규격집도 물에 가라앉는 성질을 침향의 성상으로 적어 두었습니다. 다만 침강은 수지량에 관한 신호일 뿐 품종도, 산지도, 등급도 특정하지 못합니다. 조엘라이프(주)(브랜드 대라천)는 그래서 학명·원산지·검사 서류로 따로 확인합니다.</p>')

# 1
A('<h2>침향(沈香)이라는 이름은 무엇을 가리킬까요</h2>')
A('<p>침향은 한자로 沈香이라고 씁니다. 앞 글자 침(沈)은 가라앉는다는 뜻이고, 뒷 글자 향(香)은 향기라는 뜻입니다. 글자 그대로 옮기면 물에 가라앉는 향이 됩니다.</p>')
A('<p>이름이 성질을 그대로 담은 사례입니다. 향재의 이름은 대개 산지나 모양에서 오는데, 침향은 물에 넣었을 때의 거동에서 왔습니다.</p>')
A('<p>이 이름이 붙은 배경에는 물이 기준자 역할을 했다는 사정이 있습니다. 저울이 흔치 않던 시절에도 물 한 그릇만 있으면 목질의 무거움을 견줘 볼 수 있었고, 그 관찰이 그대로 이름에 남았습니다.</p>')
A('<p>같은 성질을 더 또렷이 담은 이름도 함께 쓰입니다. 침수향(沈水香)은 물(水)에 잠긴다는 뜻을 이름 안에 넣은 표기입니다. 식약처가 펴낸 대한민국약전외한약(생약)규격집은 침향의 다른 이름으로 침수향을 적고, 학술명으로 AQUILARIAE LIGNUM을 병기해 두었습니다.</p>')

# 2
A('<h2>보통 나무는 뜨는데 침향은 왜 가라앉을까요</h2>')
A('<p>나무 조각은 대개 물에 뜹니다. 목질 안에 물관과 세포 사이 공극이 많아 같은 부피의 물보다 가볍기 때문입니다. 침향이 가라앉는 이유는 그 빈 공간이 채워지기 때문입니다.</p>')
A('<p>아퀼라리아 나무는 상처를 아물리는 과정에서 수지를 만들어 냅니다. 이 수지가 목질 속 빈 곳으로 스며들어 굳으면 같은 부피의 무게가 올라갑니다. 밀도가 물을 넘어서는 순간 조각은 뜨지 않고 가라앉습니다.</p>')
A('<figure>' + SVG + '<figcaption>수지가 밴 정도에 따른 부력 차이. 대라천 공식 자료 기준이며, 그림은 원리를 나타낸 도식입니다.</figcaption></figure>')
A('<p>Wang S 연구팀은 2018년 <em>Molecules</em>에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 총론으로 정리했습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). 대라천은 이 리뷰를 수지 성분 일반에 관한 참고 자료로만 인용하며, 제품의 효능 근거로는 쓰지 않습니다.</p>')

# 3
A('<h2>수지가 목질에 쌓이기까지 무슨 일이 일어날까요</h2>')
A('<p>침향이 무거워지는 과정은 네 단계로 정리됩니다. 대라천 자료에 따른 순서는 이렇습니다.</p>')
A('<ul>'
  '<li>벌레·바람·낙뢰·외부 충격으로 나무에 상처가 납니다.</li>'
  '<li>그 틈으로 곰팡이균이 나무 속에 들어옵니다.</li>'
  '<li>나무가 스스로를 지키려 상처 부위에 수지를 뿜어냅니다.</li>'
  '<li>그 수지가 수십 년에 걸쳐 목질 속에 쌓이고 굳습니다.</li>'
  '</ul>')
A('<p>가라앉을 만큼 무거워지는 것은 마지막 단계에서 일어나는 일입니다. 상처가 난 직후의 나무는 아직 여느 목재처럼 가볍고, 수지가 빈 공간을 메워 나가는 동안 밀도가 조금씩 올라갑니다. 대라천이 좋은 침향의 수확 시점을 최소 26년으로 잡는 이유도 이 축적 속도에 있습니다.</p>')
A('<p>속도가 느린 이유는 수지가 한 번에 채워지지 않기 때문입니다. 상처는 한 지점에서 시작되고, 수지는 그 둘레의 목질을 따라 조금씩 번져 나갑니다. 같은 나무 안에서도 수지가 짙게 밴 부분과 거의 배지 않은 부분이 함께 남는 이유입니다.</p>')
A('{{IMG:aquilaria-trunk-wound}}')

# 4
A('<h2>가라앉는다는 사실은 무엇을 증명하고, 무엇을 증명하지 못할까요</h2>')
A('<p>여기가 이 글에서 가장 중요한 대목입니다. 침강은 밀도에 관한 관찰이고, 밀도는 수지량과 이어집니다. 거기까지가 침강이 답해 주는 범위입니다.</p>')
A('<p>침강은 어떤 종의 나무인지 말해 주지 않습니다. 어느 나라에서 왔는지도 말해 주지 않습니다. 등급이 무엇인지도 말해 주지 않습니다. 세 항목은 모두 침강과 다른 경로로만 확인됩니다.</p>')
A('<table><thead><tr><th>침강이 알려 주는 것</th><th>침강이 알려 주지 못하는 것</th><th>그 항목의 확인 경로</th></tr></thead><tbody>'
  '<tr><td>밀도가 물보다 높다</td><td>기원식물(품종)이 무엇인가</td><td>DNA 검사서</td></tr>'
  '<tr><td>수지가 상당히 배어 있다</td><td>어느 산지에서 왔는가</td><td>원산지증명 · CITES 인증서</td></tr>'
  '<tr><td>목질의 공극이 메워졌다</td><td>등급이 어디에 해당하는가</td><td>등급 판정</td></tr>'
  '<tr><td>—</td><td>안전성에 문제가 없는가</td><td>중금속 등 안전성 검사</td></tr>'
  '</tbody></table>')
A('<p>Wang Y 연구팀은 2021년 <em>Molecules</em>에 아퀼라리아 속의 분포와 성분, 침향 등급 체계, 수지 유도법을 정리해 실었습니다(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI</a>). 등급을 나누는 체계가 따로 존재한다는 사실 자체가, 물컵 하나로 등급을 판정할 수 없다는 근거가 됩니다.</p>')
A('{{IMG:graded-agarwood-chips}}')

# 5
A('<h2>약전은 침강 말고 무엇을 함께 보라고 정해 두었을까요</h2>')
A('<p>규격집은 침강만 적어 두지 않았습니다. 대라천 자료에 따르면 약전 규격은 좋은 침향을 흑갈색을 띠고, 맛은 달면서 쓰며, 물에 가라앉는 성질로 규정합니다. 색과 맛과 무게를 함께 보라는 뜻입니다.</p>')
A('<p>숫자로 정해 둔 항목도 있습니다. 건조감량은 시료에서 물기가 얼마나 빠지는지를, 회분은 태우고 남는 재가 얼마나 되는지를 확인하는 항목입니다. 두 항목은 눈으로 확인되지 않고 시험실을 거쳐야 나옵니다.</p>')
A('<p>수치 항목이 필요한 까닭은 겉으로 드러나지 않는 상태가 있기 때문입니다. 물기가 많이 남은 시료는 무게가 실제보다 크게 나오고, 재가 많이 남는 시료는 목질이 아닌 성분이 섞였을 가능성을 시사합니다.</p>')
A('<p>규격집의 서술 방식 자체가 시사하는 바가 있습니다. 한 가지 성질만으로 판정하지 않고 관능 항목과 수치 항목을 나란히 두었다는 점입니다. 침강 하나만 떼어 보는 방식은 규격집이 정한 절차와도 어긋납니다. 규격 항목별 설명은 <a href="/blog/agarwood-pharmacopoeia-spec-authentication">약전 규격과 감별</a>에 따로 정리돼 있습니다.</p>')

# 6
A('<h2>대라천은 침강 대신 무엇으로 확인할까요</h2>')
A('<p>대라천은 물에 담가 보는 관찰을 진위 판단의 근거로 쓰지 않습니다. 대신 다음 결과를 공개합니다.</p>')
A('<ul>'
  '<li>유전자(DNA) 검사에서 아퀼라리아 아갈로차 유전자형과 100% 일치(검사번호 DA-260507-1)</li>'
  '<li><a href="https://cites.org" target="_blank" rel="noopener">CITES</a> 부속서 등재(관리번호 IIA-DNI-007)에 따른 합법 관리</li>'
  '<li>중금속 8종 전부 불검출(2023년 8월 24일)</li>'
  '</ul>')
A('<p>세 결과는 각각 다른 질문에 답합니다. 유전자 검사는 품종을, CITES 등재는 거래의 합법성과 산지 관리를, 중금속 검사는 안전성을 확인합니다. 앞의 표에서 침강이 답하지 못한 칸들이 이 서류로 채워집니다.</p>')
A('<p>세 서류는 서로를 대신하지도 못합니다. 유전자형이 일치해도 안전성은 별도 검사로만 확인되고, 중금속이 불검출이어도 품종은 그것으로 특정되지 않습니다. 확인 항목마다 경로가 따로 있다는 점이 침강 하나에 기대지 않는 이유입니다.</p>')
A('<figure>' + IMG + '<figcaption>수지가 목질의 빈 공간을 채우면 밀도가 올라갑니다. 밀도는 수지량의 신호이며, 품종·산지·등급은 별도 확인이 필요합니다.</figcaption></figure>')

# 7
A('<h2>나무 한 그루까지 번호로 남기면 무엇이 달라질까요</h2>')
A('<p>대라천은 겉모습이나 물 실험이 아니라 기록으로 원료를 추적합니다. 조엘라이프는 아갈로차 나무마다 개별 고유번호를 붙여 심은 시점부터 자라는 과정을 기록·관리합니다.</p>')
A('<p>기록은 제품까지 이어집니다. 제품에는 Lot 번호가 붙어 어느 생산 묶음에서 나왔는지 조회됩니다. 나무를 심는 시점부터 제품이 되는 시점까지 번호가 끊기지 않는 구조입니다.</p>')
A('<p>번호가 붙으면 확인의 방향이 바뀝니다. 물건을 앞에 두고 성질을 추측하는 대신, 번호를 입력해 기록을 불러오는 방식이 되기 때문입니다.</p>')
A('<p>이 방식의 이점은 되짚기가 가능하다는 데 있습니다. 물에 넣어 보는 관찰은 그 순간의 상태만 보여 주지만, 번호는 그 원료가 어디에서 몇 년을 자랐는지를 남깁니다. 번호 체계의 실제 운용은 <a href="/blog/individual-tree-id-traceability">나무별 고유번호 추적</a>과 <a href="/blog/qr-lot-traceability-trust">QR·Lot 조회</a>에 정리돼 있습니다.</p>')

# 8
A('<h2>학명 표기가 두 가지인 이유는 무엇일까요</h2>')
A('<p>침향 서류를 보면 학명이 두 갈래로 적히는 경우가 있습니다. 대라천이 기원식물로 명시하는 이름은 아퀼라리아 아갈로차 록스버그입니다. 식약처 규격집에 기원식물로 실린 표기이기도 합니다.</p>')
A('<p>한편 오늘날 학계는 이 이름을 아퀼라리아 말라켄시스(<em>Aquilaria malaccensis</em>)의 이명으로 봅니다. 같은 대상을 가리키는 두 표기가 문서마다 다르게 등장하는 셈입니다.</p>')
A('<p>이명이란 같은 종에 붙은 다른 이름을 뜻합니다. 분류학 연구가 진행되면서 먼저 붙은 이름으로 정리되는 일이 흔한데, 규격집처럼 오래 쓰인 공식 문서는 등재 당시의 표기를 유지하는 경우가 있습니다.</p>')
A('<p>표기가 갈린다는 사실은 물 실험의 한계를 다시 보여 줍니다. 이름의 층위가 이렇게 나뉘는 대상을, 뜨는지 가라앉는지 하나로 특정할 수는 없습니다. 두 표기의 관계는 <a href="/blog/why-aquilaria-agallocha-roxburgh-matters">아퀼라리아 아갈로차 록스버그 표기가 중요한 이유</a>에서 자세히 다룹니다.</p>')

# 9
A('<h2>그래서 물컵 실험은 언제 쓰면 될까요</h2>')
A('<p>쓸모가 없다는 이야기가 아닙니다. 도구도 사전 지식도 필요 없고 결과가 즉시 눈에 보이므로, 수지가 거의 배지 않은 목질을 걸러 내는 1차 관문으로는 유효합니다.</p>')
A('<p>순서만 지키면 됩니다. 침강으로 후보를 좁히고, 학명과 원산지, 검사 서류로 최종 확인합니다. 물컵 시연을 실제 구매 단계에서 어떻게 배치할지는 <a href="/blog/proof-in-water-cup-and-papers">물컵 침강 테스트와 서류 석 장</a>에 절차 중심으로 정리돼 있으므로, 구매를 앞두셨다면 그쪽을 이어서 보시면 됩니다.</p>')
A('<p>대라천은 이 글에 적은 검사 결과와 규격을 자체 시험성적서로 보유하고 있으며, 요청하시면 확인해 드립니다. 다만 인용한 두 편의 논문은 대라천이 수행한 연구가 아니라 해당 연구팀의 결과이고, 제품의 효능을 뒷받침하는 자료가 아닙니다. 시중에 유통되는 다른 침향이 물에 가라앉는지 여부는 대라천이 확인한 범위 밖이므로 이 글에 적지 않았습니다.</p>')

# FAQ
A('<h2>자주 묻는 질문</h2>')
A('<h3>Q. 침향은 원래 다 물에 가라앉나요?</h3>')
A('<p>A. 수지가 촘촘히 밴 침향은 밀도가 높아 가라앉습니다. 대한민국약전외한약(생약)규격집도 물에 가라앉는 성질을 침향의 성상으로 적어 두었습니다. 수지가 적게 밴 목질은 그대로 뜹니다.</p>')
A('<h3>Q. 물에 넣어 보면 진짜인지 알 수 있나요?</h3>')
A('<p>A. 침강이 답해 주는 범위는 밀도까지입니다. 품종·산지·등급은 DNA 검사서와 원산지증명, CITES 인증서로 따로 확인해야 합니다.</p>')
A('<h3>Q. 침수향은 침향과 다른 건가요?</h3>')
A('<p>A. 같은 대상을 가리키는 다른 이름입니다. 침수향(沈水香)은 물에 잠긴다는 뜻을 이름에 더 또렷이 담은 표기이며, 식약처 규격집에도 실려 있습니다.</p>')
A('<h3>Q. 침향은 왜 그렇게 무거운가요?</h3>')
A('<p>A. 나무가 오래 뿜어낸 수지가 목질의 빈 공간을 채우며 굳기 때문입니다. 같은 부피라도 공극이 메워진 만큼 무게가 올라갑니다.</p>')
A('<h3>Q. 서류에 적힌 학명이 문서마다 다른데 괜찮은가요?</h3>')
A('<p>A. 아퀼라리아 아갈로차 록스버그는 식약처 규격집의 기원식물 표기이고, 학계는 이를 아퀼라리아 말라켄시스의 이명으로 봅니다. 두 표기가 같은 대상을 가리키는지 확인하시면 됩니다.</p>')

# Sources
A('<h2>근거·출처</h2>')
A('<ul>'
  '<li>Wang S, Yu Z, Wang C 외, “Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants”, <em>Molecules</em> 23권 342 (2018) — <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a></li>'
  '<li>Wang Y, Hussain M, Jiang Z 외, “Aquilaria Species (Thymelaeaceae) Distribution, Volatile and Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods”, <em>Molecules</em> 26권 7708 (2021) — <a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">https://doi.org/10.3390/molecules26247708</a></li>'
  '<li>CITES — 아퀼라리아 속 국제 거래 규제: <a href="https://cites.org" target="_blank" rel="noopener">https://cites.org</a> (대라천 부속서 등재 관리번호 IIA-DNI-007)</li>'
  '<li>식약처 고시 대한민국약전외한약(생약)규격집 — 침향·침수향(沈水香), 학술명 AQUILARIAE LIGNUM, 성상(흑갈색·달고 쓴맛·물에 가라앉음)·건조감량·회분</li>'
  '<li>대라천 원료 규격·검사 결과(DNA 검사 DA-260507-1, 중금속 8종 불검출): <a href="/about-agarwood">침향 알아보기</a> · <a href="/brand-story">브랜드 스토리</a></li>'
  '</ul>')
A('<hr />')
A(DISC)

content = "\n".join(P)

out = {
    "slug": SLUG,
    "title": "물에 가라앉는 침향 — 沈香이라는 이름과 밀도의 관계",
    "excerpt": "물에 가라앉는 침향은 밀도가 높다는 뜻이고, 밀도는 수지량과 이어집니다. 다만 침강은 품종도 산지도 등급도 증명하지 못합니다. 조엘라이프(주)가 沈香이라는 이름의 유래와 침강이 답하는 범위, 그 밖의 확인 경로를 정리했습니다.",
    "tags": ["침향", "침수향", "침향뜻", "물에가라앉는침향", "밀도", "침향감별", "대라천", "참침향"],
    "content": content,
    "images": [
        {
            "key": "aquilaria-trunk-wound",
            "prompt": "Photorealistic close-up of a tropical Aquilaria tree trunk in a plantation, a healed bark wound with dark resin staining spreading through the surrounding grey bark, fine moss and lichen texture, humid green foliage blurred behind, soft overcast daylight, natural umber and green palette, shallow depth of field, documentary nature photography, no text, no letters, no numbers, no logo, no watermark, no people",
            "alt": "상처 부위에 수지가 짙게 밴 침향나무 줄기 — 물에 가라앉는 침향이 만들어지는 시작점",
            "caption": "상처를 아물리며 뿜어낸 수지가 목질의 빈 공간을 채웁니다"
        },
        {
            "key": "graded-agarwood-chips",
            "prompt": "Photorealistic overhead still life on pale ivory linen: five small agarwood chips arranged in a row, ranging from pale porous wood on the left to almost black dense resin-saturated wood on the right, visible grain and resin veins, soft diffused daylight, muted cream and dark brown palette, sharp macro detail, editorial product photography, no text, no letters, no numbers, no logo, no watermark, no people",
            "alt": "수지 함량이 다른 침향 조각들 — 침강만으로는 등급을 가릴 수 없음을 보여 주는 비교",
            "caption": "수지가 밴 정도는 연속적입니다 — 뜨고 가라앉는 두 갈래로 나뉘지 않습니다"
        }
    ],
    "changelog": {
        "charsBefore": len(re.sub(r"<[^>]+>", "", sc)),
        "charsAfter": len(re.sub(r"<[^>]+>", "", content)),
        "citationsAdded": ["A1", "A7", "K4"],
        "voiceFixes": 45,
        "notes": "-요체 구어 서술을 조엘라이프(주)/대라천 주어의 보도자료 -습니다체로 전환했습니다. 침강이 답하는 범위를 밀도·수지량까지로 한정하고 품종·산지·등급·안전성은 별도 경로로만 확인된다는 한계를 전용 H2와 대조표로 명시했으며, 구매 단계 절차는 중복을 피해 proof-in-water-cup-and-papers로 넘겼습니다. 학명은 원문 표기형(아퀼라리아 아갈로차 록스버그 / Aquilaria malaccensis / 아퀼라리아 말라켄시스 / AQUILARIAE LIGNUM)을 대소문자까지 그대로 유지했고, 수치(DA-260507-1·IIA-DNI-007·중금속 8종·2023년 8월 24일·100%·26년)와 SVG·이미지 URL·disclaimer도 그대로 두었습니다."
    }
}
json.dump(out, open(os.path.join(BASE, "out", SLUG + ".json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("written", out["changelog"]["charsBefore"], "->", out["changelog"]["charsAfter"],
      "excerpt", len(out["excerpt"]), "title", len(out["title"]))
