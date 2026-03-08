import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Utensils, Truck, Star, Zap } from "lucide-react";
import HeroSection from "@/components/HeroSection";

const features = [
  { icon: Utensils, title: "Frische Zutaten", desc: "Täglich frisch zubereitet mit den besten Zutaten" },
  { icon: Truck, title: "Schnelle Lieferung", desc: "In 30-45 Minuten bei dir — heiss und frisch" },
  { icon: Star, title: "Beste Qualität", desc: "Über 500 zufriedene Kunden pro Woche" },
  { icon: Zap, title: "Einfach bestellen", desc: "Wenige Klicks — direkt ohne Drittanbieter" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />

      <section className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Warum DirectOrder?
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Dein Essen, direkt vom Restaurant zu dir — ohne Umweg.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feat.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-card-foreground text-lg mb-1">{feat.title}</h3>
              <p className="text-muted-foreground text-sm">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Hunger? Bestelle jetzt!
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-md mx-auto">
            Schau unser Menü an und bestelle in wenigen Minuten.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Menü ansehen
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
