import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, X, Monitor, Smartphone, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  hero_subtitle: "Pizza, Pasta und mehr seit 2006 – das Original",
  hero_image: "",
  about_title: "Über uns",
  about_text: "Am besten, Sie lernen uns persönlich kennen und überzeugen sich vom Geschmack unserer Speisen! Unsere Pizzeria besteht bereits seit 2006.",
  about_image: "",
  footer_phone: "044 431 32 33",
  footer_email: "piratinoag@hotmail.com",
  footer_address: "Badenerstrasse 696, 8048 Zürich",
};

type Section = "hero" | "about" | "contact";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "hero", label: "Hero-Bereich", icon: "🏠" },
  { id: "about", label: "Über uns", icon: "📖" },
  { id: "contact", label: "Kontakt & Footer", icon: "📞" },
];

const AdminContent = () => {
  const [content, setContent] = useState<ContentSettings>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("hero");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [panelOpen, setPanelOpen] = useState(true);
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

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
      toast({ title: "Gespeichert ✓", description: "Seiteninhalte wurden aktualisiert." });
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
    if (error) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); return; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
    setContent((prev) => ({ ...prev, [field]: data.publicUrl }));
    toast({ title: "Bild hochgeladen ✓" });
  };

  const scrollToSection = (section: Section) => {
    setActiveSection(section);
    const el = previewRef.current?.querySelector(`[data-section="${section}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) return <div className="py-8 text-center">Laden...</div>;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col -m-6">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelOpen(!panelOpen)}
            className="text-muted-foreground"
          >
            {panelOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <span className="font-semibold text-sm">Seiteninhalte bearbeiten</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <Button
              variant={previewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("desktop")}
              className="h-7 px-2"
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={previewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("mobile")}
              className="h-7 px-2"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button onClick={saveContent} disabled={saving} size="sm">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Section editors */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border bg-card overflow-y-auto shrink-0"
            >
              <div className="w-[340px]">
                {/* Section tabs */}
                <div className="flex flex-col gap-0.5 p-2 border-b border-border">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                        activeSection === s.id
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <span>{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Active section editor */}
                <div className="p-4">
                  {activeSection === "hero" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Hero-Bereich</h3>
                      <FieldLabel label="Titel">
                        <Input
                          value={content.hero_title}
                          onChange={(e) => setContent((p) => ({ ...p, hero_title: e.target.value }))}
                        />
                      </FieldLabel>
                      <FieldLabel label="Untertitel">
                        <Input
                          value={content.hero_subtitle}
                          onChange={(e) => setContent((p) => ({ ...p, hero_subtitle: e.target.value }))}
                        />
                      </FieldLabel>
                      <ImageField
                        label="Hero-Bild"
                        value={content.hero_image}
                        onUpload={(f) => handleImageUpload("hero_image", f)}
                        onRemove={() => setContent((p) => ({ ...p, hero_image: "" }))}
                      />
                    </div>
                  )}
                  {activeSection === "about" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Über uns</h3>
                      <FieldLabel label="Titel">
                        <Input
                          value={content.about_title}
                          onChange={(e) => setContent((p) => ({ ...p, about_title: e.target.value }))}
                        />
                      </FieldLabel>
                      <FieldLabel label="Text">
                        <Textarea
                          value={content.about_text}
                          onChange={(e) => setContent((p) => ({ ...p, about_text: e.target.value }))}
                          rows={5}
                        />
                      </FieldLabel>
                      <ImageField
                        label="Bild"
                        value={content.about_image}
                        onUpload={(f) => handleImageUpload("about_image", f)}
                        onRemove={() => setContent((p) => ({ ...p, about_image: "" }))}
                      />
                    </div>
                  )}
                  {activeSection === "contact" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Kontakt & Footer</h3>
                      <FieldLabel label="Telefon">
                        <Input
                          value={content.footer_phone}
                          onChange={(e) => setContent((p) => ({ ...p, footer_phone: e.target.value }))}
                          placeholder="+41 44 123 45 67"
                        />
                      </FieldLabel>
                      <FieldLabel label="E-Mail">
                        <Input
                          value={content.footer_email}
                          onChange={(e) => setContent((p) => ({ ...p, footer_email: e.target.value }))}
                          placeholder="info@piratino.ch"
                        />
                      </FieldLabel>
                      <FieldLabel label="Adresse">
                        <Textarea
                          value={content.footer_address}
                          onChange={(e) => setContent((p) => ({ ...p, footer_address: e.target.value }))}
                          rows={2}
                          placeholder="Musterstrasse 1, 8048 Zürich"
                        />
                      </FieldLabel>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right panel - Live preview */}
        <div className="flex-1 bg-muted/30 overflow-y-auto flex justify-center p-4">
          <div
            ref={previewRef}
            className={cn(
              "bg-background rounded-xl shadow-2xl border border-border overflow-hidden transition-all duration-300",
              previewMode === "desktop" ? "w-full max-w-[1200px]" : "w-[375px]"
            )}
            style={{ minHeight: "100%" }}
          >
            {/* Preview: Hero */}
            <div
              data-section="hero"
              onClick={() => setActiveSection("hero")}
              className={cn(
                "relative cursor-pointer transition-all group",
                activeSection === "hero" && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
              )}
            >
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                  Hero bearbeiten
                </span>
              </div>
              <section
                className="relative overflow-hidden"
                style={{
                  backgroundImage: content.hero_image ? `url(${content.hero_image})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className={cn("py-12 px-6", content.hero_image && "bg-background/80")}>
                  <h1
                    className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3 uppercase tracking-wide"
                    style={{ fontFamily: "'League Spartan', sans-serif" }}
                  >
                    {content.hero_title || "Titel eingeben..."}
                  </h1>
                  <p className="text-base text-muted-foreground mb-6">
                    {content.hero_subtitle || "Untertitel eingeben..."}
                  </p>
                  <div className="flex gap-3">
                    <span className="px-5 py-2 rounded-lg text-sm font-semibold border-2 border-foreground text-foreground">
                      Jetzt bestellen
                    </span>
                    <span className="px-5 py-2 rounded-lg text-sm font-semibold border-2 border-foreground text-foreground">
                      Tisch reservieren
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Preview: Menu teaser */}
            <div className="py-8 px-6 border-t border-border">
              <div className="grid grid-cols-3 gap-3">
                {["🍕 Pizza", "🍝 Pasta", "🥗 Salate"].map((cat) => (
                  <div key={cat} className="bg-card rounded-lg p-4 text-center border border-border">
                    <span className="text-2xl">{cat.split(" ")[0]}</span>
                    <p className="text-sm font-medium text-card-foreground mt-1">{cat.split(" ")[1]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview: About */}
            <div
              data-section="about"
              onClick={() => setActiveSection("about")}
              className={cn(
                "relative cursor-pointer transition-all group border-t border-border",
                activeSection === "about" && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
              )}
            >
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                  Über uns bearbeiten
                </span>
              </div>
              <div className="py-10 px-6">
                <h2 className="text-xl font-bold text-foreground mb-3 uppercase tracking-wide" style={{ fontFamily: "'League Spartan', sans-serif" }}>
                  {content.about_title || "Titel eingeben..."}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  {content.about_text || "Text eingeben..."}
                </p>
                {content.about_image && (
                  <img src={content.about_image} alt="Über uns" className="mt-4 w-full max-w-md rounded-lg object-cover h-40" />
                )}
              </div>
            </div>

            {/* Preview: Footer/Contact */}
            <div
              data-section="contact"
              onClick={() => setActiveSection("contact")}
              className={cn(
                "relative cursor-pointer transition-all group",
                activeSection === "contact" && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
              )}
            >
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                  Footer bearbeiten
                </span>
              </div>
              <div className="bg-primary text-primary-foreground py-8 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg mb-3">Kontakt</h3>
                    <div className="space-y-1.5 text-sm text-primary-foreground/90">
                      <p>📍 {content.footer_address || "Adresse eingeben..."}</p>
                      <p>📞 {content.footer_phone || "Telefon eingeben..."}</p>
                      <p>✉️ {content.footer_email || "E-Mail eingeben..."}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-3">Öffnungszeiten</h3>
                    <div className="space-y-1 text-sm text-primary-foreground/90">
                      <div className="flex justify-between"><span>Mo–Do</span><span>11–14, 17–22</span></div>
                      <div className="flex justify-between"><span>Freitag</span><span>11–14, 17–23</span></div>
                      <div className="flex justify-between"><span>Samstag</span><span>11–23</span></div>
                      <div className="flex justify-between"><span>Sonntag</span><span>14–22</span></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-primary-foreground/60 mt-6 text-center">
                  © {new Date().getFullYear()} Piratino AG · Pizza, Pasta and more since 2006.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components
const FieldLabel = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

interface ImageFieldProps {
  label: string;
  value: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const ImageField = ({ label, value, onUpload, onRemove }: ImageFieldProps) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    {value ? (
      <div className="relative">
        <img src={value} alt={label} className="w-full h-32 object-cover rounded-lg border border-border" />
        <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-7 w-7 p-0" onClick={onRemove}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    ) : (
      <label className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer block hover:border-muted-foreground/50 transition-colors">
        <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
        <span className="text-xs text-muted-foreground">Bild hochladen</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
          className="hidden"
        />
      </label>
    )}
  </div>
);

export default AdminContent;
