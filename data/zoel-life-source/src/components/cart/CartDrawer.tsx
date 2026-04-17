import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-luxury-cream shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-luxury-gold/20 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-luxury-gold" size={24} />
                <h2 className="text-xl font-noto-serif font-bold text-luxury-black">장바구니 ({totalItems})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-luxury-cream rounded-full transition-colors text-luxury-black/60"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-luxury-gold/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-luxury-gold/40" size={40} />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-luxury-black">장바구니가 비어있습니다.</p>
                    <p className="text-sm text-luxury-black/60">ZOEL LIFE의 프리미엄 침향 제품을 담아보세요.</p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-pill"
                  >
                    쇼핑 계속하기
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-luxury-gold/10 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-luxury-black leading-tight">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-luxury-black/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-luxury-gold font-bold mt-1">₩{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-luxury-gold/20 rounded-lg bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 px-2 hover:text-luxury-gold transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 px-2 hover:text-luxury-gold transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-white border-t border-luxury-gold/20 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-luxury-black/60">총 합계</span>
                  <span className="text-2xl font-bold text-luxury-black">₩{totalPrice.toLocaleString()}</span>
                </div>
                <button className="w-full bg-luxury-black text-luxury-cream py-4 rounded-xl font-bold tracking-widest hover:bg-luxury-gold transition-all shadow-xl shadow-luxury-black/10">
                  주문하기
                </button>
                <p className="text-[10px] text-center text-luxury-black/40">
                  배송비는 주문 단계에서 계산됩니다.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
