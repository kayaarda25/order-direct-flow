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
  { id: "softdrinks", name: "Softdrinks", icon: "🥤" },
  { id: "bier", name: "Bier", icon: "🍺" },
  { id: "spirituosen", name: "Spirituosen", icon: "🥃" },
];

// Cross-sell mapping: category -> suggested categories
export const crossSellMap: Record<string, string[]> = {
  "pizza-32": ["softdrinks", "beilagen", "desserts"],
  "pizza-45": ["softdrinks", "beilagen", "desserts"],
  "pizza-50": ["softdrinks", "beilagen", "desserts"],
  "pasta": ["softdrinks", "vorspeisen", "desserts"],
  "kebab": ["softdrinks", "beilagen"],
  "fleisch-fisch-grill": ["softdrinks", "beilagen", "desserts"],
  "salate": ["softdrinks", "pasta"],
  "vorspeisen": ["softdrinks", "pizza-32", "pasta"],
};

// Upsell mapping: item category -> upgrade category
export const upsellMap: Record<string, string> = {
  "pizza-32": "pizza-45",
  "pizza-45": "pizza-50",
};

function makeModifierGroup(modifierString: string): ModifierGroup[] {
  if (!modifierString || modifierString.trim() === "") return [];
  const options = modifierString.split(",").map((m) => m.trim()).filter(Boolean);
  if (options.length === 0) return [];
  return [
    {
      id: "options",
      name: "Optionen",
      required: false,
      multiSelect: true,
      options: options.map((name) => ({
        id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        name,
        price: 0,
      })),
    },
  ];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const menuItems: MenuItem[] = [
  // Vorspeisen
  {
    id: slugify("Bruschetta"),
    name: "Bruschetta",
    description: "Geröstetes Brot mit frischen Tomaten und Knoblauch",
    price: 12,
    image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop",
    category: "vorspeisen",
    station: "starters",
    modifierGroups: [],
    bestseller: true,
  },
  {
    id: slugify("Carpaccio di Manzo"),
    name: "Carpaccio di Manzo",
    description: "Hauchdünn geschnittenes Rindfleisch mit Rucola und Parmesan",
    price: 18,
    image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=300&fit=crop",
    category: "vorspeisen",
    station: "starters",
    modifierGroups: [],
  },
  {
    id: slugify("Vitello Tonnato"),
    name: "Vitello Tonnato",
    description: "Kalbfleisch mit Thunfischsauce",
    price: 16,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop",
    category: "vorspeisen",
    station: "starters",
    modifierGroups: [],
  },

  // Salate
  {
    id: slugify("Caesar Salad"),
    name: "Caesar Salad",
    description: "Romana, Caesar-Dressing, Croutons, Parmesan",
    price: 16,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    category: "salate",
    station: "salad",
    modifierGroups: makeModifierGroup("Mit Poulet, Ohne Croutons"),
    bestseller: true,
  },
  {
    id: slugify("Insalata Caprese"),
    name: "Insalata Caprese",
    description: "Tomaten, Mozzarella, Basilikum",
    price: 14,
    image: "https://images.unsplash.com/photo-1608032077018-c9aad9565d29?w=400&h=300&fit=crop",
    category: "salate",
    station: "salad",
    modifierGroups: [],
  },
  {
    id: slugify("Insalata Mista"),
    name: "Insalata Mista",
    description: "Gemischter Salat mit Hausdressing",
    price: 12,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    category: "salate",
    station: "salad",
    modifierGroups: [],
  },

  // Pizza - 32cm
  {
    id: slugify("Pizza Margherita 32cm"),
    name: "Pizza Margherita",
    description: "Tomatensauce, Mozzarella, frisches Basilikum",
    price: 19,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: [],
    bestseller: true,
  },
  {
    id: slugify("Pizza Prosciutto 32cm"),
    name: "Pizza Prosciutto",
    description: "Tomatensauce, Mozzarella, Schinken",
    price: 22,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Pizza Diavola 32cm"),
    name: "Pizza Diavola",
    description: "Tomatensauce, Mozzarella, scharfe Salami, Peperoni",
    price: 23,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: [],
    bestseller: true,
  },
  {
    id: slugify("Pizza Prosciutto e Funghi 32cm"),
    name: "Pizza Prosciutto e Funghi",
    description: "Tomatensauce, Mozzarella, Schinken, Champignons",
    price: 24,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: [],
  },
  {
    id: slugify("Pizza Calzone 32cm"),
    name: "Pizza Calzone",
    description: "Gefüllte Pizza mit Schinken, Champignons, Mozzarella",
    price: 24,
    image: "https://images.unsplash.com/photo-1536964549204-cce9eab227bd?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Pizza Quattro Stagioni 32cm"),
    name: "Pizza Quattro Stagioni",
    description: "Tomatensauce, Mozzarella, Schinken, Pilze, Artischocken, Oliven",
    price: 25,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: [],
  },
  {
    id: slugify("Pizza Tonno 32cm"),
    name: "Pizza Tonno",
    description: "Tomatensauce, Mozzarella, Thunfisch, Zwiebeln",
    price: 23,
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: [],
  },
  {
    id: slugify("My Pizza 32cm"),
    name: "My Pizza",
    description: "Stelle deine eigene Pizza zusammen",
    price: 28,
    image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=400&h=300&fit=crop",
    category: "pizza-32",
    station: "pizza",
    modifierGroups: makeModifierGroup("Extra Käse, Extra Schinken, Salami, Pilze, Oliven, Peperoni"),
  },

  // Pizza Grande - 45cm
  {
    id: slugify("Pizza Margherita 45cm"),
    name: "Pizza Margherita Grande",
    description: "Tomatensauce, Mozzarella, frisches Basilikum",
    price: 32,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    category: "pizza-45",
    station: "pizza",
    modifierGroups: [],
  },
  {
    id: slugify("Pizza Prosciutto 45cm"),
    name: "Pizza Prosciutto Grande",
    description: "Tomatensauce, Mozzarella, Schinken",
    price: 36,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: "pizza-45",
    station: "pizza",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Pizza Prosciutto e Funghi 45cm"),
    name: "Pizza Prosciutto e Funghi Grande",
    description: "Tomatensauce, Mozzarella, Schinken, Champignons",
    price: 38,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    category: "pizza-45",
    station: "pizza",
    modifierGroups: [],
  },

  // Pizza - 50cm
  {
    id: slugify("Pizza Margherita 50cm"),
    name: "Pizza Margherita XXL",
    description: "Tomatensauce, Mozzarella, frisches Basilikum",
    price: 38,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    category: "pizza-50",
    station: "pizza",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Pizza Prosciutto 50cm"),
    name: "Pizza Prosciutto XXL",
    description: "Tomatensauce, Mozzarella, Schinken",
    price: 42,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: "pizza-50",
    station: "pizza",
    modifierGroups: [],
  },

  // Kinder Pizza
  {
    id: slugify("Kinder Pizza Margherita"),
    name: "Kinder Pizza Margherita",
    description: "Kleine Pizza mit Tomatensauce und Mozzarella",
    price: 10,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    category: "kinder-pizza",
    station: "pizza",
    modifierGroups: [],
  },
  {
    id: slugify("Kinder Pizza Prosciutto"),
    name: "Kinder Pizza Prosciutto",
    description: "Kleine Pizza mit Tomatensauce, Mozzarella und Schinken",
    price: 12,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: "kinder-pizza",
    station: "pizza",
    modifierGroups: [],
  },

  // Pasta
  {
    id: slugify("Pasta Carbonara"),
    name: "Pasta Carbonara",
    description: "Speck, Ei, Parmesan, schwarzer Pfeffer",
    price: 18,
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop",
    category: "pasta",
    station: "grill",
    modifierGroups: [],
    bestseller: true,
  },
  {
    id: slugify("Pasta Piratino"),
    name: "Pasta Piratino",
    description: "Pasta mit Meeresfrüchten in Tomatensauce",
    price: 21,
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop",
    category: "pasta",
    station: "grill",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Pasta Bolognese"),
    name: "Pasta Bolognese",
    description: "Hausgemachte Fleischsauce, Parmesan",
    price: 23,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    category: "pasta",
    station: "grill",
    modifierGroups: [],
  },
  {
    id: slugify("Lasagne"),
    name: "Lasagne",
    description: "Hausgemachte Lasagne mit Fleischsauce und Béchamel",
    price: 23,
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop",
    category: "pasta",
    station: "grill",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Pasta Ai Funghi Porcini"),
    name: "Pasta Ai Funghi Porcini",
    description: "Pasta mit Steinpilzen in Rahmsauce",
    price: 24,
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop",
    category: "pasta",
    station: "grill",
    modifierGroups: [],
  },
  {
    id: slugify("Penne Al Forno"),
    name: "Penne Al Forno",
    description: "Überbackene Penne mit Tomatensauce und Käse",
    price: 24,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    category: "pasta",
    station: "grill",
    modifierGroups: [],
  },

  // Fleisch, Fisch & Grill
  {
    id: slugify("Scaloppine ai Funghi"),
    name: "Scaloppine ai Funghi",
    description: "Kalbsschnitzel mit Pilzrahmsauce",
    price: 32,
    image: "https://images.unsplash.com/photo-1432139509613-5c4255a1d1f3?w=400&h=300&fit=crop",
    category: "fleisch-fisch-grill",
    station: "grill",
    modifierGroups: [],
  },
  {
    id: slugify("Saltimbocca alla Romana"),
    name: "Saltimbocca alla Romana",
    description: "Kalbfleisch mit Parmaschinken und Salbei",
    price: 34,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
    category: "fleisch-fisch-grill",
    station: "grill",
    modifierGroups: [],
    bestseller: true,
  },
  {
    id: slugify("Filetto di Salmone"),
    name: "Filetto di Salmone",
    description: "Gegrilltes Lachsfilet",
    price: 36,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
    category: "fleisch-fisch-grill",
    station: "grill",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Entrecote alla Griglia"),
    name: "Entrecôte alla Griglia",
    description: "Gegrilltes Entrecôte vom Rind",
    price: 38,
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop",
    category: "fleisch-fisch-grill",
    station: "grill",
    modifierGroups: makeModifierGroup("Medium, Well Done, Rare"),
    bestseller: true,
  },

  // Kebabgerichte
  {
    id: slugify("Kebab im Fladenbrot"),
    name: "Kebab im Fladenbrot",
    description: "Kebab mit frischem Gemüse im Fladenbrot",
    price: 14,
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop",
    category: "kebab",
    station: "grill",
    modifierGroups: [],
    bestseller: true,
  },
  {
    id: slugify("Dueruem Kebab"),
    name: "Dürüm Kebab",
    description: "Kebab im dünnen Fladenbrot gerollt",
    price: 15,
    image: "https://images.unsplash.com/photo-1633321702518-7fecdafb94d5?w=400&h=300&fit=crop",
    category: "kebab",
    station: "grill",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Kebab Teller"),
    name: "Kebab Teller",
    description: "Kebab mit Reis oder Pommes und Salat",
    price: 18,
    image: "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=400&h=300&fit=crop",
    category: "kebab",
    station: "grill",
    modifierGroups: makeModifierGroup("Mit Reis, Mit Pommes"),
  },

  // Beilagen
  {
    id: slugify("Hausgemachte Joghurtsosse"),
    name: "Joghurtsosse",
    description: "Frische hausgemachte Joghurtsosse",
    price: 3,
    image: "https://images.unsplash.com/photo-1563599175592-c58dc3ea0b82?w=400&h=300&fit=crop",
    category: "beilagen",
    station: "sides",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Hausgemachte Knoblauchsosse"),
    name: "Knoblauchsosse",
    description: "Cremige Knoblauchsauce",
    price: 3,
    image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=300&fit=crop",
    category: "beilagen",
    station: "sides",
    modifierGroups: [],
  },
  {
    id: slugify("Hausgemachte Peperoncini in Olivenoel"),
    name: "Peperoncini in Olivenöl",
    description: "Scharfe Peperoncini eingelegt in Olivenöl",
    price: 4,
    image: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=300&fit=crop",
    category: "beilagen",
    station: "sides",
    modifierGroups: [],
  },
  {
    id: slugify("Warme Broetli"),
    name: "Warme Brötli",
    description: "Frisch aufgebackene warme Brötli",
    price: 6,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    category: "beilagen",
    station: "sides",
    modifierGroups: [],
    popular: true,
  },

  // Desserts
  {
    id: slugify("Souffle al Cioccolato"),
    name: "Soufflé al Cioccolato",
    description: "Warmes Schokoladensoufflé",
    price: 8,
    image: "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&h=300&fit=crop",
    category: "desserts",
    station: "sides",
    modifierGroups: [],
  },
  {
    id: slugify("Cheesecake"),
    name: "Cheesecake",
    description: "Cremiger New York Cheesecake",
    price: 9,
    image: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop",
    category: "desserts",
    station: "sides",
    modifierGroups: [],
  },
  {
    id: slugify("Panna Cotta"),
    name: "Panna Cotta",
    description: "Italienische Panna Cotta",
    price: 9,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
    category: "desserts",
    station: "sides",
    modifierGroups: [],
  },
  {
    id: slugify("Tiramisu"),
    name: "Tiramisu",
    description: "Hausgemacht mit Mascarpone und Espresso",
    price: 12,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
    category: "desserts",
    station: "sides",
    modifierGroups: [],
    bestseller: true,
  },

  // Softdrinks
  {
    id: slugify("Mineral Wasser"),
    name: "Mineral Wasser",
    description: "Schweizer Mineralwasser 5dl",
    price: 4,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop",
    category: "softdrinks",
    station: "drinks",
    modifierGroups: [],
  },
  {
    id: slugify("Coca Cola"),
    name: "Coca Cola",
    description: "Erfrischendes Kaltgetränk 3.3dl",
    price: 4.5,
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
    category: "softdrinks",
    station: "drinks",
    modifierGroups: [],
    bestseller: true,
  },
  {
    id: slugify("Eistee"),
    name: "Eistee",
    description: "Erfrischender Eistee 5dl",
    price: 4.5,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    category: "softdrinks",
    station: "drinks",
    modifierGroups: [],
  },
  {
    id: slugify("Fanta"),
    name: "Fanta",
    description: "Orangenlimonade 3.3dl",
    price: 4.5,
    image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&h=300&fit=crop",
    category: "softdrinks",
    station: "drinks",
    modifierGroups: [],
  },
  {
    id: slugify("Sprite"),
    name: "Sprite",
    description: "Zitronenlimonade 3.3dl",
    price: 4.5,
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=300&fit=crop",
    category: "softdrinks",
    station: "drinks",
    modifierGroups: [],
  },

  // Bier
  {
    id: slugify("Feldschloesschen"),
    name: "Feldschlösschen",
    description: "Schweizer Lagerbier 3.3dl",
    price: 5.5,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop",
    category: "bier",
    station: "drinks",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Peroni"),
    name: "Peroni",
    description: "Italienisches Bier 3.3dl",
    price: 6,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop",
    category: "bier",
    station: "drinks",
    modifierGroups: [],
  },
  {
    id: slugify("Corona"),
    name: "Corona",
    description: "Mexikanisches Bier 3.3dl",
    price: 6.5,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop",
    category: "bier",
    station: "drinks",
    modifierGroups: [],
  },

  // Spirituosen
  {
    id: slugify("Limoncello"),
    name: "Limoncello",
    description: "Italienischer Zitronenlikör 2cl",
    price: 7,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop",
    category: "spirituosen",
    station: "drinks",
    modifierGroups: [],
    popular: true,
  },
  {
    id: slugify("Amaretto"),
    name: "Amaretto",
    description: "Italienischer Mandellikör 2cl",
    price: 8,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop",
    category: "spirituosen",
    station: "drinks",
    modifierGroups: [],
  },
  {
    id: slugify("Grappa"),
    name: "Grappa",
    description: "Italienischer Tresterbrand 2cl",
    price: 8,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop",
    category: "spirituosen",
    station: "drinks",
    modifierGroups: [],
  },
];

// Helper to check if item can be quick-added (no required modifiers)
export function canQuickAdd(item: MenuItem): boolean {
  return item.modifierGroups.length === 0 || !item.modifierGroups.some(g => g.required);
}

// Get cross-sell suggestions based on cart content
export function getCrossSellItems(cartCategories: string[]): MenuItem[] {
  const suggestedCategories = new Set<string>();
  cartCategories.forEach(cat => {
    const suggestions = crossSellMap[cat];
    if (suggestions) {
      suggestions.forEach(s => suggestedCategories.add(s));
    }
  });
  
  // Filter out categories already in cart and get popular items
  const items = menuItems.filter(item => 
    suggestedCategories.has(item.category) && 
    !cartCategories.includes(item.category) &&
    (item.bestseller || item.popular)
  );
  
  return items.slice(0, 4);
}
