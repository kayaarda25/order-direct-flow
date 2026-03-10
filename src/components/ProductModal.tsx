import { useState, useMemo } from "react";
import { X, Minus, Plus, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MenuItem, Modifier } from "@/data/menu";
import { useCart, type CartItemType } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAdded?: () => void;
}

const ProductModal = ({ item, onClose, onAdded }: ProductModalProps) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});
  const [specialNotes, setSpecialNotes] = useState("");

  if (!item) return null;

  // Auto-select first option of required single-select modifier groups (like size)
  const getDefaultModifiers = () => {
    if (!item) return {};
    const defaults: Record<string, Modifier[]> = {};
    item.modifierGroups.forEach((group) => {
      if (group.required && !group.multiSelect && group.options.length > 0) {
        defaults[group.id] = [group.options[0]];
      }
    });
    return defaults;
  };

  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>(getDefaultModifiers);

  // Reset defaults when item changes
  useEffect(() => {
    setSelectedModifiers(getDefaultModifiers());
    setQuantity(1);
    setSpecialNotes("");
  }, [item?.id]);

  const handleModifierToggle = (groupId: string, modifier: Modifier, multiSelect: boolean) => {
    setSelectedModifiers((prev) => {
      if (multiSelect) {
        const current = prev[groupId] || [];
        const exists = current.find((m) => m.id === modifier.id);
        return {
          ...prev,
          [groupId]: exists ? current.filter((m) => m.id !== modifier.id) : [...current, modifier],
        };
      }
      return { ...prev, [groupId]: [modifier] };
    });
  };

  const modifierPrice = Object.values(selectedModifiers)
    .flat()
    .reduce((sum, m) => sum + m.price, 0);

  const totalPrice = item.price + modifierPrice;

  const handleAdd = () => {
    const cartItem: CartItemType = {
      id: "",
      menuItem: item,
      quantity,
      selectedModifiers,
      specialNotes,
      totalPrice,
    };
    addItem(cartItem);
    onAdded?.();
    onClose();
    setQuantity(1);
    setSelectedModifiers({});
    setSpecialNotes("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card w-full md:w-[500px] md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <img src={item.image} alt={item.name} className="w-full aspect-video object-cover" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 bg-card/90 backdrop-blur rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-card-foreground" />
            </button>
          </div>

          <div className="p-5">
            <h2 className="font-display text-2xl font-bold text-card-foreground">{item.name}</h2>
            <p className="text-muted-foreground mt-1">{item.description}</p>
            <p className="text-primary font-bold text-xl mt-2">CHF {item.price.toFixed(2)}</p>


            {item.modifierGroups.map((group) => (
              <div key={group.id} className="mt-5">
                <h3 className="font-semibold text-card-foreground mb-2">
                  {group.name}
                  {group.required && <span className="text-primary text-sm ml-1">*</span>}
                </h3>
                <div className="flex flex-col gap-2">
                  {group.options.map((option) => {
                    const isSelected = (selectedModifiers[group.id] || []).some(
                      (m) => m.id === option.id
                    );
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleModifierToggle(group.id, option, group.multiSelect)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <span className="text-card-foreground font-medium">{option.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {option.price > 0 ? `+CHF ${option.price.toFixed(2)}` : "Inkl."}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-5">
              <h3 className="font-semibold text-card-foreground mb-2">Bemerkungen</h3>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="z.B. ohne Zwiebeln, extra scharf..."
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-card-foreground w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                CHF {(totalPrice * quantity).toFixed(2)} — Hinzufügen
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;
