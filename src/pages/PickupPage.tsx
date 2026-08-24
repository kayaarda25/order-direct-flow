import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";
import OpeningHoursTable from "@/components/OpeningHoursTable";

interface Item {
  id: string;
  name: string;
  pickup_price: number | null;
  price: number | null;
}

const PickupPage = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let active = true;
    supabase
      .from("menu_items")
      .select("id, name, pickup_price, price, category, available, sort_order")
      .eq("category", "pizza")
      .eq("available", true)
      .order("sort_order")
      .then(({ data }) => {
        if (active && data) setItems(data as unknown as Item[]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <Seo
        title="Pizza Abholung Zürich Altstetten | Pizza Piratino"
        description="Pizza zum Abholen an der Badenerstrasse 696 in Zürich Altstetten – Abholpreise, Öffnungszeiten und direkte Bestellung bei Pizza Piratino."
        path="/pizza-abholung-zuerich"
      />
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4 uppercase tracking-wider">
          Pizza Abholung Zürich
        </h1>
        <p className="text-primary-foreground/70 mb-10">
          Bestell online vor und hol deine Pizza frisch aus dem Ofen bei uns an der Badenerstrasse 696
          in Zürich Altstetten ab. Bei Abholung gelten reduzierte Preise.
        </p>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-4 uppercase tracking-wide">
            Abholpreise Pizza
          </h2>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Preise werden geladen …</p>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5">
              <table className="w-full text-sm">
                <tbody>
                  {items.map((it) => {
                    const p = it.pickup_price ?? it.price;
                    return (
                      <tr key={it.id} className="border-b border-border/40 last:border-0">
                        <th scope="row" className="py-2 text-left text-foreground font-semibold uppercase tracking-wide">
                          {it.name}
                        </th>
                        <td className="py-2 text-right text-muted-foreground">
                          {p != null ? `ab CHF ${Number(p).toFixed(2)}` : "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-muted-foreground text-xs mt-3">
                Preis je nach gewählter Grösse (24 cm, 32 cm oder 45 cm).
              </p>
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-4 uppercase tracking-wide">
            Standort und Anfahrt
          </h2>
          <p className="text-primary-foreground/70 mb-2">Badenerstrasse 696, 8048 Zürich</p>
          <p className="text-primary-foreground/70 mb-4">Telefon: +41 44 431 32 33</p>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Badenerstrasse+696,+8048+Z%C3%BCrich"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground underline"
          >
            Route auf Google Maps öffnen
          </a>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-4 uppercase tracking-wide">
            Öffnungszeiten
          </h2>
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
            to="/pizza-lieferung-zuerich"
            className="px-6 py-3 rounded-lg border-2 border-primary-foreground/20 text-primary-foreground font-semibold uppercase tracking-wide text-sm hover:bg-primary-foreground/5 transition-colors"
          >
            Liefergebiete ansehen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PickupPage;
