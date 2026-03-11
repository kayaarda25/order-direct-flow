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
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
}

export const categories: MenuCategory[] = [
  { id: "vorspeisen", name: "Vorspeisen", icon: "🥖" },
  { id: "salate", name: "Salate", icon: "🥗" },
  { id: "pizza", name: "Pizza", icon: "🍕" },
  { id: "kinder-pizza", name: "Kinder Pizza", icon: "🍕" },
  { id: "pasta", name: "Pasta", icon: "🍝" },
  { id: "fleisch-fisch-grill", name: "Fleisch, Fisch & Grill", icon: "🥩" },
  { id: "kebab", name: "Kebabgerichte", icon: "🥙" },
  { id: "beilagen", name: "Beilagen", icon: "🧆" },
  { id: "desserts", name: "Desserts", icon: "🍰" },
  { id: "getraenke", name: "Getränke", icon: "🥤" },
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

function mapDbItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price: row.price,
    image: row.image_url || "/placeholder.svg",
    category: row.category,
    station: row.station || "general",
    modifierGroups: (row.modifier_groups as ModifierGroup[]) || [],
    bestseller: row.bestseller || false,
    popular: row.popular || false,
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
