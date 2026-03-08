import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-food.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Leckeres Essen" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>

      <div className="relative container py-20 md:py-32 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-tight mb-4">
            Frisch zu dir <br />
            <span className="text-accent">geliefert.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 font-body">
            Bestelle direkt bei uns — ohne Umweg, ohne Gebühren. Frisch zubereitet und schnell geliefert.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Jetzt bestellen
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 bg-primary-foreground/15 text-primary-foreground backdrop-blur-sm px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-foreground/25 transition-colors border border-primary-foreground/20"
            >
              Menü ansehen
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 text-primary-foreground/70">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <span className="font-body">Mo-Do 11-14 & 17-22 Uhr</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <span className="font-body">Liefergebiet: 5km Radius</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
