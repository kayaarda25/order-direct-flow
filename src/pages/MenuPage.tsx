import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { menuItems, categories } from "@/data/menu";
import type { MenuItem } from "@/data/menu";
import CategoryBar from "@/components/CategoryBar";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(categoryParam || categories[0].id);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (categoryParam && categories.some((c) => c.id === categoryParam)) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  return (
    <div className="min-h-screen">
      <CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <div className="container py-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
          {categories.find((c) => c.id === activeCategory)?.icon}{" "}
          {categories.find((c) => c.id === activeCategory)?.name}
        </h1>
        <p className="text-muted-foreground mb-6">
          {filteredItems.length} Produkte
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <ProductCard key={item.id} item={item} onAdd={setSelectedItem} />
          ))}
        </div>
      </div>

      {selectedItem && (
        <ProductModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default MenuPage;
