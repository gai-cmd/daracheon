import React from 'react';
import { motion } from 'motion/react';

export const StoryContent = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 text-luxury-black">
    <div className="overflow-hidden rounded-2xl border border-luxury-gold/20 shadow-xl">
      <table className="w-full text-left border-collapse bg-white">
        <tbody>
          <tr className="border-b border-luxury-gold/10">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              조엘라이프는 "자연의 진실된 가치"를 모토로 한 프리미엄 침향 브랜드 [대라천 '참'침향]을 소개합니다. 침향은 수천 년 전부터 귀하게 여겨져 온 천연의 선물로, 침향나무가 스스로 상처를 치유하며 만들어내는 고귀한 수지입니다. 조엘라이프는 이 고귀한 가치를 현대 과학과 결합하여 인류의 건강과 행복에 기여하고자 합니다.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10 bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              대라천 '참'침향은 세계적으로 인정 받은 침향의 최고 산지인 베트남에서 생산된 침향만 100% 사용합니다. 직접 운영하는 침향농장에서 생산된 침향을 사용하는 제품은 오직 대라천 '참'침향뿐입니다. 또한, 베트남 식약청에서 'Aquilaria Agallocha Roxburgh' 학명 사용을 인정한 제품은 대라천 '참'침향 제품 뿐입니다.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              대라천 '참'침향은 식목에서 침향을 얻기까지 20~30년 동안 유기농법으로 재배합니다. 20년 이상 된 침향나무에서 2~10년에 걸쳐 열대과일 발효액으로 수지 내림을 해, 벌목 후 사람 손으로 하나하나 침향을 채취하고 국가 공인 유기농 인증을 통해 더욱 안전하고 신뢰할 수 있습니다.
            </td>
          </tr>
          <tr className="bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              베트남 하띤성의 침향농장에서는 모든 Agallocha 침향나무에 개별적으로 고유번호를 부여해 이력을 관리하며 동나이 직영공장에서 전통 증기 증류법으로 침향오일을 생산합니다. 침향나무 재배나 수지 추출 과정을 고려하면 당연히 비쌀 수 밖에 없지만 비싼 만큼 최선을 다하고 있습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <img src="https://lh3.googleusercontent.com/d/1ysHtLQD-eWosY0RzcKUyPl81Vg8vYAJU" alt="대라천 참침향 브랜드 이미지 1" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1x41yQZcD9Tw2X0OS2yO8gyTFIbZnMYjL" alt="대라천 참침향 브랜드 이미지 2" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/150DP4twXGPZZSZcy1oEuDBfBYcnh7veI" alt="대라천 참침향 브랜드 이미지 3" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
    </div>
  </motion.div>
);

export const FieldContent = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 text-luxury-black">
    <div className="overflow-hidden rounded-2xl border border-luxury-gold/20 shadow-xl">
      <table className="w-full text-left border-collapse bg-white">
        <tbody>
          <tr className="border-b border-luxury-gold/10">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              베트남 하띤성에 위치한 200ha 규모의 대규모 침향 농장은 대라천 '참'침향의 심장부로, 400만 그루의 침향나무가 자라는 생명의 터전입니다. 하띤성, 나짱, 푸꿕 등 베트남 전역에 걸쳐 대규모 직영 농장을 운영하고 있습니다.
            </td>
          </tr>
          <tr className="bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              직영 농장에서는 모든 Agallocha 침향나무에 개별적으로 고유번호를 부여해 이력을 관리하며, 특허받은 수지유도 기술을 통해 최상의 침향을 생산합니다. CITES 국제인증, Organic HACCP 품질인증, 베트남 정부 OCOP 품질보증을 통해 그 가치를 입증했습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <img src="https://lh3.googleusercontent.com/d/1Y5s694jxliP9eyZwITFQ-dSodvq69Dwo" alt="침향 농장 1" className="w-full h-80 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1gMDKasiAFetV3JHqfQT95EhfEGXUuol6" alt="침향 농장 2" className="w-full h-80 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/15y3HH3KX1LlUvlADTsVlph3MfKCD9KXQ" alt="침향 농장 3" className="w-full h-80 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1w6lbVhmEDHZ96TeBShhYb70-cFxBnbWm" alt="침향 농장 4" className="w-full h-80 object-cover rounded-lg" loading="lazy" />
    </div>
  </motion.div>
);

export const HistoryContent = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 text-luxury-black">
    <h3 className="text-4xl font-noto-serif text-luxury-gold">대라천 '참'침향의 역사</h3>
    <div className="overflow-hidden rounded-2xl border border-luxury-gold/20 shadow-xl">
      <table className="w-full text-left border-collapse bg-white">
        <tbody>
          <tr className="border-b border-luxury-gold/10">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>1998 - 2001:</strong> 1998년 캄보디아에서 침향사업을 시작한 이래, 대라천 '참'침향은 끊임없는 도전과 연구를 이어왔습니다. 2000년에는 베트남 5개 성에 농장을 조성하며 본격적인 침향 재배를 시작했습니다. 2001년 동나이성에 대규모 식재를 진행하며 미래를 준비했습니다.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10 bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>2014 - 2019:</strong> 2014년 노니발효 시스템을 개발하며 기술력을 축적했고, 2018년에는 NTV Vietnam 통합법인을 설립하고 Organic/HACCP 인증을 획득하며 식용가능 수지유도제를 재개발했습니다. 2019년에는 OCOP 베트남 정부 품질보증을 받았습니다.
            </td>
          </tr>
          <tr className="bg-white">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>2023 - 2025:</strong> 2023년 침향캡슐 건강기능성 재인증을 통해 18품목을 생산하게 되었고, 2024년에는 조엘라이프를 통해 한국 시장에 본격적으로 진출했습니다. 2025년에는 아시아 10대 선도 브랜드로 선정되었으며, 유기 바나듐, 셀레늄, 게르마늄 특허를 출원하며 기술 혁신을 이어가고 있습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <img src="https://lh3.googleusercontent.com/d/18H4_TrP4YdOnrPLM5iSPhAhmINr4OFUM" alt="역사 이미지 1" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1o_Gl34UbhvNdkZusqCjQgncv_vkZeCtF" alt="역사 이미지 2" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/16bDkhswkafwHe0Vz31pMAiNCca9nv0Bm" alt="역사 이미지 3" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
    </div>
  </motion.div>
);

export const CertificationContent = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 text-luxury-black">
    <h3 className="text-4xl font-noto-serif text-luxury-gold">다양한 인증</h3>
    <div className="overflow-hidden rounded-2xl border border-luxury-gold/20 shadow-xl">
      <table className="w-full text-left border-collapse bg-white">
        <tbody>
          <tr className="border-b border-luxury-gold/10">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>국제 거래 및 기술 특허:</strong> 대라천 '참'침향은 엄격한 품질 관리와 인증을 통해 고객에게 신뢰를 드립니다. CITES 인증번호 IIA-DNI-007은 멸종위기종인 침향의 국제거래가 합법적임을 보장합니다. 수지유도 특허 #12835는 2011년 출원하여 2014년 등록되었으며, 20년 유효한 식용가능 침향수지 생산 기술입니다.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10 bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>품질 보증:</strong> Organic 유기농 재배 인증과 HACCP 식품안전관리 인증을 통해 안전성을 확보했습니다. OCOP 베트남 정부 품질보증을 통해 품질을 공인받았습니다. 2025 아시아 10대 선도 브랜드로 선정된 것은 대라천 '참'침향의 노력을 인정받은 결과입니다.
            </td>
          </tr>
          <tr className="bg-white">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>안전성 시험:</strong> TSL 안전성 시험은 ISO/IEC 17025:2017 기준을 준수하며, 2023년 8월 24일 실시한 중금속 8종 시험에서 전부 불검출 판정을 받았습니다. 이러한 인증들은 대라천 '참'침향이 안전하고 신뢰할 수 있는 제품임을 증명합니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <img src="https://lh3.googleusercontent.com/d/1STuvVXJ2PO3otEAThOdRr803_IylcsQ2" alt="인증 이미지 1" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/163LBEIXLwxe06cJKYGCWjrk9IV82hO56" alt="인증 이미지 2" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1TzFiCV2UJZLe-c0LhBe05F5CV89zTTAp" alt="인증 이미지 3" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
    </div>
  </motion.div>
);

export const QualityContent = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 text-luxury-black">
    <h3 className="text-4xl font-noto-serif text-luxury-gold">검증된 품질</h3>
    <div className="overflow-hidden rounded-2xl border border-luxury-gold/20 shadow-xl">
      <table className="w-full text-left border-collapse bg-white">
        <tbody>
          <tr className="border-b border-luxury-gold/10">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>원료 및 품종:</strong> 대라천 '참'침향은 침수향(AQUILARIAE LIGNUM)을 원료로 합니다. <span className="text-luxury-gold font-bold">Aquilaria agallocha Roxburgh</span>(팥꽃나무과 Thymeleaceae) 품종을 사용하여 그 효능을 극대화했습니다.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10 bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>약전 규격 준수:</strong> 약전 규격에 따라 건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상을 엄격히 준수합니다. 등급양품은 흑갈색을 띠며 달고 쓴맛이 나고, 물에 가라앉는 특성을 가집니다.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10 bg-white">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>과학적 안전성:</strong> TSL 안전성 시험을 통해 ISO/IEC 17025:2017 기준으로 중금속 8종(납Pb, 카드뮴Cd, 수은Hg, 비소As, 구리Cu, 주석Sn, 안티몬Sb, 니켈Ni)이 전부 불검출되었음을 확인했습니다. 이는 과학으로 입증된 안전성을 의미합니다.
            </td>
          </tr>
          <tr className="bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>시간의 가치:</strong> 최소 26년의 시간이 만드는 한 방울의 가치는 대라천 '참'침향의 자부심입니다. 우리는 자연의 순수함을 지키면서도 과학적인 검증을 통해 최고의 품질을 유지합니다. 대라천 '참'침향은 고객의 건강을 위해 타협하지 않는 품질을 약속합니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <img src="https://lh3.googleusercontent.com/d/1dL0H-hlz-1jRVf2Xeo7i_aTNgS4KKmNC" alt="품질 이미지 1" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1xsS2UKdVLxSmboReYkcVnMinEduhHljU" alt="품질 이미지 2" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1FBMv0CfAVbBKqCEbcX2lDnRXG88WfMyT" alt="품질 이미지 3" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
    </div>
  </motion.div>
);

export const ProcessContent = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 text-luxury-black">
    <h3 className="text-4xl font-noto-serif text-luxury-gold">생산 공정</h3>
    <div className="overflow-hidden rounded-2xl border border-luxury-gold/20 shadow-xl">
      <table className="w-full text-left border-collapse bg-white">
        <tbody>
          <tr className="border-b border-luxury-gold/10">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>14단계 프리미엄 공정:</strong> 침향오일은 14단계의 엄격한 생산공정을 거쳐 탄생합니다. 1. 식목, 2. 수지앉힘(특허#12835 식용가능유도제), 3. 침향검사, 4. 침향수확, 5. 원목입고, 6. 세척(표피제거), 7. 절단(10-20cm), 8. 수지목분리, 9. 이물질제거, 10. 세척(3회), 11. 건조(자연광), 12. 분쇄(1-2mm), 13. 고온증류(72시간), 14. 수지채취후숙성검사출고.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10 bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>시간과 기술:</strong> 총 소요 시간은 최소 26년입니다. 각 단계는 침향의 순수함과 효능을 유지하기 위해 정교하게 설계되었습니다. 수지앉힘 단계에서 사용하는 특허받은 식용가능 유도제는 대라천 '참'침향만의 핵심 기술입니다.
            </td>
          </tr>
          <tr className="border-b border-luxury-gold/10 bg-white">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>증류 및 숙성:</strong> 고온증류 과정은 72시간 동안 지속되며, 이 과정에서 침향의 깊은 향과 성분이 추출됩니다. 이후 숙성 및 검사 과정을 거쳐 최종 제품으로 출고됩니다. 이러한 철저한 공정은 대라천 '참'침향이 왜 프리미엄인지를 보여줍니다.
            </td>
          </tr>
          <tr className="bg-luxury-gold/5">
            <td className="py-6 px-8 md:px-12 text-luxury-black/80 text-lg md:text-xl font-light leading-relaxed">
              <strong>자연과 과학의 조화:</strong> 우리는 자연의 시간을 존중하며, 그 시간을 제품에 담아냅니다. 26년의 기다림 끝에 얻은 침향오일은 고객에게 최고의 경험을 선사할 것입니다. 대라천 '참'침향의 생산 공정은 자연과 과학의 완벽한 조화입니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <img src="https://lh3.googleusercontent.com/d/1kqnSMCY3FdScIrhl5H4Mj8Zpq4eAAs2m" alt="공정 이미지 1" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1c9tWUB6n8SwZHBC0FI9TlX2s7USVoobO" alt="공정 이미지 2" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
      <img src="https://lh3.googleusercontent.com/d/1L4OSWD0R7hPRKdv3YeU7BEv24yDwiM3-" alt="공정 이미지 3" className="w-full h-64 object-cover rounded-lg" loading="lazy" />
    </div>
  </motion.div>
);
