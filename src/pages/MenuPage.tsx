import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { menuItems, categories } from "@/data/menu";
import type { MenuItem } from "@/data/menu";
import CategoryBar from "@/components/CategoryBar";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import CrossSellBar from "@/components/CrossSellBar";
import CartSidebar from "@/components/CartSidebar";
import FloatingCartBar from "@/components/FloatingCartBar";

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(categoryParam || categories[0].id);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [lastAddedCategory, setLastAddedCategory] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrolling = useRef(false);

  useEffect(() => {
    if (categoryParam && categories.some((c) => c.id === categoryParam)) {
      setActiveCategory(categoryParam);
      setTimeout(() => {
        scrollToCategory(categoryParam);
      }, 100);
    }
  }, [categoryParam]);

  const scrollToCategory = (catId: string) => {
    isScrolling.current = true;
    const el = sectionRefs.current[catId];
    if (el) {
      const offset = 140;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setTimeout(() => { isScrolling.current = false; }, 600);
    }
  };

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    scrollToCategory(catId);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling.current) return;
      const offset = 180;
      for (const cat of categories) {
        const el = sectionRefs.current[cat.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom > offset) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    categories.forEach((cat) => {
      groups[cat.id] = menuItems.filter((item) => item.category === cat.id);
    });
    return groups;
  }, []);

  const handleItemAdded = (category: string) => {
    setLastAddedCategory(category);
    setTimeout(() => setLastAddedCategory(null), 8000);
  };

  return (
    <div className="min-h-screen bg-white">
      <CategoryBar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      {lastAddedCategory && (
        <CrossSellBar
          triggerCategory={lastAddedCategory}
          onSelect={setSelectedItem}
          onDismiss={() => setLastAddedCategory(null)}
        />
      )}

      <div className="container py-4">
        <div className="flex gap-6">
          {/* Menu items - main area */}
          <div className="flex-1 min-w-0">
            {categories.map((cat) => {
              const items = groupedItems[cat.id];
              if (!items || items.length === 0) return null;

              return (
                <div
                  key={cat.id}
                  ref={(el) => { sectionRefs.current[cat.id] = el; }}
                  className="mb-10"
                >
                  <h2 className="font-display text-xl md:text-2xl font-bold text-neutral-900 mb-1 flex items-center gap-2">
                    <span>{cat.icon}</span> {cat.name}
                  </h2>
                  <p className="text-neutral-500 text-sm mb-4">
                    {items.length} {items.length === 1 ? "Produkt" : "Produkte"}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        onAdd={setSelectedItem}
                        onQuickAdded={() => handleItemAdded(item.category)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart sidebar - desktop only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <CartSidebar />
          </div>
        </div>
      </div>

      {selectedItem && (
        <ProductModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdded={() => handleItemAdded(selectedItem.category)}
        />
      )}

      {/* Floating cart bar for mobile only */}
      <div className="lg:hidden">
        <FloatingCartBar />
      </div>
    </div>
  );
};

export default MenuPage;
