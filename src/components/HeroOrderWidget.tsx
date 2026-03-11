import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

const HeroOrderWidget = () => {
  const navigate = useNavigate();
  const { setOrderType, setOrderTypeChosen } = useCart();
  const [selected, setSelected] = useState<"delivery" | "pickup" | null>(null);

  const handleOrder = () => {
    if (!selected) return;
    setOrderType(selected);
    if (selected === "pickup") {
      setOrderTypeChosen(true);
    }
    // For delivery, the MenuPage will show the PLZ modal
    navigate("/menu");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl p-6 md:p-8 shadow-lg max-w-xs w-full space-y-5"
    >
      {/* Delivery / Pickup toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => setSelected("delivery")}
          className={cn(
            "flex-1 py-3 rounded-lg border-2 font-bold text-sm uppercase tracking-wider transition-all",
            selected === "delivery"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
          )}
        >
          liefern
        </button>
        <button
          onClick={() => setSelected("pickup")}
          className={cn(
            "flex-1 py-3 rounded-lg border-2 font-bold text-sm uppercase tracking-wider transition-all",
            selected === "pickup"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
          )}
        >
          abholen
        </button>
      </div>

      {/* Order button */}
      <button
        onClick={handleOrder}
        disabled={!selected}
        className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-bold text-lg uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        bestellen
      </button>
    </motion.div>
  );
};

export default HeroOrderWidget;
