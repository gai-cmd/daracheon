import { motion } from "motion/react";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();

  return (
    <div className="bg-luxury-cream min-h-screen pt-32 pb-24 font-noto-sans text-luxury-black">
      <SEO 
        title="장바구니 - ZOEL LIFE 프리미엄 침향"
        description="선택하신 ZOEL LIFE의 프리미엄 침향 제품들을 확인하고 주문하세요."
      />

      <main className="max-w-7xl mx-auto px-6 lg:px-12">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-micro mb-4 text-luxury-gold tracking-[0.3em] uppercase font-bold"
          >
            SHOPPING CART
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-noto-serif font-light"
          >
            장바구니
          </motion.h1>
          <div className="w-16 h-px bg-luxury-gold mx-auto mt-6" />
        </header>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-16 text-center shadow-xl shadow-luxury-black/5 border border-luxury-gold/10"
          >
            <div className="w-24 h-24 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingCart className="text-luxury-gold/40" size={48} />
            </div>
            <h2 className="text-2xl font-noto-serif font-bold mb-4">장바구니가 비어있습니다.</h2>
            <p className="text-luxury-black/60 mb-10 max-w-md mx-auto">
              아직 장바구니에 담긴 상품이 없습니다.<br />
              ZOEL LIFE의 엄선된 프리미엄 침향 제품들을 만나보세요.
            </p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-luxury-black text-luxury-cream px-10 py-4 rounded-full font-bold tracking-widest hover:bg-luxury-gold transition-all shadow-lg">
              제품 보러가기 <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center mb-4 px-4">
                <span className="text-sm font-medium text-luxury-black/60">상품 정보</span>
                <button 
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={14} /> 장바구니 비우기
                </button>
              </div>

              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row gap-6 shadow-md border border-luxury-gold/5 group"
                >
                  <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-luxury-cream flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-noto-serif font-bold text-luxury-black mb-1">{item.name}</h3>
                        <p className="text-luxury-gold font-bold">₩{item.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-luxury-black/20 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center border border-luxury-gold/20 rounded-xl bg-luxury-cream/50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 px-4 hover:text-luxury-gold transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 px-4 hover:text-luxury-gold transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-luxury-black/40 uppercase tracking-widest mb-1">Subtotal</p>
                        <p className="text-xl font-bold text-luxury-black">₩{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-luxury-gold/10 sticky top-32">
                <h2 className="text-2xl font-noto-serif font-bold text-luxury-black mb-8">주문 요약</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-luxury-black/60">
                    <span>총 상품 수</span>
                    <span>{totalItems}개</span>
                  </div>
                  <div className="flex justify-between text-luxury-black/60">
                    <span>상품 금액</span>
                    <span>₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-luxury-black/60">
                    <span>배송비</span>
                    <span>무료</span>
                  </div>
                  <div className="pt-4 border-t border-luxury-gold/10 flex justify-between items-center">
                    <span className="text-lg font-bold">총 결제 금액</span>
                    <span className="text-3xl font-bold text-luxury-gold">₩{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <button className="w-full bg-luxury-black text-luxury-cream py-5 rounded-2xl font-bold tracking-[0.2em] uppercase hover:bg-luxury-gold transition-all shadow-xl shadow-luxury-black/10 flex items-center justify-center gap-3 group">
                  주문하기 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-luxury-black/60">
                    <div className="w-8 h-8 rounded-full bg-luxury-cream flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={14} className="text-luxury-gold" />
                    </div>
                    <span>안전한 결제 시스템을 지원합니다.</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-luxury-black/60">
                    <div className="w-8 h-8 rounded-full bg-luxury-cream flex items-center justify-center flex-shrink-0">
                      <ArrowRight size={14} className="text-luxury-gold" />
                    </div>
                    <span>무료 배송 혜택이 적용되었습니다.</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
