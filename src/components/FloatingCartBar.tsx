import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import OrderTypeModal from "@/components/OrderTypeModal";

const FloatingCartBar = () => {
  const { totalItems, totalPrice, setOrderType } = useCart();
  const navigate = useNavigate();
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4"
      >
        <div className="container max-w-2xl">
          <button
            onClick={() => setShowOrderTypeModal(true)}
            className="flex items-center justify-between w-full bg-primary text-primary-foreground rounded-xl px-5 py-3.5 shadow-2xl hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-primary-foreground text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <span className="font-semibold">Bestellen</span>
            </div>
            <span className="font-bold text-lg">
              CHF {totalPrice.toFixed(2)}
            </span>
          </button>
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
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingCartBar;
