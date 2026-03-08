import { Plus, Check, Flame, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { MenuItem } from "@/data/menu";
import { canQuickAdd } from "@/data/menu";
import { useCart, type CartItemType } from "@/context/CartContext";

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onQuickAdded?: () => void;
}

const ProductCard = ({ item, onAdd, onQuickAdded }: ProductCardProps) => {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const isQuickAdd = canQuickAdd(item);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isQuickAdd) {
      onAdd(item);
      return;
    }

    const cartItem: CartItemType = {
      id: "",
      menuItem: item,
      quantity: 1,
      selectedModifiers: {},
      specialNotes: "",
      totalPrice: item.price,
    };
    addItem(cartItem);
    setJustAdded(true);
    onQuickAdded?.();
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
      onClick={() => onAdd(item)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.bestseller && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3" /> Bestseller
            </span>
          )}
          {item.popular && !item.bestseller && (
            <span className="bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <TrendingUp className="w-3 h-3" /> Beliebt
            </span>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleQuickAdd}
          className="absolute bottom-3 right-3 w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
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

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-card-foreground text-base leading-tight">{item.name}</h3>
          <span className="text-primary font-bold text-base whitespace-nowrap">CHF {item.price.toFixed(2)}</span>
        </div>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{item.description}</p>
        {item.modifierGroups.length > 0 && (
          <p className="text-xs text-muted-foreground/70 mt-1">Anpassbar</p>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
