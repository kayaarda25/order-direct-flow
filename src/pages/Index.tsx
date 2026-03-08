import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import pizzaImg from "@/assets/pizza-overhead.png";
import cateringPizzaImg from "@/assets/catering-pizza-party.png";
import cateringPastaImg from "@/assets/catering-pasta.png";
import cateringAperitivoImg from "@/assets/catering-aperitivo.png";
import cateringCarneImg from "@/assets/catering-carne.png";
import cateringMareImg from "@/assets/catering-mare.png";
import cateringVerdeImg from "@/assets/catering-verde.png";

const menuCategories = [
  { name: "Vorspeisen & Salate", id: "vorspeisen" },
  { name: "PIZZA", id: "pizza" },
  { name: "Pasta", id: "pasta" },
  { name: "Fisch & Fleisch", id: "fisch-fleisch" },
  { name: "Kinder Pizza", id: "kinder" },
  { name: "Getränke", id: "getranke" },
];

const cateringPackages = [
  {
    name: "PIZZA PARTY",
    desc: "Perfekt für lockere Events, Geburtstage und Teams.",
    content: ["Pizza nach Auswahl", "2 Beilagen", "Dips"],
    price: "CHF 30.00 pro Person",
  },
  {
    name: "PASTA CLASSICA",
    desc: "Perfekt für Business, Lunch und Events.",
    content: ["Pasta nach Auswahl", "2 Beilagen", "Parmesan & Toppings"],
    price: "CHF 30.00 pro Person",
  },
  {
    name: "APERITIVO (KALT)",
    desc: "Perfekt für Apéros, Networking und Firmenevents.",
    content: ["Antipasti-Platten", "Käse, Aufschnitte und Fleisch", "Hausgemachtes Brot & Dips"],
    price: "CHF 35.00 pro Person",
  },
  {
    name: "CARNE (FLEISCH)",
    desc: "Perfekt für grössere Events, gehobene Anlässe.",
    content: ["Fleischgerichte (Poulet, Rind, Lamm, Schwein)", "2-3 warme Beilagen", "Hausgemachtes Brot & Dips"],
    price: "CHF 45.00 pro Person",
  },
  {
    name: "MARE (FISCH)",
    desc: "Perfekt für gehobene Business-Events.",
    content: ["Fischgerichte (kalt und warm)", "Beilagen", "Hausgemachtes Brot & Dips"],
    price: "CHF 45.00 pro Person",
  },
  {
    name: "VERDE (VEGAN)",
    desc: "Perfekt für moderne Events.",
    content: ["Vegane/ Vegetarische Hauptgerichte", "Beilagen", "Salate"],
    price: "CHF 25.00 pro Person",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* MENU Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
              Menu
            </h2>
            <p className="text-primary-foreground/60 text-base uppercase tracking-wide">
              Im Restaurant geniessen, selbst abholen oder nach Hause bestellen
            </p>
          </motion.div>

          <div className="relative flex flex-col md:flex-row items-stretch mt-10 max-w-3xl">
            {/* Pizza image behind the card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 z-0"
            >
              <img src={pizzaImg} alt="Pizza" className="w-72 lg:w-96 h-auto" />
            </motion.div>

            {/* Dark card with category buttons */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col gap-3 z-10 relative w-full md:w-auto"
            >
              {menuCategories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to="/menu"
                    className="block w-full md:w-72 text-center px-6 py-3 border-2 border-foreground/40 rounded-lg text-foreground font-semibold hover:bg-foreground/10 transition-colors uppercase tracking-wide text-sm"
                  >
                    {cat.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Mobile pizza image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:hidden flex justify-center mt-6"
            >
              <img src={pizzaImg} alt="Pizza" className="w-52 h-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* CATERING Section */}
      <section className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 uppercase tracking-wider">
            Catering-Pakete
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto italic">
            5 perfekt abgestimmte Catering-Pakete – individuell erweiterbar
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cateringPackages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-foreground/30 transition-colors"
            >
              <h3 className="font-display font-bold text-foreground text-lg mb-2 uppercase tracking-wide">
                {pkg.name}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 italic">{pkg.desc}</p>
              <p className="text-foreground text-xs font-semibold uppercase tracking-wider mb-2">Inhalt:</p>
              <ul className="text-muted-foreground text-sm space-y-1 mb-4">
                {pkg.content.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <p className="text-foreground font-bold text-sm uppercase">Preis: {pkg.price}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
