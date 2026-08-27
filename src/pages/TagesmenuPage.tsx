import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Pizza, Phone, MapPin } from "lucide-react";
import Seo from "@/components/Seo";
import pizzaOverhead from "@/assets/pizza-overhead.png";

interface Menu {
  id: string;
  title: string;
  window: string;
  days: string;
  description: string;
  ranges: { day: number; from: number; to: number }[];
}

const MENUS: Menu[] = [
  {
    id: "mittag",
    title: "Mittagsmenü",
    window: "11:00 – 14:00 Uhr",
    days: "Montag bis Samstag",
    description: "Pizza oder Pasta nach Wahl, frischer Salat und ein Getränk.",
    ranges: [1, 2, 3, 4, 5, 6].map((day) => ({ day, from: 11 * 60, to: 14 * 60 })),
  },
  {
    id: "abend",
    title: "Abendmenü",
    window: "17:00 – 22:00 Uhr (Fr bis 23:00, Sa und So nach Öffnungszeiten)",
    days: "Täglich",
    description: "Pizza oder Pasta nach Wahl, frischer Salat und ein Getränk.",
    ranges: [
      { day: 0, from: 14 * 60, to: 22 * 60 },
      { day: 1, from: 17 * 60, to: 22 * 60 },
      { day: 2, from: 17 * 60, to: 22 * 60 },
      { day: 3, from: 17 * 60, to: 22 * 60 },
      { day: 4, from: 17 * 60, to: 22 * 60 },
      { day: 5, from: 17 * 60, to: 23 * 60 },
      { day: 6, from: 17 * 60, to: 23 * 60 },
    ],
  },
];

const isActive = (menu: Menu, now = new Date()) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return menu.ranges.some((r) => r.day === now.getDay() && minutes >= r.from && minutes < r.to);
};

const TagesmenuPage = () => {
  return (
    <div className="container py-10">
      <Seo
        title="Mittagsmenü & Abendmenü | CHF 22 statt 25 | Pizza Piratino Zürich"
        description="Mittagsmenü 11–14 Uhr und Abendmenü ab 17 Uhr bei Pizza Piratino in Zürich Altstetten: Pizza oder Pasta für CHF 22 statt 25. Lieferung oder Abholung."
        path="/tagesmenu"
      />

      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
          <Pizza className="w-4 h-4" />
          Aktion in Zürich Altstetten
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-5">
          Mittagsmenü & Abendmenü
          <span className="block text-primary mt-2">CHF 22 statt 25</span>
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Frisch bei Pizza Piratino an der Badenerstrasse 696 – direkt bestellen, ohne Lieferdienst.
          Lieferung oder Abholung, Zahlung bar, mit Karte oder TWINT.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 max-w-4xl mx-auto mt-10">
        {MENUS.map((menu, i) => {
          const active = isActive(menu);
          return (
            <motion.div
              key={menu.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold text-card-foreground">{menu.title}</h2>
                {active && (
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    Jetzt gültig
                  </span>
                )}
              </div>

              <p className="flex items-center gap-2 text-muted-foreground mt-3">
                <Clock className="w-4 h-4 text-primary" />
                {menu.window}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{menu.days}</p>

              <p className="text-card-foreground mt-4">{menu.description}</p>

              <div className="flex items-baseline gap-3 mt-5">
                <span className="font-display text-3xl font-bold text-primary">CHF 22.–</span>
                <span className="text-muted-foreground line-through">CHF 25.–</span>
              </div>

              <Link
                to="/menu?category=vorspeisen"
                className="mt-6 w-full bg-primary text-primary-foreground text-center py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Jetzt bestellen
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto mt-10 grid gap-5 md:grid-cols-2 items-center">
        <img
          src={pizzaOverhead}
          alt="Pizza von Pizza Piratino in Zürich Altstetten"
          className="rounded-2xl w-full h-64 object-cover"
          loading="lazy"
        />
        <div className="space-y-3 text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Badenerstrasse 696, 8048 Zürich
          </p>
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <a href="tel:+41444313233" className="hover:text-foreground transition-colors">
              +41 44 431 32 33
            </a>
          </p>
          <p className="text-sm">
            Aktionspreis gilt für das Menü: Pizza oder Pasta nach Wahl, frischer Salat und ein Getränk.
            Gültig innerhalb der angegebenen Zeiten, solange die Küche geöffnet ist. Nicht mit anderen Rabatten kombinierbar.
          </p>
          <Link
            to="/menu?category=vorspeisen"
            className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Zur Speisekarte
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TagesmenuPage;
