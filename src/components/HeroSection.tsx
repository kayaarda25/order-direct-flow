import { motion } from "framer-motion";
import mascotImg from "@/assets/pirate-mascot.png";
import { useSiteContent, type ElementPosition } from "@/hooks/useSiteContent";
import HeroOrderWidget from "@/components/HeroOrderWidget";

const HeroSection = () => {
  const { content } = useSiteContent();

  const heroPositions = content.element_positions?.hero;
  const hasCustomPositions = heroPositions && Object.keys(heroPositions).length > 0;

  const getPos = (id: string, defaults: ElementPosition): ElementPosition => {
    return heroPositions?.[id] || defaults;
  };

  // If custom positions exist, use absolute positioning
  if (hasCustomPositions) {
    const titlePos = getPos("hero_title", { x: 5, y: 15, scale: 1 });
    const subtitlePos = getPos("hero_subtitle", { x: 5, y: 45, scale: 1 });
    const buttonsPos = getPos("hero_buttons", { x: 5, y: 58, scale: 1 });
    const mascotPos = getPos("hero_mascot", { x: 65, y: 20, scale: 1 });

    return (
      <section
        className="relative overflow-hidden bg-background"
        style={
          content.hero_image
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${content.hero_image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="relative container" style={{ paddingBottom: "56.25%", minHeight: "500px" }}>
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute"
            style={{
              left: `${titlePos.x}%`,
              top: `${titlePos.y}%`,
              transform: `scale(${titlePos.scale || 1})`,
              transformOrigin: "top left",
            }}
          >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight uppercase tracking-wide whitespace-pre-line"
              style={{ fontFamily: "'League Spartan', sans-serif" }}
            >
              {content.hero_title}
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="absolute"
            style={{
              left: `${subtitlePos.x}%`,
              top: `${subtitlePos.y}%`,
              transform: `scale(${subtitlePos.scale || 1})`,
              transformOrigin: "top left",
            }}
          >
            <p className="text-lg md:text-xl text-muted-foreground font-body">
              {content.hero_subtitle}
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="absolute"
            style={{
              left: `${buttonsPos.x}%`,
              top: `${buttonsPos.y}%`,
              transform: `scale(${buttonsPos.scale || 1})`,
              transformOrigin: "top left",
            }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Jetzt bestellen
              </Link>
              <Link
                to="/reservieren"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Tisch reservieren
              </Link>
              <Link
                to="/catering"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Catering Anfrage
              </Link>
            </div>
          </motion.div>

          {/* Mascot */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute"
            style={{
              left: `${mascotPos.x}%`,
              top: `${mascotPos.y}%`,
              transform: `scale(${mascotPos.scale || 1})`,
              transformOrigin: "top left",
            }}
          >
            <img
              src={mascotImg}
              alt="Piratino Maskottchen"
              className="w-48 md:w-64 lg:w-80 h-auto"
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Default layout (no custom positions)
  return (
    <section
      className="relative overflow-hidden bg-background"
      style={
        content.hero_image
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${content.hero_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="container py-16 md:py-24 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4 uppercase tracking-wide whitespace-pre-line" style={{ fontFamily: "'League Spartan', sans-serif" }}>
              {content.hero_title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 font-body">
              {content.hero_subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Jetzt bestellen
              </Link>
              <Link
                to="/reservieren"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
              >
                Tisch reservieren
              </Link>
              <Link
                to="/catering"
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
