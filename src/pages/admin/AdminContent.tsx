import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  about_title: string;
  about_text: string;
  about_image: string;
  footer_phone: string;
  footer_email: string;
  footer_address: string;
}

const DEFAULT_CONTENT: ContentSettings = {
  hero_title: "Willkommen bei Piratino",
  hero_subtitle: "Authentische italienische Küche",
  hero_image: "",
  about_title: "Über uns",
  about_text: "",
  about_image: "",
  footer_phone: "",
  footer_email: "",
  footer_address: "",
};

const AdminContent = () => {
  const [content, setContent] = useState<ContentSettings>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "content")
      .single();

    if (!error && data) {
      setContent({ ...DEFAULT_CONTENT, ...(data.value as Record<string, string>) });
    }
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, []);

  const saveContent = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "content")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: content as unknown as Record<string, string>, updated_at: new Date().toISOString() })
          .eq("key", "content");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "content", value: content as unknown as Record<string, string> });
        if (error) throw error;
      }

      toast({ title: "Gespeichert", description: "Seiteninhalte wurden aktualisiert." });
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (field: keyof ContentSettings, file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Max. 5MB", variant: "destructive" });
      return;
    }

    const ext = file.name.split(".").pop();
    const fileName = `site-${field}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("menu-images").upload(fileName, file);
    if (error) {
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
      return;
    }

    const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
    setContent((prev) => ({ ...prev, [field]: data.publicUrl }));
    toast({ title: "Bild hochgeladen" });
  };

  if (loading) return <div className="py-8 text-center">Laden...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Seiteninhalte</h1>
        <Button onClick={saveContent} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Speichern..." : "Speichern"}
        </Button>
      </div>

      <Tabs defaultValue="hero">
        <TabsList>
          <TabsTrigger value="hero">Hero-Bereich</TabsTrigger>
          <TabsTrigger value="about">Über uns</TabsTrigger>
          <TabsTrigger value="contact">Kontakt & Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Hero-Bereich</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titel</label>
                <Input
                  value={content.hero_title}
                  onChange={(e) => setContent((p) => ({ ...p, hero_title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Untertitel</label>
                <Input
                  value={content.hero_subtitle}
                  onChange={(e) => setContent((p) => ({ ...p, hero_subtitle: e.target.value }))}
                />
              </div>
              <ImageField
                label="Hero-Bild"
                value={content.hero_image}
                onUpload={(f) => handleImageUpload("hero_image", f)}
                onRemove={() => setContent((p) => ({ ...p, hero_image: "" }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Über uns</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titel</label>
                <Input
                  value={content.about_title}
                  onChange={(e) => setContent((p) => ({ ...p, about_title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Text</label>
                <Textarea
                  value={content.about_text}
                  onChange={(e) => setContent((p) => ({ ...p, about_text: e.target.value }))}
                  rows={6}
                />
              </div>
              <ImageField
                label="Bild"
                value={content.about_image}
                onUpload={(f) => handleImageUpload("about_image", f)}
                onRemove={() => setContent((p) => ({ ...p, about_image: "" }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Kontaktdaten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Telefon</label>
                <Input
                  value={content.footer_phone}
                  onChange={(e) => setContent((p) => ({ ...p, footer_phone: e.target.value }))}
                  placeholder="+41 44 123 45 67"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">E-Mail</label>
                <Input
                  value={content.footer_email}
                  onChange={(e) => setContent((p) => ({ ...p, footer_email: e.target.value }))}
                  placeholder="info@piratino.ch"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Adresse</label>
                <Textarea
                  value={content.footer_address}
                  onChange={(e) => setContent((p) => ({ ...p, footer_address: e.target.value }))}
                  rows={2}
                  placeholder="Musterstrasse 1, 8048 Zürich"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ImageFieldProps {
  label: string;
  value: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const ImageField = ({ label, value, onUpload, onRemove }: ImageFieldProps) => (
  <div>
    <label className="text-sm font-medium mb-1 block">{label}</label>
    {value ? (
      <div className="relative inline-block">
        <img src={value} alt={label} className="w-full max-w-md h-40 object-cover rounded-lg border border-border" />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
          className="w-full"
        />
      </div>
    )}
  </div>
);

export default AdminContent;
