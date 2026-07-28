# -*- coding: utf-8 -*-
"""침향 입문 2편 재편 빌더 — SPEC.md v1 준수."""
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, 'out')

DISCLAIMER = ('<hr /><p style="font-size:13px;color:#7D7570"><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, '
              '대라천 공식 자료(zoellife.com)와 공식 문서·학술 논문에 근거해 작성되었습니다. 소개된 전통 문헌·연구 내용은 '
              '해당 출처의 기록이며 특정 효과를 보장하지 않습니다. 대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 '
              '예방·치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. 건강 상태에 따라 전문가와 '
              '상담하시기 바랍니다.</em></p>')

# ─────────────────────────────────────────────────────────────
# 1) what-is-agarwood-for-beginners
# ─────────────────────────────────────────────────────────────

SVG1 = (
'<figure><svg viewBox="0 0 660 260" width="100%" role="img" aria-label="침향이 만들어지는 4단계와 최소 25년의 소요 시간을 나타낸 선 도표">'
'<rect x="0" y="0" width="660" height="260" fill="#fffdf9"/>'
'<text x="20" y="34" font-size="17" font-weight="700" fill="#2b2318">침향 한 조각이 만들어지기까지</text>'
'<text x="20" y="56" font-size="13" fill="#2b2318" opacity="0.75">가로축은 시간의 흐름. 총 소요 시간 최소 25년 = 219,000시간</text>'
'<line x1="40" y1="120" x2="620" y2="120" stroke="#9a6a10" stroke-width="3"/>'
'<circle cx="60" cy="120" r="9" fill="#9a6a10"/><circle cx="200" cy="120" r="9" fill="#9a6a10"/>'
'<circle cx="340" cy="120" r="9" fill="#9a6a10"/><circle cx="540" cy="120" r="13" fill="#9a6a10"/>'
'<text x="60" y="103" font-size="13" font-weight="700" fill="#2b2318" text-anchor="middle">1단계</text>'
'<text x="200" y="103" font-size="13" font-weight="700" fill="#2b2318" text-anchor="middle">2단계</text>'
'<text x="340" y="103" font-size="13" font-weight="700" fill="#2b2318" text-anchor="middle">3단계</text>'
'<text x="540" y="99" font-size="13" font-weight="700" fill="#2b2318" text-anchor="middle">4단계</text>'
'<text x="60" y="148" font-size="13" fill="#2b2318" text-anchor="middle">상처</text>'
'<text x="200" y="148" font-size="13" fill="#2b2318" text-anchor="middle">곰팡이균 침입</text>'
'<text x="340" y="148" font-size="13" fill="#2b2318" text-anchor="middle">수지 분비</text>'
'<text x="540" y="148" font-size="13" fill="#2b2318" text-anchor="middle">숙성</text>'
'<text x="540" y="172" font-size="15" font-weight="700" fill="#9a6a10" text-anchor="middle">최소 25년</text>'
'<text x="540" y="192" font-size="13" fill="#9a6a10" text-anchor="middle">219,000시간</text>'
'<text x="20" y="228" font-size="13" fill="#2b2318" opacity="0.75">1~3단계는 나무가 상처에 반응하는 과정이고, 전체 기간의 대부분은 4단계 숙성이 차지합니다.</text>'
'<text x="20" y="248" font-size="13" fill="#2b2318" opacity="0.75">눈금 간격은 도식이며 각 단계의 실제 길이 비율을 나타내지 않습니다.</text>'
'</svg><figcaption>자료: 대라천 공식 자료의 침향 형성 4단계와 최소 25년(219,000시간) 기준. 단계 간 간격은 도식이며 실제 기간 비율이 아닙니다.</figcaption></figure>'
)

TABLE1 = (
'<table style="width:100%;border-collapse:collapse;font-size:15px"><thead><tr style="background:#b88c2d;color:#fff">'
'<th style="padding:10px;border:1px solid #e5ddd0;text-align:left">구분</th>'
'<th style="padding:10px;border:1px solid #e5ddd0;text-align:left">보통 나무 조각</th>'
'<th style="padding:10px;border:1px solid #e5ddd0;text-align:left">침향</th></tr></thead><tbody>'
'<tr><td style="padding:10px;border:1px solid #e5ddd0"><strong>물에 넣으면</strong></td>'
'<td style="padding:10px;border:1px solid #e5ddd0">대부분 물에 뜬다</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">밀도가 높아 가라앉는 편</td></tr>'
'<tr style="background:#faf7f0"><td style="padding:10px;border:1px solid #e5ddd0"><strong>만들어지는 시간</strong></td>'
'<td style="padding:10px;border:1px solid #e5ddd0">자르면 바로</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">최소 25년 이상</td></tr>'
'<tr><td style="padding:10px;border:1px solid #e5ddd0"><strong>향</strong></td>'
'<td style="padding:10px;border:1px solid #e5ddd0">보통 나무 냄새</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">수지가 밴 은은하고 깊은 향</td></tr>'
'<tr style="background:#faf7f0"><td style="padding:10px;border:1px solid #e5ddd0"><strong>귀함</strong></td>'
'<td style="padding:10px;border:1px solid #e5ddd0">흔함</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">국제적으로 보호받는 희귀 자원</td></tr>'
'</tbody></table>'
)

C1 = ''.join([
# ── 리드
'<p class="lead"><strong>결론부터.</strong> 침향(沈香)은 침향나무가 상처를 스스로 아물리려고 뿜어낸 '
'수지(樹脂, 나무가 만드는 끈끈한 진)가 나무 속에 오래 쌓여 굳은 부분입니다. 향수처럼 병에 담긴 액체가 아니라 '
'향기 성분이 잔뜩 밴 단단한 나무 덩어리이고, 물에 넣으면 가라앉을 만큼 무거워 가라앉을 침(沈) 자를 씁니다. '
'조엘라이프(주)(브랜드 대라천)는 이 글에서 침향의 정의와 형성 과정, 학명, 쓰임새를 처음 접하는 분도 '
'따라올 수 있는 순서로 정리했습니다.</p>',

# ── H2 1
'<h2>침향은 한마디로 무엇일까요?</h2>',
'<p>사람이 손을 다치면 그 자리에 딱지가 앉습니다. 나무도 비슷합니다. 상처가 나면 그 자리를 지키려고 '
'끈끈한 진을 뿜어냅니다. 그 진이 오랜 시간 나무 속에 쌓이고 익어 향기로운 덩어리가 되는데, 이것이 침향입니다.</p>',
'<p>대라천의 공식 설명은 침향을 <strong>침향나무의 수지가 침착된 수간목(樹幹木, 진이 스며든 나무 줄기 부분)</strong>으로 '
'정의합니다. 나무 전체가 아니라 진이 밴 부분만 침향으로 칩니다. 같은 나무에서도 수지가 배지 않은 부위는 '
'그냥 목재입니다. 처음 실물을 본 분이 검고 무거운 나무 조각으로 여기는 것도 이 때문입니다.</p>',
'<p>보통 나무와 무엇이 다른지 표로 견주면 이렇습니다.</p>',
TABLE1,

# ── H2 2
'<h2>나무는 어떻게 향을 만들까요?</h2>',
'<p>침향은 나무를 자른다고 바로 나오지 않습니다. 대라천 자료가 정리한 <strong>침향 형성 4단계</strong>를 '
'차례로 보면 이렇습니다.</p>',
'<ol>'
'<li><strong>1단계 · 상처가 생깁니다.</strong> 벌레가 파먹거나 강한 바람에 가지가 부러지거나, 벼락(낙뢰)을 맞거나 '
'바깥에서 충격을 받으면 나무에 상처가 납니다.</li>'
'<li><strong>2단계 · 곰팡이균이 들어옵니다.</strong> 벌어진 상처 틈으로 곰팡이균이 파고듭니다. '
'나무에게는 위험한 침입자입니다.</li>'
'<li><strong>3단계 · 나무가 스스로 대응합니다.</strong> 나무는 자기를 지키려고(자기방어) 상처 자리에 '
'끈끈한 수지를 뿜어내며 그 부위를 메웁니다.</li>'
'<li><strong>4단계 · 오래 익습니다.</strong> 이렇게 나온 수지가 수십 년에 걸쳐 나무 속에 쌓이고 숙성되며 '
'마침내 침향이 됩니다.</li></ol>',
'<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/what-is-agarwood-for-beginners-formation-1782959958747.png" '
'alt="침향이 상처에서 수지로, 오랜 숙성을 거쳐 형성되는 4단계 일러스트" />'
'<figcaption>상처에서 시작해 수십 년 숙성을 거쳐 완성되는 침향 형성 4단계.</figcaption></figure>',
'<p>이 과정은 학계에서도 연구 주제입니다. Li 연구팀은 2021년 <em>Natural Product Reports</em> 38권 528~565쪽에 '
'침향 성분의 화학 구조와 생합성 경로를 정리한 논문을 실었습니다'
'(<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">DOI 10.1039/D0NP00042F</a>). '
'나무가 어떤 경로로 이 성분들을 만들어 내는지를 다룬 연구이며, 사람에게 어떤 효과가 있는지를 확인한 연구는 아닙니다.</p>',

# ── H2 3
'<h2>왜 이름에 가라앉을 침(沈) 자가 붙었을까요?</h2>',
'<p>보통 나무 조각은 물에 넣으면 뜹니다. 그런데 수지가 촘촘히 밴 침향은 밀도가 높아 <strong>물에 넣으면 '
'가라앉을 만큼 무겁습니다.</strong> 이름은 여기서 나왔습니다.</p>',
'<p>한국민족문화대백과사전의 침향 항목은 이 대목을 '
'&ldquo;질은 견실하고 단단하며 물에 담겼을 때 가라앉아서 침향이라고 하였다&rdquo;라고 적고 있습니다'
'(<a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 침향</a>). '
'물에 잠기는 향이라는 뜻의 침수향(沈水香)이라는 옛 이름도 같은 자리에서 나왔습니다.</p>',
'<p>다만 물에 가라앉는지만 보고 진짜와 가짜를 가릴 수는 없습니다. 무게추를 넣거나 기름을 먹여 밀도를 '
'올린 물건도 가라앉기 때문입니다. 가라앉는 성질이 왜 생기는지와 이 시험의 한계는 '
'<a href="/blog/why-agarwood-sinks-in-water">침향이 물에 가라앉는 이유</a>에 따로 정리돼 있습니다.</p>',
'{{IMG:resin-in-trunk}}',

# ── H2 4
'<h2>좋은 침향은 얼마나 기다려야 할까요?</h2>',
'<p>대라천 자료는 쓸 만한 침향을 얻으려면 <strong>최소 25년 이상</strong>이 걸린다고 밝힙니다. 대라천이 이 기다림을 '
'<strong>219,000시간의 기다림</strong>이라고 부르는 것도 같은 기간을 시간 단위로 바꿔 부른 표현입니다.</p>',
'<p>아기가 태어나 성인이 될 만큼의 시간을, 나무는 향 하나를 완성하는 데 씁니다. 침향이 비싼 첫 번째 이유가 '
'여기에 있습니다. 공장에서 생산량을 늘리듯 기간을 줄일 방법이 없습니다.</p>',
SVG1,
'<p>표에서 본 &ldquo;자르면 바로&rdquo;와 &ldquo;최소 25년 이상&rdquo;의 차이가 이 그림에 그대로 담겨 있습니다. '
'대라천이 베트남 직영 농장에서 나무마다 고유번호를 붙여 관리하는 것도, 한 그루의 시간을 처음부터 끝까지 '
'따라가야 하기 때문입니다.</p>',

# ── H2 5
'<h2>어떤 나무에서만 침향이 나올까요?</h2>',
'<p>침향이라고 다 같은 침향은 아닙니다. 대한민국의 공식 문서들은 침향을 <strong>아퀼라리아(Aquilaria)</strong> '
'속(屬) 나무의 수지에서 나온 것으로 규정하며, 그 기원 식물의 학명으로 '
'<strong>아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)</strong>를 적고 있습니다.</p>',
'<p>이 학명은 식품의약품안전처가 고시한 <strong>대한민국약전외한약(생약)규격집</strong>에 실려 있습니다. '
'규격집은 침향을 팥꽃나무과(Thymelaeaceae) 아퀼라리아 아갈로차 록스버그의 수지가 침착된 수간목으로 '
'정의합니다. 앞에서 본 정의와 같은 말을 학명으로 못 박아 둔 셈입니다.</p>',
'<p>아퀼라리아 속 안에는 여러 종이 있습니다. Wang 연구팀은 2021년 <em>Molecules</em> 26권 7708에 '
'아퀼라리아 속의 분포와 등급 체계, 수지 유도법을 정리한 논문을 실었습니다'
'(<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">DOI 10.3390/molecules26247708</a>). '
'속 이름만으로는 어떤 나무인지 확정되지 않기 때문에 학명까지 확인해야 합니다.</p>',
'<p>대라천의 참침향은 100% 베트남산이며, 이 아갈로차 록스버그 품종만 원료로 씁니다. 학명이 왜 구매의 첫 질문이 '
'되는지는 <a href="/blog/why-aquilaria-agallocha-roxburgh-matters">이 학명이 왜 중요한지 정리한 글</a>에서 '
'더 자세히 다룹니다.</p>',
'{{IMG:agarwood-chips}}',

# ── H2 6
'<h2>옛 기록은 침향을 어떻게 남겼을까요?</h2>',
'<p>침향은 오래전부터 귀하게 다뤄졌습니다. 대라천 자료는 침향을 <strong>수천 년 동안 왕실과 귀족이 쓰던 '
'귀한 향</strong>으로 소개합니다. 향을 피우고, 몸에 지니고, 귀한 손님을 맞을 때 썼습니다.</p>',
'<p>옛 의학책에도 항목으로 실려 있습니다. 동의보감은 침향의 성질이 뜨겁고 맛이 매우며 독이 없다고 적었고, '
'기(氣)를 통하게 하며 속을 따뜻하게 해 냉통(冷痛)을 멎게 한다고 기록했습니다. 문헌의 서술을 더 자세히 옮긴 글은 '
'<a href="/blog/agarwood-in-donguibogam">동의보감 침향 기록</a>에 따로 있습니다.</p>',
'<p>여기서 한 번 끊고 가야 할 대목이 있습니다. 이런 서술은 <strong>옛 문헌이 그렇게 적어 두었다</strong>는 '
'사실까지만 말합니다. 침향이 병을 낫게 한다는 뜻이 아니며, 오늘의 의학 용어로 옮겨 읽는 순간 원래 문장에 없던 뜻이 '
'따라붙습니다. 그래서 대라천은 이런 내용을 옮길 때 반드시 어느 문헌의 기록인지를 밝힙니다.</p>',
'<p>종교 문헌에서도 침향은 귀한 향이었습니다. 요한복음은 예수의 장례에 몰약과 침향을 썼다고 적고 있습니다. '
'다만 성경 원문의 &lsquo;알로에스(aloes)&rsquo;를 침향으로 보는 것은 전통적인 해석이고, 백단향처럼 다른 향목으로 '
'보는 학술적 이견도 있습니다. 대라천 자료는 불경 역시 향 공양을 귀하게 여겨 고급 향재로 침향을 꼽는다고 '
'정리합니다.</p>',

# ── H2 7
'<h2>침향에는 어떤 향과 성분이 들었을까요?</h2>',
'<p>침향의 향은 인공 향처럼 톡 쏘지 않고 은은하면서 깊습니다. 대라천 자료는 침향의 성분으로 '
'<strong>세스퀴테르펜(식물이 만드는 자연 향 물질)</strong>과 2-(2-페닐에틸)크로몬(줄여서 PEC)을 소개합니다. '
'이름은 낯설지만 나무가 오래 만들어 낸 자연 향기 물질이라고 이해하면 됩니다.</p>',
'<p>이 성분들은 학술 논문의 주제이기도 합니다. Wang 연구팀은 2018년 <em>Molecules</em> 23권 342에 침향과 '
'아퀼라리아 식물의 화학 성분과 약리 활성을 정리한 리뷰를 실었습니다'
'(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI 10.3390/molecules23020342</a>).</p>',
'<p>기억해 둘 점이 하나 있습니다. 이런 논문들은 대체로 앞으로 임상시험과 안전성(독성) 연구가 더 필요하다는 '
'단서를 함께 답니다. 성분이 무엇인지를 밝힌 연구와 사람에게 어떤 효과가 있는지를 확인한 연구는 다른 층위입니다. '
'대라천이 성분을 이야기할 때 어느 논문의 결과인지를 매번 붙이는 이유입니다.</p>',

# ── H2 8
'<h2>침향은 어떤 형태로 만날 수 있을까요?</h2>',
'<p>재료는 하나인데 형태는 여럿입니다. 대라천 제품을 예로 들면 침향 조각을 온열판(전자 향로)에 올려 향을 즐기는 '
'<strong>침향스틱</strong>, 향 성분을 뽑아 만든 <strong>에센셜 오일</strong>과 <strong>오일 캡슐</strong>, '
'물에 우려 마시는 <strong>침향차</strong>, 몸에 지니며 체온으로 은은한 향을 즐기는 '
'<strong>침향 팔찌·묵주</strong>가 있습니다. 형태별 차이는 <a href="/products">제품 안내</a>에서 볼 수 있습니다.</p>',
'<p>다만 침향으로 만든 제품은 <strong>일반식품(또는 건강식품)이지 의약품이 아닙니다.</strong> 향을 즐기거나 '
'기호로 곁에 두는 것이지 병을 다루는 용도가 아닙니다. 예부터 침향은 아주 조금씩만 쓰던 향재였고, 제품마다 '
'쓰고 먹는 방법이 다르므로 포장에 적힌 표기를 따르는 편이 안전합니다.</p>',
'<p>대라천은 이 글에 적은 원료 기준과 검사 결과를 자체 시험성적서로 보유하고 있으며, 요청하시면 확인해 드립니다. '
'다만 인용한 논문은 대라천이 수행한 연구가 아니라 각 연구팀의 결과이고, 옛 문헌의 서술은 그 시대의 기록입니다. '
'어느 쪽도 대라천 제품의 효능을 뒷받침하는 자료가 아닙니다. 다음 단계로 기초를 더 다지고 싶다면 '
'<a href="/blog/agarwood-7-basics-faq">침향 기초 7가지</a>를 이어서 읽으시길 권합니다.</p>',

# ── FAQ
'<h2>자주 묻는 질문</h2>',
'<h3>Q. 침향은 향수인가요, 나무인가요?</h3>',
'<p>A. 기본은 향기 성분인 수지가 잔뜩 밴 단단한 나무입니다. 여기서 향 성분을 뽑아 오일로 만들거나, '
'조각을 향로에 올려 향을 피우기도 합니다.</p>',
'<h3>Q. 침향은 왜 그렇게 오래 걸리나요?</h3>',
'<p>A. 나무가 상처를 아물리며 수지를 조금씩 쌓고 익히는 과정이기 때문입니다. 대라천 자료는 좋은 침향을 얻기까지 '
'최소 25년 이상이 걸린다고 밝힙니다.</p>',
'<h3>Q. 아무 나무나 침향이 되나요?</h3>',
'<p>A. 아닙니다. 대한민국 공식 문서는 침향의 기원 식물로 아퀼라리아 아갈로차 록스버그를 적고 있습니다. '
'이 학명은 식약처가 고시한 대한민국약전외한약(생약)규격집에 실려 있습니다.</p>',
'<h3>Q. 물에 넣어 가라앉으면 진짜 침향인가요?</h3>',
'<p>A. 가라앉는 것은 침향의 특징이 맞지만 그것만으로는 부족합니다. 학명과 원산지, DNA 검사 성적서나 '
'CITES 인증서 같은 증빙 문서를 함께 확인하는 편이 확실합니다.</p>',
'<h3>Q. 침향 향을 맡으면 건강해지나요?</h3>',
'<p>A. 옛 문헌의 기록과 학술 연구가 남아 있지만, 침향 제품은 의약품이 아니라 향과 일반식품입니다. '
'대라천은 특정 효과를 보장한다고 말하지 않으며, 반응에는 개인차가 있습니다.</p>',

# ── 근거·출처
'<h2>근거·출처</h2>',
'<p>정의와 형성 과정, 원료 기준은 대라천 공식 자료를 따랐고, 학명은 식약처 공식 문서를, 성분 서술은 각 연구팀의 '
'논문에 귀속합니다. 인용한 논문은 성분과 생합성을 다룬 연구이며 제품 효능의 근거가 아닙니다.</p>',
'<ul>'
'<li><a href="/about-agarwood">침향이란 · 형성 4단계 · 학명 — about-agarwood</a></li>'
'<li><a href="/brand-story">대라천 참침향 브랜드 스토리 · 원료와 검사 — brand-story</a></li>'
'<li><a href="/company">조엘라이프(주) 회사 소개 — company</a></li>'
'<li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">'
'한국민족문화대백과사전 — 침향(沈香) 항목</a></li>'
'<li>Wang S, Yu Z, Wang C 외, &ldquo;Chemical Constituents and Pharmacological Activity of Agarwood and '
'Aquilaria Plants&rdquo;, <em>Molecules</em> 23권 342 (2018) — '
'<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">'
'https://doi.org/10.3390/molecules23020342</a></li>'
'<li>Li W, Chen HQ, Wang H 외, &ldquo;Natural products in agarwood and Aquilaria plants&rdquo;, '
'<em>Natural Product Reports</em> 38권 528~565쪽 (2021) — '
'<a href="https://doi.org/10.1039/D0NP00042F" target="_blank" rel="noopener">'
'https://doi.org/10.1039/D0NP00042F</a></li>'
'<li>Wang Y, Hussain M, Jiang Z 외, &ldquo;Aquilaria Species (Thymelaeaceae) Distribution, Volatile and '
'Non-Volatile Phytochemicals, Pharmacological Uses, Agarwood Grading System, and Induction Methods&rdquo;, '
'<em>Molecules</em> 26권 7708 (2021) — '
'<a href="https://doi.org/10.3390/molecules26247708" target="_blank" rel="noopener">'
'https://doi.org/10.3390/molecules26247708</a></li>'
'<li>식품의약품안전처 고시 대한민국약전외한약(생약)규격집 — 아퀼라리아 아갈로차 록스버그 학명 규정</li>'
'<li>동의보감 등 전통 문헌 기록</li>'
'<li><a href="/blog/agarwood-7-basics-faq">침향 처음이라면 꼭 알아야 할 7가지 기초</a></li>'
'</ul>',
DISCLAIMER,
])

ART1 = {
  "slug": "what-is-agarwood-for-beginners",
  "title": "침향이 뭐예요? 나무가 스스로 만든 향, 처음부터 쉽게",
  "excerpt": ("침향은 침향나무가 상처를 아물리며 뿜어낸 수지가 나무 속에 굳은 부분입니다. 물에 가라앉을 만큼 무겁고 "
              "최소 25년이 걸립니다. 조엘라이프(주)가 정의와 형성 4단계, 학명, 쓰임새를 순서대로 정리했습니다."),
  "tags": ["침향", "침향이란", "침향입문", "아퀼라리아", "수지", "천연향", "대라천", "참침향"],
  "content": C1,
  "images": [
    {"key": "resin-in-trunk",
     "prompt": "Photorealistic macro close-up of a cut cross-section of an Aquilaria tree trunk, pale cream sapwood contrasting with dark brown and near-black resin-soaked veins spreading irregularly through the grain, rough bark visible at the outer edge, resting on a plain linen cloth, soft even daylight from the side, shallow depth of field, warm brown and ivory palette, editorial documentary photography, no text, no logo, no watermark, no people, no hands",
     "alt": "수지가 스며든 침향나무 줄기 단면 — 침향이 만들어진 부분",
     "caption": "진한 색으로 번진 부분이 수지가 침착된 자리이며, 이 부분만 침향으로 씁니다."},
    {"key": "agarwood-chips",
     "prompt": "Photorealistic still life of small irregular dark agarwood chips and slivers arranged loosely in a shallow pale ceramic dish on a warm grey stone surface, deep brown to near-black wood with visible resin streaks, a few chips scattered beside the dish, soft diffused overhead daylight, shallow depth of field, muted ivory grey and dark brown palette, editorial product photography, no text, no logo, no watermark, no people, no hands",
     "alt": "아퀼라리아 아갈로차 록스버그 원목에서 나온 침향 조각",
     "caption": "대라천 참침향은 100% 베트남산 아갈로차 록스버그 품종만 원료로 씁니다."}
  ],
  "changelog": {
    "charsBefore": 0, "charsAfter": 0,
    "citationsAdded": ["A1", "A2", "A7", "K1"],
    "voiceFixes": 0,
    "notes": ("-어요체와 무주어 서술을 조엘라이프(주)·문헌·연구팀 귀속의 -습니다체로 전환하고 회피 화법을 걷어냈습니다. "
              "沈 자 유래를 한국민족문화대백과사전 원문 인용(K1)으로 교체하고 생합성(A2)·속 분류(A7) 근거를 보강했습니다. "
              "형성 4단계와 최소 25년(219,000시간)을 밝은 팔레트 SVG 선 도표로 시각화하고 zoellife.com 절대링크를 내부 경로로 정리했습니다.")
  }
}

# ─────────────────────────────────────────────────────────────
# 2) agarwood-7-basics-faq
# ─────────────────────────────────────────────────────────────

SVG2 = (
'<figure><svg viewBox="0 0 660 250" width="100%" role="img" aria-label="대라천이 공개한 원료 검증 항목 세 가지의 충족 비율 막대그래프">'
'<rect x="0" y="0" width="660" height="250" fill="#fffdf9"/>'
'<text x="20" y="34" font-size="17" font-weight="700" fill="#2b2318">대라천이 문서로 공개한 원료 검증 결과</text>'
'<text x="20" y="56" font-size="13" fill="#2b2318" opacity="0.75">가로축 0~100%. 눈금 1칸 = 25%</text>'
'<line x1="230" y1="70" x2="230" y2="200" stroke="#2b2318" stroke-width="1" opacity="0.25"/>'
'<line x1="330" y1="70" x2="330" y2="200" stroke="#2b2318" stroke-width="1" opacity="0.15"/>'
'<line x1="430" y1="70" x2="430" y2="200" stroke="#2b2318" stroke-width="1" opacity="0.15"/>'
'<line x1="530" y1="70" x2="530" y2="200" stroke="#2b2318" stroke-width="1" opacity="0.15"/>'
'<line x1="630" y1="70" x2="630" y2="200" stroke="#2b2318" stroke-width="1" opacity="0.15"/>'
'<text x="20" y="99" font-size="14" fill="#2b2318">DNA 유전자형 일치</text>'
'<rect x="230" y="80" width="400" height="26" fill="#9a6a10"/>'
'<text x="240" y="99" font-size="15" font-weight="700" fill="#fffdf9">100%</text>'
'<text x="20" y="147" font-size="14" fill="#2b2318">베트남산 원료 비율</text>'
'<rect x="230" y="128" width="400" height="26" fill="#9a6a10"/>'
'<text x="240" y="147" font-size="15" font-weight="700" fill="#fffdf9">100%</text>'
'<text x="20" y="195" font-size="14" fill="#2b2318">중금속 불검출 항목</text>'
'<rect x="230" y="176" width="400" height="26" fill="#9a6a10"/>'
'<text x="240" y="195" font-size="15" font-weight="700" fill="#fffdf9">8종 중 8종</text>'
'<text x="20" y="230" font-size="13" fill="#2b2318" opacity="0.75">세 항목 모두 원료 신원과 안전성 검사 결과이며, 제품의 효능을 나타내는 값이 아닙니다.</text>'
'</svg><figcaption>자료: 대라천이 공개한 DNA 검사 결과(검사번호 DA-260507-1), 원료 원산지 표시, 중금속 8종 검사 결과. 단위는 백분율(%)입니다.</figcaption></figure>'
)

TABLE2 = (
'<table style="width:100%;border-collapse:collapse;font-size:15px"><thead><tr style="background:#b88c2d;color:#fff">'
'<th style="padding:10px;border:1px solid #e5ddd0;text-align:left">번호</th>'
'<th style="padding:10px;border:1px solid #e5ddd0;text-align:left">질문</th>'
'<th style="padding:10px;border:1px solid #e5ddd0;text-align:left">핵심 답</th></tr></thead><tbody>'
'<tr><td style="padding:10px;border:1px solid #e5ddd0">1</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">침향이 뭐예요?</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">나무가 만든 수지가 밴 나무</td></tr>'
'<tr style="background:#faf7f0"><td style="padding:10px;border:1px solid #e5ddd0">2</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">어떻게 만들어져요?</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">상처→치유→수지→오랜 숙성</td></tr>'
'<tr><td style="padding:10px;border:1px solid #e5ddd0">3</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">왜 귀해요?</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">최소 25년·국제 보호종</td></tr>'
'<tr style="background:#faf7f0"><td style="padding:10px;border:1px solid #e5ddd0">4</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">어떤 나무에서 나요?</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">아퀼라리아 아갈로차 록스버그</td></tr>'
'<tr><td style="padding:10px;border:1px solid #e5ddd0">5</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">어디서 나요?</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">주로 베트남산</td></tr>'
'<tr style="background:#faf7f0"><td style="padding:10px;border:1px solid #e5ddd0">6</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">진짜는 어떻게 알아요?</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">학명·원산지·증빙 문서</td></tr>'
'<tr><td style="padding:10px;border:1px solid #e5ddd0">7</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">어떻게 보관해요?</td>'
'<td style="padding:10px;border:1px solid #e5ddd0">직사광선 피해 서늘·건조하게</td></tr>'
'</tbody></table>'
)

C2 = ''.join([
'<p class="lead"><strong>결론부터.</strong> 침향을 처음 만난다면 일곱 가지만 순서대로 확인하면 됩니다. '
'무엇인지, 어떻게 만들어지는지, 왜 귀한지, 어떤 나무인지, 어디서 나는지, 진짜인지 어떻게 확인하는지, '
'어떻게 보관하는지입니다. 조엘라이프(주)(브랜드 대라천)는 이 일곱 항목을 하나씩 짚으면서, 각 항목마다 '
'대라천이 무엇을 문서로 확인했고 무엇은 확인하지 않았는지 함께 밝힙니다.</p>',

'<h2>일곱 가지를 표로 먼저 봅니다</h2>',
'<p>본론에 들어가기 전에 오늘 짚을 일곱 항목을 한눈에 정리했습니다. 아래 순서대로 하나씩 이어집니다.</p>',
TABLE2,
'<p>정의부터 차근차근 읽고 싶은 분에게는 '
'<a href="/blog/what-is-agarwood-for-beginners">침향이 뭐예요? 처음부터 쉽게</a>가 먼저 읽기에 좋습니다. '
'이 글은 그 내용을 확인 항목 일곱 개로 다시 세운 점검표에 가깝습니다.</p>',

'<h2>기초 1 · 침향은 수지가 밴 나무입니다</h2>',
'<p>침향(沈香)은 <strong>침향나무의 수지(끈끈한 나뭇진)가 밴 나무</strong>입니다. 나무가 스스로 상처를 '
'아물리려고 뿜어낸 수지가 속에 오래 쌓여 굳은 부분을 가리킵니다.</p>',
'<p>향수 같은 액체가 아니라 향기 성분이 잔뜩 밴 단단한 나무 덩어리입니다. 물에 넣으면 가라앉을 만큼 무거워 '
'가라앉을 침(沈) 자를 붙였습니다. 같은 나무라도 수지가 배지 않은 부위는 침향으로 치지 않습니다. '
'첫 항목에서 확인할 것은 이 한 가지입니다. 침향은 나무 전체가 아니라 나무의 일부입니다.</p>',

'<h2>기초 2 · 상처에서 시작해 오랜 숙성으로 완성됩니다</h2>',
'<p>대라천 자료가 정리한 <strong>형성 4단계</strong>로 기억하면 쉽습니다. 벌레나 바람, 낙뢰, 충격에 나무가 '
'상처를 입고, 그 틈으로 곰팡이균이 파고들고, 나무는 자기를 지키려 수지를 뿜어 상처를 메우고, 그 수지가 '
'수십 년에 걸쳐 쌓이고 익어 마침내 침향이 됩니다.</p>',
'<p>한마디로 <strong>상처에서 시작해 오랜 숙성으로 완성되는 향</strong>입니다. 사람이 개입해 만들 수 있는 구간은 '
'앞쪽의 상처와 관리뿐이고, 뒤쪽의 숙성은 시간이 합니다.</p>',
'<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/agarwood-7-basics-faq-steps-1782959478780.png" '
'alt="침향 형성 4단계를 순서대로 나타낸 간단한 스텝 일러스트" />'
'<figcaption>상처에서 시작해 오랜 숙성으로 완성되는 침향 형성 4단계.</figcaption></figure>',

'<h2>기초 3 · 침향은 왜 그렇게 귀하고 비쌀까요?</h2>',
'<p>이유는 셋으로 나뉩니다. 첫째는 시간입니다. 대라천 자료는 좋은 침향을 얻으려면 <strong>최소 25년 이상</strong>이 '
'걸린다고 밝히며, 이 기간을 시간 단위로 바꾼 <strong>219,000시간의 기다림</strong>이라는 표현도 함께 씁니다.</p>',
'<p>둘째는 규제입니다. 아퀼라리아 속은 '
'<a href="https://cites.org" target="_blank" rel="noopener">CITES</a>(멸종위기 야생동식물 국제거래협약)가 '
'국제 거래를 관리하는 대상이라, 함부로 캐서 팔 수 없고 합법 절차를 밟아야 합니다.</p>',
'<p>셋째는 수요입니다. 수천 년 동안 왕실과 귀족이 써 온 자리에서 내려온 향이라 찾는 사람이 꾸준합니다. '
'공급은 시간에 묶여 있고 수요는 오래 쌓였습니다. 침향의 가격은 이 두 힘이 만나는 자리에서 정해집니다.</p>',

'<h2>옛 기록은 침향을 어떤 자리에 두었을까요?</h2>',
'<p>대라천 자료는 침향을 <strong>수천 년 동안 왕실과 귀족만 쓸 수 있던 귀한 향</strong>으로 소개합니다. '
'귀함의 근거가 오늘의 마케팅이 아니라 오래된 기록에 있다는 뜻입니다.</p>',
'<p>종교 문헌에서도 침향은 귀한 향으로 등장합니다. 요한복음은 예수의 장례에 몰약과 침향을 썼다고 적고 있고, '
'대라천 자료는 불경 역시 침향을 고급 향재로 다룬다고 정리합니다. 다만 성경 속 향의 정확한 식별을 두고는 '
'학술적 이견이 있습니다.</p>',
'<p>한국과 중국의 옛 의학책에도 침향이 실려 있습니다. 동의보감과 본초강목을 비롯한 여러 문헌이 침향을 항목으로 '
'다뤘습니다. 이런 서술은 <strong>옛 책이 그렇게 적어 두었다</strong>는 사실까지만 말하며, 침향이 병을 낫게 한다는 '
'뜻이 아닙니다. 대라천이 문헌 이야기를 옮길 때 출처를 먼저 밝히는 이유입니다. 동의보감의 서술은 '
'<a href="/blog/agarwood-in-donguibogam">동의보감 침향 기록</a>에 더 자세히 정리돼 있습니다.</p>',

'<h2>기초 4 · 학명은 아퀼라리아 아갈로차 록스버그입니다</h2>',
'<p>진짜 침향은 <strong>아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)</strong>라는 나무에서 나옵니다. '
'이 표기는 침향나무의 학명 가운데 하나로, 식물 분류학의 정명(正名)인 아퀼라리아 말라켄시스(A. malaccensis)의 '
'이명(異名)으로도 쓰입니다.</p>',
'<p>이 학명은 식품의약품안전처가 고시한 <strong>대한민국약전외한약(생약)규격집</strong>에 실려 있고, '
'약전과 식품공전에는 침향속(Aquilaria)의 여러 종이 함께 등재돼 있습니다. 대라천은 이 가운데 아갈로차 록스버그 '
'원료만 씁니다.</p>',
'<p>이름이 길다는 이유로 건너뛸 항목이 아닙니다. 학명은 재료의 신원을 확정하는 첫 질문이고, 그 뒤의 산지와 서류는 '
'신원이 정해진 다음에야 의미를 가집니다. 자세한 배경은 '
'<a href="/blog/why-aquilaria-agallocha-roxburgh-matters">이 학명이 왜 중요한지 정리한 글</a>에 있습니다.</p>',

'<h2>기초 5 · 산지는 베트남입니다</h2>',
'<p>대라천 자료는 여러 역사 문헌이 침향의 좋은 산지로 <strong>베트남 지역</strong>을 지목해 왔다고 정리합니다. '
'옛 문헌에 나오는 교지·임읍·교주·점성·안남·월남이 모두 오늘날의 베트남 일대를 가리키는 지명입니다.</p>',
'<p>대라천 참침향도 <strong>100% 베트남산</strong>입니다. 조엘라이프는 베트남 <strong>5개 지역에 '
'약 200헥타르(약 60만 평), 약 400만 그루</strong>의 침향나무를 직접 관리하며, 나무마다 고유번호를 붙여 '
'개체 단위로 이력을 남깁니다. 조엘라이프는 2026년 한국 시장 진출을 밝히고 있습니다.</p>',
'<p>산지를 따지는 이유는 상표가 아니라 성분입니다. 같은 종이라도 자란 땅과 기후가 다르면 수지의 조성이 달라집니다. '
'산지별 차이는 <a href="/blog/terroir-shapes-agarwood-5-vietnam-farms">다섯 농장의 토양이 만드는 차이</a>에서 '
'따로 다룹니다.</p>',

'<h2>기초 6 · 진짜인지 어떻게 확인할까요?</h2>',
'<p>대라천이 제시하는 기준은 셋입니다. <strong>기준① 정확한 학명</strong>(아퀼라리아 아갈로차 록스버그), '
'<strong>기준② 원산지</strong>(베트남), <strong>기준③ 증빙 문서</strong>(원산지증명, DNA 유전자 검사, '
'CITES 인증서 등)입니다.</p>',
'<p>대라천은 원목을 DNA 검사에 의뢰해 아퀼라리아 아갈로차 유전자형과 100% 일치한다는 결과를 확인했습니다'
'(검사번호 DA-260507-1). 여기에 중금속 8종이 전부 불검출로 나온 검사 결과도 함께 공개하고 있습니다. '
'값만 보지 말고 이런 문서를 함께 확인하시길 권합니다.</p>',
SVG2,
'<p>세 기준 가운데 하나라도 답이 막힌다면 그 뒤의 설명은 확인하기 어려운 이야기일 가능성이 큽니다. '
'질문을 어떻게 던질지는 <a href="/blog/how-to-avoid-fake-agarwood">가짜 침향을 피하는 법</a>에 정리돼 있습니다.</p>',
'{{IMG:test-report-documents}}',

'<h2>기초 7 · 보관은 직사광선을 피해 서늘하고 건조하게</h2>',
'<p>대라천 자료의 공통 보관법은 간단합니다. <strong>직사광선을 피하고, 서늘하고 건조한 곳에 밀폐해 '
'보관</strong>하는 것입니다. 오일 캡슐이나 침향수처럼 개봉한 뒤에는 냉장 보관을 권하는 제품도 있습니다.</p>',
'<p>햇빛과 습기를 피하는 것이 향과 품질을 지키는 기본입니다. 향 성분은 휘발성이라 열과 빛에 노출될수록 빠져나가고, '
'습기는 곰팡이의 조건이 됩니다. 제품별 보관 조건은 라벨 표기가 우선이며, 형태별 요령은 '
'<a href="/blog/how-to-store-agarwood">침향 보관법</a>에서 더 볼 수 있습니다.</p>',

'<h2>향과 성분, 그리고 제품 형태는 어떻게 될까요?</h2>',
'<p>침향의 향은 인공 향처럼 톡 쏘지 않고 은은하면서 깊습니다. 대라천 자료는 침향의 성분으로 '
'<strong>세스퀴테르펜(식물이 만드는 자연 향 물질)</strong>과 2-(2-페닐에틸)크로몬(PEC)을 소개합니다. '
'낯선 이름이지만 나무가 오래 만든 자연 향기 물질이라고 이해하면 됩니다.</p>',
'<p>이 성분들은 학술 논문의 주제이기도 합니다. Wang 연구팀은 2018년 <em>Molecules</em> 23권 342에 침향과 '
'아퀼라리아 식물의 화학 성분과 약리 활성을 정리한 리뷰를 실었고'
'(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI 10.3390/molecules23020342</a>), '
'Wang 연구팀은 2025년 <em>Journal of Essential Oil Research</em> 37권 110~144쪽에 추출 방법이 정유의 수율과 '
'성분 조성에 미치는 영향을 정리한 리뷰를 실었습니다'
'(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI 10.1080/10412905.2024.2447706</a>). '
'두 논문 모두 성분과 공정을 다룬 연구이며, 사람에게 어떤 효과가 있는지를 확인한 연구가 아닙니다.</p>',
'<p>같은 재료가 여러 형태로 나옵니다. 대라천 제품을 예로 들면 이렇습니다.</p>',
'<ul>'
'<li><strong>오일 캡슐·에센셜 오일</strong> — 침향에서 향 성분만 뽑아 만든 형태입니다.</li>'
'<li><strong>침향차·침향수</strong> — 물에 우리거나 증류해서 즐기는 형태입니다.</li>'
'<li><strong>침향스틱·선향</strong> — 향로나 온열판에 얹어 향을 피우는 형태입니다.</li>'
'<li><strong>침향 팔찌·묵주</strong> — 몸에 지니고 체온으로 은은한 향을 즐기는 형태입니다.</li>'
'</ul>',
'{{IMG:agarwood-product-forms}}',
'<p>이 제품들은 모두 <strong>일반식품(또는 건강식품)이며 의약품이 아닙니다.</strong> 향과 취향을 즐기기 위한 것이지 '
'병을 다루는 용도가 아닙니다. 형태별 차이는 <a href="/products">제품 안내</a>에서 확인할 수 있습니다.</p>',
'<p>대라천은 이 글에 적은 검사 결과와 원료 기준을 자체 시험성적서로 보유하고 있으며, 요청하시면 확인해 드립니다. '
'다만 인용한 논문은 대라천이 수행한 연구가 아니라 각 연구팀의 결과이고, 옛 문헌의 서술은 그 시대의 기록입니다. '
'어느 쪽도 대라천 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>',

'<h2>자주 묻는 질문</h2>',
'<h3>Q. 침향은 어떻게 쓰나요?</h3>',
'<p>A. 조각을 향로에 얹어 향을 피우기도 하고, 향 성분을 뽑아 오일·차 등 여러 형태로 활용하기도 합니다. '
'예부터 아주 소량만 쓰던 향재이며, 제품마다 먹고 쓰는 방법이 다르므로 라벨 표기를 따르는 편이 안전합니다.</p>',
'<h3>Q. 침향은 약인가요?</h3>',
'<p>A. 아닙니다. 대라천 침향 제품은 일반식품(또는 건강식품)이지 의약품이 아닙니다. 옛 문헌과 논문에 여러 기록이 '
'남아 있지만, 특정 질병을 다룬다고 말할 수는 없습니다.</p>',
'<h3>Q. 침향은 누구나 먹어도 되나요?</h3>',
'<p>A. 제품에 따라 임산부나 수유부, 과민증이 있는 분은 주의가 필요하다고 안내합니다. 건강 상태에 따라 전문가와 '
'상담하시는 편이 안전합니다.</p>',
'<h3>Q. 진짜 침향인지 물에 넣어 보면 알 수 있나요?</h3>',
'<p>A. 물에 가라앉는 것은 좋은 침향의 특징이 맞지만 그것만으로는 부족합니다. 학명과 베트남 원산지, '
'DNA 검사서·CITES 인증서 같은 증빙 문서를 함께 확인하는 편이 확실합니다.</p>',
'<h3>Q. 대라천 침향은 어디서 나나요?</h3>',
'<p>A. 대라천 참침향은 100% 베트남산이며, 아퀼라리아 아갈로차 록스버그 품종만 씁니다. 베트남 5개 지역의 '
'직영 농장에서 직접 관리합니다.</p>',

'<h2>근거·출처</h2>',
'<p>일곱 항목의 정의와 원료 기준은 대라천 공식 자료를 따랐고, 학명은 식약처 공식 문서를, 성분과 추출 서술은 '
'각 연구팀의 논문에 귀속합니다. 인용한 논문은 성분과 공정을 다룬 연구이며 제품 효능의 근거가 아닙니다.</p>',
'<ul>'
'<li><a href="/about-agarwood">침향의 정의·형성·학명·원산지·감별·용법 — about-agarwood</a></li>'
'<li><a href="/brand-story">DNA 검사·CITES·중금속 불검출 등 품질 증명 — brand-story</a></li>'
'<li><a href="/products">제품별 사용·보관 안내 — products</a></li>'
'<li>식품의약품안전처 고시 대한민국약전외한약(생약)규격집 — 학명·성상 규정</li>'
'<li><a href="https://cites.org" target="_blank" rel="noopener">CITES 부속서 II — 아퀼라리아속(Aquilaria) '
'국제 거래 보호종 등재 (cites.org)</a></li>'
'<li>Wang S, Yu Z, Wang C 외, &ldquo;Chemical Constituents and Pharmacological Activity of Agarwood and '
'Aquilaria Plants&rdquo;, <em>Molecules</em> 23권 342 (2018) — '
'<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">'
'https://doi.org/10.3390/molecules23020342</a></li>'
'<li>Wang X, Chan SW, Singaram N 외, &ldquo;Essential oil from Aquilaria spp. (agarwood)&rdquo;, '
'<em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — '
'<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">'
'https://doi.org/10.1080/10412905.2024.2447706</a></li>'
'<li>동의보감 등 전통 문헌 기록</li>'
'<li><a href="/blog/what-is-agarwood-for-beginners">침향이 뭐예요? 처음부터 쉽게</a></li>'
'</ul>',
DISCLAIMER,
])

ART2 = {
  "slug": "agarwood-7-basics-faq",
  "title": "침향 처음이라면? 꼭 알아야 할 7가지 기초",
  "excerpt": ("침향을 처음 만난다면 일곱 가지만 확인하면 됩니다. 정의와 형성 과정, 희소성, 학명, 산지, 진위 확인, "
              "보관법입니다. 조엘라이프(주)가 항목마다 무엇을 문서로 확인했는지 밝히며 순서대로 짚었습니다."),
  "tags": ["침향", "침향기초", "침향FAQ", "침향입문", "침향보관", "침향학명", "대라천", "참침향"],
  "content": C2,
  "images": [
    {"key": "test-report-documents",
     "prompt": "Photorealistic still life of several plain unmarked laboratory test report sheets fanned out on a pale wooden desk, no legible lettering on the pages, a small clear glass dish holding dark agarwood chips resting on top of them, a magnifying glass to one side, soft even daylight from the left, shallow depth of field, muted ivory grey and warm brown palette, editorial documentary photography, no text, no logo, no watermark, no people, no hands",
     "alt": "침향 원료의 DNA 검사와 중금속 검사 결과를 담은 시험성적서와 목편 시료",
     "caption": "대라천은 학명·원산지·증빙 문서 세 기준을 문서로 확인합니다."},
    {"key": "agarwood-product-forms",
     "prompt": "Photorealistic overhead flat lay of four agarwood product forms arranged on a warm grey stone surface: a small amber glass dropper bottle of dark oil, a shallow cup of pale brown tea, several thin dark incense sticks in a row, and a strand of dark brown round wooden beads, generous negative space between items, soft diffused daylight, muted ivory grey and warm brown palette, editorial product photography, no text, no labels, no logo, no watermark, no people, no hands",
     "alt": "침향 오일과 침향차, 침향스틱, 침향 팔찌 등 침향 제품 형태 네 가지",
     "caption": "같은 침향이 오일·차·향·장신구 등 여러 형태로 나옵니다."}
  ],
  "changelog": {
    "charsBefore": 0, "charsAfter": 0,
    "citationsAdded": ["A1", "A4", "K4"],
    "voiceFixes": 0,
    "notes": ("Q&A 나열 구조를 기초 1~7 순차 점검표로 재편하고 -어요체·회피 화법을 조엘라이프(주) 주어의 -습니다체로 "
              "전환했습니다. 추출 공정 근거(A4)와 CITES 링크를 보강하고, 원료 검증 수치(DNA 100%·베트남산 100%·중금속 "
              "8종 불검출)를 밝은 팔레트 SVG 막대그래프로 시각화했습니다. zoellife.com 절대링크를 내부 경로로 바꾸고 "
              "what-is-agarwood-for-beginners와 상호 링크했습니다.")
  }
}

# ─────────────────────────────────────────────────────────────

def hangul(s):
    return len(re.findall(r'[가-힣]', s))

def strip_html(s):
    s = (s.replace('&middot;', '·').replace('&nbsp;', ' ').replace('&ldquo;', '"')
          .replace('&rdquo;', '"').replace('&lsquo;', "'").replace('&rsquo;', "'")
          .replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>'))
    s = re.sub(r'<[^>]*>', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

for art in (ART1, ART2):
    src = json.load(open(os.path.join(BASE, 'in', art['slug'] + '.json'), encoding='utf-8'))
    art['changelog']['charsBefore'] = hangul(strip_html(src['content']))
    art['changelog']['charsAfter'] = hangul(strip_html(art['content']))
    path = os.path.join(OUT, art['slug'] + '.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(art, f, ensure_ascii=False, indent=2)
    print('wrote', path,
          '| title', len(art['title']),
          '| excerpt', len(art['excerpt']),
          '| chars', art['changelog']['charsBefore'], '->', art['changelog']['charsAfter'])
