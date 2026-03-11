import { Plus, Check, Flame, TrendingUp, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { MenuItem, Modifier } from "@/hooks/useMenuItems";
import { useCart, type CartItemType } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onQuickAdded?: () => void;
}

const ProductCard = ({ item, onAdd, onQuickAdded }: ProductCardProps) => {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const sizeGroup = item.modifierGroups.find((g) => g.id === "groesse");
  const extraToppingsGroup = item.modifierGroups.find((g) => g.id === "extras");
  const [selectedSize, setSelectedSize] = useState<Modifier | null>(
    sizeGroup?.options[0] || null
  );

  const currentPrice = item.price + (selectedSize?.price || 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const modifiers: Record<string, Modifier[]> = {};
    if (sizeGroup && selectedSize) {
      modifiers[sizeGroup.id] = [selectedSize];
    }

    const hasOtherRequired = item.modifierGroups.some(
      (g) => g.id !== "groesse" && g.id !== "extras" && g.required
    );
    if (hasOtherRequired) {
      onAdd(item);
      return;
    }

    const cartItem: CartItemType = {
      id: "",
      menuItem: item,
      quantity: 1,
      selectedModifiers: modifiers,
      specialNotes: "",
      totalPrice: currentPrice,
    };
    addItem(cartItem);
    setJustAdded(true);
    onQuickAdded?.();
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleRefine = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-neutral-100"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={() => onAdd(item)}
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.bestseller && (
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3" /> Bestseller
            </span>
          )}
          {item.popular && !item.bestseller && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <TrendingUp className="w-3 h-3" /> Beliebt
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="font-display font-semibold text-neutral-900 text-base leading-tight">{item.name}</h3>
        <p className="text-neutral-500 text-sm mt-1 line-clamp-2">{item.description}</p>

        {extraToppingsGroup && (
          <button
            onClick={handleRefine}
            className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            Pizza verfeinern <Settings2 className="w-4 h-4" />
          </button>
        )}

        {sizeGroup && sizeGroup.options.length > 1 && (
          <div className="flex border border-neutral-200 rounded-lg overflow-hidden mt-3">
            {sizeGroup.options.map((opt) => (
              <button
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSize(opt);
                }}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold transition-all text-center",
                  selectedSize?.id === opt.id
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {opt.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-neutral-900 font-bold text-base">
            CHF {currentPrice.toFixed(2)}
          </span>
          <button
            onClick={handleQuickAdd}
            className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Plus className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
