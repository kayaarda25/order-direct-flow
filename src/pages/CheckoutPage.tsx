import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDeliveryZone } from "@/data/deliveryZones";
import { isRestaurantOpen, getScheduledTimeSlots } from "@/utils/openingHours";
import { ArrowLeft, CreditCard, Banknote, Smartphone, Loader2, AlertCircle, Clock, Pizza } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const paymentMethods = [
  { id: "cash", name: "Bargeld", icon: Banknote },
  { id: "card", name: "Karte", icon: CreditCard },
  { id: "twint", name: "TWINT", icon: Smartphone },
];

const CheckoutPage = () => {
  const { items, totalPrice, orderType, clearCart, freePizzasRedeemed, setFreePizzasRedeemed } = useCart();
  const { placeOrder } = useOrder();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const restaurantOpen = isRestaurantOpen();
  const scheduledSlots = useMemo(() => getScheduledTimeSlots(), []);

  const [freePizzasAvailable, setFreePizzasAvailable] = useState(0);

  // Check if user has free pizzas
  useEffect(() => {
    if (!user) return;
    supabase
      .from("pizza_pass")
      .select("free_pizzas_available")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setFreePizzasAvailable(data.free_pizzas_available);
      });
  }, [user]);

  // Find the most expensive pizza in the cart for the discount
  const pizzaItems = items.filter(item => item.menuItem.category?.toLowerCase().includes("pizza"));
  const bestPizzaDiscount = pizzaItems.length > 0
    ? Math.max(...pizzaItems.map(item => item.totalPrice))
    : 0;

  const adjustedTotal = freePizzaApplied ? totalPrice - bestPizzaDiscount : totalPrice;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    plz: "",
    address: "",
    payment: "cash",
    notes: "",
    scheduledTime: restaurantOpen ? "" : (scheduledSlots[0]?.value || ""),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deliveryZone = useMemo(
    () => (orderType === "delivery" && form.plz.length >= 4 ? getDeliveryZone(form.plz.trim()) : undefined),
    [orderType, form.plz]
  );

  const subtotalWithoutDelivery = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);
  const belowMinimum = orderType === "delivery" && deliveryZone && subtotalWithoutDelivery < deliveryZone.minimumOrder;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name ist erforderlich";
    if (!form.phone.trim()) e.phone = "Telefonnummer ist erforderlich";
    if (!restaurantOpen && !form.scheduledTime) e.scheduledTime = "Bitte wähle einen Zeitpunkt";
    if (orderType === "delivery") {
      if (!form.plz.trim()) e.plz = "PLZ ist erforderlich";
      else if (!deliveryZone) e.plz = "Wir liefern leider nicht in diese PLZ";
      if (!form.address.trim()) e.address = "Adresse ist erforderlich";
      if (belowMinimum) e.plz = `Mindestbestellwert für ${deliveryZone!.city}: CHF ${deliveryZone!.minimumOrder.toFixed(2)}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);

    try {
      // Forward order to admin webhook via edge function
      const webhookPayload = {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: orderType === "delivery" ? `${form.address}, ${form.plz} ${deliveryZone?.city || ""}`.trim() : "",
        order_type: orderType,
        payment_type: form.payment,
        scheduled_time: form.scheduledTime || null,
        special_notes: form.notes + (freePizzaApplied ? " [GRATIS-PIZZA EINGELÖST]" : ""),
        items: items.map((item) => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.totalPrice,
          station: item.menuItem.station,
          modifiers: Object.values(item.selectedModifiers)
            .flat()
            .map((m) => m.name)
            .join(", ") || undefined,
          notes: item.specialNotes || undefined,
        })),
      };

      const { data, error } = await supabase.functions.invoke("forward-order", {
        body: webhookPayload,
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || "Webhook failed");

      const order = placeOrder({
        items,
        customerName: form.name,
        phone: form.phone,
        address: form.address,
        orderType,
        paymentMethod: form.payment,
        notes: form.notes,
        totalPrice: adjustedTotal,
      });

      clearCart();

      // Award loyalty points and redeem free pizza if applicable
      if (user) {
        try {
          // Redeem free pizza in DB
          if (freePizzaApplied) {
            await supabase.rpc("redeem_free_pizza", { p_user_id: user.id });
          }

          const { data: pointsAwarded } = await supabase.rpc("award_points", {
            p_user_id: user.id,
            p_order_total: adjustedTotal,
          });
          if (pointsAwarded) {
            toast.success(`+${pointsAwarded} Punkte gesammelt!`);
            await refreshProfile();
          }

          // Count pizzas in order for pizza pass
          const pizzaCount = items
            .filter(item => item.menuItem.category?.toLowerCase().includes("pizza"))
            .reduce((sum, item) => sum + item.quantity, 0);
          if (pizzaCount > 0) {
            await supabase.rpc("add_pizzas_to_pass", {
              p_user_id: user.id,
              p_count: pizzaCount,
            });
          }
        } catch (err) {
          console.error("Points/pass award error:", err);
        }
      }

      toast.success("Bestellung erfolgreich gesendet!");
      navigate(`/order/${order.id}`);
    } catch (err) {
      console.error("Order submission error:", err);
      toast.error("Bestellung konnte nicht gesendet werden. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
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

      {!restaurantOpen && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-foreground font-semibold text-sm mb-2">Geplante Bestellung</p>
              <p className="text-muted-foreground text-xs mb-3">Wir haben gerade geschlossen. Wähle einen Zeitpunkt für deine Bestellung:</p>
              <select
                value={form.scheduledTime}
                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                className={cn(
                  "w-full p-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm",
                  errors.scheduledTime ? "border-destructive" : "border-border"
                )}
              >
                <option value="">Zeitpunkt wählen…</option>
                {scheduledSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
              {errors.scheduledTime && <p className="text-destructive text-xs mt-1">{errors.scheduledTime}</p>}
            </div>
          </div>
        )}

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
          <>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">PLZ *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.plz}
                onChange={(e) => setForm({ ...form, plz: e.target.value.replace(/\D/g, "") })}
                className={cn(
                  "w-full p-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.plz ? "border-destructive" : "border-border"
                )}
                placeholder="8048"
              />
              {errors.plz && <p className="text-destructive text-xs mt-1">{errors.plz}</p>}
              {deliveryZone && !belowMinimum && (
                <p className="text-sm text-green-600 mt-1">
                  ✅ {deliveryZone.city} — Mindestbestellwert: CHF {deliveryZone.minimumOrder.toFixed(2)}
                </p>
              )}
              {belowMinimum && deliveryZone && (
                <div className="flex items-center gap-2 mt-1 text-sm text-orange-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Mindestbestellwert für {deliveryZone.city}: CHF {deliveryZone.minimumOrder.toFixed(2)} (aktuell: CHF {subtotalWithoutDelivery.toFixed(2)})
                </div>
              )}
              {form.plz.length === 4 && !deliveryZone && (
                <p className="text-destructive text-xs mt-1">Wir liefern leider nicht in diese PLZ</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Strasse & Hausnummer *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={cn(
                  "w-full p-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.address ? "border-destructive" : "border-border"
                )}
                placeholder="Musterstrasse 12"
              />
              {errors.address && <p className="text-destructive text-xs mt-1">{errors.address}</p>}
            </div>
          </>
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
            <span>{orderType === "delivery" ? "Lieferung" : "Abholung"}</span>
          </div>

          {/* Free pizza redemption */}
          {user && freePizzasAvailable > 0 && pizzaItems.length > 0 && !freePizzaApplied && (
            <button
              type="button"
              onClick={() => {
                setFreePizzaApplied(true);
                toast.success("Gratis-Pizza wird beim Bestellen eingelöst!");
              }}
              className="w-full flex items-center justify-center gap-2 bg-accent/10 border border-accent/30 text-accent rounded-lg py-2.5 font-semibold text-sm hover:bg-accent/20 transition-colors"
            >
              <Pizza className="w-4 h-4" />
              Gratis-Pizza einlösen ({freePizzasAvailable} verfügbar)
            </button>
          )}

          {freePizzaApplied && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-accent font-semibold flex items-center gap-1">
                <Pizza className="w-4 h-4" /> Gratis-Pizza
              </span>
              <div className="flex items-center gap-2">
                <span className="text-accent font-semibold">- CHF {bestPizzaDiscount.toFixed(2)}</span>
                <button type="button" onClick={() => setFreePizzaApplied(false)} className="text-muted-foreground text-xs underline hover:text-foreground">Entfernen</button>
              </div>
            </div>
          )}

          <div className="flex justify-between text-foreground font-bold text-lg">
            <span>Total</span>
            <span>CHF {adjustedTotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            "Bestellung aufgeben"
          )}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
