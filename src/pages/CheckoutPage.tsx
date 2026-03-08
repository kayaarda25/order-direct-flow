import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { ArrowLeft, CreditCard, Banknote, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { id: "cash", name: "Bargeld", icon: Banknote },
  { id: "card", name: "Karte", icon: CreditCard },
  { id: "twint", name: "TWINT", icon: Smartphone },
];

const CheckoutPage = () => {
  const { items, totalPrice, orderType, clearCart } = useCart();
  const { placeOrder } = useOrder();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "cash",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name ist erforderlich";
    if (!form.phone.trim()) e.phone = "Telefonnummer ist erforderlich";
    if (orderType === "delivery" && !form.address.trim()) e.address = "Adresse ist erforderlich";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const order = placeOrder({
      items,
      customerName: form.name,
      phone: form.phone,
      address: form.address,
      orderType,
      paymentMethod: form.payment,
      notes: form.notes,
      totalPrice,
    });

    clearCart();
    navigate(`/order/${order.id}`);
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="container py-6 max-w-lg">
      <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück zum Warenkorb
      </Link>

      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Kasse</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Vollständiger Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={cn(
              "w-full p-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              errors.name ? "border-destructive" : "border-border"
            )}
            placeholder="Max Muster"
          />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Telefonnummer *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={cn(
              "w-full p-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              errors.phone ? "border-destructive" : "border-border"
            )}
            placeholder="+41 79 123 45 67"
          />
          {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
        </div>

        {orderType === "delivery" && (
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Lieferadresse *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={cn(
                "w-full p-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                errors.address ? "border-destructive" : "border-border"
              )}
              placeholder="Musterstrasse 12, 8000 Zürich"
            />
            {errors.address && <p className="text-destructive text-xs mt-1">{errors.address}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Zahlungsmethode</label>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setForm({ ...form, payment: pm.id })}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  form.payment === pm.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <pm.icon className={cn("w-6 h-6", form.payment === pm.id ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", form.payment === pm.id ? "text-primary" : "text-muted-foreground")}>
                  {pm.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Bemerkungen</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Weitere Hinweise zur Bestellung..."
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-muted-foreground text-sm">
            <span>{items.length} Artikel</span>
            <span>{orderType === "delivery" ? "🚗 Lieferung" : "🏪 Abholung"}</span>
          </div>
          <div className="flex justify-between text-foreground font-bold text-lg">
            <span>Total</span>
            <span>CHF {totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          Bestellung aufgeben
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
