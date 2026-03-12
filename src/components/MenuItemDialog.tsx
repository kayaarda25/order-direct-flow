import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/hooks/useMenuItems";
import { Upload, X } from "lucide-react";

const PIZZA_CATEGORIES = ["pizza", "kinder-pizza"];
const DRINK_CATEGORY = "getraenke";
const PASTA_CATEGORY = "pasta";

const menuItemSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  price: z.number().min(0, "Preis muss positiv sein"),
  price_normal: z.number().optional(),
  price_gross: z.number().optional(),
  // Per-size pickup prices for pizza
  pickup_price_klein: z.number().optional(),
  pickup_price_normal: z.number().optional(),
  pickup_price_gross: z.number().optional(),
  // Per-size delivery prices for pizza
  delivery_price_klein: z.number().optional(),
  delivery_price_normal: z.number().optional(),
  delivery_price_gross: z.number().optional(),
  // Drink size prices
  price_033: z.number().optional(),
  price_05: z.number().optional(),
  price_15: z.number().optional(),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  allergens: z.string().optional(),
  available: z.boolean().default(true),
  bestseller: z.boolean().default(false),
  popular: z.boolean().default(false),
  delivery_price: z.number().optional(),
  pickup_price: z.number().optional(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  allergens: string[];
  available: boolean;
  bestseller: boolean;
  popular: boolean;
  station: string;
  modifier_groups: any[];
  sort_order: number;
  delivery_price?: number | null;
  pickup_price?: number | null;
}

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  onSaved: () => void;
  onClose: () => void;
}

function extractSizePrices(basePrice: number, modifierGroups: any[]): { normal: number; gross: number; pickupKlein?: number; pickupNormal?: number; pickupGross?: number; deliveryKlein?: number; deliveryNormal?: number; deliveryGross?: number } | null {
  const sizeGroup = modifierGroups?.find((g: any) => g.id === "groesse");
  if (!sizeGroup) return null;
  const normal = sizeGroup.options?.find((o: any) => o.id === "normal");
  const gross = sizeGroup.options?.find((o: any) => o.id === "gross");
  const klein = sizeGroup.options?.find((o: any) => o.id === "klein");
  return {
    normal: basePrice + (normal?.price || 0),
    gross: basePrice + (gross?.price || 0),
    pickupKlein: klein?.pickup_price,
    pickupNormal: normal?.pickup_price,
    pickupGross: gross?.pickup_price,
    deliveryKlein: klein?.delivery_price,
    deliveryNormal: normal?.delivery_price,
    deliveryGross: gross?.delivery_price,
  };
}

function extractDrinkSizePrices(modifierGroups: any[]): { p033: number; p05: number; p15: number } | null {
  const sizeGroup = modifierGroups?.find((g: any) => g.id === "groesse");
  if (!sizeGroup) return null;
  const p033 = sizeGroup.options?.find((o: any) => o.id === "0.33l");
  const p05 = sizeGroup.options?.find((o: any) => o.id === "0.5l");
  const p15 = sizeGroup.options?.find((o: any) => o.id === "1.5l");
  if (!p033 && !p05 && !p15) return null;
  return {
    p033: p033?.price || 0,
    p05: p05?.price || 0,
    p15: p15?.price || 0,
  };
}

const MenuItemDialog = ({
  open,
  onOpenChange,
  item,
  onSaved,
  onClose,
}: MenuItemDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Per-size drink images
  const [drinkSizeImages, setDrinkSizeImages] = useState<Record<string, { file: File | null; preview: string | null }>>({
    "0.33l": { file: null, preview: null },
    "0.5l": { file: null, preview: null },
    "1.5l": { file: null, preview: null },
  });
  const { toast } = useToast();

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      price_normal: 0,
      price_gross: 0,
      pickup_price_klein: undefined,
      pickup_price_normal: undefined,
      pickup_price_gross: undefined,
      delivery_price_klein: undefined,
      delivery_price_normal: undefined,
      delivery_price_gross: undefined,
      price_033: 0,
      price_05: 0,
      price_15: 0,
      category: "",
      allergens: "",
      available: true,
      bestseller: false,
      popular: false,
      delivery_price: undefined,
      pickup_price: undefined,
    },
  });

  const watchCategory = form.watch("category");
  const isPizza = PIZZA_CATEGORIES.includes(watchCategory);
  const isDrink = watchCategory === DRINK_CATEGORY;

  useEffect(() => {
    if (item) {
      const sizePrices = extractSizePrices(item.price, item.modifier_groups);
      const drinkPrices = extractDrinkSizePrices(item.modifier_groups);
      form.reset({
        name: item.name,
        description: item.description || "",
        price: item.price,
        price_normal: sizePrices?.normal || 0,
        price_gross: sizePrices?.gross || 0,
        pickup_price_klein: sizePrices?.pickupKlein,
        pickup_price_normal: sizePrices?.pickupNormal,
        pickup_price_gross: sizePrices?.pickupGross,
        price_033: drinkPrices?.p033 || 0,
        price_05: drinkPrices?.p05 || 0,
        price_15: drinkPrices?.p15 || 0,
        category: item.category,
        allergens: item.allergens?.join(", ") || "",
        available: item.available,
        bestseller: item.bestseller || false,
        popular: item.popular || false,
        delivery_price: item.delivery_price ?? undefined,
        pickup_price: item.pickup_price ?? undefined,
      });
      setImagePreview(item.image_url);
      setImageFile(null);
      // Load drink size images from modifier groups
      const drinkSizeGroup = item.modifier_groups?.find((g: any) => g.id === "groesse");
      if (item.category === DRINK_CATEGORY && drinkSizeGroup) {
        const imgs: Record<string, { file: File | null; preview: string | null }> = {
          "0.33l": { file: null, preview: null },
          "0.5l": { file: null, preview: null },
          "1.5l": { file: null, preview: null },
        };
        drinkSizeGroup.options?.forEach((opt: any) => {
          if (opt.image_url && imgs[opt.id]) {
            imgs[opt.id] = { file: null, preview: opt.image_url };
          }
        });
        setDrinkSizeImages(imgs);
      } else {
        setDrinkSizeImages({ "0.33l": { file: null, preview: null }, "0.5l": { file: null, preview: null }, "1.5l": { file: null, preview: null } });
      }
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        price_normal: 0,
        price_gross: 0,
        pickup_price_klein: undefined,
        pickup_price_normal: undefined,
        pickup_price_gross: undefined,
        price_033: 0,
        price_05: 0,
        price_15: 0,
        category: "",
        allergens: "",
        available: true,
        bestseller: false,
        popular: false,
        delivery_price: undefined,
        pickup_price: undefined,
      });
      setImagePreview(null);
      setImageFile(null);
      setDrinkSizeImages({ "0.33l": { file: null, preview: null }, "0.5l": { file: null, preview: null }, "1.5l": { file: null, preview: null } });
    }
    setUploadProgress(0);
  }, [item, form]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Ungültiger Dateityp", description: "Bitte wähle eine Bilddatei.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Datei zu gross", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrinkSizeImageSelect = (sizeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Ungültiger Dateityp", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Datei zu gross", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDrinkSizeImages(prev => ({
        ...prev,
        [sizeId]: { file, preview: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeDrinkSizeImage = (sizeId: string) => {
    setDrinkSizeImages(prev => ({
      ...prev,
      [sizeId]: { file: null, preview: null },
    }));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    setUploadProgress(10);
    const { error: uploadError } = await supabase.storage.from('menu-images').upload(fileName, file);
    if (uploadError) throw uploadError;
    setUploadProgress(80);
    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    setUploadProgress(100);
    return data.publicUrl;
  };

  const onSubmit = async (data: MenuItemFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        setUploadProgress(0);
        imageUrl = await uploadImage(imageFile);
      } else if (item?.image_url && !imageFile) {
        imageUrl = item.image_url;
      }

      const allergensList = data.allergens
        ? data.allergens.split(",").map((a) => a.trim()).filter(Boolean)
        : [];

      // Build modifier groups
      let modifierGroups: any[] = item?.modifier_groups || [];

      if (PIZZA_CATEGORIES.includes(data.category)) {
        // Build size modifier group
        const sizeGroup = {
          id: "groesse",
          name: "Grösse",
          required: true,
          multiSelect: false,
          options: [
            { id: "klein", name: "Klein 24cm", price: 0, pickup_price: data.pickup_price_klein ?? null },
            { id: "normal", name: "Normal 32cm", price: (data.price_normal || data.price) - data.price, pickup_price: data.pickup_price_normal ?? null },
            { id: "gross", name: "Gross 45cm", price: (data.price_gross || data.price) - data.price, pickup_price: data.pickup_price_gross ?? null },
          ],
        };

        // Keep extras group if exists, replace size group
        const extrasGroup = modifierGroups.find((g: any) => g.id === "extras");
        modifierGroups = [sizeGroup];
        if (extrasGroup) modifierGroups.push(extrasGroup);

        // If no extras group exists, add default pizza extras
        if (!extrasGroup) {
          modifierGroups.push({
            id: "extras",
            name: "Extra Zutaten",
            required: false,
            multiSelect: true,
            options: [
              { id: "extra-mozzarella", name: "Extra Mozzarella", price: 2.5 },
              { id: "extra-gorgonzola", name: "Gorgonzola", price: 3.0 },
              { id: "extra-salami", name: "Salami", price: 2.5 },
              { id: "extra-prosciutto", name: "Prosciutto", price: 3.0 },
              { id: "extra-funghi", name: "Champignons", price: 2.0 },
              { id: "extra-olive", name: "Oliven", price: 2.0 },
              { id: "extra-peperoni", name: "Peperoni", price: 2.0 },
              { id: "extra-rucola", name: "Rucola", price: 1.5 },
              { id: "extra-tonno", name: "Thunfisch", price: 3.0 },
              { id: "extra-cipolla", name: "Zwiebeln", price: 1.5 },
            ],
          });
        }
      } else if (data.category === DRINK_CATEGORY) {
        const existingGroesse = modifierGroups.find((g: any) => g.id === "groesse");
        if (existingGroesse) {
          // Upload per-size images
          const sizeImageUrls: Record<string, string | undefined> = {};
          for (const sizeId of ["0.33l", "0.5l", "1.5l"]) {
            const sizeImg = drinkSizeImages[sizeId];
            if (sizeImg?.file) {
              sizeImageUrls[sizeId] = (await uploadImage(sizeImg.file)) || undefined;
            } else if (sizeImg?.preview) {
              sizeImageUrls[sizeId] = sizeImg.preview;
            }
          }

          const sizeGroup = {
            id: "groesse",
            name: "Grösse",
            required: true,
            multiSelect: false,
            options: [
              { id: "0.33l", name: "0.33l", price: data.price_033 || 0, image_url: sizeImageUrls["0.33l"] || null },
              { id: "0.5l", name: "0.5l", price: data.price_05 || 0, image_url: sizeImageUrls["0.5l"] || null },
              { id: "1.5l", name: "1.5l", price: data.price_15 || 0, image_url: sizeImageUrls["1.5l"] || null },
            ],
          };
          modifierGroups = [sizeGroup];
        }
      } else if (data.category === PASTA_CATEGORY) {
        // Ensure pasta type modifier exists
        const hasPastaType = modifierGroups.some((g: any) => g.id === "pasta-art");
        if (!hasPastaType) {
          modifierGroups = [
            {
              id: "pasta-art",
              name: "Pasta-Art",
              required: true,
              multiSelect: false,
              options: [
                { id: "penne", name: "Penne", price: 0 },
                { id: "spaghetti", name: "Spaghetti", price: 0 },
              ],
            },
            ...modifierGroups,
          ];
        }
      }

      const menuItemData: any = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        category: data.category,
        image_url: imageUrl,
        allergens: allergensList,
        available: data.available,
        bestseller: data.bestseller,
        popular: data.popular,
        modifier_groups: modifierGroups,
        delivery_price: data.delivery_price || null,
        pickup_price: data.pickup_price || null,
      };

      if (item) {
        const { error } = await supabase.from("menu_items").update(menuItemData).eq("id", item.id);
        if (error) throw error;
        toast({ title: "Element aktualisiert" });
      } else {
        const { error } = await supabase.from("menu_items").insert(menuItemData);
        if (error) throw error;
        toast({ title: "Element erstellt" });
      }

      onSaved();
    } catch (error) {
      toast({ title: "Fehler beim Speichern", description: String(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Menüelement bearbeiten" : "Neues Menüelement"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Base price - hidden for pizza (included in size grid below) */}
            {!isPizza && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preis (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Pizza size prices - all 3 in one grid */}
            {isPizza && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 p-3 border border-border rounded-lg bg-muted/50">
                  <p className="col-span-3 text-sm font-semibold text-foreground">Pizza-Grössen (Preise CHF)</p>
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Klein 24cm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_normal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Normal 32cm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_gross"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Gross 45cm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 border border-border rounded-lg bg-muted/50">
                  <p className="col-span-3 text-sm font-semibold text-foreground">Abholpreise pro Grösse (optional)</p>
                  <FormField
                    control={form.control}
                    name="pickup_price_klein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Klein 24cm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Standard"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickup_price_normal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Normal 32cm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Standard"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickup_price_gross"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Gross 45cm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Standard"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Drink size prices & images */}
            {isDrink && (
              <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/50">
                <p className="text-sm font-semibold text-foreground">Getränke-Grössen</p>
                {[
                  { sizeId: "0.33l", label: "0.33l", priceField: "price_033" as const },
                  { sizeId: "0.5l", label: "0.5l", priceField: "price_05" as const },
                  { sizeId: "1.5l", label: "1.5l", priceField: "price_15" as const },
                ].map(({ sizeId, label, priceField }) => (
                  <div key={sizeId} className="flex items-start gap-3 p-2 bg-card rounded-md border border-border">
                    {/* Size image */}
                    <div className="w-16 h-16 shrink-0">
                      {drinkSizeImages[sizeId]?.preview ? (
                        <div className="relative w-full h-full">
                          <img src={drinkSizeImages[sizeId].preview!} alt={label} className="w-full h-full object-cover rounded" />
                          <button type="button" onClick={() => removeDrinkSizeImage(sizeId)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-full border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:border-muted-foreground">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDrinkSizeImageSelect(sizeId, e)} />
                        </label>
                      )}
                    </div>
                    {/* Size price */}
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={priceField}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">{label} (CHF)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery/pickup prices - only for non-pizza (pizza has per-size pickup above) */}
            {!isPizza && (
            <div className="grid grid-cols-2 gap-3 p-3 border border-border rounded-lg bg-muted/50">
              <p className="col-span-2 text-sm font-semibold text-foreground">Liefer- / Abholpreise (optional)</p>
              <FormField
                control={form.control}
                name="delivery_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Lieferpreis (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Standard"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pickup_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Abholpreis (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Standard"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Bild</FormLabel>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <div className="text-sm text-muted-foreground mb-2">Bild auswählen</div>
                  <Input type="file" accept="image/*" onChange={handleFileSelect} className="w-full" />
                  <div className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP bis 5MB</div>
                </div>
              ) : (
                <div className="relative">
                  <img src={imagePreview} alt="Vorschau" className="w-full h-32 object-cover rounded-lg border" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && <Progress value={uploadProgress} className="w-full" />}
            </div>

            <FormField
              control={form.control}
              name="allergens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergene (durch Kommas getrennt)</FormLabel>
                  <FormControl><Input {...field} placeholder="z.B. Gluten, Nüsse, Milch" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center gap-1 rounded-lg border p-3">
                    <FormLabel className="text-xs">Verfügbar</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bestseller"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center gap-1 rounded-lg border p-3">
                    <FormLabel className="text-xs">Bestseller</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="popular"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center gap-1 rounded-lg border p-3">
                    <FormLabel className="text-xs">Beliebt</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemDialog;
