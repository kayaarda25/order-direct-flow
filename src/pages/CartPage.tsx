import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";

const CartPage = () => {
  const { items, removeItem, updateQuantity, totalPrice, deliveryFee, orderType, setOrderType } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Dein Warenkorb ist leer</h2>
        <p className="text-muted-foreground mb-6">Füge leckere Gerichte aus unserem Menü hinzu!</p>
        <Link
          to="/menu"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Zum Menü
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <Link to="/menu" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Weiter bestellen
      </Link>

      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Warenkorb</h1>

      <div className="flex gap-2 mb-6">
        {(["delivery", "pickup"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              orderType === type
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {type === "delivery" ? "🚗 Lieferung" : "🏪 Abholung"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            className="bg-card border border-border rounded-xl p-4 flex gap-4"
          >
            <img
              src={item.menuItem.image}
              alt={item.menuItem.name}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-card-foreground truncate">{item.menuItem.name}</h3>
              {Object.values(item.selectedModifiers).flat().length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Object.values(item.selectedModifiers).flat().map((m) => m.name).join(", ")}
                </p>
              )}
              {item.specialNotes && (
                <p className="text-xs text-muted-foreground italic mt-0.5">"{item.specialNotes}"</p>
              )}
              <p className="text-primary font-bold mt-1">CHF {(item.totalPrice * item.quantity).toFixed(2)}</p>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold text-card-foreground w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mt-6 space-y-3">
        <div className="flex justify-between text-muted-foreground">
          <span>Zwischensumme</span>
          <span>CHF {(totalPrice - deliveryFee).toFixed(2)}</span>
        </div>
        {orderType === "delivery" && (
          <div className="flex justify-between text-muted-foreground">
            <span>Liefergebühr</span>
            <span>CHF {deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-foreground font-bold text-lg pt-3 border-t border-border">
          <span>Total</span>
          <span>CHF {totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <Link
        to="/checkout"
        className="block w-full bg-primary text-primary-foreground text-center py-4 rounded-xl font-semibold text-lg mt-6 hover:opacity-90 transition-opacity"
      >
        Zur Kasse — CHF {totalPrice.toFixed(2)}
      </Link>
    </div>
  );
};

export default CartPage;
