import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Percent, ArrowRight } from "lucide-react";
import { activatePromo, PROMO_PERCENT } from "@/lib/promo";
import Seo from "@/components/Seo";

/**
 * Landingpage der Werbeanzeige: aktiviert den Gutschein automatisch.
 * Der Rabatt ist nur über diesen Link erreichbar.
 */
const AktionPage = () => {
  useEffect(() => {
    activatePromo();
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Seo
        title={`${PROMO_PERCENT}% Rabatt auf deine Bestellung | Pizza Piratino Zürich`}
        description={`Dein Aktionsrabatt von ${PROMO_PERCENT}% ist aktiviert. Jetzt Pizza oder Pasta direkt bei Pizza Piratino in Zürich Altstetten bestellen.`}
        path="/aktion"
      />
      <div className="max-w-lg w-full text-center bg-card border border-border rounded-2xl p-8 space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Percent className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {PROMO_PERCENT}% Rabatt sind aktiviert
        </h1>
        <p className="text-muted-foreground">
          Der Rabatt wird an der Kasse automatisch von deiner Bestellung abgezogen. Er gilt
          einmalig für diese Bestellung, bei Lieferung und Abholung.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Jetzt bestellen
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default AktionPage;
