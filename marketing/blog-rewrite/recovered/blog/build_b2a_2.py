# -*- coding: utf-8 -*-
"""b2-intro-a / 2 of 3 — agarwood-7-basics-faq
Restructured from a Q&A wall into a numbered 기초 walkthrough so it does not
duplicate the sibling entry article's shape."""
from srcblocks import blocks, emit

SLUG = "agarwood-7-basics-faq"
B = blocks(SLUG)
TABLE = B['tables'][0]          # 7가지 요약표 (원문 그대로)
FIGURE = B['figures'][0]        # 형성 4단계 스텝 일러스트 (Blob URL 보존)
DISCLAIMER = B['disclaimer']

SVG = ('<figure><svg viewBox="0 0 640 260" width="100%" role="img" aria-label="대라천이 공개한 원료 검사 결과 — 아갈로차 유전자형 일치율 100퍼센트, 중금속 8종 검출률 0퍼센트" xmlns="http://www.w3.org/2000/svg">'
       '<rect x="0" y="0" width="640" height="260" fill="#fffdf9"/>'
       '<text x="24" y="36" font-size="17" font-weight="700" fill="#2b2318">대라천이 공개한 원료 검사 결과</text>'
       '<text x="24" y="58" font-size="12" fill="#2b2318">단위: % · DNA 검사번호 DA-260507-1</text>'
       '<text x="24" y="106" font-size="13" fill="#2b2318">아갈로차 유전자형 일치율</text>'
       '<rect x="240" y="88" width="320" height="26" rx="4" fill="#9a6a10"/>'
       '<text x="572" y="107" font-size="14" font-weight="700" fill="#9a6a10">100%</text>'
       '<text x="24" y="166" font-size="13" fill="#2b2318">중금속 8종 검출률</text>'
       '<rect x="240" y="148" width="320" height="26" rx="4" fill="#f0e8d6"/>'
       '<text x="572" y="167" font-size="14" font-weight="700" fill="#9a6a10">0%</text>'
       '<line x1="240" y1="198" x2="560" y2="198" stroke="#2b2318" stroke-width="1"/>'
       '<text x="240" y="216" font-size="11" fill="#2b2318" text-anchor="middle">0</text>'
       '<text x="400" y="216" font-size="11" fill="#2b2318" text-anchor="middle">50</text>'
       '<text x="560" y="216" font-size="11" fill="#2b2318" text-anchor="middle">100</text>'
       '<text x="24" y="244" font-size="12" fill="#2b2318">막대는 0~100% 축을 그대로 따릅니다. 중금속은 8종 모두 불검출이라 0% 자리에 머뭅니다.</text>'
       '</svg><figcaption>대라천이 공개한 원료 검사 결과. 단위: %. 출처: 대라천 브랜드 스토리(zoellife.com/brand-story), DNA 검사번호 DA-260507-1.</figcaption></figure>')

CONTENT = '''<p class="lead"><strong>결론부터.</strong> 침향 입문에 필요한 기초는 일곱 가지입니다. 침향은 나무가 상처를 아물리며 만든 수지가 밴 나무이고, 쓸 만한 것을 얻기까지 최소 25년이 걸리며, 아퀼라리아 아갈로차 록스버그라는 나무에서 주로 베트남 땅에 납니다. 조엘라이프(주)(브랜드 대라천)는 이 일곱 가지를 정의부터 보관까지 순서대로 짚고, 진위 확인 대목에는 공개된 검사 결과를 함께 붙였습니다.</p>
<p>질문을 나열하는 대신 기초 ①번부터 ⑦번까지 차례로 밟아 가겠습니다. 먼저 오늘 다룰 일곱 가지를 표로 훑어보시기 바랍니다.</p>
''' + TABLE + '''
<h2>기초① 침향이란 무엇입니까?</h2>
<p>침향(沈香)은 <strong>침향나무의 수지(끈끈한 나뭇진)가 밴 나무</strong>입니다. 나무가 스스로 상처를 아물리려고 뿜어낸 수지가 줄기 속에 오래 쌓여 굳은 것입니다.</p>
<p>향수 같은 액체가 아니라 향기 성분이 잔뜩 밴 단단한 나무 덩어리로 보시면 됩니다. 물에 넣으면 가라앉을 만큼 무거워 가라앉을 침(沈) 자를 붙였습니다.</p>
<p>향은 인공 향처럼 톡 쏘지 않고 은은하게 번집니다. 대라천 자료는 침향에 <strong>세스퀴테르펜(식물이 만드는 자연 향 물질)</strong>과 2-(2-페닐에틸)크로몬(PEC) 계열 성분이 들어 있다고 소개합니다.</p>
<p>Wang 연구팀은 2018년 <em>Molecules</em> 23권 342번 논문에서 침향과 아퀼라리아 속 식물의 화학 성분과 약리 활성을 폭넓게 검토했습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). 대라천이 수행한 연구가 아니라 해당 연구팀의 결과입니다.</p>
<p>정의만 더 풀어 보고 싶다면 <a href="/blog/what-is-agarwood-for-beginners">침향이란 무엇인가</a> 편을 먼저 읽어도 좋습니다.</p>
<h2>기초② 침향은 어떻게 만들어집니까?</h2>
<p>대라천이 정리한 <strong>형성 4단계</strong>로 기억하면 쉽습니다. 벌레나 바람, 낙뢰, 충격에 나무가 상처를 입고, 그 틈으로 곰팡이균이 파고듭니다.</p>
<p>나무는 스스로를 지키려 수지를 뿜어 상처를 아뭅니다. 그 수지가 수십 년에 걸쳐 쌓이고 익어 마침내 침향이 됩니다.</p>
<p>한마디로 <strong>상처에서 시작해 오랜 숙성으로 완성되는 향</strong>입니다. 상처 없이 곱게 자란 나무에서는 침향이 나오지 않습니다.</p>
''' + FIGURE + '''
<p>{{IMG:farm-rows}}</p>
<h2>기초③ 침향은 왜 그렇게 귀하고 비쌀까요?</h2>
<p>대라천 자료에 따르면 좋은 침향은 <strong>최소 25년 이상</strong> 기다려야 얻을 수 있습니다. 대라천은 이 기다림을 <strong>219,000시간</strong>이라는 표현으로 옮겨 적기도 합니다.</p>
<p>여기에 규제가 더해집니다. 침향은 <a href="https://cites.org" target="_blank" rel="noopener">CITES</a>라는 국제 협약이 보호하는 자원이라 함부로 캐서 팔 수 없고, 합법 절차를 밟아야 국경을 넘습니다.</p>
<p>수천 년 동안 왕실과 귀족이 써 온 역사까지 얹히면서 침향은 아주 귀하고 값비싼 향이 되었습니다.</p>
<p>기다리는 시간이 곧 원가입니다. 값이 유난히 싼 침향을 만났을 때 근거 문서를 먼저 확인해야 하는 이유도 여기에 있습니다.</p>
<h2>기초④ 침향은 어떤 나무에서 나옵니까?</h2>
<p>진짜 침향은 <strong>아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)</strong>라는 나무에서 나옵니다. 이름은 길지만 침향나무의 학명 가운데 하나입니다.</p>
<p>국제 식물분류학은 이 이름을 정명(正名)인 아퀼라리아 말라켄시스(A. malaccensis)의 이명(異名)으로 정리해 두었습니다. 같은 종을 가리키는 다른 이름이라는 뜻입니다.</p>
<p>식품의약품안전처가 고시한 <strong>대한민국약전외한약(생약)규격집</strong>에도 이 학명이 실려 있고, 약전과 식품공전에는 침향속(Aquilaria)의 여러 종이 함께 등재돼 있습니다.</p>
<p>대라천은 이 아갈로차 록스버그 원료만 고집한다고 밝히고 있습니다. 이름이 왜 여러 겹인지는 <a href="/blog/agarwood-many-names-milhyangsu">침향을 부르는 이름들</a>에서 문헌별로 풀었습니다.</p>
<h2>기초⑤ 좋은 침향은 어디서 납니까?</h2>
<p>대라천이 정리한 문헌 목록은 침향의 좋은 산지로 <strong>베트남 지역</strong>을 한결같이 지목합니다. 옛 문헌에 나오는 교지·임읍·교주·점성·안남·월남이 모두 오늘날의 베트남 땅을 가리키는 지명입니다.</p>
<p>시대와 나라 이름은 바뀌었어도 산지를 가리키는 손끝은 같은 자리에 머물렀습니다.</p>
<p>대라천 참침향도 <strong>100% 베트남산</strong>입니다. 조엘라이프(주)는 베트남 현지 농장에서 원목을 직접 길러 채취합니다.</p>
<p>산지 표기는 학명 표기와 짝을 이룰 때 의미가 생깁니다. 둘 중 하나만 적혀 있다면 아직 절반짜리 정보입니다.</p>
<h2>기초⑥ 진짜 침향인지 무엇으로 확인합니까?</h2>
<p>대라천은 진짜 침향을 가리는 세 가지 기준을 제시합니다. <strong>기준① 정확한 학명</strong>(아퀼라리아 아갈로차 록스버그), <strong>기준② 원산지</strong>(베트남), <strong>기준③ 증빙 문서</strong>(원산지증명, DNA 유전자 검사, CITES 인증서 등)입니다.</p>
<p>대라천은 DNA 검사에서 아퀼라리아 아갈로차 유전자형과 100% 일치했다는 결과(DA-260507-1)에 더해, 중금속 8종이 모두 불검출로 나온 결과까지 공개하고 있습니다.</p>
''' + SVG + '''
<p>값만 보고 고르는 대신 이런 근거를 함께 확인하시기 바랍니다. 검사번호가 적혀 있으면 뒤에서 되짚을 수 있고, 적혀 있지 않으면 확인할 방법이 없습니다.</p>
<h2>기초⑦ 침향은 어떻게 보관합니까?</h2>
<p>대라천 자료의 공통 보관법은 짧습니다. <strong>직사광선을 피하고, 서늘하고 건조한 곳에 밀폐해서 보관</strong>하는 것입니다.</p>
<p>오일 캡슐이나 침향수처럼 개봉한 뒤 냉장 보관을 권하는 제품도 있습니다. 햇빛과 습기를 피하는 것이 향과 품질을 지키는 기본입니다.</p>
<p>형태에 따라 보관 자리도 조금씩 달라집니다. 대라천 제품을 예로 들면 이렇습니다.</p>
<ul><li><strong>오일 캡슐·에센셜 오일</strong>: 침향에서 향 성분만 뽑아 만든 형태.</li><li><strong>침향차·침향수</strong>: 물에 우리거나 증류해서 즐기는 형태.</li><li><strong>침향스틱·선향</strong>: 향로나 온열판에 얹어 향을 피우는 형태.</li><li><strong>침향 팔찌·묵주</strong>: 몸에 지니고 체온으로 은은한 향을 즐기는 형태.</li></ul>
<p>{{IMG:storage-shelf}}</p>
<p>이 제품들은 모두 <strong>일반식품(또는 건강식품)이며 의약품이 아닙니다.</strong> 향과 취향을 즐기기 위한 것이지 병을 치료하는 용도가 아닙니다. 형태별 안내는 <a href="/products">제품 페이지</a>에 정리돼 있습니다.</p>
<h2>대라천은 어떤 규모로 침향을 기릅니까?</h2>
<p>대라천 자료에 따르면 조엘라이프는 베트남 <strong>5개 지역에 약 200헥타르(약 60만 평), 약 400만 그루</strong>의 침향나무를 직접 관리합니다.</p>
<p>나무마다 고유번호를 붙여 관리하고, DNA 검사와 CITES 등재, 중금속 불검출 검사 같은 <strong>여러 문서로 품질을 증명</strong>한다고 밝히고 있습니다.</p>
<p>조엘라이프(주)는 2026년 한국 시장 진출을 준비하고 있습니다.</p>
<p>규모 자체가 품질을 보증하지는 않습니다. 다만 원목을 사 오는 대신 직접 기르면, 어느 나무에서 나온 원료인지를 서류로 되짚을 수 있습니다. 대라천이 개별 나무에 번호를 붙이는 이유가 여기에 있습니다.</p>
<h2>침향은 언제부터 귀하게 여겨졌습니까?</h2>
<p>침향은 아주 오래전부터 귀한 대접을 받았습니다. 대라천 자료는 침향이 수천 년 동안 왕실과 귀족만 쓰던 향이었다고 정리합니다.</p>
<p>한국 역사 속 기록은 한국민족문화대백과사전 침향(沈香) 항목에서 확인할 수 있습니다(<a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전</a>).</p>
<p>의서에도 자주 나옵니다. <strong>동의보감</strong>과 중국의 <strong>본초강목</strong>을 비롯한 여러 문헌이 침향을 약재 항목으로 다루고 있습니다.</p>
<p>종교 경전에도 침향이 등장합니다. 요한복음은 예수의 장례에 몰약과 침향을 썼다고 적고 있습니다. 다만 성경 속 향의 정확한 식별을 두고는 학술적 이견이 있습니다.</p>
<p>이런 대목은 어디까지나 <strong>옛 책에 적힌 기록</strong>일 뿐, 침향이 병을 낫게 한다는 뜻이 아닙니다. 대라천은 언제나 어느 문헌의 기록인지를 함께 밝힙니다.</p>
<h2>대라천이 확인한 것과 확인하지 않은 것</h2>
<p>대라천은 이 글에 적은 검사 결과와 규격을 자체 시험성적서로 보유하고 있으며, 요청하시면 확인해 드립니다. DNA 검사번호 DA-260507-1과 중금속 검사 결과가 여기에 해당합니다.</p>
<p>반면 인용한 논문은 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다.</p>
<p>옛 문헌 기록도 같은 기준으로 다룹니다. 대라천은 문헌에 그렇게 적혀 있다는 사실만 전달하고, 그 내용이 오늘의 효능을 보증한다고 말하지 않습니다.</p>
<p>대라천 침향 제품은 일반식품(또는 건강식품)입니다. 이 글의 어느 문장도 질병의 예방이나 치료를 뜻하지 않습니다.</p>
<h2>자주 묻는 질문</h2>
<h3>Q. 침향은 어떻게 쓰나요?</h3>
<p>A. 조각을 향로에 얹어 향을 피우기도 하고, 향 성분을 뽑아 오일·차 등 여러 형태로 활용하기도 합니다. 제품마다 쓰는 방법이 다르니 라벨 표기를 따르시기 바랍니다.</p>
<h3>Q. 침향은 약인가요?</h3>
<p>A. 아닙니다. 대라천 침향 제품은 일반식품(또는 건강식품)이지 의약품이 아닙니다. 옛 문헌과 논문에 기록이 남아 있지만, 특정 질병을 치료하거나 예방한다고 말할 수는 없습니다.</p>
<h3>Q. 침향은 누구나 먹어도 되나요?</h3>
<p>A. 제품에 따라 임산부나 수유부, 과민증이 있는 분은 주의가 필요하다고 안내합니다. 건강 상태에 따라 전문가와 상담하시는 편이 안전합니다.</p>
<h3>Q. 진짜 침향인지 물에 넣어 보면 알 수 있나요?</h3>
<p>A. 물에 가라앉는 것은 좋은 침향의 특징이 맞지만 그것만으로는 부족합니다. 학명과 베트남 원산지, DNA 검사서·CITES 인증서 같은 증빙 문서를 함께 확인하는 편이 확실합니다.</p>
<h3>Q. 대라천 침향은 어디서 나나요?</h3>
<p>A. 대라천 참침향은 100% 베트남산이고, 아퀼라리아 아갈로차 록스버그 품종만 쓴다고 밝히고 있습니다. 베트남 5개 지역의 직영 농장에서 직접 관리합니다.</p>
<h2>근거·출처</h2>
<p>이 글의 정의·형성·학명·산지·감별·보관 서술은 대라천 공식 자료(zoellife.com)와 국내 공식 문서에 근거하며, 성분 서술은 아래 학술 논문에 근거합니다.</p>
<ul><li><a href="https://zoellife.com/about-agarwood" target="_blank" rel="noopener">침향의 정의·형성·학명·원산지·감별·용법 (zoellife.com/about-agarwood)</a></li><li><a href="https://zoellife.com/brand-story" target="_blank" rel="noopener">DNA 검사·CITES·중금속 불검출 등 품질 증명 (zoellife.com/brand-story)</a></li><li><a href="https://zoellife.com/products" target="_blank" rel="noopener">제품별 사용·보관 안내 (zoellife.com/products)</a></li><li>Wang S, Yu Z, Wang C 외, &ldquo;Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants&rdquo;, <em>Molecules</em> 2018;23:342 — <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">10.3390/molecules23020342</a></li><li><a href="https://encykorea.aks.ac.kr/Article/E0058589" target="_blank" rel="noopener">한국민족문화대백과사전 — 침향(沈香)</a></li><li><a href="https://cites.org" target="_blank" rel="noopener">CITES 부속서 II — 아퀼라리아속(Aquilaria) 국제 거래 보호종 등재 (cites.org)</a></li><li>식약처 고시 대한민국약전외한약(생약)규격집 — 학명·성상 규정</li><li>동의보감·본초강목 등 전통 문헌 기록</li></ul>
''' + DISCLAIMER

ART = {
    "slug": SLUG,
    "title": "침향 기초 7가지 — 처음 접할 때 알아야 할 것",
    "excerpt": "침향을 처음 접할 때 필요한 기초는 일곱 가지입니다. 무엇인지, 어떻게 만들어지는지, 왜 최소 25년이 걸리는지, 학명과 산지, 진위 확인, 보관법까지 대라천이 공개한 DNA 검사와 중금속 검사 결과를 곁들여 순서대로 정리했습니다.",
    "tags": ["침향", "침향기초", "침향FAQ", "침향입문", "침향보관", "침향학명", "대라천", "참침향"],
    "content": CONTENT,
    "images": [
        {"key": "farm-rows",
         "prompt": "Wide photograph of a Vietnamese agarwood plantation, rows of slender Aquilaria trees with broad green leaves on red soil, morning mist between the rows, distant low hills, soft natural light, photorealistic landscape, no people, no text, no lettering, no logo, no watermark",
         "alt": "베트남 침향나무 직영 농장의 아퀼라리아 나무 행렬",
         "caption": "침향은 나무 안에서 수십 년을 기다린 뒤에야 채취됩니다."},
        {"key": "storage-shelf",
         "prompt": "Still life of dark amber glass jars and a sealed wooden box on a cool dark wooden shelf away from direct sunlight, dim quiet interior, soft shadow, photorealistic, no text, no lettering, no label, no logo, no watermark",
         "alt": "직사광선을 피해 서늘하게 보관한 침향 보관 용기",
         "caption": "직사광선과 습기를 피해 밀폐 보관하는 것이 기본입니다."}
    ],
    "changelog": {
        "charsBefore": 0, "charsAfter": 0,
        "citationsAdded": ["A1", "K1", "K4"],
        "voiceFixes": 21,
        "notes": "질문 나열형(Q&A 벽) 구조를 기초①~⑦ 순차 워크스루로 재편하고 보너스 4개 항목을 규모·역사 H2로 통합. '한다고 합니다 / 전해집니다 / 알려져 있어요' 회피 화법을 대라천·문헌 주어 문장으로 교체하고, DNA 100% 일치와 중금속 8종 불검출을 0~100% 축 막대 인포그래픽으로 시각화. 검사번호 DA-260507-1, 200헥타르·400만 그루·2026년 등 수치와 표·figure·disclaimer는 원문 그대로 보존."
    }
}

emit(ART)
