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
  station: "pizza" | "kitchen";
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
}

export const categories: MenuCategory[] = [
  { id: "pizza", name: "Pizza", icon: "🍕" },
  { id: "pasta", name: "Pasta", icon: "🍝" },
  { id: "salads", name: "Salate", icon: "🥗" },
  { id: "burgers", name: "Burgers", icon: "🍔" },
  { id: "desserts", name: "Desserts", icon: "🍰" },
  { id: "drinks", name: "Getränke", icon: "🥤" },
];

const sizeModifier: ModifierGroup = {
  id: "size",
  name: "Grösse",
  required: true,
  multiSelect: false,
  options: [
    { id: "small", name: "Klein (26cm)", price: 0 },
    { id: "medium", name: "Mittel (30cm)", price: 3 },
    { id: "large", name: "Gross (40cm)", price: 6 },
  ],
};

const extraToppings: ModifierGroup = {
  id: "extras",
  name: "Extras",
  required: false,
  multiSelect: true,
  options: [
    { id: "extra-cheese", name: "Extra Käse", price: 2 },
    { id: "olives", name: "Oliven", price: 1.5 },
    { id: "mushrooms", name: "Champignons", price: 1.5 },
    { id: "pepperoni", name: "Peperoni", price: 2 },
    { id: "onions", name: "Zwiebeln", price: 1 },
  ],
};

const sauceModifier: ModifierGroup = {
  id: "sauce",
  name: "Sauce",
  required: false,
  multiSelect: false,
  options: [
    { id: "ketchup", name: "Ketchup", price: 0 },
    { id: "mayo", name: "Mayonnaise", price: 0 },
    { id: "bbq", name: "BBQ Sauce", price: 0.5 },
    { id: "garlic", name: "Knoblauch Sauce", price: 0.5 },
  ],
};

const drinkSizeModifier: ModifierGroup = {
  id: "drink-size",
  name: "Grösse",
  required: true,
  multiSelect: false,
  options: [
    { id: "small-drink", name: "0.33L", price: 0 },
    { id: "large-drink", name: "0.5L", price: 1 },
  ],
};

export const menuItems: MenuItem[] = [
  {
    id: "margherita",
    name: "Pizza Margherita",
    description: "Tomatensauce, Mozzarella, frisches Basilikum",
    price: 14.5,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    category: "pizza",
    station: "pizza",
    modifierGroups: [sizeModifier, extraToppings],
  },
  {
    id: "diavola",
    name: "Pizza Diavola",
    description: "Tomatensauce, Mozzarella, scharfe Salami, Peperoni",
    price: 17.5,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop",
    category: "pizza",
    station: "pizza",
    modifierGroups: [sizeModifier, extraToppings],
  },
  {
    id: "quattro-formaggi",
    name: "Pizza Quattro Formaggi",
    description: "Mozzarella, Gorgonzola, Parmesan, Fontina",
    price: 19,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    category: "pizza",
    station: "pizza",
    modifierGroups: [sizeModifier, extraToppings],
  },
  {
    id: "prosciutto",
    name: "Pizza Prosciutto e Rucola",
    description: "Tomatensauce, Mozzarella, Prosciutto, Rucola, Parmesan",
    price: 20,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: "pizza",
    station: "pizza",
    modifierGroups: [sizeModifier, extraToppings],
  },
  {
    id: "spaghetti-bolognese",
    name: "Spaghetti Bolognese",
    description: "Hausgemachte Fleischsauce, Parmesan",
    price: 16.5,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    category: "pasta",
    station: "kitchen",
    modifierGroups: [],
  },
  {
    id: "penne-arrabiata",
    name: "Penne Arrabiata",
    description: "Scharfe Tomatensauce, Knoblauch, Chili",
    price: 15,
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop",
    category: "pasta",
    station: "kitchen",
    modifierGroups: [],
  },
  {
    id: "carbonara",
    name: "Spaghetti Carbonara",
    description: "Speck, Ei, Parmesan, schwarzer Pfeffer",
    price: 18,
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop",
    category: "pasta",
    station: "kitchen",
    modifierGroups: [],
  },
  {
    id: "caesar-salad",
    name: "Caesar Salat",
    description: "Romana, Caesar-Dressing, Croutons, Parmesan, Poulet",
    price: 14,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    category: "salads",
    station: "kitchen",
    modifierGroups: [],
  },
  {
    id: "mixed-salad",
    name: "Gemischter Salat",
    description: "Frische Blattsalate, Tomaten, Gurken, Hausdressing",
    price: 11,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    category: "salads",
    station: "kitchen",
    modifierGroups: [],
  },
  {
    id: "classic-burger",
    name: "Classic Burger",
    description: "Rindfleisch, Cheddar, Salat, Tomaten, Zwiebeln",
    price: 16,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    category: "burgers",
    station: "kitchen",
    modifierGroups: [sauceModifier],
  },
  {
    id: "chicken-burger",
    name: "Chicken Burger",
    description: "Pouletbrust, Salat, Mayo, Jalapeños",
    price: 15,
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop",
    category: "burgers",
    station: "kitchen",
    modifierGroups: [sauceModifier],
  },
  {
    id: "tiramisu",
    name: "Tiramisu",
    description: "Hausgemacht mit Mascarpone und Espresso",
    price: 9,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
    category: "desserts",
    station: "kitchen",
    modifierGroups: [],
  },
  {
    id: "panna-cotta",
    name: "Panna Cotta",
    description: "Vanille Panna Cotta mit Beerensauce",
    price: 8,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
    category: "desserts",
    station: "kitchen",
    modifierGroups: [],
  },
  {
    id: "coca-cola",
    name: "Coca Cola",
    description: "Erfrischendes Kaltgetränk",
    price: 3.5,
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
    category: "drinks",
    station: "kitchen",
    modifierGroups: [drinkSizeModifier],
  },
  {
    id: "water",
    name: "Mineralwasser",
    description: "Still oder mit Kohlensäure",
    price: 3,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop",
    category: "drinks",
    station: "kitchen",
    modifierGroups: [drinkSizeModifier],
  },
  {
    id: "ice-tea",
    name: "Ice Tea",
    description: "Pfirsich oder Zitrone",
    price: 3.5,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    category: "drinks",
    station: "kitchen",
    modifierGroups: [drinkSizeModifier],
  },
];
