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

const menuItemSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  price: z.number().min(0, "Preis muss positiv sein"),
  price_normal: z.number().optional(),
  price_gross: z.number().optional(),
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

function extractSizePrices(modifierGroups: any[]): { klein: number; normal: number; gross: number } | null {
  const sizeGroup = modifierGroups?.find((g: any) => g.id === "groesse");
  if (!sizeGroup) return null;
  const klein = sizeGroup.options?.find((o: any) => o.id === "klein");
  const normal = sizeGroup.options?.find((o: any) => o.id === "normal");
  const gross = sizeGroup.options?.find((o: any) => o.id === "gross");
  return {
    klein: 0,
    normal: normal?.price || 0,
    gross: gross?.price || 0,
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
      const sizePrices = extractSizePrices(item.modifier_groups);
      const drinkPrices = extractDrinkSizePrices(item.modifier_groups);
      form.reset({
        name: item.name,
        description: item.description || "",
        price: item.price,
        price_normal: sizePrices?.normal || 0,
        price_gross: sizePrices?.gross || 0,
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
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        price_normal: 0,
        price_gross: 0,
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
            { id: "klein", name: "Klein 24cm", price: 0 },
            { id: "normal", name: "Normal 32cm", price: data.price_normal || 0 },
            { id: "gross", name: "Gross 45cm", price: data.price_gross || 0 },
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
        // Check if drink has existing groesse group (multi-size drink)
        const existingGroesse = modifierGroups.find((g: any) => g.id === "groesse");
        if (existingGroesse) {
          const sizeGroup = {
            id: "groesse",
            name: "Grösse",
            required: true,
            multiSelect: false,
            options: [
              { id: "0.33l", name: "0.33l", price: data.price_033 || 0 },
              { id: "0.5l", name: "0.5l", price: data.price_05 || 0 },
              { id: "1.5l", name: "1.5l", price: data.price_15 || 0 },
            ],
          };
          modifierGroups = [sizeGroup];
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

            {/* Base price - for pizza this is Klein 24cm */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isPizza ? "Preis Klein 24cm (CHF)" : "Preis (CHF)"}</FormLabel>
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

            {/* Pizza size prices */}
            {isPizza && (
              <div className="grid grid-cols-2 gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                <p className="col-span-2 text-sm font-semibold text-neutral-700">Pizza-Grössen (Aufpreis)</p>
                <FormField
                  control={form.control}
                  name="price_normal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Normal 32cm (+CHF)</FormLabel>
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
                      <FormLabel className="text-xs">Gross 45cm (+CHF)</FormLabel>
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
            )}

            {/* Drink size prices */}
            {isDrink && (
              <div className="grid grid-cols-3 gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                <p className="col-span-3 text-sm font-semibold text-neutral-700">Getränke-Grössen (CHF)</p>
                <FormField
                  control={form.control}
                  name="price_033"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">0.33l</FormLabel>
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
                  name="price_05"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">0.5l</FormLabel>
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
                  name="price_15"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">1.5l</FormLabel>
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
            )}

            <div className="grid grid-cols-2 gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50">
              <p className="col-span-2 text-sm font-semibold text-neutral-700">Liefer- / Abholpreise (optional)</p>
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
