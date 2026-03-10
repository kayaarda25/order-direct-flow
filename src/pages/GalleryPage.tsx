import { motion } from "framer-motion";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";
import { useSiteContent } from "@/hooks/useSiteContent";

const defaultGalleryImages = [
  { src: gallery1, alt: "Restaurant Innenbereich" },
  { src: gallery2, alt: "Restaurant Fensterplätze" },
  { src: gallery3, alt: "Restaurant Eingang" },
  { src: gallery4, alt: "Pizzaofen" },
  { src: gallery5, alt: "Küche und Ofen" },
  { src: gallery6, alt: "Profiküche" },
  { src: gallery7, alt: "Restaurant Sitzbereich" },
  { src: gallery8, alt: "Dekor und Ambiente" },
];

const GalleryPage = () => {
  const { content } = useSiteContent();

  const images = (content.gallery_images && content.gallery_images.length > 0)
    ? content.gallery_images.map((img) => ({ src: img.url, alt: img.alt }))
    : defaultGalleryImages;

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
            {content.gallery_title}
          </h1>
          <p className="text-primary-foreground/60 text-sm max-w-2xl uppercase tracking-wide">
            {content.gallery_text}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-lg"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
