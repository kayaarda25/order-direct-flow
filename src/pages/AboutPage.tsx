import { motion } from "framer-motion";
import teamPhoto from "@/assets/team-photo.jpg";

const AboutPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
            Über uns
          </h1>
          <p className="text-primary-foreground/60 text-sm max-w-2xl uppercase tracking-wide">
            Am besten, Sie lernen uns persönlich kennen und überzeugen sich vom Geschmack unserer Speisen! Unsere Pizzeria besteht bereits seit 2006. Seit dem bieten wir unseren Gästen leckere Pizzen sowie weitere italienische Gerichte und Highlights aus der Schweizer Küche an. Überzeugen Sie sich selbst:
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl"
        >
          <img
            src={teamPhoto}
            alt="Das Piratino Team"
            className="w-full rounded-lg shadow-lg"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
