import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSiteContent } from "@/hooks/useSiteContent";
import HeroSection from "@/components/HeroSection";
import pizzaImg from "@/assets/pizza-overhead.png";
import cateringPizzaImg from "@/assets/catering-pizza-party.png";
import cateringPastaImg from "@/assets/catering-pasta.png";
import cateringAperitivoImg from "@/assets/catering-aperitivo.png";
import cateringCarneImg from "@/assets/catering-carne.png";
import cateringMareImg from "@/assets/catering-mare.png";
import cateringVerdeImg from "@/assets/catering-verde.png";
import gallery1 from "@/assets/gallery-1.jpg";
import teamPhoto from "@/assets/team-photo.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";

const galleryImages = [
  { src: gallery1, alt: "Restaurant Innenbereich" },
  { src: gallery2, alt: "Restaurant Fensterplätze" },
  { src: gallery3, alt: "Restaurant Eingang" },
  { src: gallery4, alt: "Pizzaofen" },
  { src: gallery5, alt: "Küche und Ofen" },
  { src: gallery6, alt: "Profiküche" },
  { src: gallery7, alt: "Restaurant Sitzbereich" },
  { src: gallery8, alt: "Dekor und Ambiente" },
];

const menuCategories = [
  { name: "Vorspeisen & Salate", id: "vorspeisen" },
  { name: "PIZZA", id: "pizza" },
  { name: "Pasta", id: "pasta" },
  { name: "Fisch & Fleisch", id: "fleisch-fisch-grill" },
  { name: "Kinder Pizza", id: "kinder-pizza" },
  { name: "Getränke", id: "softdrinks" },
];

const cateringPackages = [
  {
    name: "PIZZA PARTY",
    desc: "Perfekt für lockere Events, Geburtstage und Teams.",
    content: ["Pizza nach Auswahl", "2 Beilagen", "Dips"],
    price: "CHF 30.00 pro Person",
    image: cateringPizzaImg,
  },
  {
    name: "PASTA CLASSICA",
    desc: "Perfekt für Business, Lunch und Events.",
    content: ["Pasta nach Auswahl", "2 Beilagen", "Parmesan & Toppings"],
    price: "CHF 30.00 pro Person",
    image: cateringPastaImg,
  },
  {
    name: "APERITIVO (KALT)",
    desc: "Perfekt für Apéros, Networking und Firmenevents.",
    content: ["Antipasti-Platten", "Käse, Aufschnitte und Fleisch", "Hausgemachtes Brot & Dips"],
    price: "CHF 35.00 pro Person",
    image: cateringAperitivoImg,
  },
  {
    name: "CARNE (FLEISCH)",
    desc: "Perfekt für grössere Events, gehobene Anlässe.",
    content: ["Fleischgerichte (Poulet, Rind, Lamm, Schwein)", "2-3 warme Beilagen", "Hausgemachtes Brot & Dips"],
    price: "CHF 45.00 pro Person",
    image: cateringCarneImg,
  },
  {
    name: "MARE (FISCH)",
    desc: "Perfekt für gehobene Business-Events.",
    content: ["Fischgerichte (kalt und warm)", "Beilagen", "Hausgemachtes Brot & Dips"],
    price: "CHF 45.00 pro Person",
    image: cateringMareImg,
  },
  {
    name: "VERDE (VEGAN)",
    desc: "Perfekt für moderne Events.",
    content: ["Vegane/ Vegetarische Hauptgerichte", "Beilagen", "Salate"],
    price: "CHF 25.00 pro Person",
    image: cateringVerdeImg,
  },
];

const Index = () => {
  const { content } = useSiteContent();

  return (
    <div className="min-h-screen">
      <HeroSection />


      {/* MENU Section */}
      <section className="bg-white py-16 md:py-24 overflow-hidden">
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

          <div className="relative mt-10 inline-block">
            {/* Dark card with category buttons */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col gap-3 z-10 relative"
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
                    to={`/menu?category=${cat.id}`}
                    className="block w-full md:w-72 text-center px-6 py-3 border-2 border-foreground/40 rounded-lg text-foreground font-semibold hover:bg-foreground/10 transition-colors uppercase tracking-wide text-sm"
                  >
                    {cat.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Pizza image behind the card, anchored to card's right edge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="absolute top-1/2 -translate-y-1/3 left-[60%] z-0 pointer-events-none"
            >
              <img src={pizzaImg} alt="Pizza" className="w-64 md:w-80 lg:w-96 h-auto" />
            </motion.div>
          </div>
        </div>
      </section>


      {/* CATERING Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
              Catering-Pakete
            </h2>
            <p className="text-primary-foreground/60 text-sm uppercase tracking-wide">
              6 perfekt abgestimmte Catering-Pakete – individuell erweiterbar
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {cateringPackages.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col sm:flex-row items-stretch"
              >
                {/* Text content */}
                <div className="flex-1 p-5 md:p-6">
                  <h3 className="font-display font-bold text-foreground text-lg mb-1 uppercase tracking-wide">
                    {pkg.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">{pkg.desc}</p>
                  <p className="text-foreground text-xs font-semibold uppercase tracking-wider mb-1">Inhalt:</p>
                  <ul className="text-muted-foreground text-sm space-y-0.5 mb-3">
                    {pkg.content.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <p className="text-foreground font-bold text-sm uppercase">Preis: {pkg.price}</p>
                </div>
                {/* Image */}
                <div className="w-full sm:w-48 md:w-56 flex-shrink-0 flex items-center justify-center p-4">
                  <img src={pkg.image} alt={pkg.name} className="w-full h-auto max-h-40 object-contain" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIE Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
              {content.gallery_title}
            </h2>
            <p className="text-primary-foreground/60 text-sm max-w-2xl uppercase tracking-wide">
              {content.gallery_text}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-lg"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-40 md:h-56 object-cover hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ÜBER UNS Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
              {content.about_title}
            </h2>
            <p className="text-primary-foreground/60 text-sm max-w-2xl uppercase tracking-wide">
              {content.about_text}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <img
              src={teamPhoto}
              alt="Das Piratino Team"
              className="w-full rounded-lg shadow-lg"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
