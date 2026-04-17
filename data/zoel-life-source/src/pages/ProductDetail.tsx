import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { renderImage } from "../utils/image";
import SEO from "../components/SEO";
import { useCart } from "../context/CartContext";
import { Plus, Minus } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("info");
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            id: docSnap.id,
            name: data.name,
            price: data.price,
            description: data.description || "상세 설명이 없습니다.",
            volume: "상세페이지 참조", // These could be added to the schema later
            usage: "상세페이지 참조",
            ingredients: "상세페이지 참조",
            images: [data.image], // Currently only one image is supported in schema
            category: data.category
          });
          setMainImage(data.image);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-luxury-cream">Loading...</div>;
  
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-luxury-cream text-xl">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="bg-luxury-cream min-h-screen text-luxury-black pt-24 pb-24 font-noto-sans">
      <SEO 
        title={`${product.name} - 프리미엄 침향 컬렉션 | ZOEL LIFE`}
        description={`${product.name}: ${product.description.substring(0, 120)}... ZOEL LIFE의 최고급 침향 제품을 만나보세요.`}
        keywords={`${product.name}, ${product.category}, 침향, ZOEL LIFE, 베트남 침향, 아가우드, 천연 침향`}
        ogImage={mainImage}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              "name": product.name,
              "image": mainImage,
              "description": product.description,
              "brand": {
                "@type": "Brand",
                "name": "ZOEL LIFE"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "KRW",
                "price": product.price.replace(/[^0-9]/g, ''),
                "availability": "https://schema.org/InStock"
              }
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "침향 제품", "item": "https://www.daracheon.com/products" },
                { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://www.daracheon.com/products/${id}` }
              ]
            }
          ]
        }}
      />
      {/* Breadcrumb */}
      <nav className="py-4 px-6 lg:px-12 border-b border-luxury-gold/20 bg-white" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto text-xs tracking-widest uppercase text-luxury-black/60">
          <Link to="/" className="hover:text-luxury-gold transition-colors">HOME</Link>
          <span className="mx-3">/</span>
          <Link to="/products" className="hover:text-luxury-gold transition-colors">PRODUCTS</Link>
          <span className="mx-3">/</span>
          <span className="text-luxury-black font-medium">{product.name}</span>
        </div>
      </nav>

      <main>
        {/* Product Top Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Images */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-white mb-6 border border-luxury-gold/20 relative group shadow-sm">
                {renderImage(mainImage, product.name, "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110")}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                  {product.images.map((img: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setMainImage(img)}
                      className={`aspect-square rounded-xl overflow-hidden border transition-all duration-300 group ${mainImage === img ? 'border-luxury-gold opacity-100 shadow-md' : 'border-luxury-gold/20 opacity-70 hover:opacity-100'}`}
                    >
                      {renderImage(img, `Thumbnail ${idx}`, "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500")}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Info */}
            <article 
              className="flex flex-col justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="mb-8">
                  <h2 className="text-micro mb-4 uppercase">{product.category}</h2>
                  <h1 className="text-4xl md:text-5xl font-noto-serif font-light text-luxury-black mb-6 leading-tight">{product.name}</h1>
                  <p className="text-luxury-black/60 text-lg font-light leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
                
                <div className="text-3xl font-noto-serif text-luxury-black mb-10 pb-10 border-b border-luxury-gold/20">
                  {product.price}
                </div>

                <div className="space-y-6 mb-12">
                  <div className="flex items-center">
                    <span className="w-32 text-xs tracking-widest uppercase text-luxury-black/60 font-medium">CAPACITY</span>
                    <span className="text-luxury-black font-light">{product.volume}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-xs tracking-widest uppercase text-luxury-black/60 font-medium">USAGE</span>
                    <span className="text-luxury-black font-light">{product.usage}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-luxury-gold/20 rounded-full bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:text-luxury-gold transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(99, quantity + 1))}
                      className="p-3 hover:text-luxury-gold transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={() => addToCart(product, quantity)}
                    className="flex-1 bg-luxury-gold text-white py-4 rounded-full font-medium tracking-widest uppercase text-sm hover:bg-luxury-gold/90 transition-colors duration-300 shadow-md"
                  >
                    장바구니 담기
                  </button>
                  <Link 
                    to="/payment"
                    className="flex-1 bg-luxury-black text-luxury-cream py-4 rounded-full font-medium tracking-widest uppercase text-sm hover:bg-luxury-gold transition-colors duration-300 shadow-md text-center"
                  >
                    구매하기
                  </Link>
                </div>

                <div className="mt-auto space-y-4">
                  <button className="w-full bg-luxury-black text-luxury-cream py-4 rounded-full font-medium tracking-widest uppercase text-sm hover:bg-luxury-gold transition-colors duration-300 shadow-md">
                    PURCHASE INQUIRY
                  </button>
                  <button className="w-full bg-white border border-luxury-gold/20 text-luxury-black py-4 rounded-full font-medium tracking-widest uppercase text-sm hover:border-luxury-gold transition-colors duration-300 flex items-center justify-center shadow-sm">
                    KAKAO TALK INQUIRY
                  </button>
                </div>
              </motion.div>
            </article>
          </div>
        </section>


        {/* Product Details Tabs */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-24">
          <div className="border-b border-luxury-gold/20">
            <nav className="flex space-x-12 overflow-x-auto pb-px no-scrollbar" aria-label="Product details tabs">
              {['상세정보', '성분/원료', '사용법', '배송/교환'].map((tab, idx) => {
                const tabKeys = ['info', 'ingredients', 'usage', 'shipping'];
                const key = tabKeys[idx];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`py-4 border-b-2 text-sm tracking-widest uppercase transition-colors whitespace-nowrap font-medium ${
                      activeTab === key
                        ? 'border-luxury-gold text-luxury-gold'
                        : 'border-transparent text-luxury-black/60 hover:text-luxury-black'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="py-16 min-h-[400px]">
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-16">
                <div className="text-center max-w-3xl mx-auto">
                  <h3 className="text-3xl font-noto-serif font-light text-luxury-black mb-6 leading-tight">219,000시간,<br/>자연의 진실된 가치를 구현하기 위한 노력</h3>
                  <p className="text-luxury-black/60 font-light leading-relaxed text-lg">
                    베트남 유일 <span className="text-luxury-gold">Aquilaria Agallocha Roxburgh</span> 학명인증을 받은 유기농 식용 침향입니다. 
                    금보다 비싸고 산삼보다 귀한 진정한 침향의 비밀을 ZOEL LIFE에서 만나보세요.
                  </p>
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-6">
                  {['CITES 인증', 'Organic 인증', 'HACCP 인증', 'TSL 안전성 검사 통과'].map(badge => (
                    <div key={badge} className="px-8 py-4 glass-panel-light rounded-full text-luxury-black font-medium text-sm tracking-wider">
                      {badge}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'ingredients' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto">
                <h3 className="text-micro mb-6">INGREDIENTS</h3>
                <div className="glass-panel-dark p-8 rounded-2xl">
                  <p className="text-luxury-black font-light leading-relaxed">
                    {product.ingredients}
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'usage' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto">
                <h3 className="text-micro mb-6">HOW TO USE</h3>
                <div className="glass-panel-dark p-8 rounded-2xl">
                  <ul className="list-none text-luxury-black font-light space-y-4">
                    <li className="flex items-start">
                      <span className="text-luxury-gold mr-3">•</span>
                      <span>{product.usage}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-luxury-gold mr-3">•</span>
                      <span>직사광선을 피하고 서늘한 곳에 보관하십시오.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-luxury-gold mr-3">•</span>
                      <span>특이체질, 알레르기 체질의 경우 성분을 확인하신 후 섭취하십시오.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto">
                <h3 className="text-micro mb-6">SHIPPING & RETURNS</h3>
                <div className="glass-panel-dark p-8 rounded-2xl space-y-6">
                  <div>
                    <h4 className="text-luxury-black font-medium mb-2 text-sm tracking-widest uppercase">배송 안내</h4>
                    <p className="text-luxury-black/60 font-light">결제 완료 후 2~3 영업일 이내 발송됩니다. (주말/공휴일 제외)</p>
                  </div>
                  <div className="h-px bg-luxury-gold/20 w-full"></div>
                  <div>
                    <h4 className="text-luxury-black font-medium mb-2 text-sm tracking-widest uppercase">교환/반품</h4>
                    <p className="text-luxury-black/60 font-light">상품 수령 후 7일 이내 고객센터를 통해 접수 가능합니다. (단, 개봉 후에는 교환/반품이 불가합니다.)</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
