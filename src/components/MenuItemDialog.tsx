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
import { categories } from "@/data/menu";
import { Upload, X } from "lucide-react";

const menuItemSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  price: z.number().min(0, "Preis muss positiv sein"),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  allergens: z.string().optional(),
  available: z.boolean().default(true),
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
}

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  onSaved: () => void;
  onClose: () => void;
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
  const { toast } = useToast();

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      allergens: "",
      available: true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description || "",
        price: item.price,
        category: item.category,
        allergens: item.allergens.join(", "),
        available: item.available,
      });
      setImagePreview(item.image_url);
      setImageFile(null);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        allergens: "",
        available: true,
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setUploadProgress(0);
  }, [item, form]);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Bilddatei.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf nicht größer als 5MB sein.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
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

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    setUploadProgress(80);

    const { data } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);

    setUploadProgress(100);
    return data.publicUrl;
  };
  const onSubmit = async (data: MenuItemFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = null;
      
      // Upload image if one is selected
      if (imageFile) {
        setUploadProgress(0);
        imageUrl = await uploadImage(imageFile);
      } else if (item?.image_url && !imageFile) {
        // Keep existing image if no new file is selected
        imageUrl = item.image_url;
      }

      const allergensList = data.allergens
        ? data.allergens.split(",").map((a) => a.trim()).filter(Boolean)
        : [];

      const menuItemData = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        category: data.category,
        image_url: imageUrl,
        allergens: allergensList,
        available: data.available,
      };

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from("menu_items")
          .update(menuItemData)
          .eq("id", item.id);

        if (error) throw error;

        toast({
          title: "Element aktualisiert",
          description: "Das Menüelement wurde erfolgreich aktualisiert.",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from("menu_items")
          .insert(menuItemData);

        if (error) throw error;

        toast({
          title: "Element erstellt",
          description: "Das neue Menüelement wurde erfolgreich erstellt.",
        });
      }

      onSaved();
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Das Menüelement konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preis (CHF)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Section */}
            <div className="space-y-2">
              <FormLabel>Bild</FormLabel>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <div className="text-sm text-gray-500 mb-2">
                    Klicken Sie, um ein Bild auszuwählen
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    PNG, JPG, WEBP bis 5MB
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Vorschau"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </div>

            <FormField
              control={form.control}
              name="allergens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergene (durch Kommas getrennt)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="z.B. Gluten, Nüsse, Milch" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Verfügbar</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
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