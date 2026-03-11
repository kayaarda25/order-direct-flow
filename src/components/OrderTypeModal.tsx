import { useState, useEffect, useMemo } from "react";
import { X, Truck, Store, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DeliveryZone {
  plz: string;
  city: string;
  minimum_order: number;
  active: boolean;
}

interface OrderTypeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (type: "delivery" | "pickup") => void;
}

const OrderTypeModal = ({ open, onClose, onConfirm }: OrderTypeModalProps) => {
  const [selected, setSelected] = useState<"delivery" | "pickup" | null>(null);
  const [plz, setPlz] = useState("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setPlz("");
      // Fetch delivery zones
      supabase
        .from("delivery_zones")
        .select("*")
        .eq("active", true)
        .then(({ data }) => {
          if (data) setZones(data as DeliveryZone[]);
        });
    }
  }, [open]);

  const matchedZone = useMemo(() => {
    if (plz.length < 4) return undefined;
    return zones.find((z) => z.plz === plz.trim());
  }, [plz, zones]);

  const plzChecked = plz.length === 4;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-md rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-neutral-200">
            <h2 className="font-display text-xl font-bold text-neutral-900">Wie möchtest du bestellen?</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Delivery option */}
            <button
              onClick={() => setSelected("delivery")}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                selected === "delivery"
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              )}
            >
              <Truck className={cn("w-6 h-6", selected === "delivery" ? "text-neutral-900" : "text-neutral-400")} />
              <div>
                <p className="font-semibold text-neutral-900">Liefern</p>
                <p className="text-sm text-neutral-500">Wir bringen es dir nach Hause</p>
              </div>
            </button>

            {/* PLZ check for delivery */}
            {selected === "delivery" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                    Postleitzahl eingeben
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={plz}
                    onChange={(e) => setPlz(e.target.value.replace(/\D/g, ""))}
                    placeholder="z.B. 8048"
                    className="w-full p-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    autoFocus
                  />
                </div>

                {plzChecked && matchedZone && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        {matchedZone.city} — Wir liefern zu dir!
                      </p>
                      <p className="text-xs text-green-600">
                        Mindestbestellwert: CHF {matchedZone.minimum_order.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {plzChecked && !matchedZone && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-sm font-semibold text-red-800">
                      Wir liefern leider nicht in diese PLZ. Bitte wähle Abholung.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pickup option */}
            <button
              onClick={() => setSelected("pickup")}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                selected === "pickup"
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              )}
            >
              <Store className={cn("w-6 h-6", selected === "pickup" ? "text-neutral-900" : "text-neutral-400")} />
              <div>
                <p className="font-semibold text-neutral-900">Abholen</p>
                <p className="text-sm text-neutral-500">Du holst es bei uns ab</p>
              </div>
            </button>
          </div>

          <div className="p-5 pt-0">
            <button
              onClick={() => {
                if (selected === "pickup") onConfirm("pickup");
                if (selected === "delivery" && matchedZone) onConfirm("delivery");
              }}
              disabled={!selected || (selected === "delivery" && !matchedZone)}
              className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Weiter zur Kasse
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderTypeModal;
