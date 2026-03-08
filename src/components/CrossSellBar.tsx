import { motion } from "framer-motion";
import { X, Plus, Check } from "lucide-react";
import { useState } from "react";
import type { MenuItem } from "@/data/menu";
import { menuItems, crossSellMap } from "@/data/menu";
import { useCart, type CartItemType } from "@/context/CartContext";

interface CrossSellBarProps {
  triggerCategory: string;
  onSelect: (item: MenuItem) => void;
  onDismiss: () => void;
}

const CrossSellBar = ({ triggerCategory, onDismiss }: CrossSellBarProps) => {
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const suggestedCategories = crossSellMap[triggerCategory] || [];
  const suggestions = menuItems
    .filter(
      (item) =>
        suggestedCategories.includes(item.category) &&
        (item.bestseller || item.popular)
    )
    .slice(0, 5);

  if (suggestions.length === 0) return null;

  const handleQuickAdd = (item: MenuItem) => {
    const cartItem: CartItemType = {
      id: "",
      menuItem: item,
      quantity: 1,
      selectedModifiers: {},
      specialNotes: "",
      totalPrice: item.price,
    };
    addItem(cartItem);
    setAddedIds((prev) => new Set(prev).add(item.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-accent/30 backdrop-blur-sm border-b border-border"
    >
      <div className="container py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">
            ✨ Dazu passt perfekt:
          </p>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {suggestions.map((item) => {
            const isAdded = addedIds.has(item.id);
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => !isAdded && handleQuickAdd(item)}
                className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3 py-2 shrink-0 hover:border-primary/50 transition-colors"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 rounded-md object-cover"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-card-foreground leading-tight">{item.name}</p>
                  <p className="text-xs text-primary font-bold">+CHF {item.price.toFixed(2)}</p>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isAdded ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
                }`}>
                  {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default CrossSellBar;
