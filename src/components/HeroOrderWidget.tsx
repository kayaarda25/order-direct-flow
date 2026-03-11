import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface DeliveryZone {
  plz: string;
  city: string;
  minimum_order: number;
  active: boolean;
}

const HeroOrderWidget = () => {
  const navigate = useNavigate();
  const { setOrderType, setOrderTypeChosen } = useCart();
  const [selected, setSelected] = useState<"delivery" | "pickup" | null>(null);
  const [plz, setPlz] = useState("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);

  useEffect(() => {
    supabase
      .from("delivery_zones")
      .select("*")
      .eq("active", true)
      .then(({ data }) => {
        if (data) setZones(data as DeliveryZone[]);
      });
  }, []);

  const matchedZone = useMemo(() => {
    if (plz.length < 4) return undefined;
    return zones.find((z) => z.plz === plz.trim());
  }, [plz, zones]);

  const plzChecked = plz.length === 4;

  const canProceed = selected === "pickup" || (selected === "delivery" && matchedZone);

  const handleOrder = () => {
    if (!canProceed || !selected) return;
    setOrderType(selected);
    setOrderTypeChosen(true);
    navigate("/menu");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl p-5 md:p-6 shadow-lg max-w-sm w-full space-y-4"
    >
      {/* PLZ Input */}
      <div>
        <label className="block text-sm font-bold text-neutral-900 mb-1 uppercase tracking-wider">
          Postleitzahl
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={plz}
          onChange={(e) => setPlz(e.target.value.replace(/\D/g, ""))}
          placeholder="z.B. 8048"
          className="w-full p-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-base"
        />
      </div>

      {/* PLZ feedback */}
      {plzChecked && matchedZone && (
        <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs font-semibold text-green-800">
            {matchedZone.city} — Mindestbestellung CHF {matchedZone.minimum_order.toFixed(2)}
          </p>
        </div>
      )}

      {plzChecked && !matchedZone && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-xs font-semibold text-red-800">
            Postleitzahl unbekannt?
          </p>
        </div>
      )}

      {/* Delivery / Pickup toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelected("delivery")}
          className={cn(
            "flex-1 py-2.5 rounded-lg border-2 font-bold text-sm uppercase tracking-wider transition-all",
            selected === "delivery"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
          )}
        >
          liefern
        </button>
        <button
          onClick={() => setSelected("pickup")}
          className={cn(
            "flex-1 py-2.5 rounded-lg border-2 font-bold text-sm uppercase tracking-wider transition-all",
            selected === "pickup"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
          )}
        >
          abholen
        </button>
      </div>

      {/* Order button */}
      <button
        onClick={handleOrder}
        disabled={!canProceed}
        className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-bold text-lg uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        bestellen
      </button>
    </motion.div>
  );
};

export default HeroOrderWidget;
