import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";
import OpeningHoursTable from "@/components/OpeningHoursTable";

interface Zone {
  plz: string;
  city: string;
  minimum_order: number;
}

const DeliveryPage = () => {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    let active = true;
    supabase
      .from("delivery_zones")
      .select("plz, city, minimum_order")
      .eq("active", true)
      .order("plz")
      .then(({ data }) => {
        if (active && data) setZones(data as Zone[]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <Seo
        title="Pizza Lieferung Zürich Altstetten | Pizza Piratino"
        description="Pizza Lieferung in Zürich Altstetten, Albisrieden und Schlieren – direkt bei Pizza Piratino bestellen. Zahlung mit Bar, Karte oder TWINT."
        path="/pizza-lieferung-zuerich"
      />
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4 uppercase tracking-wider">
          Pizza Lieferung Zürich
        </h1>
        <p className="text-primary-foreground/70 mb-10">
          Wir liefern frische Pizza, Pasta und Antipasti aus unserer Pizzeria an der Badenerstrasse 696
          in Zürich Altstetten. Bestellungen laufen direkt bei uns in der Küche ein – so bleiben sie heiss
          und pünktlich.
        </p>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-4 uppercase tracking-wide">
            Liefergebiete und Mindestbestellwert
          </h2>
          {zones.length === 0 ? (
            <p className="text-muted-foreground text-sm">Liefergebiete werden geladen …</p>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-foreground uppercase tracking-wide text-xs">
                    <th className="py-2">Postleitzahl</th>
                    <th className="py-2">Ort</th>
                    <th className="py-2 text-right">Mindestbestellwert</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.plz} className="border-t border-border/40">
                      <td className="py-2 text-foreground font-semibold">{z.plz}</td>
                      <td className="py-2 text-muted-foreground">{z.city}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        CHF {Number(z.minimum_order).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-4 uppercase tracking-wide">
            Bezahlen
          </h2>
          <p className="text-primary-foreground/70">
            Bei Lieferung kannst du bar, mit Karte oder mit TWINT bezahlen.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-4 uppercase tracking-wide">
            Lieferzeiten
          </h2>
          <p className="text-primary-foreground/70 mb-4">
            Wir liefern während unserer Öffnungszeiten. Wenn wir gerade geschlossen sind, kannst du
            deine Bestellung für einen späteren Zeitpunkt vorbestellen.
          </p>
          <OpeningHoursTable />
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/menu"
            className="px-6 py-3 rounded-lg bg-card border-2 border-foreground/40 text-foreground font-semibold uppercase tracking-wide text-sm hover:bg-foreground/10 transition-colors"
          >
            Jetzt bestellen
          </Link>
          <Link
            to="/pizza-abholung-zuerich"
            className="px-6 py-3 rounded-lg border-2 border-primary-foreground/20 text-primary-foreground font-semibold uppercase tracking-wide text-sm hover:bg-primary-foreground/5 transition-colors"
          >
            Abholpreise ansehen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
