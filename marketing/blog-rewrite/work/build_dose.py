# -*- coding: utf-8 -*-
"""agarwood-oil-daily-dose-2-3mg — rebuilt as a PRODUCT SPECIFICATION article.

Compliance pivot (SPEC §F): the mg figure is retained as a spec/unit notation,
never as a recommended intake. All intake-guidance sentences removed.
"""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(BASE, 'in/agarwood-oil-daily-dose-2-3mg.json')))

DISCLAIMER = "<hr /><p style='font-size:13px;color:#7D7570'><em>※ 본 콘텐츠는 정보 제공을 목적으로 하며, 대라천 공식 자료(zoellife.com)와 공식 문서·학술 논문에 근거해 작성되었습니다. 소개된 전통 문헌·연구 내용은 해당 출처의 기록이며 특정 효과를 보장하지 않습니다. 대라천 침향 제품은 일반식품(또는 건강식품)으로 질병의 예방·치료를 위한 의약품이 아니며, 효과와 반응에는 개인차가 있습니다. 건강 상태에 따라 전문가와 상담하시기 바랍니다.</em></p>"

# --- SVG 1: source chart preserved byte-identical inside <svg>, width added for responsiveness
SVG_SRC = """<svg viewBox='0 0 400 210' width="100%" role='img' aria-label='침향 분말 형태와 오일 형태의 양 비교 막대그래프'>
<rect x='0' y='0' width='400' height='210' fill='#faf6ec'/>
<rect x='60' y='30' width='90' height='120' fill='#b88c2d'/>
<text x='105' y='170' font-size='13' text-anchor='middle' fill='#3a2f10'>분말 형태</text>
<text x='105' y='188' font-size='12' text-anchor='middle' fill='#7D7570'>그램(g) 단위</text>
<rect x='250' y='142' width='90' height='8' fill='#5c4a15'/>
<text x='295' y='170' font-size='13' text-anchor='middle' fill='#3a2f10'>오일 형태</text>
<text x='295' y='188' font-size='12' text-anchor='middle' fill='#7D7570'>약 2~3 mg</text>
<text x='200' y='22' font-size='12' text-anchor='middle' fill='#8a6d1f'>오일은 분말보다 훨씬 농축된 형태예요</text>
</svg>"""

# --- SVG 2: new — capsule composition ratio, light reading surface per SPEC §E-2
SVG_RATIO = """<svg viewBox="0 0 480 176" width="100%" role="img" aria-label="참침향 오일 캡슐 표기 기준 침향수지오일 0.59% 비율 막대">
<rect x="0" y="0" width="480" height="176" fill="#fffdf9"/>
<text x="24" y="30" font-size="13" fill="#2b2318">참침향 오일 캡슐 — 표기 성분 비율</text>
<rect x="24" y="52" width="432" height="34" fill="#efe7d6" stroke="#d9c9a3"/>
<rect x="24" y="52" width="3" height="34" fill="#9a6a10"/>
<path d="M27 52 L27 40 L150 40" fill="none" stroke="#9a6a10" stroke-width="1.5"/>
<text x="156" y="44" font-size="12" fill="#9a6a10">침향수지오일 0.59%</text>
<text x="240" y="74" font-size="12" text-anchor="middle" fill="#2b2318">나머지 — 적송오일·오메가3·비타민E 등 부원료</text>
<text x="24" y="112" font-size="12" fill="#2b2318">캡슐당 용량 3mL · 한 통 30캡슐 · 유통기한 3년</text>
<text x="24" y="134" font-size="12" fill="#2b2318">가로 막대 전체 = 캡슐 내용물 100%, 눈금은 실제 비율</text>
<text x="24" y="156" font-size="12" fill="#7d7570">수치는 대라천 제품 표기를 그대로 옮긴 규격입니다</text>
</svg>"""

TABLE = """<table style='width:100%;border-collapse:collapse;font-size:14px'>
<thead><tr style='background:#b88c2d;color:#fff'><th style='padding:8px;border:1px solid #d9c9a3;text-align:left'>제품</th><th style='padding:8px;border:1px solid #d9c9a3;text-align:left'>구성·함량</th><th style='padding:8px;border:1px solid #d9c9a3;text-align:left'>제품 표기 사용법</th></tr></thead>
<tbody>
<tr><td style='padding:8px;border:1px solid #e6dcc4'><strong>참침향 오일 캡슐</strong></td><td style='padding:8px;border:1px solid #e6dcc4'>25년산, 30캡슐. 침향수지오일 0.59%, 캡슐당 3mL. 적송오일·오메가3·비타민E 함유</td><td style='padding:8px;border:1px solid #e6dcc4'>1일 1캡슐</td></tr>
<tr style='background:#faf6ec'><td style='padding:8px;border:1px solid #e6dcc4'><strong>참침향 에센셜 오일</strong></td><td style='padding:8px;border:1px solid #e6dcc4'>25년산 원목 72시간 고온증류 100% 순수 오일 (1ml). 약 400kg에서 20~25cc만 추출</td><td style='padding:8px;border:1px solid #e6dcc4'>취향·복용·차·마사지</td></tr>
</tbody></table>"""

content = """<p class="lead"><strong>결론부터.</strong> 대라천 자료에 적힌 침향 오일 mg 표기는 하루에 얼마를 드시라는 권장 섭취량이 아니라, 오일이라는 형태를 재는 눈금입니다. 조엘라이프(주)(브랜드 대라천)는 침향을 분말로 다룰 때는 그램(g)으로, 오일로 뽑았을 때는 밀리그램(mg)으로 규격을 적습니다. 완제품에는 제품마다 별도의 표기가 붙습니다. 대라천 침향 제품은 일반식품이며, 섭취 여부와 양에 관한 판단은 제품 표기와 전문가 상담의 몫입니다.</p>

<h2>침향 오일 mg 표기는 무엇을 가리킬까요?</h2>
<p>대라천 자료는 100% 침향 오일의 규격을 <strong>2~3mg</strong> 수준의 밀리그램 단위로 적습니다. 처음 보면 단위가 지나치게 작다고 느끼기 쉽습니다.</p>
<p>침향은 아퀼라리아 나무가 상처 입은 자리에 수지(진액)를 오랜 시간 쌓아 만들어 내는 재료입니다. 조엘라이프(주)는 베트남 농장에서 확보한 25년산 원목을 참침향 제품군의 원료로 씁니다.</p>
<p>이 원목을 증류해 오일로 뽑으면 부피가 크게 줄어듭니다. 대라천 제품 표기에 따르면 참침향 에센셜 오일은 원목 약 400kg에서 20~25cc만 나옵니다. 재료가 이만큼 압축되니 규격을 적는 눈금도 그램에서 밀리그램으로 한 칸 내려갑니다.</p>
<p>추출 방식이 오일의 수율과 성분 구성을 좌우한다는 점은 학계에서도 다뤄진 주제입니다. Wang X 연구팀은 2025년 <em>Journal of Essential Oil Research</em>에 아퀼라리아 정유의 추출법이 수율·화학 조성·생물학적 활성에 미치는 영향을 검토한 리뷰를 실었습니다(<a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">DOI</a>).</p>
<p>이 리뷰는 대라천이 수행한 연구가 아니라 해당 연구팀의 작업이며, 대라천 제품의 효능을 뒷받침하는 자료도 아닙니다. 다만 같은 원료라도 증류 조건에 따라 뽑히는 오일의 양과 성분이 달라진다는 사실은, 오일 규격을 읽을 때 함량 수치 하나만 보아서는 안 되는 이유를 설명해 줍니다.</p>

<h2>2~3mg은 권장 섭취량인가요?</h2>
<p>아닙니다. 대라천은 이 숫자를 <strong>제품 규격을 설명하는 표기</strong>로만 씁니다. 하루에 이만큼 드시라는 권장량이 아니고, 어떤 효과를 기대할 수 있다는 뜻은 더더욱 아닙니다.</p>
<p>대라천 침향 제품은 <strong>일반식품</strong>입니다. 질병의 예방이나 치료를 목적으로 만든 의약품이 아니므로, 무엇을 얼마나 드실지는 대라천이 정해 드릴 수 있는 영역이 아닙니다. 복용 중인 약이 있거나 건강 상태가 신경 쓰인다면 의사·약사 같은 전문가와 먼저 상의하시기 바랍니다.</p>
<p>완제품을 고르셨다면 확인할 곳은 하나, 제품 표기입니다. 대라천 참침향 오일 캡슐의 표기 사용법은 <strong>1일 1캡슐</strong>로 인쇄돼 있습니다. 같은 표기에는 임산부·수유부·과민증이 있는 분은 주의하라는 문구도 함께 들어 있습니다.</p>
<p>대라천은 이 글에서 mg 숫자를 규격으로만 다루고, 그 이상의 해석은 하지 않습니다.</p>
<p>표기와 권장을 구분하는 일이 왜 중요한지도 짚어 둡니다. 규격은 제조사가 책임지고 밝히는 사실이지만, 얼마를 어떻게 드실지는 드시는 분의 건강 상태와 전문가의 판단이 함께 필요한 영역입니다. 대라천은 앞의 것만 이 글에 적고, 뒤의 것은 적지 않습니다.</p>

<h2>분말과 오일, 표기 눈금은 얼마나 벌어질까요?</h2>
<p>아래 막대그래프는 침향을 분말로 다룰 때와 오일로 뽑았을 때 규격 단위가 얼마나 벌어지는지 보여 줍니다. g(그램)과 mg(밀리그램)은 1,000배 차이입니다.</p>
<figure>@@SVG_SRC@@<figcaption style='font-size:13px;color:#7D7570'>같은 침향이라도 분말과 오일은 규격에 쓰는 단위가 1,000배 넘게 차이 납니다. 섭취량 안내가 아니라 표기 단위 비교입니다. (출처: 대라천 제품 자료)</figcaption></figure>
<p>대라천은 이 차이를 제품 설명에서 그대로 유지합니다. 분말 제품은 그램으로, 오일 제품은 밀리그램으로 적습니다. 단위를 섞어 쓰면 소비자가 규격을 나란히 놓고 비교하기 어려워지기 때문입니다.</p>
<p>눈금이 작다는 사실이 오일이 더 좋은 형태라는 뜻은 아닙니다. 같은 재료를 다른 방식으로 다뤘고, 그래서 재는 자가 달라졌을 뿐입니다.</p>
<p>표기 단위를 헷갈리면 제품끼리 비교가 어긋납니다. 밀리그램으로 적힌 오일과 그램으로 적힌 분말을 숫자만 보고 나란히 놓으면, 실제로는 1,000배 차이 나는 눈금을 같은 자로 재는 셈이 됩니다. 규격을 읽을 때 숫자보다 단위를 먼저 확인해야 하는 이유입니다.</p>
{{IMG:oil-distillation}}
<figure><img src="https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/blog/agarwood-oil-daily-dose-2-3mg-distillation-1782959616939.png" alt="침향 분말이 증류 과정을 거쳐 소량의 오일 방울이 되는 과정을 나타낸 일러스트" /><figcaption>많은 분말을 증류해야 나오는 소량의 귀한 오일</figcaption></figure>

<h2>대라천 오일 제품의 규격은 어떻게 적혀 있나요?</h2>
<p>조엘라이프(주)가 공개한 두 오일 제품의 규격을 표기 그대로 옮겼습니다. 표의 오른쪽 칸은 제품에 인쇄된 사용법 문구이며, 대라천이 이 글에서 새로 권하는 양이 아닙니다.</p>
@@TABLE@@
<p style='font-size:13px;color:#7D7570'>※ 위 내용은 대라천 제품 표기(<a href="/products">zoellife.com/products</a>)를 정리한 제품 이용 안내이며, 질병 치료를 위한 복용법이 아닙니다.</p>
<p>표에서 눈여겨볼 대목은 두 제품의 성격 차이입니다. 오일 캡슐은 부원료를 함께 담아 캡슐 하나로 규격을 고정한 완제품이고, 에센셜 오일은 1ml 단위로 담은 100% 순수 오일입니다. 규격이 다르니 표기 방식도 달라집니다.</p>
<p>표기 사용법 칸도 성격이 다릅니다. 캡슐은 개수로 규격이 닫혀 있어 한 줄로 적히지만, 에센셜 오일은 쓰임이 여러 갈래라 용도만 나열돼 있습니다. 대라천은 이 칸을 제품에 인쇄된 문구 그대로 옮겨 적었고, 문구를 다듬거나 보태지 않았습니다.</p>

<h2>오일 함량 숫자만으로 좋은 제품인지 알 수 있을까요?</h2>
<p>알기 어렵습니다. 함량 수치는 제품을 견주는 여러 정보 가운데 하나일 뿐입니다.</p>
<p>함량만 앞세운 제품은 저가 오일이거나 여러 오일을 섞은 복합 오일일 수 있습니다. 숫자 하나로는 어떤 원목을 어떤 조건에서 증류했는지 알 길이 없습니다.</p>
<p>대라천 자료는 참침향 에센셜 오일을 25년산 원목을 72시간 고온 증류해 얻은 100% 순수 오일로 적고 있습니다. 원목 약 400kg에서 20~25cc가 나온다는 수율도 함께 밝힙니다. 함량 수치보다 이런 원료·공정 정보가 비교에 훨씬 쓸모 있습니다.</p>
<p>Wang S 연구팀은 2018년 <em>Molecules</em>에 침향과 아퀼라리아 식물의 화학 성분을 총정리한 논문을 실었습니다(<a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">DOI</a>). 침향의 성분 구성이 수종과 수지 형성 조건에 따라 달라진다는 사실을 확인할 수 있는 1차 자료입니다.</p>
<p>이 논문 역시 대라천이 수행한 연구가 아닙니다. 성분표의 숫자가 같더라도 그 숫자를 만든 원료와 공정이 다르면 결과물도 달라진다는 점만 확인하시면 충분합니다. 대라천이 원목 나이와 증류 조건을 제품 표기에 함께 적어 두는 까닭이 여기에 있습니다.</p>

<h2>제형마다 표기 단위가 다른 이유는 무엇일까요?</h2>
<p>침향은 오일 말고도 분말(가루)과 증류수 형태로 나옵니다. 형태가 달라지면 규격을 적는 단위도 함께 달라집니다.</p>
<p>대라천 침향단은 25년산 침향 분말이 10% 들어간 환 제품입니다. 제품 표기는 1단 5g 기준이고, 사용법은 하루 1단 식후로 인쇄돼 있습니다. 밀리그램 대신 <strong>정해진 개수</strong>로 규격을 잡은 셈입니다.</p>
<p>침향수는 25년산 침향을 증류해 얻은 추출물 100% 제품입니다. 표기 기준은 하루 20ml이며, 가습기나 분무기에 담아 공간에 뿌리는 쓰임도 함께 안내합니다. 마시는 용도와 뿌리는 용도가 한 제품에 담기다 보니 규격도 무게가 아닌 부피로 적혀 있습니다.</p>
<p>정리하면 오일은 mg, 캡슐은 개수, 분말 환은 단 수, 침향수는 용량으로 규격 단위가 제각각입니다. 단위가 헷갈릴 때 펼쳐 볼 곳은 제품 라벨입니다.</p>
<p>단위가 나뉘는 기준은 단순합니다. 액체는 부피로, 고형물은 무게로, 이미 낱개로 성형된 제품은 개수로 적습니다. 대라천은 제형이 바뀔 때마다 이 원칙에 맞춰 표기를 정하고, 같은 제품 안에서 단위를 섞지 않습니다. 표기 단위만 알아 두어도 처음 보는 침향 제품의 규격을 읽어 낼 수 있습니다.</p>

<h2>오일 캡슐은 어떤 규격으로 구성되어 있나요?</h2>
<p>대라천 참침향 오일 캡슐을 규격 단위로 뜯어보겠습니다. 이 제품은 25년산 침향 오일 원액에 적송 오일, 오메가3, 비타민E를 함께 담았습니다. 침향 오일 하나만 넣은 단일 원료 제품이 아닙니다.</p>
<p>수치로 보면 침향수지오일이 <strong>0.59%</strong>, 캡슐 하나가 <strong>3mL</strong>, 한 통에 <strong>30캡슐</strong>입니다. 제품 표기 사용법은 1일 1캡슐, 유통기한은 3년으로 적혀 있습니다.</p>
<figure>@@SVG_RATIO@@<figcaption style='font-size:13px;color:#7D7570'>참침향 오일 캡슐 표기 기준 — 침향수지오일 0.59%가 캡슐 내용물에서 차지하는 비율. 나머지는 적송오일·오메가3·비타민E 등 부원료입니다. (출처: 대라천 제품 표기)</figcaption></figure>
<p>0.59%라는 숫자만 떼어 보면 적다고 느낄 수 있습니다. 다만 이 수치는 캡슐 안에서 침향수지오일이 차지하는 비율일 뿐, 그 오일을 어떤 원목에서 어떻게 뽑았는지까지 알려 주지는 않습니다.</p>
<p>대라천은 부원료를 감추지 않고 표기에 함께 밝혔습니다. 캡슐 하나의 3mL 가운데 대부분은 적송 오일과 오메가3, 비타민E가 채우고, 침향수지오일은 그중 0.59%를 차지합니다. 규격을 이렇게 열어 두어야 소비자가 제품을 있는 그대로 비교할 수 있습니다.</p>
{{IMG:capsule-spec}}

<h2>대라천이 확인한 것과 확인하지 않은 것</h2>
<p>조엘라이프(주)는 이 글에 적은 제품 규격을 제품 표기와 자체 자료로 보유하고 있으며, 요청하시면 확인해 드립니다. 25년산 원료, 침향수지오일 0.59%, 캡슐당 3mL, 한 통 30캡슐, 유통기한 3년, 에센셜 오일 1ml와 72시간 고온 증류, 원목 약 400kg당 20~25cc 수율이 여기에 해당합니다.</p>
<p>확인하지 않은 것도 함께 밝힙니다. 이 글에 인용한 Wang X 연구팀과 Wang S 연구팀의 논문은 대라천이 수행한 연구가 아니라 각 연구팀의 결과이며, 대라천 제품의 효능을 뒷받침하는 자료가 아닙니다. 대라천은 특정 섭취량이 어떤 결과로 이어진다는 주장을 하지 않고, 그 판단은 전문가의 몫으로 남겨 둡니다.</p>
<p>침향을 고르는 기준을 더 살펴보시려면 <a href="/blog/choose-your-first-agarwood-product">첫 침향 제품 고르기</a>와 <a href="/about-agarwood">침향 성분·용법 정보</a>를 함께 참고하시기 바랍니다.</p>
<p>이 글의 어떤 문장도 섭취를 권하거나 섭취량을 정해 드리는 내용이 아닙니다. 대라천이 밝힐 수 있는 것은 제품에 무엇이 얼마나 들었고 어떤 공정을 거쳤는가까지이며, 그 지점에서 글을 멈춥니다. 규격을 넘어선 판단은 의료 전문가의 영역입니다.</p>

<h2>자주 묻는 질문</h2>
<h3>Q. 하루 2~3mg 표기는 권장 섭취량인가요?</h3>
<p>A. 아닙니다. 대라천 자료가 100% 침향 오일의 규격을 밀리그램 단위로 적은 표기입니다. 대라천 제품은 일반식품이며, 섭취 여부와 양은 제품 표기를 확인하신 뒤 전문가와 상의하시기 바랍니다.</p>
<h3>Q. 오일은 mg, 분말은 g으로 적는 이유가 무엇인가요?</h3>
<p>A. 증류를 거치며 재료가 압축되기 때문입니다. g과 mg은 1,000배 차이라, 같은 침향이라도 형태에 따라 규격 눈금이 한 칸 내려갑니다.</p>
<h3>Q. 오일 함량이 높은 제품이 더 좋은 제품인가요?</h3>
<p>A. 함량 수치만으로는 판단하기 어렵습니다. 함량이 높아도 저가 오일이거나 복합 오일일 수 있으므로, 원목의 나이와 추출 방식을 함께 확인하시는 편이 낫습니다.</p>
<h3>Q. 오일 캡슐과 에센셜 오일은 규격이 어떻게 다른가요?</h3>
<p>A. 오일 캡슐은 침향수지오일 0.59%에 적송 오일·오메가3·비타민E를 더해 캡슐당 3mL, 한 통 30캡슐로 고정한 완제품입니다. 에센셜 오일은 25년산 원목을 72시간 고온 증류한 100% 순수 오일 1ml입니다.</p>
<h3>Q. 침향수도 mg으로 규격을 적나요?</h3>
<p>A. 아닙니다. 침향수는 증류 추출물이라 하루 20ml처럼 용량(ml)으로 표기합니다. 형태마다 기준 단위가 다르니 제품 라벨을 확인하시기 바랍니다.</p>
<h3>Q. 오일 캡슐 안에는 침향만 들어 있나요?</h3>
<p>A. 아닙니다. 대라천 오일 캡슐은 25년산 침향 오일 원액에 적송 오일, 오메가3, 비타민E를 함께 담았습니다. 침향수지오일 표기 함량은 0.59%, 캡슐 하나는 3mL입니다.</p>

<h2>근거·출처</h2>
<p>이 글의 제품 규격과 표기는 대라천 공식 자료(zoellife.com)와 제품 표기를 정리한 제품 이용 안내입니다. mg·% 표기는 모두 규격 설명이며, 특정 효능이나 섭취량을 권하는 내용이 아닙니다. 인용한 학술 논문은 각 연구팀의 결과이며 대라천 제품의 효능 근거가 아닙니다.</p>
<ul>
<li>Wang X, Chan SW, Singaram N 외, "Essential oil from Aquilaria spp. (agarwood): a comprehensive review on the impact of extraction methods on yield, chemical composition, and biological activities", <em>Journal of Essential Oil Research</em> 37권 110~144쪽 (2025) — <a href="https://doi.org/10.1080/10412905.2024.2447706" target="_blank" rel="noopener">https://doi.org/10.1080/10412905.2024.2447706</a></li>
<li>Wang S, Yu Z, Wang C 외, "Chemical Constituents and Pharmacological Activity of Agarwood and Aquilaria Plants", <em>Molecules</em> 23권 342 (2018) — <a href="https://doi.org/10.3390/molecules23020342" target="_blank" rel="noopener">https://doi.org/10.3390/molecules23020342</a></li>
<li><a href="/about-agarwood">침향의 용법·성분 정보 — zoellife.com/about-agarwood</a></li>
<li><a href="/products">대라천 오일 제품 안내 — zoellife.com/products</a></li>
</ul>
"""
content = content.replace("@@SVG_SRC@@", SVG_SRC).replace("@@SVG_RATIO@@", SVG_RATIO).replace("@@TABLE@@", TABLE)


content = content + DISCLAIMER

out = {
    "slug": "agarwood-oil-daily-dose-2-3mg",
    "title": "침향 오일 mg 표기 읽는 법 — 대라천 제품 규격 안내",
    "excerpt": "대라천 자료에 적힌 2~3mg은 권장 섭취량이 아니라 침향 오일의 규격 단위입니다. 조엘라이프(주)가 참침향 오일 캡슐의 침향수지오일 0.59%, 캡슐당 3mL, 한 통 30캡슐 규격을 어떻게 표기했는지 표와 도표로 정리했습니다.",
    "tags": ["침향", "침향오일", "침향오일규격", "침향캡슐", "제품표기", "일반식품", "대라천", "조엘라이프"],
    "content": content,
    "images": [
        {"key": "oil-distillation",
         "prompt": "Photorealistic still life of a traditional copper distillation apparatus in a clean workshop, warm agarwood chips in a wooden tray beside it, a single tiny amber glass vial holding a few drops of dark oil, soft natural window light, shallow depth of field, no text, no logo, no watermark",
         "alt": "침향 원목을 증류해 소량의 침향 오일을 얻는 공정 — 침향 오일 mg 표기의 배경",
         "caption": "원목을 증류하면 오일은 밀리그램 눈금으로 내려갑니다"},
        {"key": "capsule-spec",
         "prompt": "Photorealistic overhead product shot of amber softgel capsules arranged neatly on a matte cream surface next to a small glass bottle, calm studio lighting, muted beige and gold tones, clinical and precise composition, no text, no label, no logo, no watermark",
         "alt": "참침향 오일 캡슐 규격 — 캡슐당 3mL, 한 통 30캡슐",
         "caption": "캡슐당 3mL, 한 통 30캡슐로 고정된 규격"}
    ],
    "changelog": {
        "charsBefore": 0, "charsAfter": 0,
        "citationsAdded": ["A4", "A1"],
        "voiceFixes": 0,
        "notes": "복용 권장 프레임을 제품 규격 프레임으로 전면 전환(§F): 제목·리드·FAQ에서 섭취 권장 문장 삭제, 일반식품·전문가 상담 명시 추가. 검증 불가한 한국한의학연구원 귀속을 excerpt·태그에서 삭제. A4·A1 1차 출처와 규격 인포그래픽 추가."
    }
}

import re
def strip(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', '', t)

out['changelog']['charsBefore'] = len(strip(src['content']))
out['changelog']['charsAfter'] = len(strip(content))
out['changelog']['voiceFixes'] = len(re.findall(r'(대라천은|대라천이|조엘라이프\(주\)는|대라천 자료는|대라천 자료가)', strip(content)))

path = os.path.join(BASE, 'out/agarwood-oil-daily-dose-2-3mg.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, indent=2)
print('wrote', path, out['changelog']['charsBefore'], '->', out['changelog']['charsAfter'])
print('excerpt len', len(out['excerpt']), 'title len', len(out['title']))
