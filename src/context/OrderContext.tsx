import React, { createContext, useContext, useState } from "react";
import type { CartItemType } from "./CartContext";

export type OrderStatus = "received" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered";

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItemType[];
  customerName: string;
  phone: string;
  address: string;
  orderType: "delivery" | "pickup";
  paymentMethod: string;
  notes: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: Date;
  estimatedTime: number;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  placeOrder: (order: Omit<Order, "id" | "orderNumber" | "status" | "createdAt" | "estimatedTime">) => Order;
  getOrder: (id: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const placeOrder = (orderData: Omit<Order, "id" | "orderNumber" | "status" | "createdAt" | "estimatedTime">) => {
    const order: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      orderNumber: `DO-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: "received",
      createdAt: new Date(),
      estimatedTime: orderData.orderType === "delivery" ? 45 : 25,
    };
    setOrders((prev) => [...prev, order]);
    setCurrentOrder(order);
    return order;
  };

  const getOrder = (id: string) => orders.find((o) => o.id === id);

  return (
    <OrderContext.Provider value={{ orders, currentOrder, placeOrder, getOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within OrderProvider");
  return context;
};
