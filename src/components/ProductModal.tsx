import { useState, useEffect, useCallback } from "react";
import { X, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MenuItem, Modifier } from "@/hooks/useMenuItems";
import { useCart, type CartItemType } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAdded?: () => void;
}

const ProductModal = ({ item, onClose, onAdded }: ProductModalProps) => {
  const { addItem, orderType } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState("");

  const getDefaultModifiers = useCallback(() => {
    if (!item) return {};
    const defaults: Record<string, Modifier[]> = {};
    item.modifierGroups.forEach((group) => {
      if (group.required && !group.multiSelect && group.options.length > 0) {
        defaults[group.id] = [group.options[0]];
      }
    });
    return defaults;
  }, [item]);

  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});

  useEffect(() => {
    setSelectedModifiers(getDefaultModifiers());
    setQuantity(1);
    setSpecialNotes("");
  }, [item?.id, getDefaultModifiers]);

  if (!item) return null;

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

  // Use pickup or delivery price if available
  const basePrice = orderType === "pickup" && item.pickupPrice != null
    ? item.pickupPrice
    : orderType === "delivery" && item.deliveryPrice != null
      ? item.deliveryPrice
      : item.price;

  const totalPrice = basePrice + modifierPrice;

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
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white w-full md:w-[500px] md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <img src={item.image} alt={item.name} className="w-full aspect-video object-cover" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-neutral-900" />
            </button>
          </div>

          <div className="p-5">
            <h2 className="font-display text-2xl font-bold text-neutral-900">{item.name}</h2>
            <p className="text-neutral-500 mt-1">{item.description}</p>
            <p className="text-neutral-900 font-bold text-xl mt-2">CHF {item.price.toFixed(2)}</p>

            {item.modifierGroups.map((group) => (
              <div key={group.id} className="mt-5">
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {group.name}
                  {group.required && <span className="text-red-500 text-sm ml-1">*</span>}
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
                            ? "border-neutral-900 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        <span className="text-neutral-900 font-medium">{option.name}</span>
                        <span className="text-neutral-500 text-sm">
                          {option.price > 0 ? `+CHF ${option.price.toFixed(2)}` : "Inkl."}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-5">
              <h3 className="font-semibold text-neutral-900 mb-2">Bemerkungen</h3>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="z.B. ohne Zwiebeln, extra scharf..."
                className="w-full p-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-neutral-900 w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
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
