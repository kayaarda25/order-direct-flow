import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { MenuItem, Modifier } from "@/hooks/useMenuItems";
import { computeItemPrice } from "@/lib/pricing";

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

const LS_ORDER_TYPE = "piratino-order-type";
const LS_ORDER_CHOSEN = "piratino-order-chosen";
export const LS_DELIVERY_PLZ = "piratino-delivery-plz";

const readStoredOrderType = (): "delivery" | "pickup" => {
  try {
    const v = localStorage.getItem(LS_ORDER_TYPE);
    return v === "pickup" || v === "delivery" ? v : "delivery";
  } catch {
    return "delivery";
  }
};

const readStoredChosen = (): boolean => {
  try {
    return localStorage.getItem(LS_ORDER_CHOSEN) === "1";
  } catch {
    return false;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawItems, setItems] = useState<CartItemType[]>([]);
  const [orderType, setOrderTypeState] = useState<"delivery" | "pickup">(readStoredOrderType);
  const [orderTypeChosen, setOrderTypeChosenState] = useState(readStoredChosen);
  const [freePizzasRedeemed, setFreePizzasRedeemed] = useState(0);

  const setOrderType = useCallback((type: "delivery" | "pickup") => {
    setOrderTypeState(type);
    try { localStorage.setItem(LS_ORDER_TYPE, type); } catch { /* ignore */ }
  }, []);

  const setOrderTypeChosen = useCallback((chosen: boolean) => {
    setOrderTypeChosenState(chosen);
    try { localStorage.setItem(LS_ORDER_CHOSEN, chosen ? "1" : "0"); } catch { /* ignore */ }
  }, []);

  // Prices always follow the currently selected order type (pickup vs delivery)
  const items = useMemo(
    () =>
      rawItems.map((item) => ({
        ...item,
        totalPrice: computeItemPrice(item.menuItem, item.selectedModifiers, orderType),
      })),
    [rawItems, orderType]
  );

  const deliveryFee = 0;

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

  const clearCart = useCallback(() => { setItems([]); setFreePizzasRedeemed(0); }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0) + deliveryFee;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, deliveryFee, orderType, setOrderType, orderTypeChosen, setOrderTypeChosen, freePizzasRedeemed, setFreePizzasRedeemed }}
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
