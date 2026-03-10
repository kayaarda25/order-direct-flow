import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type SiteContent, type GalleryImage, DEFAULT_CONTENT } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, X, Monitor, Smartphone, ChevronLeft, ChevronRight, Trash2, GripVertical, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Import actual assets used on the real site
import mascotImg from "@/assets/pirate-mascot.png";
import logoImg from "@/assets/piratino-logo.png";
import pizzaImg from "@/assets/pizza-overhead.png";
import teamPhoto from "@/assets/team-photo.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";
import cateringPizzaImg from "@/assets/catering-pizza-party.png";
import cateringPastaImg from "@/assets/catering-pasta.png";
import cateringAperitivoImg from "@/assets/catering-aperitivo.png";


type Section = "hero" | "menu" | "catering" | "gallery" | "about" | "footer";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "hero", label: "Hero-Bereich", icon: "🏠" },
  { id: "menu", label: "Menü-Bereich", icon: "📋" },
  { id: "catering", label: "Catering", icon: "🍽️" },
  { id: "gallery", label: "Galerie", icon: "🖼️" },
  { id: "about", label: "Über uns", icon: "📖" },
  { id: "footer", label: "Footer & Kontakt", icon: "📞" },
];

const galleryImages = [gallery1, gallery2, gallery3, gallery4, gallery5, gallery6, gallery7, gallery8];

const AdminContent = () => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("hero");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [panelOpen, setPanelOpen] = useState(true);
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("site_settings").select("*").eq("key", "content").single();
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
        .from("site_settings").select("id").eq("key", "content").single();
      if (existing) {
        const { error } = await supabase.from("site_settings")
          .update({ value: content as unknown as Record<string, string>, updated_at: new Date().toISOString() })
          .eq("key", "content");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings")
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

  const handleImageUpload = async (field: keyof SiteContent, file: File) => {
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

  const handleGalleryUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Max. 5MB", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop();
    const fileName = `gallery-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(fileName, file);
    if (error) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); return; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
    const newImage: GalleryImage = { url: data.publicUrl, alt: `Galerie ${(content.gallery_images?.length || 0) + 1}` };
    setContent((prev) => ({ ...prev, gallery_images: [...(prev.gallery_images || []), newImage] }));
    toast({ title: "Galerie-Bild hochgeladen ✓" });
  };

  const removeGalleryImage = (index: number) => {
    setContent((prev) => ({
      ...prev,
      gallery_images: (prev.gallery_images || []).filter((_, i) => i !== index),
    }));
  };

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    const images = [...(content.gallery_images || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    [images[index], images[newIndex]] = [images[newIndex], images[index]];
    setContent((prev) => ({ ...prev, gallery_images: images }));
  };

  const updateGalleryAlt = (index: number, alt: string) => {
    const images = [...(content.gallery_images || [])];
    images[index] = { ...images[index], alt };
    setContent((prev) => ({ ...prev, gallery_images: images }));
  };

  const scrollToSection = (section: Section) => {
    setActiveSection(section);
    const el = previewRef.current?.querySelector(`[data-section="${section}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) return <div className="py-8 text-center text-foreground">Laden...</div>;

  const editableSections: Section[] = ["hero", "about", "footer", "gallery", "catering"];
  const isEditable = editableSections.includes(activeSection);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col -m-6">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <span className="font-semibold text-sm text-foreground">Seiteninhalte bearbeiten</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <Button variant={previewMode === "desktop" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("desktop")} className="h-7 px-2">
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button variant={previewMode === "mobile" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("mobile")} className="h-7 px-2">
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button onClick={saveContent} disabled={saving} size="sm">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
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
                      {!editableSections.includes(s.id) && activeSection === s.id && (
                        <span className="ml-auto text-xs opacity-70">Nur Vorschau</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Editor */}
                <div className="p-4">
                  {activeSection === "hero" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Hero bearbeiten</h3>
                      <FieldLabel label="Titel">
                        <Textarea value={content.hero_title} onChange={(e) => setContent((p) => ({ ...p, hero_title: e.target.value }))} rows={2} />
                      </FieldLabel>
                      <FieldLabel label="Untertitel">
                        <Input value={content.hero_subtitle} onChange={(e) => setContent((p) => ({ ...p, hero_subtitle: e.target.value }))} />
                      </FieldLabel>
                      <ImageField label="Hero-Hintergrundbild" value={content.hero_image} onUpload={(f) => handleImageUpload("hero_image", f)} onRemove={() => setContent((p) => ({ ...p, hero_image: "" }))} />
                    </div>
                  )}
                  {activeSection === "about" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Über uns bearbeiten</h3>
                      <FieldLabel label="Titel">
                        <Input value={content.about_title} onChange={(e) => setContent((p) => ({ ...p, about_title: e.target.value }))} />
                      </FieldLabel>
                      <FieldLabel label="Text">
                        <Textarea value={content.about_text} onChange={(e) => setContent((p) => ({ ...p, about_text: e.target.value }))} rows={5} />
                      </FieldLabel>
                      <ImageField label="Bild" value={content.about_image} onUpload={(f) => handleImageUpload("about_image", f)} onRemove={() => setContent((p) => ({ ...p, about_image: "" }))} />
                    </div>
                  )}
                  {activeSection === "footer" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Kontakt bearbeiten</h3>
                      <FieldLabel label="Telefon">
                        <Input value={content.footer_phone} onChange={(e) => setContent((p) => ({ ...p, footer_phone: e.target.value }))} />
                      </FieldLabel>
                      <FieldLabel label="E-Mail">
                        <Input value={content.footer_email} onChange={(e) => setContent((p) => ({ ...p, footer_email: e.target.value }))} />
                      </FieldLabel>
                      <FieldLabel label="Adresse">
                        <Textarea value={content.footer_address} onChange={(e) => setContent((p) => ({ ...p, footer_address: e.target.value }))} rows={2} />
                      </FieldLabel>
                    </div>
                  )}
                  {activeSection === "gallery" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Galerie bearbeiten</h3>
                      <FieldLabel label="Titel">
                        <Input value={content.gallery_title} onChange={(e) => setContent((p) => ({ ...p, gallery_title: e.target.value }))} />
                      </FieldLabel>
                      <FieldLabel label="Beschreibung">
                        <Textarea value={content.gallery_text} onChange={(e) => setContent((p) => ({ ...p, gallery_text: e.target.value }))} rows={3} />
                      </FieldLabel>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">Bilder ({(content.gallery_images || []).length})</label>
                        <div className="space-y-2 mb-3">
                          {(content.gallery_images || []).map((img, i) => (
                            <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg p-2">
                              <img src={img.url} alt={img.alt} className="w-14 h-14 object-cover rounded" />
                              <div className="flex-1 min-w-0">
                                <Input
                                  value={img.alt}
                                  onChange={(e) => updateGalleryAlt(i, e.target.value)}
                                  placeholder="Bildbeschreibung"
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0}>
                                  <ChevronLeft className="h-3 w-3 rotate-90" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => moveGalleryImage(i, 1)} disabled={i === (content.gallery_images || []).length - 1}>
                                  <ChevronRight className="h-3 w-3 rotate-90" />
                                </Button>
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeGalleryImage(i)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <label className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer block hover:border-muted-foreground/50 transition-colors">
                          <Plus className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Bild hinzufügen</span>
                          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryUpload(f); }} className="hidden" />
                        </label>
                      </div>
                    </div>
                  )}
                  {activeSection === "catering" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Catering bearbeiten</h3>
                      <FieldLabel label="Titel">
                        <Input value={content.catering_title} onChange={(e) => setContent((p) => ({ ...p, catering_title: e.target.value }))} />
                      </FieldLabel>
                      <FieldLabel label="Beschreibung">
                        <Textarea value={content.catering_text} onChange={(e) => setContent((p) => ({ ...p, catering_text: e.target.value }))} rows={3} />
                      </FieldLabel>
                    </div>
                  )}
                  {!isEditable && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Dieser Bereich wird automatisch generiert.<br />
                        Klicke auf einen bearbeitbaren Bereich in der Vorschau.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right panel - Live website preview */}
        <div className="flex-1 bg-muted/50 overflow-y-auto flex justify-center p-4">
          <div
            ref={previewRef}
            className={cn(
              "rounded-xl shadow-2xl border border-border overflow-hidden transition-all duration-300",
              previewMode === "desktop" ? "w-full max-w-[1200px]" : "w-[375px]"
            )}
          >
            {/* ===== REAL WEBSITE PREVIEW ===== */}

            {/* Header */}
            <div className="sticky top-0 z-20" style={{ background: "hsl(0 45% 14% / 0.95)", borderBottom: "1px solid hsl(0 25% 25%)" }}>
              <div className="flex items-center justify-between h-14 px-4">
                <img src={logoImg} alt="Piratino" className="h-8 w-auto" />
                <div className="flex items-center gap-4 text-sm" style={{ color: "hsl(30 25% 92% / 0.8)" }}>
                  <span>Jetzt bestellen</span>
                  <span>Catering</span>
                  <span>Galerie</span>
                  <span>Über uns</span>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <PreviewSection
              section="hero"
              active={activeSection}
              onClick={() => setActiveSection("hero")}
              label="Hero bearbeiten"
            >
              <div
                style={{
                  background: content.hero_image
                    ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.hero_image}) center/cover`
                    : "hsl(0 45% 14%)",
                  color: "hsl(30 25% 92%)",
                  padding: previewMode === "mobile" ? "2rem 1.5rem" : "4rem 3rem",
                }}
                className="flex items-center justify-between gap-6"
              >
                <div className="flex-1">
                  <h1
                    className={cn("font-bold uppercase tracking-wide leading-tight mb-3 whitespace-pre-line", previewMode === "mobile" ? "text-2xl" : "text-4xl")}
                    style={{ fontFamily: "'League Spartan', sans-serif" }}
                  >
                    {content.hero_title || "Titel eingeben..."}
                  </h1>
                  <p className="text-base opacity-70 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {content.hero_subtitle || "Untertitel eingeben..."}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["Jetzt bestellen", "Tisch reservieren", "Catering Anfrage"].map((btn) => (
                      <span key={btn} className="px-5 py-2.5 rounded-lg text-sm font-semibold border-2 border-current">
                        {btn}
                      </span>
                    ))}
                  </div>
                </div>
                {previewMode === "desktop" && (
                  <img src={mascotImg} alt="Maskottchen" className="w-48 h-auto flex-shrink-0" />
                )}
              </div>
            </PreviewSection>

            {/* Menu Section */}
            <PreviewSection
              section="menu"
              active={activeSection}
              onClick={() => setActiveSection("menu")}
              label="Menü (automatisch)"
            >
              <div style={{ background: "#fff", color: "hsl(0 45% 14%)", padding: previewMode === "mobile" ? "2rem 1.5rem" : "3rem" }}>
                <h2 className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }}>Menu</h2>
                <p className="text-sm opacity-60 uppercase tracking-wide mb-6">Im Restaurant geniessen, selbst abholen oder nach Hause bestellen</p>
                <div className="relative inline-block">
                  <div className="rounded-2xl p-4 flex flex-col gap-2 relative z-10" style={{ background: "hsl(0 40% 18%)", border: "1px solid hsl(0 25% 25%)" }}>
                    {["Vorspeisen & Salate", "PIZZA", "Pasta", "Fisch & Fleisch", "Kinder Pizza", "Getränke"].map((cat) => (
                      <span key={cat} className="block text-center px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide border-2" style={{ color: "hsl(30 25% 92%)", borderColor: "hsl(30 25% 92% / 0.4)" }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                  {previewMode === "desktop" && (
                    <img src={pizzaImg} alt="Pizza" className="absolute top-1/2 -translate-y-1/3 left-[60%] w-72 h-auto z-0 pointer-events-none" />
                  )}
                </div>
              </div>
            </PreviewSection>

            {/* Catering Section */}
            <PreviewSection
              section="catering"
              active={activeSection}
              onClick={() => setActiveSection("catering")}
              label="Catering bearbeiten"
            >
              <div style={{ background: "#fff", color: "hsl(0 45% 14%)", padding: previewMode === "mobile" ? "2rem 1.5rem" : "3rem" }}>
                <h2 className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }}>{content.catering_title || "Catering-Pakete"}</h2>
                <p className="text-sm opacity-60 uppercase tracking-wide mb-6">{content.catering_text || "6 perfekt abgestimmte Catering-Pakete"}</p>
                <div className="flex flex-col gap-3">
                  {[
                    { name: "PIZZA PARTY", img: cateringPizzaImg, price: "CHF 30.00" },
                    { name: "PASTA CLASSICA", img: cateringPastaImg, price: "CHF 30.00" },
                    { name: "APERITIVO", img: cateringAperitivoImg, price: "CHF 35.00" },
                  ].map((pkg) => (
                    <div key={pkg.name} className="flex items-center rounded-xl overflow-hidden" style={{ background: "hsl(0 40% 18%)", border: "1px solid hsl(0 25% 25%)" }}>
                      <div className="flex-1 p-4">
                        <h3 className="font-bold uppercase tracking-wide text-sm" style={{ color: "hsl(30 25% 92%)" }}>{pkg.name}</h3>
                        <p className="text-xs mt-1" style={{ color: "hsl(30 25% 92% / 0.7)" }}>Preis: {pkg.price} pro Person</p>
                      </div>
                      <img src={pkg.img} alt={pkg.name} className="w-20 h-20 object-contain p-2" />
                    </div>
                  ))}
                </div>
              </div>
            </PreviewSection>

            {/* Gallery Section */}
            <PreviewSection
              section="gallery"
              active={activeSection}
              onClick={() => setActiveSection("gallery")}
              label="Galerie bearbeiten"
            >
              <div style={{ background: "#fff", color: "hsl(0 45% 14%)", padding: previewMode === "mobile" ? "2rem 1.5rem" : "3rem" }}>
                <h2 className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }}>{content.gallery_title || "Galerie"}</h2>
                <p className="text-sm opacity-60 uppercase tracking-wide mb-4">{content.gallery_text || "Eindrücke aus unserem Restaurant"}</p>
                <div className={cn("grid gap-2", previewMode === "mobile" ? "grid-cols-2" : "grid-cols-4")}>
                  {((content.gallery_images || []).length > 0 ? content.gallery_images : galleryImages.map((src, i) => ({ url: src, alt: `Galerie ${i + 1}` }))).map((img, i) => (
                    <img key={i} src={typeof img === 'string' ? img : img.url} alt={typeof img === 'string' ? `Galerie ${i+1}` : img.alt} className="w-full h-24 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            </PreviewSection>

            {/* About Section */}
            <PreviewSection
              section="about"
              active={activeSection}
              onClick={() => setActiveSection("about")}
              label="Über uns bearbeiten"
            >
              <div style={{ background: "#fff", color: "hsl(0 45% 14%)", padding: previewMode === "mobile" ? "2rem 1.5rem" : "3rem" }}>
                <h2 className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }}>
                  {content.about_title || "Über uns"}
                </h2>
                <p className="text-sm opacity-60 uppercase tracking-wide mb-4 max-w-xl leading-relaxed">
                  {content.about_text || "Text eingeben..."}
                </p>
                <img
                  src={content.about_image || teamPhoto}
                  alt="Team"
                  className="w-full max-w-md rounded-lg shadow-lg"
                />
              </div>
            </PreviewSection>

            {/* Footer */}
            <PreviewSection
              section="footer"
              active={activeSection}
              onClick={() => setActiveSection("footer")}
              label="Footer bearbeiten"
            >
              <div style={{ background: "hsl(0 45% 14%)", color: "hsl(30 25% 92%)", padding: previewMode === "mobile" ? "2rem 1.5rem" : "3rem" }}>
                <div className="flex gap-4 mb-6">
                  <img src={mascotImg} alt="Maskottchen" className="h-16 w-auto" />
                </div>

                <div className={cn("grid gap-6", previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2")}>
                  <div className="rounded-none p-4" style={{ border: "1px solid hsl(30 25% 92% / 0.3)", background: "hsl(30 30% 88% / 0.1)" }}>
                    <h3 className="font-bold text-lg mb-3">Kontakt</h3>
                    <div className="space-y-2 text-sm opacity-90">
                      <p>📍 {content.footer_address || "Adresse eingeben..."}</p>
                      <p>📞 {content.footer_phone || "Telefon eingeben..."}</p>
                      <p>✉️ {content.footer_email || "E-Mail eingeben..."}</p>
                    </div>
                  </div>
                  <div className="rounded-none p-4" style={{ border: "1px solid hsl(30 25% 92% / 0.3)", background: "hsl(30 30% 88% / 0.1)" }}>
                    <h3 className="font-bold text-lg mb-3">Öffnungszeiten</h3>
                    <div className="space-y-1 text-sm opacity-90">
                      {[
                        ["Montag", "11:00–14:00, 17:00–22:00"],
                        ["Dienstag", "11:00–14:00, 17:00–22:00"],
                        ["Mittwoch", "11:00–14:00, 17:00–22:00"],
                        ["Donnerstag", "11:00–14:00, 17:00–22:00"],
                        ["Freitag", "11:00–14:00, 17:00–23:00"],
                        ["Samstag", "11:00–23:00"],
                        ["Sonntag", "14:00–22:00"],
                      ].map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-xs">
                          <span className="font-medium">{day}</span>
                          <span className="opacity-80">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-none p-4" style={{ border: "1px solid hsl(30 25% 92% / 0.3)", background: "hsl(30 30% 88% / 0.1)" }}>
                  <h3 className="font-bold text-lg mb-2">Social Media</h3>
                  <div className="flex gap-4 text-sm opacity-90">
                    <span>📸 @pizzapiratino</span>
                    <span>🎵 @pizzapiratino</span>
                    <span>📘 Facebook</span>
                  </div>
                </div>

                <p className="text-xs opacity-50 mt-6 text-center">
                  © {new Date().getFullYear()} Piratino AG · Pizza, Pasta and more since 2006.
                </p>
              </div>
            </PreviewSection>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clickable preview section wrapper
const PreviewSection = ({
  section,
  active,
  onClick,
  label,
  children,
}: {
  section: Section;
  active: Section;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) => (
  <div
    data-section={section}
    onClick={onClick}
    className={cn(
      "relative cursor-pointer transition-all group",
      active === section && "ring-2 ring-blue-500 ring-inset"
    )}
  >
    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
        {label}
      </span>
    </div>
    {children}
  </div>
);

const FieldLabel = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

const ImageField = ({ label, value, onUpload, onRemove }: { label: string; value: string; onUpload: (f: File) => void; onRemove: () => void }) => (
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
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} className="hidden" />
      </label>
    )}
  </div>
);

export default AdminContent;
