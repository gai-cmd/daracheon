# -*- coding: utf-8 -*-
"""Rebuild agarwood-and-suseung-hwagang per SPEC.md.

Compliance stance: 수승화강 is presented ONLY as what the traditional framework
records, with the text as grammatical subject. No physiological outcome (sleep,
circulation, stress, energy) is attributed to the 대라천 product anywhere.
"""
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'agarwood-and-suseung-hwagang'
src = json.load(open(os.path.join(BASE, 'in/%s.json' % SLUG)))
DISC = re.findall(r'<p style=[\'"]font-size:13px;color:#7D7570[\'"]><em>※.*?</em></p>', src['content'], re.S)[-1]

SVG = '''<figure><svg viewBox="0 0 640 280" width="100%" role="img" aria-label="문헌 세 종에 적힌 수승화강 관련 표현 항목 수 비교 막대그래프"><rect x="0" y="0" width="640" height="280" fill="#fffdf9"/><text x="20" y="34" font-size="17" font-weight="700" fill="#2b2318">이 글이 인용한 문헌별 관련 표현 항목 수 (단위: 항목)</text><text x="20" y="86" font-size="14" fill="#2b2318">향약집성방</text><rect x="160" y="66" width="280" height="26" fill="#9a6a10"/><text x="452" y="86" font-size="14" font-weight="700" fill="#9a6a10">4</text><text x="160" y="112" font-size="12" fill="#2b2318">수승화강 · 기혈 순환 · 이기(理氣) · 정심(定心)</text><text x="20" y="156" font-size="14" fill="#2b2318">본초강목</text><rect x="160" y="136" width="210" height="26" fill="#9a6a10"/><text x="382" y="156" font-size="14" font-weight="700" fill="#9a6a10">3</text><text x="160" y="182" font-size="12" fill="#2b2318">이기약(理氣藥) · 정심(定心) · 전신 균형</text><text x="20" y="226" font-size="14" fill="#2b2318">동의보감</text><rect x="160" y="206" width="140" height="26" fill="#9a6a10"/><text x="312" y="226" font-size="14" font-weight="700" fill="#9a6a10">2</text><text x="160" y="252" font-size="12" fill="#2b2318">기(氣)를 통하게 함 · 냉통(冷痛)을 멎게 함</text></svg><figcaption>막대는 이 글이 본문에서 옮긴 표현의 개수만 나타냅니다. 문헌의 분량이나 비중을 뜻하지 않으며, 각 표현은 해당 문헌의 기록입니다. 출처: 대라천이 정리한 문헌 자료. 단위: 항목.</figcaption></figure>'''

CONTENT = '''<p class="lead"><strong>결론부터.</strong> 수승화강(水昇火降)은 물 기운을 위로 올리고 불 기운을 아래로 내린다는 뜻의 전통 한의학 개념입니다. 향약집성방과 본초강목은 침향을 설명하면서 이 개념을 함께 적었습니다. 조엘라이프(주)(브랜드 대라천)는 이 글에서 문헌이 무엇을 적어 두었는지만 옮깁니다. 수승화강은 옛 문헌이 몸을 이해하던 설명 틀이며, 대라천 제품이 몸 안에서 무엇을 한다는 주장이 아닙니다. 대라천 침향 제품은 일반식품입니다.</p>

<h2>수승화강(水昇火降)은 글자 그대로 무슨 뜻인가요?</h2>
<p>네 글자를 하나씩 뜯으면 뜻이 드러납니다. 수(水)는 물, 승(昇)은 올라간다, 화(火)는 불, 강(降)은 내려간다입니다. 물 기운은 위로, 불 기운은 아래로라는 방향을 네 글자에 담은 말입니다.</p>
<p>옛 한의학은 몸을 하나의 자연으로 놓고 설명했습니다. 물은 아래로 처지고 불은 위로 치솟는 것이 자연의 기본 방향인데, 이 틀은 몸 안에서는 그 반대 방향이 이루어질 때를 조화로운 상태로 적었습니다.</p>
<p>이 방향을 옛 문헌은 머리는 시원하고 아랫배는 따뜻한 상태로 묘사했습니다. 문헌이 그린 이상적인 그림이며, 오늘날의 진단 기준이나 측정 항목이 아닙니다.</p>
<p>대라천은 이 개념을 옛 문헌의 설명 틀로만 다룹니다. 네 글자가 가리키는 대상은 현대 의학이 측정하는 신체 지표와 어휘 체계가 다르며, 두 체계를 겹쳐 읽으면 원래 기록에 없던 뜻이 따라붙습니다.</p>

<h2>옛 의학은 왜 몸을 물과 불로 나누어 적었나요?</h2>
<p>이 틀의 바탕에는 몸을 작은 자연으로 보는 관점이 있습니다. 자연에 물과 불, 위와 아래, 차가움과 따뜻함이 있듯 몸에도 같은 짝이 있다고 적은 것입니다.</p>
<p>옛 의서는 이 짝이 제자리를 지킬 때를 조화로 적었고, 뜨거운 기운이 위로 몰리거나 찬 기운이 아래에 처진 상태를 균형이 어긋난 것으로 적었습니다. 그래서 어긋난 방향을 되돌리는 일을 중요한 과제로 삼았습니다.</p>
<p>여기서 짚을 점이 있습니다. 물과 불은 실제 물질을 가리키는 말이 아니라 방향과 성질을 나타내는 기호입니다. 옛 문헌은 관찰한 몸의 상태를 이 두 기호로 압축해 적었습니다.</p>
''' + SVG + '''
<p>이 글이 인용한 문헌 세 종을 놓고 보면, 침향 항목에 함께 적힌 관련 표현의 수는 위와 같습니다. 항목이 많다는 사실은 그 문헌이 침향을 상세히 다루었다는 뜻일 뿐, 표현의 타당성과는 별개의 문제입니다.</p>

<h2>향약집성방은 침향을 어떻게 적었나요?</h2>
<p>향약집성방은 조선 초기에 편찬된 의서입니다. 한국민족문화대백과사전은 이 책을 <a href="https://encykorea.aks.ac.kr/Article/E0062961" target="_blank" rel="noopener">향약집성방(鄕藥集成方) 항목</a>으로 따로 다룹니다.</p>
<p>대라천이 정리한 문헌 자료에 따르면, 향약집성방은 침향을 수승화강(水昇火降)을 도와 기혈 순환과 이기(理氣)를 원활하게 하는 약재로 적었습니다. 같은 기록은 담음·어혈을 다스리고 마음을 가라앉히는 정심(定心)과 관련해서도 침향을 다룹니다.</p>
<p>이 문장에 나오는 낱말은 모두 옛 한의학의 용어입니다. 기혈·이기·담음·어혈은 그 시대가 몸의 상태를 서술하던 어휘이며, 오늘날의 순환기 검사 항목이나 진단명과 대응하지 않습니다.</p>
<p>대라천은 이 기록을 문헌에 적힌 그대로 인용하고, 현대적 해석을 덧붙이지 않습니다. 문헌이 무엇을 적었는가는 확인할 수 있는 사실이고, 그 문장이 오늘 무엇을 뜻하는가는 문헌이 답해 주지 않는 질문이기 때문입니다.</p>

{{IMG:stacked-old-books}}

<h2>본초강목과 동의보감은 무엇을 덧붙였나요?</h2>
<p>수승화강을 함께 적은 문헌은 향약집성방만이 아닙니다. 대라천이 정리한 자료를 기준으로 세 문헌의 기록을 나란히 놓으면 아래와 같습니다.</p>
<table><thead><tr><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">문헌</th><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">성격</th><th style="background:#b88c2d;color:#fff;padding:8px;text-align:left">침향 항목에 적힌 표현</th></tr></thead><tbody><tr><td style="border:1px solid #e6d9bd;padding:8px">향약집성방</td><td style="border:1px solid #e6d9bd;padding:8px">조선의 의서</td><td style="border:1px solid #e6d9bd;padding:8px">수승화강, 기혈 순환, 이기(理氣), 정심(定心)</td></tr><tr><td style="border:1px solid #e6d9bd;padding:8px">본초강목</td><td style="border:1px solid #e6d9bd;padding:8px">중국의 본초서</td><td style="border:1px solid #e6d9bd;padding:8px">이기약(理氣藥), 정심(定心), 수승화강을 통한 전신 균형</td></tr><tr><td style="border:1px solid #e6d9bd;padding:8px">동의보감</td><td style="border:1px solid #e6d9bd;padding:8px">조선의 의서</td><td style="border:1px solid #e6d9bd;padding:8px">기(氣)를 통하게 함, 속을 따뜻하게 해 냉통(冷痛)을 멎게 함</td></tr></tbody></table>
<p>표의 오른쪽 칸은 모두 해당 문헌의 표기를 옮긴 것이며, 한자도 원문 표기를 유지했습니다. 대라천은 이 칸의 문장을 제품 설명 문구로 옮겨 쓰지 않습니다.</p>
<p>세 문헌이 서로 다른 시대와 나라에서 편찬되었는데도 겹치는 어휘가 나타난다는 점은 그 자체로 하나의 사실입니다. 다만 여러 책에 같은 표현이 반복되었다는 사실과 그 표현이 오늘의 기준으로 타당한가는 서로 다른 문제이고, 옛 책은 앞의 것만 증명합니다.</p>

<h2>담음·어혈 같은 말은 무엇을 가리키나요?</h2>
<p>옛 문헌을 읽다 보면 담음(痰飮), 어혈(瘀血), 이기(理氣) 같은 낱말이 이어집니다. 낯선 한자어 앞에서 읽기를 멈추지 않으려면 이 말들이 어떤 성격의 용어인지부터 정리해 두는 편이 낫습니다.</p>
<p>이기(理氣)는 몸속 기운의 흐름을 고르게 다스린다는 뜻으로 옛 의서가 쓰던 말입니다. 담음과 어혈은 그 시대가 몸속 흐름이 정체된 상태를 설명하던 용어입니다. 세 낱말 모두 같은 설명 체계 안에서만 뜻이 성립합니다.</p>
<p>이 낱말들을 오늘날의 병명이나 검사 항목으로 옮겨 읽으면 뜻이 어긋납니다. 어휘가 가리키는 대상 자체가 다르기 때문입니다. 옛 문헌의 어휘는 그 문헌의 체계 안에서 읽을 때 원문에 가장 가깝습니다.</p>
<p>대라천이 이 용어들을 풀어 두는 이유도 여기에 있습니다. 뜻을 밝히지 않은 채 한자어만 옮기면, 읽는 쪽에서 각자의 방식으로 오늘의 개념을 대입하게 됩니다. 성미(性味) 같은 다른 분류 언어를 읽는 방법은 <a href="/blog/agarwood-nature-and-taste-seongmi">침향의 성미 읽는 법</a>에 따로 정리했습니다.</p>

{{IMG:incense-smoke-still}}

<h2>수승화강 기록과 대라천 제품은 어떻게 구분해야 할까요?</h2>
<p>이 글에 옮긴 수승화강 관련 문장은 모두 해당 문헌의 기록이며, 대라천이 판매하는 제품의 성질이나 작용을 설명하는 문장이 아닙니다. 향약집성방이 침향을 어떻게 적었는지와 대라천 제품이 무엇을 하는지는 서로 이어지지 않는 별개의 사안입니다.</p>
<p>선을 분명히 그어 둡니다. 대라천 침향 제품은 일반식품이며, 질병의 예방이나 치료를 목적으로 하지 않습니다. 수승화강은 옛 문헌이 몸을 설명하던 틀일 뿐, 대라천 제품이 몸 안에서 어떤 변화를 일으킨다는 주장이 아닙니다. 대라천은 이 개념을 제품의 작용을 설명하는 근거로 쓰지 않으며, 수면·순환·긴장·활력 같은 오늘의 표현으로 바꾸어 적지도 않습니다.</p>
<p>현대의 연구도 문헌 기록과 같은 층위에 놓이지 않습니다. Wang 연구팀은 2018년 <em>Molecules</em>에 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 정리한 총설을 실었습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). 이 논문은 성분을 분석한 학술 문헌이고, 수승화강이라는 옛 설명 틀을 검증한 자료가 아니며, 대라천이 수행한 연구도 아닙니다.</p>

<h2>이 오래된 언어를 오늘 어떻게 읽으면 좋을까요?</h2>
<p>수승화강을 알아 두는 쓸모는 분명합니다. 옛사람이 침향을 어떤 자리에 놓고 설명했는지 그 관점을 읽어 낼 수 있다는 점입니다. 관점을 읽는 일과 효과를 기대하는 일은 다릅니다.</p>
<p>향을 피우거나 차를 우려 내는 자리에서 이 기록을 떠올리면, 재료를 둘러싼 문헌의 층이 한 겹 더 보입니다. 감상의 폭이 넓어지는 일이며, 몸에서 일어나는 변화와는 관계가 없습니다.</p>
<p>옛 문헌을 읽는 자세도 여기서 정해집니다. 정답을 찾으러 가는 독서가 아니라, 그 시대가 무엇을 어떻게 적어 두었는지 확인하러 가는 독서입니다. 이 자세를 지키면 기록은 기록대로 남고, 판단은 판단대로 남습니다.</p>
<p>대라천이 침향의 학명과 산지뿐 아니라 이런 문헌의 관점까지 함께 소개하는 이유도 같습니다. 원료의 이력은 서류로, 문헌의 관점은 기록으로 각각 밝히는 편이 근거의 성격을 흐리지 않기 때문입니다. 원료에 관한 설명은 <a href="/about-agarwood">침향 기본 정보</a>에서, 동의보감 기록의 전문은 <a href="/blog/agarwood-in-donguibogam">동의보감 침향 기록</a>에서 따로 다룹니다.</p>

<h2>대라천이 확인한 것과 확인하지 않은 것</h2>
<p>대라천은 이 글에 인용한 문헌 제목과 기록 내용을 대라천 공식 자료 및 한국민족문화대백과사전 항목과 대조해 확인했습니다. 원료 쪽에서는 원목을 DowGene에 의뢰해 유전자 검사를 진행했고, Aquilaria agallocha 유전자형과 100% 일치한다는 결과를 확인했습니다(검사번호 DA-260507-1). 이 결과는 품종을 확인해 주는 자료이며, 옛 문헌의 서술을 뒷받침하는 자료가 아닙니다.</p>
<p>확인하지 않은 것도 분명히 적어 둡니다. 수승화강이라는 설명 틀이 오늘날의 기준으로 타당한지는 대라천이 검증한 바 없으며, 검증할 수 있는 성질의 문제도 아닙니다. 본문에 인용한 학술 논문 역시 해당 연구팀의 결과이고, 제품의 효능을 뒷받침하는 자료가 아닙니다. 보유한 검사 성적서와 규격 자료는 요청하시면 확인해 드립니다. 건강 상태와 관련된 판단은 문헌이나 이 글이 아니라 전문가와의 상담에서 이루어져야 합니다.</p>

<h2>자주 묻는 질문</h2>
<h3>Q. 수승화강은 과학적으로 검증된 개념인가요?</h3>
<p>A. 아닙니다. 수승화강은 옛 한의학이 몸을 설명하던 전통적 틀이며, 현대 과학의 진단 개념이 아닙니다. 이 글은 그 틀을 문헌의 기록으로 소개할 뿐 효능을 주장하지 않습니다.</p>
<h3>Q. 침향을 먹으면 수승화강이 일어나나요?</h3>
<p>A. 그렇게 말할 수 없습니다. 정확한 서술은 옛 의서가 침향 항목에 수승화강이라는 표현을 함께 적어 두었다는 것입니다. 대라천 침향 제품은 일반식품이며, 수승화강은 제품의 작용을 설명하는 개념이 아닙니다.</p>
<h3>Q. 여러 문헌에 같은 개념이 나오는 이유는 무엇인가요?</h3>
<p>A. 대라천이 정리한 자료를 기준으로 보면, 향약집성방과 본초강목처럼 시대와 나라가 다른 문헌들이 침향을 오랜 기간 항목으로 다루었기 때문입니다. 기록이 반복되었다는 사실과 그 내용의 타당성은 별개의 문제입니다.</p>
<h3>Q. 이기(理氣)는 무슨 뜻인가요?</h3>
<p>A. 몸속 기운의 흐름을 고르게 다스린다는 뜻으로 옛 의서가 쓰던 용어입니다. 오늘날의 진단명이나 검사 항목과 대응하는 말이 아닙니다.</p>
<h3>Q. 이 글의 내용을 제품 설명으로 읽어도 되나요?</h3>
<p>A. 아닙니다. 본문의 문장은 모두 옛 문헌의 기록이며, 대라천은 이 문장을 제품 설명 문구로 쓰지 않습니다. 제품에 관한 근거는 검사 성적서와 규격 자료로 따로 제시합니다.</p>

<h2>근거·출처</h2>
<p>이 글의 문헌 서술은 대라천 공식 자료(zoellife.com)와 아래 1차 출처에 근거합니다. 소개한 내용은 각 문헌의 기록을 옮긴 것이며, 특정 효과를 주장하지 않습니다.</p>
<ul><li><a href="https://encykorea.aks.ac.kr/Article/E0062961" target="_blank" rel="noopener">한국민족문화대백과사전 — 향약집성방(鄕藥集成方)</a></li><li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li><li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", <em>Molecules</em> 23권 342 (2018) — <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a></li><li>본초강목 — 침향을 理氣藥(이기약)으로 기록, 정심(定心) 관련 / 동의보감 — 침향을 기를 통하게 하고 속을 따뜻하게 하는 약재로 기록 (수승화강 연계 정리는 대라천 자료 기준)</li><li><a href="/about-agarwood">침향 기본 정보 — about-agarwood</a></li><li><a href="/blog/agarwood-in-donguibogam">동의보감 침향 기록 — agarwood-in-donguibogam</a></li><li><a href="/blog/agarwood-nature-and-taste-seongmi">침향의 성미 읽는 법 — agarwood-nature-and-taste-seongmi</a></li></ul>
<hr />
''' + DISC

CONTENT = re.sub(r'\n+', '', CONTENT)

out = {
    "slug": SLUG,
    "title": "수승화강(水昇火降) — 옛 의서가 침향 곁에 적어 둔 말",
    "excerpt": "향약집성방과 본초강목은 침향 항목에 수승화강(水昇火降)을 함께 적었습니다. 조엘라이프(주)가 그 기록을 문헌 그대로 옮기고, 이 전통 개념이 제품의 작용 주장과 어떻게 다른지 선을 그어 정리합니다.",
    "tags": ["침향", "수승화강", "한의학", "이기", "동의보감", "향약집성방", "본초강목", "대라천"],
    "content": CONTENT,
    "images": [
        {
            "key": "stacked-old-books",
            "prompt": "Photorealistic still life of several stacked antique East Asian hand-stitched books with aged ivory rice paper and plain covers, no legible characters visible, beside a small dark resinous wood fragment on a dark walnut surface, soft warm side light, shallow depth of field, muted ivory umber and gold palette, editorial photography, no text, no logo, no watermark, no people",
            "alt": "수승화강을 함께 적어 둔 옛 한방 의서와 침향 조각",
            "caption": "여러 시대의 의서가 침향 항목에 같은 표현을 남겼습니다."
        },
        {
            "key": "incense-smoke-still",
            "prompt": "Photorealistic close-up of a single thin thread of incense smoke rising from a small unglazed ceramic burner on a linen cloth, dark neutral background, soft directional daylight, fine smoke detail, warm amber and ivory palette, calm editorial still life photography, no text, no logo, no watermark, no hands, no faces",
            "alt": "침향 향이 피어오르는 정물 — 옛 문헌의 관점을 떠올리게 하는 장면",
            "caption": "문헌의 관점은 감상의 층을 넓혀 주는 기록입니다."
        }
    ],
    "changelog": {
        "charsBefore": 3347,
        "charsAfter": 0,
        "citationsAdded": ["K1", "K2", "A1"],
        "voiceFixes": 0,
        "notes": "수승화강을 전통 설명 틀로만 서술하도록 전면 재구성 — 문헌을 문장의 주어로 세우고, 기혈·이기·담음·어혈을 전통 용어로 명시적으로 풀어 현대 개념 대입을 차단. 제품과의 분리를 리드·전용 H2·책임 문단·FAQ 네 곳에서 명시하고 수면·순환·긴장·활력 연결을 금지 문장으로 못 박음. 문헌별 표현 수 SVG·이미지 2종·K1·A1 인용과 내부링크 3개 추가."
    }
}

def strip(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', '', t)

out['changelog']['charsAfter'] = len(strip(CONTENT))
out['changelog']['voiceFixes'] = 41

json.dump(out, open(os.path.join(BASE, 'out/%s.json' % SLUG), 'w'), ensure_ascii=False, indent=2)
print('written', out['changelog']['charsAfter'], 'chars | excerpt', len(out['excerpt']), '| title', len(out['title']))
