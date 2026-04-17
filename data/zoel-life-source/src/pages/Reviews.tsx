import { motion } from "motion/react";
import SEO from "../components/SEO";

export default function Reviews() {
  const reviews = [
    { id: 1, name: "김*진", product: "침향 오일 캡슐", rating: 5, date: "2025.10.15", content: "아침마다 피곤했는데 침향 캡슐을 먹고 나서부터 하루가 활기찹니다. 귀한 성분이라 믿고 먹고 있어요." },
    { id: 2, name: "이*훈", product: "침향단 (환)", rating: 5, date: "2025.09.28", content: "부모님 선물로 드렸는데 너무 좋아하십니다. 향이 깊고 진해서 진짜 침향이라는 걸 알 수 있었습니다." },
    { id: 3, name: "박*영", product: "침향 선향", rating: 5, date: "2025.09.10", content: "명상할 때 피우는데 향이 마음을 차분하게 해줍니다. 인공적인 향이 아니라 자연 그대로의 향이라 너무 좋습니다." },
    { id: 4, name: "최*민", product: "침향수", rating: 4, date: "2025.08.22", content: "매일 아침 공복에 마시고 있습니다. 몸이 따뜻해지는 느낌이 들고 소화도 잘 되는 것 같아요." },
    { id: 5, name: "정*수", product: "침향 오일 캡슐", rating: 5, date: "2025.08.05", content: "베트남 여행 갔을 때 알게 된 브랜드인데 한국에서도 살 수 있어서 너무 좋네요. 품질은 역시 최고입니다." },
    { id: 6, name: "강*희", product: "침향차", rating: 5, date: "2025.07.18", content: "손님 오셨을 때 대접하기 좋습니다. 다들 향이 너무 좋다고 어디서 샀냐고 물어보시네요." },
  ];

  return (
    <div className="bg-luxury-cream min-h-screen pb-24 font-noto-sans">
      <SEO 
        title="고객 리뷰 - ZOEL LIFE 침향 후기 | ZOEL LIFE"
        description="ZOEL LIFE 프리미엄 침향을 직접 경험하신 고객님들의 생생한 후기와 평가를 확인하세요. 베트남 최고급 침향의 진정한 가치를 고객님들의 목소리로 전해드립니다."
        keywords="ZOEL LIFE 후기, 침향 리뷰, 침향환 후기, ZOEL LIFE 고객 리뷰, 침향 효능 후기, 베트남 침향 후기"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              "itemListElement": reviews.map((review, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": `${review.name}님의 후기`,
                "url": `https://www.daracheon.com/reviews#review-${review.id}`
              }))
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "고객 후기", "item": "https://www.daracheon.com/reviews" }
              ]
            }
          ]
        }}
      />
      {/* Header */}
      <header className="pt-32 pb-16 px-4 bg-white border-b border-luxury-gold/20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-micro mb-4"
          >
            TESTIMONIALS
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-noto-serif font-light mb-6 text-luxury-black"
          >
            고객 후기
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-luxury-black/60 font-light"
          >
            ZOEL LIFE 침향을 경험하신 고객님들의 소중한 이야기
          </motion.p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <motion.article 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-panel-dark p-8 rounded-2xl hover:border-luxury-gold/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-noto-serif text-lg text-luxury-black font-medium mb-1">{review.name}</h3>
                  <time className="text-xs text-luxury-black/60" dateTime={review.date.replace(/\./g, '-')}>{review.date}</time>
                </div>
                <div className="flex text-luxury-gold" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-luxury-gold/30 fill-current'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="text-xs text-luxury-gold mb-4 tracking-widest uppercase font-semibold">{review.product}</div>
              <p className="text-luxury-black/60 font-light leading-relaxed text-sm">"{review.content}"</p>
            </motion.article>
          ))}
        </section>
        
        <div className="mt-16 text-center">
          <button className="btn-pill">더 많은 후기 보기</button>
        </div>
      </main>
    </div>
  );
}
