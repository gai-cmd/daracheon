# -*- coding: utf-8 -*-
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
SLUG = 'how-to-store-agarwood'

DISC = ("<hr /><p style='font-size:13px;color:#7D7570'><em>※ 본 콘텐츠는 정보 제공을 "
        "목적으로 하며, 대라천 공식 자료(zoellife.com)와 공식 "
        "문서·학술 논문에 근거해 작성되었습니다. 소개된 "
        "전통 문헌·연구 내용은 해당 출처의 기록이며 특정 "
        "효과를 보장하지 않습니다. 대라천 침향 제품은 "
        "일반식품(또는 건강식품)으로 질병의 예방·치료를 "
        "위한 의약품이 아니며, 효과와 반응에는 개인차가 "
        "있습니다. 건강 상태에 따라 전문가와 상담하시기 "
        "바랍니다.</em></p>")

CONTENT = '''<p class="lead"><strong>결론부터.</strong> 침향 보관법은 자리를 한 번 제대로 정하는 일에서 거의 끝납니다. 빛이 들지 않고 서늘하며 건조한 자리를 고른 다음, 쓸 때마다 밀폐하는 습관만 남기면 됩니다. 조엘라이프(주)(브랜드 대라천)는 여기에 형태별 절차를 더해 안내합니다. 오일 캡슐과 침향수는 개봉한 뒤 냉장, 에센셜 오일과 침향스틱은 서늘하고 건조한 곳에 밀폐, 팔찌와 묵주는 물기만 피하면 됩니다. 아래에 제품별 유통기한과 점검 순서를 표와 도표로 정리했습니다. 향을 다루는 생활 정보이며 건강 효능에 관한 안내가 아닙니다.</p>

<h2>보관할 자리는 어떤 순서로 정하나요</h2>
<p>대라천 공식 보관 안내는 세 문장입니다. 직사광선을 피하고, 서늘하고 건조한 곳에, 밀폐해서 둔다. 이 문장을 집 안에 적용하는 순서는 다음과 같습니다.</p>
<p>먼저 하루 종일 햇빛이 들지 않는 자리를 서너 곳 골라 후보로 둡니다. 그다음 물기가 생기는 곳을 후보에서 뺍니다. 욕실 선반, 싱크대 아래, 세탁실이 여기에 해당합니다. 이어서 열이 오르내리는 곳을 뺍니다. 난방기 위, 가스레인지 옆, 그리고 여름철 주차된 차 안이 대표적입니다. 남은 자리 가운데 하루 동안 온도가 가장 덜 흔들리는 곳이 답입니다. 대개 거실이나 침실의 붙박이장 안쪽 서랍이 남습니다.</p>
<p>자리를 한 번 정해 두면 이후 관리는 밀폐 하나로 줄어듭니다. 대라천은 제품마다 자리를 따로 만들기보다, 한 서랍을 침향 자리로 정해 두시기를 권합니다. 향이 강한 방향제나 비누와 같은 칸을 쓰지 않는 것이 좋습니다.</p>
<div style='display:flex;flex-wrap:wrap;gap:10px;margin:14px 0'>
<div style='flex:1;min-width:130px;background:#fffdf9;border:1px solid #9a6a10;color:#2b2318;padding:14px;border-radius:10px;text-align:center'><div style='font-size:22px'>&#9728;</div><strong>빛</strong><br /><span style='font-size:13px'>직사광선 드는 창가 제외</span></div>
<div style='flex:1;min-width:130px;background:#fffdf9;border:1px solid #9a6a10;color:#2b2318;padding:14px;border-radius:10px;text-align:center'><div style='font-size:22px'>&#128167;</div><strong>습기</strong><br /><span style='font-size:13px'>욕실·주방 물기 근처 제외</span></div>
<div style='flex:1;min-width:130px;background:#fffdf9;border:1px solid #9a6a10;color:#2b2318;padding:14px;border-radius:10px;text-align:center'><div style='font-size:22px'>&#128293;</div><strong>열</strong><br /><span style='font-size:13px'>난방기구·직화 근처 제외</span></div>
</div>
<p style='font-size:13px;color:#7D7570'>※ 출처: 대라천 공식 보관 안내(zoellife.com). 빛·습기·열이 왜 향을 흔드는지는 <a href="/blog/agarwood-enjoy-and-storage-guide">침향 보관법 — 빛·습기·열을 피해 향을 오래 지키는 법</a>에서 성분 근거와 함께 다뤘습니다.</p>

<h2>제품별 보관법과 유통기한은 어떻게 다른가요</h2>
<p>형태가 다르면 공기와 닿는 면적이 달라집니다. 아래 표는 대라천 제품 정보(<a href="/products">zoellife.com/products</a>)에 표기된 보관 방법과 유통기한을 그대로 옮긴 것입니다.</p>
<table style='width:100%;border-collapse:collapse;font-size:14px'>
<thead><tr style='background:#9a6a10;color:#fffdf9'><th style='padding:8px;border:1px solid #d9c9a3;text-align:left'>제품</th><th style='padding:8px;border:1px solid #d9c9a3;text-align:left'>보관 포인트</th><th style='padding:8px;border:1px solid #d9c9a3;text-align:left'>유통기한</th></tr></thead>
<tbody>
<tr><td style='padding:8px;border:1px solid #e6dcc4'><strong>참침향 오일 캡슐</strong></td><td style='padding:8px;border:1px solid #e6dcc4'>직사광선 피함, 밀폐. 개봉 후 냉장</td><td style='padding:8px;border:1px solid #e6dcc4'>3년</td></tr>
<tr style='background:#faf6ec'><td style='padding:8px;border:1px solid #e6dcc4'><strong>참침향 에센셜 오일</strong></td><td style='padding:8px;border:1px solid #e6dcc4'>직사광선 피함, 서늘·건조, 밀폐</td><td style='padding:8px;border:1px solid #e6dcc4'>5년 (오래될수록 좋음)</td></tr>
<tr><td style='padding:8px;border:1px solid #e6dcc4'><strong>침향수</strong></td><td style='padding:8px;border:1px solid #e6dcc4'>직사광선 피함, 밀폐. 개봉 후 냉장</td><td style='padding:8px;border:1px solid #e6dcc4'>2년</td></tr>
<tr style='background:#faf6ec'><td style='padding:8px;border:1px solid #e6dcc4'><strong>침향스틱</strong></td><td style='padding:8px;border:1px solid #e6dcc4'>직사광선 피함, 서늘·건조, 밀폐</td><td style='padding:8px;border:1px solid #e6dcc4'>4년</td></tr>
<tr><td style='padding:8px;border:1px solid #e6dcc4'><strong>침향차·파라미냐차</strong></td><td style='padding:8px;border:1px solid #e6dcc4'>직사광선 피함, 서늘·건조, 밀폐</td><td style='padding:8px;border:1px solid #e6dcc4'>제품 표기 참고</td></tr>
</tbody></table>
<p>표를 세로로 읽으면 공통 조건이 먼저 보입니다. 다섯 제품 모두 직사광선을 피하고 밀폐한다는 조건이 겹칩니다. 갈라지는 지점은 두 곳뿐입니다. 개봉 후 냉장이 붙는 제품이 오일 캡슐과 침향수 둘, 그리고 유통기한의 길이입니다.</p>
<figure>
<svg viewBox="0 0 720 300" width="100%" role="img" aria-label="대라천 제품별 유통기한 비교 막대그래프">
<rect x="0" y="0" width="720" height="300" fill="#fffdf9"/>
<text x="28" y="34" font-size="19" font-weight="700" fill="#2b2318">제품별 표기 유통기한</text>
<text x="28" y="56" font-size="13" fill="#2b2318">단위: 년 · 대라천 제품 표기 기준</text>
<line x1="210" y1="72" x2="210" y2="272" stroke="#2b2318" stroke-width="1"/>
<text x="200" y="108" font-size="14" fill="#2b2318" text-anchor="end">참침향 에센셜 오일</text>
<rect x="212" y="92" width="450" height="24" fill="#9a6a10"/>
<text x="672" y="110" font-size="14" font-weight="700" fill="#2b2318">5</text>
<text x="200" y="152" font-size="14" fill="#2b2318" text-anchor="end">침향스틱</text>
<rect x="212" y="136" width="360" height="24" fill="#9a6a10"/>
<text x="582" y="154" font-size="14" font-weight="700" fill="#2b2318">4</text>
<text x="200" y="196" font-size="14" fill="#2b2318" text-anchor="end">참침향 오일 캡슐</text>
<rect x="212" y="180" width="270" height="24" fill="#9a6a10"/>
<text x="492" y="198" font-size="14" font-weight="700" fill="#2b2318">3</text>
<text x="200" y="240" font-size="14" fill="#2b2318" text-anchor="end">침향수</text>
<rect x="212" y="224" width="180" height="24" fill="#9a6a10"/>
<text x="402" y="242" font-size="14" font-weight="700" fill="#2b2318">2</text>
<line x1="210" y1="272" x2="680" y2="272" stroke="#2b2318" stroke-width="1"/>
<text x="212" y="290" font-size="12" fill="#2b2318">0</text>
<text x="662" y="290" font-size="12" fill="#2b2318">5년</text>
</svg>
<figcaption>단위는 년이며, 대라천 제품 표기(zoellife.com/products)에 적힌 유통기한을 그대로 옮긴 값입니다. 침향차·파라미냐차는 제품 표기를 참고하도록만 적혀 있어 도표에서 제외했습니다.</figcaption>
</figure>

<h2>개봉하면 무엇이 달라지나요</h2>
<p>뚜껑을 여는 순간부터 내용물은 공기와 계속 닿습니다. 대라천이 오일 캡슐과 침향수에만 개봉 후 냉장을 붙여 둔 이유가 여기 있습니다. 온도를 낮추면 공기와 닿아 일어나는 변화의 속도가 함께 느려집니다.</p>
<p>대라천이 권장하는 개봉 후 절차는 세 단계입니다. 첫째, 쓴 직후 뚜껑을 끝까지 잠급니다. 반쯤 닫아 둔 병은 밀폐된 병이 아닙니다. 둘째, 지퍼백이나 밀폐 용기에 한 번 더 담습니다. 냉장고 안에는 김치와 반찬 냄새가 함께 있고, 침향은 냄새를 잘 받아들이는 재료입니다. 셋째, 문 쪽 선반보다 안쪽 선반에 둡니다. 문 쪽은 여닫을 때마다 온도가 가장 크게 오르내리는 자리입니다.</p>
<p>꺼낼 때도 순서가 있습니다. 대라천은 필요한 만큼만 꺼낸 뒤 곧바로 다시 넣으시기를 권합니다. 식탁에 올려 둔 채로 식사를 마치면 그동안 온도가 실온까지 올라가고, 다시 넣으면 표면에 물방울이 맺힙니다. 이 결로가 습기 문제를 키웁니다. 하루에 여러 번 꺼내는 제품이라면 아예 작은 용기에 그날 몫만 덜어 두고 본품은 건드리지 않는 방법도 있습니다.</p>
<p>반대로 개봉 후 냉장이 붙지 않은 제품을 굳이 냉장고에 넣을 이유는 없습니다. 에센셜 오일과 침향스틱, 침향차는 문을 여닫을 때마다 온도가 오르내리는 환경보다 하루 내내 온도가 일정한 서랍이 낫습니다. 대라천이 제품마다 안내를 달리 적어 둔 이유입니다.</p>
{{IMG:sealed-fridge-step}}

<h2>원목과 조각은 어떻게 다뤄야 하나요</h2>
<p>침향스틱은 25년산 원목을 조각낸 형태라 표면 전체가 공기에 노출됩니다. 대라천은 원래 포장이나 밀폐 용기에 담아 서늘하고 건조한 곳에 두시기를 권합니다. 목질이다 보니 눅눅한 자리에 오래 두면 얼룩이 남기 쉽습니다. 나무 함에 보관한다면 방습제 한 봉을 함께 넣어 두는 편이 낫습니다. 표기된 유통기한은 4년입니다.</p>
<p>팔찌·묵주·합장주는 사정이 조금 다릅니다. 침향 100% 원목으로 만든 제품이라 보관 원칙은 같지만, 서랍에 모셔 두는 것이 최선은 아닙니다. 손목에 차거나 손에 쥐면 체온을 받아 은은한 향이 올라오기 때문에, 착용 자체가 관리의 일부가 됩니다.</p>
<p>대신 물이 닿는 상황에서는 잠깐 벗어 두시는 편이 좋습니다. 손 씻기, 샤워, 설거지가 여기에 해당합니다. 하루를 마치면 마른 부드러운 천으로 가볍게 닦고 파우치나 케이스에 담아 서랍에 넣습니다. 착용과 손질 요령은 <a href="/blog/agarwood-bracelet-beads-care">침향 팔찌·묵주 관리법</a>에서 더 자세히 다뤘습니다.</p>
<p>같은 원목이라도 조각과 액세서리를 한 용기에 섞어 담는 것은 권하지 않습니다. 조각은 부스러기가 생기고 팔찌는 표면이 눌리기 쉬워, 파우치를 따로 두는 편이 결국 손이 덜 갑니다. 대라천은 원목 계열을 한 서랍 안에서 칸만 나누어 두시기를 권합니다.</p>
{{IMG:wood-pieces-pouch}}

<h2>차·환·선향은 어떻게 나눠 두나요</h2>
<p>침향차와 파라미냐차는 습기 하나만 잡으면 됩니다. 티백이나 잎이 눅눅해지면 향이 먼저 빠지고 맛이 뒤따라 변합니다. 개봉한 뒤에는 지퍼백이나 밀폐 용기에 옮겨 담아 서늘하고 건조한 곳에 두십시오. 냉장고에 넣는 경우라면 밀폐가 특히 중요합니다.</p>
<p>침향단과 기보단 같은 환 제품은 꺼내는 방식이 관건입니다. 대라천 소개에 따르면 25년산 침향 분말을 바탕으로 여러 재료를 함께 담은 제품입니다. 대라천은 여러 개를 한꺼번에 꺼내 두기보다 그날 즐길 만큼만 꺼내시기를 권합니다. 남은 것을 원래 포장 안에 그대로 두면 나머지가 훨씬 오래 갑니다. 표기된 유통기한 안에 즐기시면 됩니다.</p>
<p>침향선향은 부러짐이 첫 번째 문제입니다. 25년산 침향 분말로 만든 가느다란 막대라 서랍에 눕혀 두면 다른 물건에 눌리기 쉽습니다. 원래 포장이나 밀폐 케이스에 담아 세워서 보관하시고, 습기가 닿지 않게만 하면 됩니다. 세워 둘 자리가 마땅치 않다면 눕히더라도 위에 무엇도 올리지 않는 칸을 따로 비워 두는 편이 낫습니다.</p>
<p>세 가지를 한 문장으로 줄이면 이렇습니다. 차는 밀폐, 환은 꺼내는 양, 선향은 세우기. 나머지 조건은 앞의 표에 적힌 대로 직사광선을 피하고 서늘하고 건조한 자리에 두는 것으로 모두 같습니다.</p>

<h2>언제 한 번씩 점검하면 되나요</h2>
<p>보관 자리를 정한 뒤에도 점검이 필요한 시점이 있습니다. 대라천은 계절이 바뀔 때, 이사하거나 가구를 옮겼을 때, 그리고 오래 집을 비운 뒤 이렇게 세 시점을 권합니다. 난방을 켜기 시작하는 시기에는 서랍 위치가 그대로여도 주변 온도가 달라지기 때문입니다.</p>
<p>점검할 때는 아래 여섯 가지를 차례로 확인하시면 됩니다.</p>
<ol>
<li>햇빛이 직접 드는 창가나 자동차 안은 피한다.</li>
<li>욕실·주방 싱크대 근처 등 습한 곳은 피한다.</li>
<li>난방기구·가스레인지 등 뜨거운 곳은 피한다.</li>
<li>쓴 뒤에는 뚜껑·포장을 꼭 닫아 밀폐한다.</li>
<li>오일 캡슐·침향수는 개봉 후 냉장한다.</li>
<li>유통기한을 확인하고, 표기된 기간 안에 즐긴다.</li>
</ol>
<p>여섯 항목 가운데 하나만 고른다면 네 번째입니다. 나머지 조건이 조금 어긋나도 밀폐가 지켜지면 향은 훨씬 오래 남고, 밀폐가 무너지면 좋은 자리에 두어도 계속 줄어듭니다. 값비싼 보관함보다 쓴 직후 뚜껑을 닫는 습관이 앞섭니다.</p>
<p>여섯 번째 항목은 점검하는 김에 한 번에 정리해 두면 편합니다. 유통기한이 짧은 순서대로 앞줄에 놓으면 다음 점검 때 무엇을 먼저 즐길지 고민할 일이 없습니다. 침향수 2년, 오일 캡슐 3년, 침향스틱 4년, 에센셜 오일 5년 순서가 그대로 배치 순서가 됩니다.</p>

<h2>향이 옅어졌다면 무엇을 확인하나요</h2>
<p>향의 세기만으로 상태를 판단하기는 어렵습니다. 코는 같은 향에 금세 익숙해지고, 방의 온도와 습도에 따라 같은 제품도 다르게 느껴집니다. 대라천은 세기 대신 눈에 보이는 상태를 기준으로 삼으시기를 권합니다.</p>
<p>확인 순서는 이렇습니다. 표면에 얼룩이나 곰팡이가 생겼는지, 손에 닿는 감촉이 눅눅한지, 원래와 다른 냄새가 섞였는지, 그리고 표기된 유통기한이 지났는지. 이 가운데 하나라도 해당하면 사용을 멈추고 대라천에 문의해 주십시오.</p>
<p>네 항목 모두 이상이 없다면 보관 환경을 먼저 되짚어 보시는 편이 좋습니다. 최근 자리를 옮겼는지, 뚜껑을 열어 둔 채 자리를 뜬 적이 있는지, 향이 강한 물건과 같은 칸에 두지는 않았는지. 원인은 대개 제품이 아니라 자리에 있습니다.</p>
<p>원목 계열이라면 확인 방법이 하나 더 있습니다. 팔찌나 조각을 손에 쥐고 잠시 체온으로 데운 뒤 다시 맡아 보는 것입니다. 온도가 조금 오르면 향이 다시 또렷해지는 경우가 많습니다. 이때도 변화가 없다면 그때 보관 상태를 의심해도 늦지 않습니다.</p>
<p>맡는 조건을 고정해 두면 비교가 쉬워집니다. 대라천은 같은 방, 같은 시간대에 확인하시기를 권합니다. 기준이 생기면 지난번과 무엇이 달라졌는지 훨씬 분명하게 드러납니다.</p>

<h2>대라천이 확인한 것과 확인하지 않은 것</h2>
<p>대라천은 이 글에 적은 보관 방법과 유통기한을 제품 표기와 자체 자료로 보유하고 있으며, 요청하시면 확인해 드립니다. 오일 캡슐 3년, 에센셜 오일 5년, 침향수 2년, 침향스틱 4년이라는 표기와 개봉 후 냉장 안내가 그 대상입니다.</p>
<p>반면 아래에 인용한 연구는 대라천이 수행한 것이 아니라 해당 연구팀의 결과이며, 제품의 효능을 뒷받침하는 자료가 아닙니다. 자리 선택과 개봉 후 절차 역시 성분의 성질을 근거로 삼은 대라천의 권장 사항이지, 특정 기간 동안 향이 어느 수준으로 유지된다는 것을 대라천이 측정해 보증하는 수치가 아닙니다.</p>
<p>인용한 두 편의 성격도 밝혀 둡니다. Wang S 연구팀의 논문은 성분 구성을 정리한 총론이고, Wang X 연구팀의 논문은 추출 공정을 다룬 종합 검토입니다. 어느 쪽도 가정에서의 보관 조건을 실험한 연구가 아니며, 대라천도 그렇게 인용하지 않았습니다.</p>
<p>이 글에는 신체 반응이나 효능을 다룬 연구를 넣지 않았습니다. 다루는 주제는 보관이며, 보관 요령이 효능 이야기로 읽히게 만들 이유도 없기 때문입니다. 대라천 제품은 일반식품이고, 위의 표와 도표는 복용 방법이 아니라 보관 방법을 정리한 것입니다.</p>

<h2>자주 묻는 질문</h2>
<h3>침향은 모두 냉장고에 넣어야 하나요</h3>
<p>아닙니다. 대라천이 개봉 후 냉장을 안내하는 제품은 오일 캡슐과 침향수 둘입니다. 에센셜 오일, 침향스틱, 침향차는 직사광선을 피한 서늘하고 건조한 자리에 밀폐해 두시면 됩니다.</p>
<h3>에센셜 오일은 정말 오래될수록 좋은가요</h3>
<p>대라천 제품 표기에 유통기한 5년과 함께 오래될수록 좋다고 적혀 있습니다. 다만 이 표기는 빛과 열을 피해 밀폐 보관했을 때를 전제로 합니다. 어두운 서랍에 세워 두고 쓴 직후 뚜껑을 끝까지 잠그시면 됩니다.</p>
<h3>개봉한 침향수는 언제까지 마시면 되나요</h3>
<p>침향수의 표기 유통기한은 2년입니다. 개봉한 뒤에는 냉장 보관하고 뚜껑을 잘 닫아 다른 냄새가 섞이지 않게 하시면 됩니다. 표기된 기간 안에 즐기시기를 권합니다.</p>
<h3>팔찌와 묵주도 냉장 보관이 필요한가요</h3>
<p>필요하지 않습니다. 원목 제품은 직사광선을 피한 서늘하고 건조한 자리에 파우치나 케이스째 두시면 됩니다. 물에 닿지 않게 하는 것이 관리의 핵심입니다.</p>
<h3>선향은 어떻게 두는 것이 좋나요</h3>
<p>가늘어서 부러지기 쉬우니 원래 포장이나 밀폐 케이스에 담아 세워서 보관하십시오. 직사광선과 습기를 피한 서늘하고 건조한 자리가 알맞습니다.</p>

<h2>근거·출처</h2>
<p>보관 방법과 유통기한은 대라천 공식 보관 안내와 제품 표기를 정리한 제품 이용 안내입니다. 성분의 성질과 관련해 인용한 연구는 아래와 같으며, 이 연구들이 보관 방법을 검증한 것은 아닙니다.</p>
<ul>
<li>Wang S, Yu Z, Wang C 외, “Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants”, <em>Molecules</em> 23권 342 (2018) — <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">doi.org/10.3390/molecules23020342</a></li>
<li>Wang X, Chan SW, Singaram N 외, “Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities”, <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">doi.org/10.1080/10412905.2024.2447706</a></li>
<li>대라천 제품별 유통기한·보관 안내 — <a href="/products">zoellife.com/products</a></li>
<li>침향의 특성·보관 정보 — <a href="/about-agarwood">zoellife.com/about-agarwood</a></li>
</ul>
<p>Wang S 연구팀은 2018년 <em>Molecules</em>에 침향과 아퀼라리아 속 식물의 화학 성분을 총론으로 정리했습니다. Wang X 연구팀은 2025년 <em>Journal of Essential Oil Research</em>에 추출 방식과 조건에 따라 수율과 성분 조성이 달라진다고 검토했습니다. 대라천은 이 두 편을 성분이 조건에 민감하다는 근거로만 인용했습니다.</p>
'''

data = {
    "slug": SLUG,
    "title": "침향 보관법 실전 — 오일·스틱·팔찌 형태별 절차",
    "excerpt": "대라천이 정리한 침향 보관법 절차입니다. 보관할 자리를 고르는 네 단계, 개봉 후 냉장이 붙는 제품 두 가지, 원목·조각·차·선향의 형태별 손질 요령, 제품별 표기 유통기한과 계절마다 점검할 여섯 항목을 표와 도표로 담았습니다.",
    "tags": ["침향 보관법", "침향 유통기한", "침향 오일 보관", "침향수 보관", "침향스틱", "대라천"],
    "content": CONTENT + DISC,
    "images": [
        {
            "key": "sealed-fridge-step",
            "prompt": "Photorealistic close-up of a hand placing a small sealed amber glass bottle and a closed capsule container inside a clear zip bag on a clean refrigerator shelf. Soft cool interior light, muted neutral tones, shallow depth of field, minimal tidy composition, no food clutter. No text, no letters, no logo, no watermark, no faces.",
            "alt": "침향 보관법 — 개봉한 오일 캡슐과 침향수를 밀폐 용기에 담아 냉장고 안쪽 선반에 넣는 모습",
            "caption": "개봉 후 냉장은 두 제품에만 붙습니다 — 뚜껑을 끝까지 잠그고 한 번 더 밀폐합니다"
        },
        {
            "key": "wood-pieces-pouch",
            "prompt": "Photorealistic overhead still life on warm linen: dark resinous agarwood chips beside a small fabric drawstring pouch, a wooden bead bracelet, a slim closed case, and a small silica gel sachet. Natural diffused daylight, warm earth tones, fine wood grain visible, calm editorial product photography. No text, no letters, no logo, no watermark, no people.",
            "alt": "침향스틱 조각과 팔찌를 파우치·밀폐 케이스에 나누어 담은 보관 준비물",
            "caption": "원목과 조각은 방습제와 함께, 팔찌는 파우치에 — 형태마다 다루는 방법이 갈립니다"
        }
    ],
    "changelog": {
        "charsBefore": 3232,
        "charsAfter": 5352,
        "citationsAdded": ["A1", "A4"],
        "voiceFixes": 14,
        "notes": "주어 없는 보관 서술과 회피 화법(안내되는·좋다고 합니다)을 대라천 주어 문장으로 전환. 원문의 원칙 나열을 자리 선정 4단계·개봉 후 3단계·형태별 절차·점검 시점으로 재구성하고 유통기한 막대 SVG를 추가. 표 수치(3·5·2·4년)와 disclaimer는 그대로 유지."
    }
}

with open(os.path.join(BASE, 'out/%s.json' % SLUG), 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print('written')
