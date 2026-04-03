import React, { createContext, useContext, useState, useCallback } from "react";
import type { MenuItem, Modifier } from "@/hooks/useMenuItems";

export interface CartItemType {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: Record<string, Modifier[]>;
  specialNotes: string;
  totalPrice: number;
}

interface CartContextType {
  items: CartItemType[];
  addItem: (item: CartItemType) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  deliveryFee: number;
  orderType: "delivery" | "pickup";
  setOrderType: (type: "delivery" | "pickup") => void;
  orderTypeChosen: boolean;
  setOrderTypeChosen: (chosen: boolean) => void;
  freePizzasRedeemed: number;
  setFreePizzasRedeemed: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [orderTypeChosen, setOrderTypeChosen] = useState(false);
  const [freePizzaApplied, setFreePizzaApplied] = useState(false);

  const deliveryFee = orderType === "delivery" ? 5 : 0;

  const addItem = useCallback((item: CartItemType) => {
    setItems((prev) => [...prev, { ...item, id: `${item.menuItem.id}-${Date.now()}` }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => { setItems([]); setFreePizzaApplied(false); }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0) + deliveryFee;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, deliveryFee, orderType, setOrderType, orderTypeChosen, setOrderTypeChosen, freePizzaApplied, setFreePizzaApplied }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
