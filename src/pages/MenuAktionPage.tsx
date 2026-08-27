import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Pizza, ArrowRight } from "lucide-react";
import { activatePromo, MENU_PROMO_CODE, MENU_PROMO_PRICE } from "@/lib/promo";
import { tagesmenuLabel } from "@/hooks/useMenuItems";
import Seo from "@/components/Seo";

/**
 * Landingpage der Menü-Anzeige: aktiviert den 22-Franken-Gutschein automatisch.
 * Der Aktionspreis ist nur über diesen Link erreichbar.
 */
const MenuAktionPage = () => {
  useEffect(() => {
    activatePromo(MENU_PROMO_CODE);
  }, []);

  const label = tagesmenuLabel();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Seo
        title={`${label} für CHF ${MENU_PROMO_PRICE} | Pizza Piratino Zürich`}
        description={`Pizzamenü oder Pastamenü mit Salat und Getränk für CHF ${MENU_PROMO_PRICE} statt CHF 25. Direkt bei Pizza Piratino in Zürich Altstetten bestellen.`}
        path="/menu-aktion"
      />
      <div className="max-w-lg w-full text-center bg-card border border-border rounded-2xl p-8 space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Pizza className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {label} für CHF {MENU_PROMO_PRICE}
        </h1>
        <p className="text-muted-foreground">
          Pizzamenü oder Pastamenü mit Salat und Getränk: statt CHF 25 nur CHF {MENU_PROMO_PRICE}.
          Der Aktionspreis wird an der Kasse automatisch abgezogen und gilt einmalig für diese
          Bestellung, bei Lieferung und Abholung.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Menü auswählen
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default MenuAktionPage;
