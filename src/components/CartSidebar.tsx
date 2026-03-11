import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

const CartSidebar = () => {
  const { items, removeItem, updateQuantity, totalPrice, deliveryFee, orderType, setOrderType } = useCart();

  return (
    <div className="sticky top-36 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-neutral-200">
        <h2 className="font-display text-xl font-bold text-neutral-900">Warenkorb</h2>
      </div>

      <div className="p-4">
        {/* Order type toggle */}
        <div className="flex gap-2 mb-4">
          {(["delivery", "pickup"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                orderType === type
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {type === "delivery" ? "🚗 Liefern" : "🏪 Abholen"}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Keine Artikel im Warenkorb</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-3 pb-3 border-b border-neutral-100 last:border-0"
                  >
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-900 truncate">{item.menuItem.name}</h4>
                      {Object.values(item.selectedModifiers).flat().length > 0 && (
                        <p className="text-xs text-neutral-500 truncate">
                          {Object.values(item.selectedModifiers).flat().map((m) => m.name).join(", ")}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center hover:bg-neutral-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-neutral-900 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center hover:bg-neutral-200"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">
                            CHF {(item.totalPrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-3 border-t border-neutral-200 space-y-2">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Zwischensumme</span>
                <span>CHF {(totalPrice - deliveryFee).toFixed(2)}</span>
              </div>
              {orderType === "delivery" && (
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Liefergebühr</span>
                  <span>CHF {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span>CHF {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-neutral-900 text-white text-center py-3 rounded-xl font-semibold mt-4 hover:bg-neutral-800 transition-colors"
            >
              Bestellen
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
