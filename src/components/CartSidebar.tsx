import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Truck, Store, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import OrderTypeModal from "@/components/OrderTypeModal";

const CartSidebar = () => {
  const { items, removeItem, updateQuantity, totalPrice, deliveryFee, orderType, setOrderType } = useCart();
  const navigate = useNavigate();
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);

  const handleCheckout = () => {
    if (items.length === 0) return;
    setShowOrderTypeModal(true);
  };

  return (
    <>
      <div className="sticky top-36 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-200">
          <h2 className="font-display text-xl font-bold text-neutral-900">Warenkorb</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
            {orderType === "delivery" ? (
              <><Truck className="w-4 h-4" /> Liefern</>
            ) : (
              <><Store className="w-4 h-4" /> Abholen</>
            )}
          </div>
        </div>

        <div className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">Keine Artikel im Warenkorb</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pb-4 border-b border-neutral-100 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-neutral-900">{item.menuItem.name}</h4>
                          {Object.values(item.selectedModifiers).flat().length > 0 && (
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {Object.values(item.selectedModifiers).flat().map((m) => m.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">
                          CHF {(item.totalPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-600 flex items-center justify-center hover:bg-neutral-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold text-neutral-900 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-600 flex items-center justify-center hover:bg-neutral-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

              <button
                onClick={handleCheckout}
                className="block w-full bg-neutral-900 text-white text-center py-3 rounded-xl font-semibold mt-4 hover:bg-neutral-800 transition-colors"
              >
                Bestellen
              </button>
            </>
          )}
        </div>
      </div>

      <OrderTypeModal
        open={showOrderTypeModal}
        onClose={() => setShowOrderTypeModal(false)}
        onConfirm={(type) => {
          setOrderType(type);
          setShowOrderTypeModal(false);
          navigate("/checkout");
        }}
      />
    </>
  );
};

export default CartSidebar;
