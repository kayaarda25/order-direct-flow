import { useParams, Link } from "react-router-dom";
import { useOrder } from "@/context/OrderContext";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Package } from "lucide-react";

const statusLabels: Record<string, { label: string; color: string }> = {
  received: { label: "Empfangen", color: "bg-accent" },
  accepted: { label: "Akzeptiert", color: "bg-success" },
  preparing: { label: "In Zubereitung", color: "bg-warm" },
  ready: { label: "Bereit", color: "bg-success" },
  out_for_delivery: { label: "Unterwegs", color: "bg-primary" },
  delivered: { label: "Geliefert", color: "bg-success" },
};

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const { getOrder, currentOrder } = useOrder();
  const order = id ? getOrder(id) : currentOrder;

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Bestellung nicht gefunden</h2>
        <Link to="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold mt-4 hover:opacity-90 transition-opacity">
          Zur Startseite
        </Link>
      </div>
    );
  }

  const status = statusLabels[order.status];

  return (
    <div className="container py-8 max-w-lg">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Bestellung bestätigt!</h1>
        <p className="text-muted-foreground mt-2">Vielen Dank, {order.customerName}!</p>
      </motion.div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Bestellnummer</span>
          <span className="font-bold text-foreground text-lg">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status</span>
          <span className={`${status.color} text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold`}>
            {status.label}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Geschätzte Zeit</span>
          <span className="flex items-center gap-1 text-foreground font-medium">
            <Clock className="w-4 h-4 text-primary" />
            ~{order.estimatedTime} Min
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Art</span>
          <span className="text-foreground">{order.orderType === "delivery" ? "🚗 Lieferung" : "🏪 Abholung"}</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mt-4">
        <h3 className="font-semibold text-card-foreground mb-3">Deine Bestellung</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-card-foreground">
                {item.quantity}x {item.menuItem.name}
              </span>
              <span className="text-muted-foreground">CHF {(item.totalPrice * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-foreground">
          <span>Total</span>
          <span>CHF {order.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <Link
          to="/menu"
          className="w-full bg-primary text-primary-foreground text-center py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Weitere Bestellung
        </Link>
        <Link
          to="/"
          className="w-full bg-secondary text-secondary-foreground text-center py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
