import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { MenuItem } from "@/data/menu";

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const ProductCard = ({ item, onAdd }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <button
          onClick={() => onAdd(item)}
          className="absolute bottom-3 right-3 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-card-foreground text-lg">{item.name}</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.description}</p>
        <p className="text-primary font-bold text-lg mt-2">CHF {item.price.toFixed(2)}</p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
