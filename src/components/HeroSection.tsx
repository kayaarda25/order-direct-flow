import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import mascotImg from "@/assets/pirate-mascot.png";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container py-16 md:py-24 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4 uppercase tracking-wide" style={{ fontFamily: "'League Spartan', sans-serif" }}>
              Willkommen bei <br />
              <span className="text-foreground">Piratino!</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 font-body italic">
              Pizza, Pasta und mehr seit 2006 – das Original
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Jetzt bestellen
              </Link>
              <a
                href="tel:+41444313233"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Tisch reservieren
              </a>
              <Link
                to="/menu"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Catering Anfrage
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <img
              src={mascotImg}
              alt="Piratino Maskottchen"
              className="w-48 md:w-64 lg:w-80 h-auto"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
