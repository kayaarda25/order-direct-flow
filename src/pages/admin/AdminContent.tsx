import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type SiteContent,
  type GalleryImage,
  type CustomSection,
  type SectionLayout,
  DEFAULT_CONTENT,
  DEFAULT_LAYOUT,
  BUILTIN_SECTIONS,
} from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Save, Upload, X, Monitor, Smartphone, ChevronUp, ChevronDown,
  Trash2, Plus, Eye, EyeOff, Type, ImageIcon, Megaphone, MousePointerClick,
  GripVertical, Pencil, LayoutGrid,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import InlineText from "@/components/admin/InlineText";
import LayoutPanel from "@/components/admin/LayoutPanel";

// Assets
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

const defaultGalleryImages = [gallery1, gallery2, gallery3, gallery4, gallery5, gallery6, gallery7, gallery8];

// Section metadata
const SECTION_META: Record<string, { label: string; icon: string }> = {
  hero: { label: "Hero", icon: "🏠" },
  menu: { label: "Menü", icon: "📋" },
  catering: { label: "Catering", icon: "🍽️" },
  gallery: { label: "Galerie", icon: "🖼️" },
  about: { label: "Über uns", icon: "📖" },
  reservation: { label: "Reservierung", icon: "📅" },
  footer: { label: "Footer", icon: "📞" },
  text_block: { label: "Textblock", icon: "📝" },
  image_block: { label: "Bildblock", icon: "🖼️" },
  banner: { label: "Banner", icon: "📢" },
  cta: { label: "Call-to-Action", icon: "🔗" },
};

const CUSTOM_BLOCK_TYPES = [
  { type: "text_block" as const, label: "Textblock", icon: Type, desc: "Titel + Text" },
  { type: "image_block" as const, label: "Bildblock", icon: ImageIcon, desc: "Bild mit Beschreibung" },
  { type: "banner" as const, label: "Banner", icon: Megaphone, desc: "Vollbreites Bild mit Text" },
  { type: "cta" as const, label: "Call-to-Action", icon: MousePointerClick, desc: "Text + Button" },
];

type PanelTab = "sections" | "content" | "layout";

const AdminContent = () => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("hero");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [panelTab, setPanelTab] = useState<PanelTab>("sections");
  const [showAddBlock, setShowAddBlock] = useState(false);
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  // Derived
  const sectionsOrder = content.sections_order?.length > 0 ? content.sections_order : [...BUILTIN_SECTIONS];
  const isVisible = (id: string) => content.sections_visibility?.[id] !== false;
  const getLayout = (id: string): Partial<SectionLayout> => {
    const custom = content.custom_sections?.find((s) => s.id === id);
    if (custom) return custom.layout || {};
    return content.sections_layout?.[id] || {};
  };
  const getResolvedLayout = (id: string) => ({ ...DEFAULT_LAYOUT, ...getLayout(id) });

  // Data
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "content").single();
      if (!error && data) setContent({ ...DEFAULT_CONTENT, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  const saveContent = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "content").single();
      const payload = { value: content as any, updated_at: new Date().toISOString() };
      if (existing) {
        const { error } = await supabase.from("site_settings").update(payload).eq("key", "content");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key: "content", ...payload });
        if (error) throw error;
      }
      toast({ title: "Gespeichert ✓" });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Section operations
  const moveSection = (id: string, dir: -1 | 1) => {
    const order = [...sectionsOrder];
    const idx = order.indexOf(id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    setContent((p) => ({ ...p, sections_order: order }));
  };

  const toggleVisibility = (id: string) => {
    setContent((p) => ({
      ...p,
      sections_visibility: { ...p.sections_visibility, [id]: !isVisible(id) },
    }));
  };

  const addCustomSection = (type: CustomSection["type"]) => {
    const id = `${type}_${Date.now()}`;
    const section: CustomSection = {
      id, type, title: "", text: "", image: "", buttonText: "", buttonLink: "",
      layout: { ...DEFAULT_LAYOUT },
    };
    setContent((p) => ({
      ...p,
      custom_sections: [...(p.custom_sections || []), section],
      sections_order: [...sectionsOrder, id],
    }));
    setActiveSection(id);
    setPanelTab("content");
    setShowAddBlock(false);
  };

  const removeCustomSection = (id: string) => {
    setContent((p) => ({
      ...p,
      custom_sections: (p.custom_sections || []).filter((s) => s.id !== id),
      sections_order: sectionsOrder.filter((s) => s !== id),
    }));
    if (activeSection === id) setActiveSection(null);
  };

  const updateSectionLayout = (id: string, layout: Partial<SectionLayout>) => {
    const custom = content.custom_sections?.find((s) => s.id === id);
    if (custom) {
      setContent((p) => ({
        ...p,
        custom_sections: (p.custom_sections || []).map((s) =>
          s.id === id ? { ...s, layout: { ...s.layout, ...layout } } : s
        ),
      }));
    } else {
      setContent((p) => ({
        ...p,
        sections_layout: { ...p.sections_layout, [id]: { ...(p.sections_layout?.[id] || {}), ...layout } },
      }));
    }
  };

  const updateCustomContent = (id: string, field: string, value: string) => {
    setContent((p) => ({
      ...p,
      custom_sections: (p.custom_sections || []).map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Image upload
  const uploadImage = async (callback: (url: string) => void, file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Ungültige Datei", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop();
    const fileName = `site-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(fileName, file);
    if (error) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); return; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
    callback(data.publicUrl);
    toast({ title: "Bild hochgeladen ✓" });
  };

  // Gallery ops
  const addGalleryImage = async (file: File) => {
    await uploadImage((url) => {
      const img: GalleryImage = { url, alt: `Galerie ${(content.gallery_images?.length || 0) + 1}` };
      setContent((p) => ({ ...p, gallery_images: [...(p.gallery_images || []), img] }));
    }, file);
  };
  const removeGalleryImage = (i: number) => setContent((p) => ({ ...p, gallery_images: (p.gallery_images || []).filter((_, idx) => idx !== i) }));
  const moveGalleryImage = (i: number, dir: -1 | 1) => {
    const imgs = [...(content.gallery_images || [])];
    const ni = i + dir;
    if (ni < 0 || ni >= imgs.length) return;
    [imgs[i], imgs[ni]] = [imgs[ni], imgs[i]];
    setContent((p) => ({ ...p, gallery_images: imgs }));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setPanelTab("content");
    previewRef.current?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Helpers
  const getSectionType = (id: string) => {
    if (BUILTIN_SECTIONS.includes(id as any)) return id;
    return content.custom_sections?.find((s) => s.id === id)?.type || "text_block";
  };

  const getSectionLabel = (id: string) => {
    const custom = content.custom_sections?.find((s) => s.id === id);
    if (custom) {
      const meta = SECTION_META[custom.type];
      return `${meta?.icon || "📄"} ${custom.title || meta?.label || "Block"}`;
    }
    const meta = SECTION_META[id];
    return meta ? `${meta.icon} ${meta.label}` : id;
  };

  const isCustom = (id: string) => !BUILTIN_SECTIONS.includes(id as any);

  if (loading) return <div className="py-8 text-center text-foreground">Laden...</div>;

  // ========== RENDER ==========

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col -m-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <span className="font-semibold text-sm text-foreground">Page Builder</span>
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
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "..." : "Speichern"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ===== SIDEBAR ===== */}
        <div className="w-[360px] border-r border-border bg-card overflow-y-auto shrink-0 flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            {([
              { id: "sections" as PanelTab, label: "Sektionen", icon: LayoutGrid },
              { id: "content" as PanelTab, label: "Inhalt", icon: Pencil },
              { id: "layout" as PanelTab, label: "Layout", icon: LayoutGrid },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPanelTab(tab.id)}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium uppercase tracking-wide transition-colors",
                  panelTab === tab.id ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* TAB: Sections List */}
            {panelTab === "sections" && (
              <div className="p-3">
                <div className="space-y-1 mb-4">
                  {sectionsOrder.map((id, idx) => (
                    <div
                      key={id}
                      onClick={() => scrollToSection(id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group text-sm",
                        activeSection === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground",
                        !isVisible(id) && "opacity-50"
                      )}
                    >
                      <GripVertical className="h-3.5 w-3.5 opacity-40" />
                      <span className="flex-1 truncate">{getSectionLabel(id)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => moveSection(id, -1)} disabled={idx === 0} className="p-0.5 hover:bg-foreground/10 rounded disabled:opacity-30">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveSection(id, 1)} disabled={idx === sectionsOrder.length - 1} className="p-0.5 hover:bg-foreground/10 rounded disabled:opacity-30">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => toggleVisibility(id)} className="p-0.5 hover:bg-foreground/10 rounded">
                          {isVisible(id) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        {isCustom(id) && (
                          <button onClick={() => removeCustomSection(id)} className="p-0.5 hover:bg-destructive/20 text-destructive rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add block */}
                <div className="border-t border-border pt-3">
                  {!showAddBlock ? (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddBlock(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Block hinzufügen
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Neuen Block wählen:</p>
                      {CUSTOM_BLOCK_TYPES.map((bt) => (
                        <button
                          key={bt.type}
                          onClick={() => addCustomSection(bt.type)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors text-left"
                        >
                          <bt.icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{bt.label}</p>
                            <p className="text-xs text-muted-foreground">{bt.desc}</p>
                          </div>
                        </button>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAddBlock(false)}>Abbrechen</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Content Editor */}
            {panelTab === "content" && activeSection && (
              <div className="p-4 space-y-4">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  {getSectionLabel(activeSection)} – Inhalt
                </h3>
                {renderContentEditor()}
              </div>
            )}

            {/* TAB: Layout */}
            {panelTab === "layout" && activeSection && (
              <div className="p-4">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-4">
                  {getSectionLabel(activeSection)} – Layout
                </h3>
                <LayoutPanel
                  layout={getLayout(activeSection)}
                  onChange={(l) => updateSectionLayout(activeSection, l)}
                  sectionType={getSectionType(activeSection)}
                />
              </div>
            )}

            {panelTab !== "sections" && !activeSection && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Klicke auf eine Sektion in der Vorschau
              </div>
            )}
          </div>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="flex-1 bg-muted/50 overflow-y-auto flex justify-center p-4">
          <div
            ref={previewRef}
            className={cn(
              "rounded-xl shadow-2xl border border-border overflow-hidden transition-all duration-300 h-fit",
              previewMode === "desktop" ? "w-full max-w-[1200px]" : "w-[375px]"
            )}
          >
            {/* Header */}
            <div className="sticky top-0 z-20" style={{ background: "hsl(0 45% 14% / 0.95)", borderBottom: "1px solid hsl(0 25% 25%)" }}>
              <div className="flex items-center justify-between h-14 px-4">
                <img src={logoImg} alt="Piratino" className="h-8 w-auto" />
                <div className="flex items-center gap-4 text-sm" style={{ color: "hsl(30 25% 92% / 0.8)" }}>
                  <span>Bestellen</span><span>Catering</span><span>Galerie</span><span>Über uns</span>
                </div>
              </div>
            </div>

            {/* Sections in order */}
            {sectionsOrder.filter(isVisible).map((id) => (
              <PreviewSection
                key={id}
                section={id}
                active={activeSection}
                onClick={() => { setActiveSection(id); setPanelTab("content"); }}
                label={getSectionLabel(id)}
              >
                {renderPreviewSection(id)}
              </PreviewSection>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ========== CONTENT EDITOR (Sidebar) ==========
  function renderContentEditor() {
    if (!activeSection) return null;

    // Custom section editor
    const custom = content.custom_sections?.find((s) => s.id === activeSection);
    if (custom) {
      return (
        <div className="space-y-4">
          <FieldLabel label="Titel">
            <Input value={custom.title} onChange={(e) => updateCustomContent(custom.id, "title", e.target.value)} />
          </FieldLabel>
          <FieldLabel label="Text">
            <Textarea value={custom.text} onChange={(e) => updateCustomContent(custom.id, "text", e.target.value)} rows={4} />
          </FieldLabel>
          {(custom.type === "image_block" || custom.type === "banner") && (
            <ImageField
              label="Bild"
              value={custom.image}
              onUpload={(f) => uploadImage((url) => updateCustomContent(custom.id, "image", url), f)}
              onRemove={() => updateCustomContent(custom.id, "image", "")}
            />
          )}
          {custom.type === "cta" && (
            <>
              <FieldLabel label="Button-Text">
                <Input value={custom.buttonText} onChange={(e) => updateCustomContent(custom.id, "buttonText", e.target.value)} placeholder="Jetzt bestellen" />
              </FieldLabel>
              <FieldLabel label="Button-Link">
                <Input value={custom.buttonLink} onChange={(e) => updateCustomContent(custom.id, "buttonLink", e.target.value)} placeholder="/menu" />
              </FieldLabel>
            </>
          )}
        </div>
      );
    }

    // Built-in section editors
    switch (activeSection) {
      case "hero":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Textarea value={content.hero_title} onChange={(e) => setContent((p) => ({ ...p, hero_title: e.target.value }))} rows={2} /></FieldLabel>
            <FieldLabel label="Untertitel"><Input value={content.hero_subtitle} onChange={(e) => setContent((p) => ({ ...p, hero_subtitle: e.target.value }))} /></FieldLabel>
            <ImageField label="Hintergrundbild" value={content.hero_image} onUpload={(f) => uploadImage((url) => setContent((p) => ({ ...p, hero_image: url })), f)} onRemove={() => setContent((p) => ({ ...p, hero_image: "" }))} />
          </div>
        );
      case "menu":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.menu_title} onChange={(e) => setContent((p) => ({ ...p, menu_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Untertitel"><Input value={content.menu_subtitle} onChange={(e) => setContent((p) => ({ ...p, menu_subtitle: e.target.value }))} /></FieldLabel>
          </div>
        );
      case "catering":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.catering_title} onChange={(e) => setContent((p) => ({ ...p, catering_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Beschreibung"><Textarea value={content.catering_text} onChange={(e) => setContent((p) => ({ ...p, catering_text: e.target.value }))} rows={3} /></FieldLabel>
          </div>
        );
      case "gallery":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.gallery_title} onChange={(e) => setContent((p) => ({ ...p, gallery_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Beschreibung"><Textarea value={content.gallery_text} onChange={(e) => setContent((p) => ({ ...p, gallery_text: e.target.value }))} rows={3} /></FieldLabel>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Bilder ({(content.gallery_images || []).length})</label>
              <div className="space-y-2 mb-3">
                {(content.gallery_images || []).map((img, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg p-2">
                    <img src={img.url} alt={img.alt} className="w-12 h-12 object-cover rounded" />
                    <Input value={img.alt} onChange={(e) => {
                      const imgs = [...(content.gallery_images || [])];
                      imgs[i] = { ...imgs[i], alt: e.target.value };
                      setContent((p) => ({ ...p, gallery_images: imgs }));
                    }} placeholder="Alt-Text" className="h-7 text-xs flex-1" />
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveGalleryImage(i, -1)} disabled={i === 0} className="p-0.5 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                      <button onClick={() => moveGalleryImage(i, 1)} disabled={i === (content.gallery_images || []).length - 1} className="p-0.5 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeGalleryImage(i)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
              <label className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer block hover:border-muted-foreground/50 transition-colors">
                <Plus className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Bild hinzufügen</span>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) addGalleryImage(f); }} className="hidden" />
              </label>
            </div>
          </div>
        );
      case "about":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.about_title} onChange={(e) => setContent((p) => ({ ...p, about_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Text"><Textarea value={content.about_text} onChange={(e) => setContent((p) => ({ ...p, about_text: e.target.value }))} rows={5} /></FieldLabel>
            <ImageField label="Bild" value={content.about_image} onUpload={(f) => uploadImage((url) => setContent((p) => ({ ...p, about_image: url })), f)} onRemove={() => setContent((p) => ({ ...p, about_image: "" }))} />
          </div>
        );
      case "reservation":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.reservation_title} onChange={(e) => setContent((p) => ({ ...p, reservation_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Beschreibung"><Textarea value={content.reservation_text} onChange={(e) => setContent((p) => ({ ...p, reservation_text: e.target.value }))} rows={3} /></FieldLabel>
          </div>
        );
      case "footer":
        return (
          <div className="space-y-4">
            <FieldLabel label="Telefon"><Input value={content.footer_phone} onChange={(e) => setContent((p) => ({ ...p, footer_phone: e.target.value }))} /></FieldLabel>
            <FieldLabel label="E-Mail"><Input value={content.footer_email} onChange={(e) => setContent((p) => ({ ...p, footer_email: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Adresse"><Textarea value={content.footer_address} onChange={(e) => setContent((p) => ({ ...p, footer_address: e.target.value }))} rows={2} /></FieldLabel>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Social Media</h4>
            <FieldLabel label="Instagram"><Input value={content.social_instagram} onChange={(e) => setContent((p) => ({ ...p, social_instagram: e.target.value }))} /></FieldLabel>
            <FieldLabel label="TikTok"><Input value={content.social_tiktok} onChange={(e) => setContent((p) => ({ ...p, social_tiktok: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Facebook"><Input value={content.social_facebook} onChange={(e) => setContent((p) => ({ ...p, social_facebook: e.target.value }))} /></FieldLabel>
            <FieldLabel label="LinkedIn"><Input value={content.social_linkedin} onChange={(e) => setContent((p) => ({ ...p, social_linkedin: e.target.value }))} /></FieldLabel>
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">Keine Bearbeitungsoptionen</p>;
    }
  }

  // ========== PREVIEW SECTIONS ==========
  function renderPreviewSection(id: string) {
    const layout = getResolvedLayout(id);
    const isActive = activeSection === id;
    const bgStyle = getBgStyle(layout.bgColor);
    const padStyle = getPadding(layout.padding, previewMode);
    const alignStyle = { textAlign: layout.textAlign } as React.CSSProperties;

    // Custom section
    const custom = content.custom_sections?.find((s) => s.id === id);
    if (custom) {
      return renderCustomPreview(custom, layout, isActive, bgStyle, padStyle, alignStyle);
    }

    switch (id) {
      case "hero":
        return (
          <div
            style={{
              background: content.hero_image
                ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.hero_image}) center/cover`
                : "hsl(0 45% 14%)",
              color: "hsl(30 25% 92%)",
              ...padStyle,
            }}
            className={cn("flex items-center justify-between gap-6", layout.imagePosition === 'left' && "flex-row-reverse")}
          >
            <div className="flex-1" style={alignStyle}>
              <InlineText
                value={content.hero_title}
                onChange={(v) => setContent((p) => ({ ...p, hero_title: v }))}
                isActive={isActive}
                as="h1"
                multiline
                className={cn("font-bold uppercase tracking-wide leading-tight mb-3 whitespace-pre-line", previewMode === "mobile" ? "text-2xl" : "text-4xl")}
                style={{ fontFamily: "'League Spartan', sans-serif" }}
              />
              <InlineText
                value={content.hero_subtitle}
                onChange={(v) => setContent((p) => ({ ...p, hero_subtitle: v }))}
                isActive={isActive}
                as="p"
                className="text-base opacity-70 mb-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              <div className="flex flex-wrap gap-3">
                {["Jetzt bestellen", "Tisch reservieren", "Catering Anfrage"].map((btn) => (
                  <span key={btn} className="px-5 py-2.5 rounded-lg text-sm font-semibold border-2 border-current">{btn}</span>
                ))}
              </div>
            </div>
            {previewMode === "desktop" && layout.imagePosition !== 'background' && (
              <img src={mascotImg} alt="Maskottchen" className="w-48 h-auto flex-shrink-0" />
            )}
          </div>
        );

      case "menu":
        return (
          <div style={{ ...bgStyle, ...padStyle }}>
            <div style={alignStyle}>
              <InlineText value={content.menu_title} onChange={(v) => setContent((p) => ({ ...p, menu_title: v }))} isActive={isActive} as="h2"
                className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }} />
              <InlineText value={content.menu_subtitle} onChange={(v) => setContent((p) => ({ ...p, menu_subtitle: v }))} isActive={isActive} as="p"
                className="text-sm opacity-60 uppercase tracking-wide mb-6" />
            </div>
            <div className="relative inline-block">
              <div className="rounded-2xl p-4 flex flex-col gap-2 relative z-10" style={{ background: "hsl(0 40% 18%)", border: "1px solid hsl(0 25% 25%)" }}>
                {["Vorspeisen & Salate", "PIZZA", "Pasta", "Fisch & Fleisch", "Kinder Pizza", "Getränke"].map((cat) => (
                  <span key={cat} className="block text-center px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide border-2" style={{ color: "hsl(30 25% 92%)", borderColor: "hsl(30 25% 92% / 0.4)" }}>{cat}</span>
                ))}
              </div>
              {previewMode === "desktop" && (
                <img src={pizzaImg} alt="Pizza" className="absolute top-1/2 -translate-y-1/3 left-[60%] w-72 h-auto z-0 pointer-events-none" />
              )}
            </div>
          </div>
        );

      case "catering":
        return (
          <div style={{ ...bgStyle, ...padStyle }}>
            <div style={alignStyle}>
              <InlineText value={content.catering_title} onChange={(v) => setContent((p) => ({ ...p, catering_title: v }))} isActive={isActive} as="h2"
                className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }} />
              <InlineText value={content.catering_text} onChange={(v) => setContent((p) => ({ ...p, catering_text: v }))} isActive={isActive} as="p"
                className="text-sm opacity-60 uppercase tracking-wide mb-6" />
            </div>
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
        );

      case "gallery": {
        const imgs = (content.gallery_images || []).length > 0
          ? content.gallery_images.map((g) => g.url)
          : defaultGalleryImages;
        return (
          <div style={{ ...bgStyle, ...padStyle }}>
            <div style={alignStyle}>
              <InlineText value={content.gallery_title} onChange={(v) => setContent((p) => ({ ...p, gallery_title: v }))} isActive={isActive} as="h2"
                className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }} />
              <InlineText value={content.gallery_text} onChange={(v) => setContent((p) => ({ ...p, gallery_text: v }))} isActive={isActive} as="p"
                className="text-sm opacity-60 uppercase tracking-wide mb-4" />
            </div>
            <div className={cn("grid gap-2", `grid-cols-${previewMode === "mobile" ? 2 : layout.columns}`)}>
              {imgs.map((src, i) => (
                <img key={i} src={src} alt={`Galerie ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
              ))}
            </div>
          </div>
        );
      }

      case "about":
        return (
          <div style={{ ...bgStyle, ...padStyle }}>
            <div className={cn("flex gap-6", layout.imagePosition === 'left' ? 'flex-row-reverse' : '', layout.imagePosition === 'top' ? 'flex-col-reverse' : '', layout.imagePosition === 'bottom' ? 'flex-col' : '')} style={alignStyle}>
              <div className="flex-1">
                <InlineText value={content.about_title} onChange={(v) => setContent((p) => ({ ...p, about_title: v }))} isActive={isActive} as="h2"
                  className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }} />
                <InlineText value={content.about_text} onChange={(v) => setContent((p) => ({ ...p, about_text: v }))} isActive={isActive} as="p"
                  multiline className="text-sm opacity-60 uppercase tracking-wide mb-4 max-w-xl leading-relaxed" />
              </div>
              {layout.imagePosition !== 'background' && (
                <div className="flex-shrink-0">
                  <img src={content.about_image || teamPhoto} alt="Team" className="w-full max-w-xs rounded-lg shadow-lg" />
                  {isActive && (
                    <label className="mt-2 block text-center">
                      <span className="text-xs text-blue-500 cursor-pointer hover:underline">Bild ändern</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage((url) => setContent((p) => ({ ...p, about_image: url })), f); }} />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "reservation":
        return (
          <div style={{ ...bgStyle, ...padStyle }}>
            <div style={alignStyle}>
              <InlineText value={content.reservation_title} onChange={(v) => setContent((p) => ({ ...p, reservation_title: v }))} isActive={isActive} as="h2"
                className="text-2xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'League Spartan', sans-serif" }} />
              <InlineText value={content.reservation_text} onChange={(v) => setContent((p) => ({ ...p, reservation_text: v }))} isActive={isActive} as="p"
                className="text-sm opacity-60 uppercase tracking-wide mb-4" />
            </div>
            <div className="flex flex-col gap-2 max-w-xs">
              {["Name", "E-Mail", "Telefon"].map((f) => (
                <div key={f} className="h-8 rounded-lg border px-3 flex items-center text-xs opacity-40" style={{ borderColor: "currentColor" }}>{f}</div>
              ))}
              <div className="h-9 rounded-lg flex items-center justify-center text-xs font-semibold uppercase" style={{ background: "hsl(0 40% 18%)", color: "hsl(30 25% 92%)" }}>Tisch reservieren</div>
            </div>
          </div>
        );

      case "footer":
        return (
          <div style={{ background: "hsl(0 45% 14%)", color: "hsl(30 25% 92%)", ...padStyle }}>
            <img src={mascotImg} alt="Maskottchen" className="h-16 w-auto mb-4" />
            <div className={cn("grid gap-6", previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2")}>
              <div className="p-4" style={{ border: "1px solid hsl(30 25% 92% / 0.3)", background: "hsl(30 30% 88% / 0.1)" }}>
                <h3 className="font-bold text-lg mb-3">Kontakt</h3>
                <div className="space-y-2 text-sm opacity-90">
                  <p>📍 {content.footer_address}</p>
                  <p>📞 {content.footer_phone}</p>
                  <p>✉️ {content.footer_email}</p>
                </div>
              </div>
              <div className="p-4" style={{ border: "1px solid hsl(30 25% 92% / 0.3)", background: "hsl(30 30% 88% / 0.1)" }}>
                <h3 className="font-bold text-lg mb-3">Öffnungszeiten</h3>
                <div className="space-y-1 text-sm opacity-90">
                  {[["Mo-Do", "11:00–14:00, 17:00–22:00"], ["Fr", "11:00–14:00, 17:00–23:00"], ["Sa", "11:00–23:00"], ["So", "14:00–22:00"]].map(([d, h]) => (
                    <div key={d} className="flex justify-between text-xs"><span className="font-medium">{d}</span><span className="opacity-80">{h}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4" style={{ border: "1px solid hsl(30 25% 92% / 0.3)", background: "hsl(30 30% 88% / 0.1)" }}>
              <h3 className="font-bold text-lg mb-2">Social Media</h3>
              <div className="flex gap-4 text-sm opacity-90">
                {content.social_instagram && <span>📸 {content.social_instagram}</span>}
                {content.social_tiktok && <span>🎵 {content.social_tiktok}</span>}
                {content.social_facebook && <span>📘 {content.social_facebook}</span>}
                {content.social_linkedin && <span>💼 {content.social_linkedin}</span>}
              </div>
            </div>
            <p className="text-xs opacity-50 mt-6 text-center">© {new Date().getFullYear()} Piratino AG</p>
          </div>
        );

      default:
        return <div style={padStyle} className="text-sm text-muted-foreground p-6">Unbekannte Sektion</div>;
    }
  }

  function renderCustomPreview(sec: CustomSection, layout: SectionLayout, isActive: boolean, bgStyle: React.CSSProperties, padStyle: React.CSSProperties, alignStyle: React.CSSProperties) {
    const textColor = layout.bgColor === 'dark' ? { color: "hsl(30 25% 92%)" } : { color: "hsl(0 45% 14%)" };

    switch (sec.type) {
      case "text_block":
        return (
          <div style={{ ...bgStyle, ...textColor, ...padStyle, ...alignStyle }}>
            <InlineText value={sec.title} onChange={(v) => updateCustomContent(sec.id, "title", v)} isActive={isActive} as="h2"
              className="text-2xl font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'League Spartan', sans-serif" }} placeholder="Titel eingeben..." />
            <InlineText value={sec.text} onChange={(v) => updateCustomContent(sec.id, "text", v)} isActive={isActive} as="p"
              multiline className="text-sm opacity-70 max-w-2xl leading-relaxed" placeholder="Text eingeben..." />
          </div>
        );

      case "image_block":
        return (
          <div style={{ ...bgStyle, ...textColor, ...padStyle }} className={cn("flex gap-6 items-center", layout.imagePosition === 'left' ? 'flex-row-reverse' : '', layout.imagePosition === 'top' ? 'flex-col-reverse' : '', layout.imagePosition === 'bottom' ? 'flex-col' : '')}>
            <div className="flex-1" style={alignStyle}>
              <InlineText value={sec.title} onChange={(v) => updateCustomContent(sec.id, "title", v)} isActive={isActive} as="h2"
                className="text-2xl font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'League Spartan', sans-serif" }} placeholder="Titel..." />
              <InlineText value={sec.text} onChange={(v) => updateCustomContent(sec.id, "text", v)} isActive={isActive} as="p"
                multiline className="text-sm opacity-70 leading-relaxed" placeholder="Beschreibung..." />
            </div>
            <div className="flex-shrink-0 w-full max-w-xs">
              {sec.image ? (
                <img src={sec.image} alt={sec.title} className="w-full rounded-lg shadow-lg" />
              ) : (
                <div className="w-full h-40 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-current/20">
                  <span className="text-xs opacity-50">Bild hochladen</span>
                </div>
              )}
            </div>
          </div>
        );

      case "banner":
        return (
          <div
            style={{
              background: sec.image ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${sec.image}) center/cover` : "hsl(0 40% 18%)",
              color: "hsl(30 25% 92%)",
              ...padStyle,
              ...alignStyle,
            }}
          >
            <InlineText value={sec.title} onChange={(v) => updateCustomContent(sec.id, "title", v)} isActive={isActive} as="h2"
              className="text-3xl font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'League Spartan', sans-serif" }} placeholder="Banner-Titel..." />
            <InlineText value={sec.text} onChange={(v) => updateCustomContent(sec.id, "text", v)} isActive={isActive} as="p"
              multiline className="text-lg opacity-80 max-w-xl" placeholder="Banner-Text..." />
          </div>
        );

      case "cta":
        return (
          <div style={{ ...bgStyle, ...textColor, ...padStyle, ...alignStyle }}>
            <InlineText value={sec.title} onChange={(v) => updateCustomContent(sec.id, "title", v)} isActive={isActive} as="h2"
              className="text-2xl font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'League Spartan', sans-serif" }} placeholder="Überschrift..." />
            <InlineText value={sec.text} onChange={(v) => updateCustomContent(sec.id, "text", v)} isActive={isActive} as="p"
              multiline className="text-sm opacity-70 mb-6 max-w-xl" placeholder="Beschreibung..." />
            <span className="inline-block px-8 py-3 rounded-lg font-semibold text-sm uppercase border-2 border-current">
              {sec.buttonText || "Button"}
            </span>
          </div>
        );

      default:
        return <div style={padStyle}>Block</div>;
    }
  }
};

// ===== HELPERS =====

function getBgStyle(bgColor: string): React.CSSProperties {
  switch (bgColor) {
    case 'dark': return { background: "hsl(0 45% 14%)", color: "hsl(30 25% 92%)" };
    case 'accent': return { background: "hsl(35 80% 95%)", color: "hsl(0 45% 14%)" };
    default: return { background: "#fff", color: "hsl(0 45% 14%)" };
  }
}

function getPadding(size: string, mode: string): React.CSSProperties {
  const mobile = mode === "mobile";
  switch (size) {
    case 'sm': return { padding: mobile ? "1.5rem 1rem" : "2rem" };
    case 'lg': return { padding: mobile ? "3rem 1.5rem" : "5rem 3rem" };
    default: return { padding: mobile ? "2rem 1.5rem" : "3rem" };
  }
}

const PreviewSection = ({ section, active, onClick, label, children }: {
  section: string; active: string | null; onClick: () => void; label: string; children: React.ReactNode;
}) => (
  <div
    data-section={section}
    onClick={onClick}
    className={cn("relative cursor-pointer transition-all group", active === section && "ring-2 ring-blue-500 ring-inset")}
  >
    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">{label}</span>
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
