import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { renderImage } from "../utils/image";
import SEO from "../components/SEO";

const fallbackProducts: any[] = [
  { id: "1", name: "침향 연질캡슐", category: "침향", price: "판매 중", image: "" },
  { id: "2", name: "침향 오일", category: "침향", price: "준비 중", image: "" },
  { id: "3", name: "침향수", category: "침향", price: "준비 중", image: "" },
  { id: "4", name: "침향환", category: "침향", price: "준비 중", image: "" },
  { id: "5", name: "침향 비누", category: "침향", price: "준비 중", image: "" },
  { id: "6", name: "침향 스틱", category: "침향", price: "준비 중", image: "" },
  { id: "7", name: "침향 선물세트", category: "침향", price: "준비 중", image: "" },
];

const categories = ["전체"];

export default function Products() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, "products"), orderBy("order", "asc")));
        if (!snap.empty) {
          setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setProducts(fallbackProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts(fallbackProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const dynamicCategories = ["전체", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = activeCategory === "전체" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="bg-luxury-cream min-h-screen pb-24 font-noto-sans">
      <SEO 
        title="침향 제품 - 프리미엄 침향환·침향분말·침향오일 | ZOEL LIFE"
        description="ZOEL LIFE의 프리미엄 침향 제품. 베트남 직영 농장에서 재배한 최고급 침향으로 만든 다양한 제품."
        keywords="침향 제품, 침향환, 선향, 침향 오일, 프리미엄 침향, ZOEL LIFE 제품, 베트남 침향, 아가우드"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              "itemListElement": products.map((product, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": product.name,
                "url": `https://www.daracheon.com/products/${product.id}`
              }))
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "침향 제품", "item": "https://www.daracheon.com/products" }
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
            COLLECTION
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-noto-serif font-light mb-6 text-luxury-black"
          >
            ZOEL LIFE 침향 제품
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-luxury-black/60 font-light"
          >
            자연의 진실된 가치를 담은 프리미엄 라인업
          </motion.p>
        </div>
      </header>

      <main>
        {/* Filters */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16" aria-label="Product categories">
          <div className="flex flex-wrap justify-center gap-3">
            {dynamicCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as string)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat 
                    ? "bg-luxury-black text-luxury-cream" 
                    : "bg-white text-luxury-black/60 border border-luxury-gold/20 hover:border-luxury-gold hover:text-luxury-black"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20 text-gray-500">로딩 중...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, idx) => (
                <article
                  key={product.id}
                  className="glass-panel rounded-2xl overflow-hidden group hover:border-luxury-gold/50 transition-colors"
                >
                  <Link to={`/products/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-luxury-cream">
                      {renderImage(product.image, product.name, "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700")}
                      {product.isMain && (
                        <div className="absolute top-4 left-4 bg-luxury-gold text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider shadow-sm">
                          BEST
                        </div>
                      )}
                    </div>
                    <div className="p-6 bg-white">
                      <div className="text-xs text-luxury-gold mb-3 tracking-widest uppercase font-semibold">{product.category}</div>
                      <h3 className="text-xl font-noto-serif font-medium mb-3 group-hover:text-luxury-gold transition-colors text-luxury-black">{product.name}</h3>
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-luxury-gold/20">
                        <span className="text-luxury-black/60 font-light">{product.price}</span>
                        <span className="text-sm text-luxury-black group-hover:text-luxury-gold transition-colors font-medium flex items-center gap-1">
                          자세히 보기 <span className="text-lg leading-none">&rarr;</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-2xl border border-gray-100">
              <p className="text-xl text-gray-500 mb-2">등록된 제품이 없습니다.</p>
              <p className="text-sm text-gray-400">관리자 페이지에서 제품을 등록해주세요.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
