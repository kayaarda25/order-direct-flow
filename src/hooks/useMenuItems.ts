import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: Modifier[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  station: string;
  modifierGroups: ModifierGroup[];
  bestseller?: boolean;
  popular?: boolean;
  deliveryPrice?: number | null;
  pickupPrice?: number | null;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export const categories: MenuCategory[] = [
  { id: "vorspeisen", name: "Vorspeisen" },
  { id: "salate", name: "Salate" },
  { id: "pizza", name: "Pizza" },
  { id: "kinder-pizza", name: "Kinder Pizza" },
  { id: "pasta", name: "Pasta" },
  { id: "fleisch-fisch-grill", name: "Fleisch, Fisch & Grill" },
  { id: "kebab", name: "Kebabgerichte" },
  { id: "beilagen", name: "Beilagen" },
  { id: "desserts", name: "Desserts" },
  { id: "getraenke", name: "Getränke" },
];

export const crossSellMap: Record<string, string[]> = {
  "pizza": ["getraenke", "beilagen", "desserts"],
  "pasta": ["getraenke", "vorspeisen", "desserts"],
  "kebab": ["getraenke", "beilagen"],
  "fleisch-fisch-grill": ["getraenke", "beilagen", "desserts"],
  "salate": ["getraenke", "pasta"],
  "vorspeisen": ["getraenke", "pizza", "pasta"],
};

export function canQuickAdd(item: MenuItem): boolean {
  return item.modifierGroups.length === 0 || !item.modifierGroups.some(g => g.required);
}

function optimizeImageUrl(url: string | null, width = 400): string {
  if (!url) return "/placeholder.svg";
  // Supabase storage transform for smaller images
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    return url.replace(
      "/storage/v1/object/public/",
      `/storage/v1/render/image/public/`
    ) + `?width=${width}&quality=75`;
  }
  return url;
}

function mapDbItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price: row.price,
    image: optimizeImageUrl(row.image_url),
    category: row.category,
    station: row.station || "general",
    modifierGroups: (row.modifier_groups as ModifierGroup[]) || [],
    bestseller: row.bestseller || false,
    popular: row.popular || false,
    deliveryPrice: row.delivery_price,
    pickupPrice: row.pickup_price,
  };
}

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("sort_order" as any)
        .order("name");

      if (error) throw error;
      setItems((data || []).map(mapDbItem));
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    categories.forEach((cat) => {
      groups[cat.id] = items.filter((item) => item.category === cat.id);
    });
    return groups;
  }, [items]);

  return { items, groupedItems, loading, refetch: fetchItems };
}

export function getCrossSellItems(items: MenuItem[], cartCategories: string[]): MenuItem[] {
  const suggestedCategories = new Set<string>();
  cartCategories.forEach(cat => {
    const suggestions = crossSellMap[cat];
    if (suggestions) suggestions.forEach(s => suggestedCategories.add(s));
  });

  return items
    .filter(item =>
      suggestedCategories.has(item.category) &&
      !cartCategories.includes(item.category) &&
      (item.bestseller || item.popular)
    )
    .slice(0, 4);
}
