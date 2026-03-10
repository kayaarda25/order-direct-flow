import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type SiteContent,
  type GalleryImage,
  type CustomSection,
  type SectionLayout,
  type ElementPosition,
  DEFAULT_CONTENT,
  DEFAULT_LAYOUT,
  BUILTIN_SECTIONS,
} from "@/hooks/useSiteContent";
import FreePositionEditor from "@/components/admin/FreePositionEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Save, Upload, X, Monitor, Smartphone, ChevronUp, ChevronDown,
  Trash2, Plus, Eye, EyeOff, Type, ImageIcon, Megaphone, MousePointerClick,
  GripVertical, Pencil, LayoutGrid, Globe, ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import LayoutPanel from "@/components/admin/LayoutPanel";
import mascotImg from "@/assets/pirate-mascot.png";

// dnd-kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// Website pages with their built-in sections
const PAGES = [
  { id: "home", label: "🏠 Startseite", path: "/", builtinSections: ['hero', 'menu', 'catering', 'gallery', 'about', 'reservation', 'footer'] },
  { id: "menu", label: "📋 Menü", path: "/menu", builtinSections: ['menu_header'] },
  { id: "galerie", label: "🖼️ Galerie", path: "/galerie", builtinSections: ['gallery_header'] },
  { id: "ueber-uns", label: "📖 Über uns", path: "/ueber-uns", builtinSections: ['about_header'] },
  { id: "catering", label: "🍽️ Catering", path: "/catering", builtinSections: ['catering_header'] },
  { id: "reservierung", label: "📅 Reservierung", path: "/reservieren", builtinSections: ['reservation_header'] },
] as const;

const PAGE_SECTION_META: Record<string, { label: string; icon: string }> = {
  menu_header: { label: "Menü Header", icon: "📋" },
  gallery_header: { label: "Galerie Header", icon: "🖼️" },
  about_header: { label: "Über uns Header", icon: "📖" },
  catering_header: { label: "Catering Header", icon: "🍽️" },
  reservation_header: { label: "Reservierung Header", icon: "📅" },
};

type PageId = typeof PAGES[number]["id"];
type PanelTab = "sections" | "content" | "layout";

// ===== SORTABLE ITEM COMPONENT =====
const SortableSectionItem = ({
  id,
  isActive,
  isItemVisible,
  label,
  isCustomItem,
  onSelect,
  onToggleVisibility,
  onRemove,
}: {
  id: string;
  isActive: boolean;
  isItemVisible: boolean;
  label: string;
  isCustomItem: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : !isItemVisible ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group text-sm",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground",
        isDragging && "shadow-lg ring-2 ring-primary/50 bg-card"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-foreground/10 rounded touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 opacity-40" />
      </button>
      <span className="flex-1 truncate">{label}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button onClick={onToggleVisibility} className="p-0.5 hover:bg-foreground/10 rounded">
          {isItemVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
        {isCustomItem && (
          <button onClick={onRemove} className="p-0.5 hover:bg-destructive/20 text-destructive rounded">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const AdminContent = () => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState<PageId>("home");
  const [activeSection, setActiveSection] = useState<string | null>("hero");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [panelTab, setPanelTab] = useState<PanelTab>("sections");
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const { toast } = useToast();

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Derived
  const currentPage = PAGES.find((p) => p.id === activePage)!;

  // Get sections order for current page
  const getPageSectionsOrder = (): string[] => {
    if (activePage === "home") {
      return content.sections_order?.length > 0 ? content.sections_order : [...BUILTIN_SECTIONS];
    }
    const pageData = content.page_sections?.[activePage];
    const builtins = currentPage.builtinSections as unknown as string[];
    if (pageData?.order?.length) return pageData.order;
    return [...builtins];
  };

  const sectionsOrder = getPageSectionsOrder();

  const isVisible = (id: string) => {
    if (activePage === "home") return content.sections_visibility?.[id] !== false;
    return content.page_sections?.[activePage]?.visibility?.[id] !== false;
  };

  const getLayout = (id: string): Partial<SectionLayout> => {
    // Check custom sections first
    const customs = activePage === "home"
      ? content.custom_sections
      : content.page_sections?.[activePage]?.custom_blocks;
    const custom = customs?.find((s) => s.id === id);
    if (custom) return custom.layout || {};
    if (activePage === "home") return content.sections_layout?.[id] || {};
    return {};
  };

  // Current page path for iframe
  const currentPagePath = useMemo(() => {
    const page = PAGES.find((p) => p.id === activePage);
    return page?.path || "/";
  }, [activePage]);

  // Iframe URL
  const iframeUrl = useMemo(() => {
    const base = window.location.origin;
    return `${base}${currentPagePath}`;
  }, [currentPagePath]);

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
      // Reload iframe to show changes
      setIframeKey((k) => k + 1);
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Section operations
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const order = [...sectionsOrder];
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      const newOrder = arrayMove(order, oldIndex, newIndex);
      if (activePage === "home") {
        setContent((p) => ({ ...p, sections_order: newOrder }));
      } else {
        setContent((p) => ({
          ...p,
          page_sections: {
            ...p.page_sections,
            [activePage]: { ...(p.page_sections?.[activePage] || { order: [], visibility: {}, custom_blocks: [] }), order: newOrder },
          },
        }));
      }
    }
  };

  const toggleVisibility = (id: string) => {
    if (activePage === "home") {
      setContent((p) => ({
        ...p,
        sections_visibility: { ...p.sections_visibility, [id]: !isVisible(id) },
      }));
    } else {
      setContent((p) => {
        const ps = p.page_sections?.[activePage] || { order: [], visibility: {}, custom_blocks: [] };
        return {
          ...p,
          page_sections: {
            ...p.page_sections,
            [activePage]: { ...ps, visibility: { ...ps.visibility, [id]: !isVisible(id) } },
          },
        };
      });
    }
  };

  const addCustomSection = (type: CustomSection["type"]) => {
    const id = `${type}_${Date.now()}`;
    const section: CustomSection = {
      id, type, title: "", text: "", image: "", buttonText: "", buttonLink: "",
      layout: { ...DEFAULT_LAYOUT },
    };
    if (activePage === "home") {
      setContent((p) => ({
        ...p,
        custom_sections: [...(p.custom_sections || []), section],
        sections_order: [...sectionsOrder, id],
      }));
    } else {
      setContent((p) => {
        const ps = p.page_sections?.[activePage] || { order: [], visibility: {}, custom_blocks: [] };
        return {
          ...p,
          page_sections: {
            ...p.page_sections,
            [activePage]: {
              ...ps,
              custom_blocks: [...(ps.custom_blocks || []), section],
              order: [...sectionsOrder, id],
            },
          },
        };
      });
    }
    setActiveSection(id);
    setPanelTab("content");
    setShowAddBlock(false);
  };

  const removeCustomSection = (id: string) => {
    if (activePage === "home") {
      setContent((p) => ({
        ...p,
        custom_sections: (p.custom_sections || []).filter((s) => s.id !== id),
        sections_order: sectionsOrder.filter((s) => s !== id),
      }));
    } else {
      setContent((p) => {
        const ps = p.page_sections?.[activePage] || { order: [], visibility: {}, custom_blocks: [] };
        return {
          ...p,
          page_sections: {
            ...p.page_sections,
            [activePage]: {
              ...ps,
              custom_blocks: (ps.custom_blocks || []).filter((s) => s.id !== id),
              order: sectionsOrder.filter((s) => s !== id),
            },
          },
        };
      });
    }
    if (activeSection === id) setActiveSection(null);
  };

  const updateSectionLayout = (id: string, layout: Partial<SectionLayout>) => {
    const customs = activePage === "home" ? content.custom_sections : content.page_sections?.[activePage]?.custom_blocks;
    const custom = customs?.find((s) => s.id === id);
    if (custom) {
      if (activePage === "home") {
        setContent((p) => ({
          ...p,
          custom_sections: (p.custom_sections || []).map((s) =>
            s.id === id ? { ...s, layout: { ...s.layout, ...layout } } : s
          ),
        }));
      } else {
        setContent((p) => {
          const ps = p.page_sections?.[activePage] || { order: [], visibility: {}, custom_blocks: [] };
          return {
            ...p,
            page_sections: {
              ...p.page_sections,
              [activePage]: {
                ...ps,
                custom_blocks: (ps.custom_blocks || []).map((s) =>
                  s.id === id ? { ...s, layout: { ...s.layout, ...layout } } : s
                ),
              },
            },
          };
        });
      }
    } else {
      setContent((p) => ({
        ...p,
        sections_layout: { ...p.sections_layout, [id]: { ...(p.sections_layout?.[id] || {}), ...layout } },
      }));
    }
  };

  const updateCustomContent = (id: string, field: string, value: string) => {
    if (activePage === "home") {
      setContent((p) => ({
        ...p,
        custom_sections: (p.custom_sections || []).map((s) =>
          s.id === id ? { ...s, [field]: value } : s
        ),
      }));
    } else {
      setContent((p) => {
        const ps = p.page_sections?.[activePage] || { order: [], visibility: {}, custom_blocks: [] };
        return {
          ...p,
          page_sections: {
            ...p.page_sections,
            [activePage]: {
              ...ps,
              custom_blocks: (ps.custom_blocks || []).map((s) =>
                s.id === id ? { ...s, [field]: value } : s
              ),
            },
          },
        };
      });
    }
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

  // Helpers
  const getSectionType = (id: string) => {
    if (BUILTIN_SECTIONS.includes(id as any)) return id;
    // Check page-level built-in sections
    if (Object.keys(PAGE_SECTION_META).includes(id)) return id;
    // Check custom sections
    const customs = activePage === "home" ? content.custom_sections : content.page_sections?.[activePage]?.custom_blocks;
    return customs?.find((s) => s.id === id)?.type || "text_block";
  };

  const getSectionLabel = (id: string) => {
    // Check custom sections
    const customs = activePage === "home" ? content.custom_sections : content.page_sections?.[activePage]?.custom_blocks;
    const custom = customs?.find((s) => s.id === id);
    if (custom) {
      const meta = SECTION_META[custom.type];
      return `${meta?.icon || "📄"} ${custom.title || meta?.label || "Block"}`;
    }
    // Check page section meta
    const pageMeta = PAGE_SECTION_META[id];
    if (pageMeta) return `${pageMeta.icon} ${pageMeta.label}`;
    const meta = SECTION_META[id];
    return meta ? `${meta.icon} ${meta.label}` : id;
  };

  const isCustom = (id: string) => {
    if (BUILTIN_SECTIONS.includes(id as any)) return false;
    if (Object.keys(PAGE_SECTION_META).includes(id)) return false;
    return true;
  };

  if (loading) return <div className="py-8 text-center text-foreground">Laden...</div>;

  // ========== RENDER ==========

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col -m-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={activePage} onValueChange={(v) => { setActivePage(v as PageId); setActiveSection(null); setPanelTab("sections"); }}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGES.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <a
            href={currentPagePath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 h-7 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
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
              { id: "sections" as PanelTab, label: "Sektionen" },
              { id: "content" as PanelTab, label: "Inhalt" },
              { id: "layout" as PanelTab, label: "Layout" },
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
            {/* TAB: Sections List with Drag & Drop (all pages) */}
            {panelTab === "sections" && (
              <div className="p-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sectionsOrder} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1 mb-4">
                      {sectionsOrder.map((id) => (
                        <SortableSectionItem
                          key={id}
                          id={id}
                          isActive={activeSection === id}
                          isItemVisible={isVisible(id)}
                          label={getSectionLabel(id)}
                          isCustomItem={isCustom(id)}
                          onSelect={() => { setActiveSection(id); setPanelTab("content"); }}
                          onToggleVisibility={() => toggleVisibility(id)}
                          onRemove={() => removeCustomSection(id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

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
            {panelTab === "content" && (
              <div className="p-4 space-y-4">
                {activeSection ? (
                  <>
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      {getSectionLabel(activeSection)} – Inhalt
                    </h3>
                    {renderContentEditor()}
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Klicke auf eine Sektion in der Liste
                  </div>
                )}
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
          </div>
        </div>

        {/* ===== LIVE PREVIEW (IFRAME) ===== */}
        <div className="flex-1 bg-muted/50 overflow-hidden flex justify-center items-start p-4">
          <div
            className={cn(
              "rounded-xl shadow-2xl border border-border overflow-hidden transition-all duration-300 h-full bg-background",
              previewMode === "desktop" ? "w-full max-w-[1200px]" : "w-[375px]"
            )}
          >
            <iframe
              key={iframeKey}
              src={iframeUrl}
              className="w-full h-full border-0"
              title="Website Vorschau"
              style={{ minHeight: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ========== PAGE-SPECIFIC CONTENT EDITORS (removed - now unified in renderContentEditor) ==========

  // ========== CONTENT EDITOR (Sidebar) ==========
  function renderContentEditor() {
    if (!activeSection) return null;

    // Custom section editor (home or page-level)
    const customs = activePage === "home" ? content.custom_sections : content.page_sections?.[activePage]?.custom_blocks;
    const custom = customs?.find((s) => s.id === activeSection);
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

    // Built-in section editors (page-level headers)
    switch (activeSection) {
      case "menu_header":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.menu_title} onChange={(e) => setContent((p) => ({ ...p, menu_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Untertitel"><Input value={content.menu_subtitle} onChange={(e) => setContent((p) => ({ ...p, menu_subtitle: e.target.value }))} /></FieldLabel>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">Die Menü-Produkte werden unter «Menü» im Admin verwaltet.</p>
          </div>
        );
      case "gallery_header":
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
      case "about_header":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.about_title} onChange={(e) => setContent((p) => ({ ...p, about_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Text"><Textarea value={content.about_text} onChange={(e) => setContent((p) => ({ ...p, about_text: e.target.value }))} rows={5} /></FieldLabel>
            <ImageField label="Bild" value={content.about_image} onUpload={(f) => uploadImage((url) => setContent((p) => ({ ...p, about_image: url })), f)} onRemove={() => setContent((p) => ({ ...p, about_image: "" }))} />
          </div>
        );
      case "catering_header":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.catering_title} onChange={(e) => setContent((p) => ({ ...p, catering_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Beschreibung"><Textarea value={content.catering_text} onChange={(e) => setContent((p) => ({ ...p, catering_text: e.target.value }))} rows={3} /></FieldLabel>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">Die Catering-Pakete sind aktuell fest definiert.</p>
          </div>
        );
      case "reservation_header":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Input value={content.reservation_title} onChange={(e) => setContent((p) => ({ ...p, reservation_title: e.target.value }))} /></FieldLabel>
            <FieldLabel label="Beschreibung"><Textarea value={content.reservation_text} onChange={(e) => setContent((p) => ({ ...p, reservation_text: e.target.value }))} rows={3} /></FieldLabel>
          </div>
        );
      case "hero":
        return (
          <div className="space-y-4">
            <FieldLabel label="Titel"><Textarea value={content.hero_title} onChange={(e) => setContent((p) => ({ ...p, hero_title: e.target.value }))} rows={2} /></FieldLabel>
            <FieldLabel label="Untertitel"><Input value={content.hero_subtitle} onChange={(e) => setContent((p) => ({ ...p, hero_subtitle: e.target.value }))} /></FieldLabel>
            <ImageField label="Hintergrundbild" value={content.hero_image} onUpload={(f) => uploadImage((url) => setContent((p) => ({ ...p, hero_image: url })), f)} onRemove={() => setContent((p) => ({ ...p, hero_image: "" }))} />
            
            <div className="border-t border-border pt-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Elemente positionieren</label>
              <FreePositionEditor
                elements={[
                  {
                    id: "hero_title",
                    label: "Titel",
                    defaultX: 5,
                    defaultY: 15,
                    render: (scale) => (
                      <div className="text-foreground font-bold text-xs uppercase leading-tight whitespace-pre-line max-w-[120px]" style={{ fontFamily: "'League Spartan', sans-serif" }}>
                        {content.hero_title}
                      </div>
                    ),
                  },
                  {
                    id: "hero_subtitle",
                    label: "Untertitel",
                    defaultX: 5,
                    defaultY: 45,
                    render: () => (
                      <div className="text-muted-foreground text-[8px] max-w-[150px]">
                        {content.hero_subtitle}
                      </div>
                    ),
                  },
                  {
                    id: "hero_buttons",
                    label: "Buttons",
                    defaultX: 5,
                    defaultY: 58,
                    render: () => (
                      <div className="flex gap-1">
                        <div className="border border-foreground/50 rounded px-2 py-0.5 text-[6px] text-foreground">Bestellen</div>
                        <div className="border border-foreground/50 rounded px-2 py-0.5 text-[6px] text-foreground">Reservieren</div>
                        <div className="border border-foreground/50 rounded px-2 py-0.5 text-[6px] text-foreground">Catering</div>
                      </div>
                    ),
                  },
                  {
                    id: "hero_mascot",
                    label: "Maskottchen",
                    defaultX: 65,
                    defaultY: 20,
                    defaultScale: 1,
                    render: () => (
                      <img src="/src/assets/pirate-mascot.png" alt="Maskottchen" className="w-16 h-auto pointer-events-none" />
                    ),
                  },
                ]}
                positions={content.element_positions?.hero || {}}
                onChange={(pos) =>
                  setContent((p) => ({
                    ...p,
                    element_positions: { ...p.element_positions, hero: pos },
                  }))
                }
                bgColor="hsl(var(--background))"
                bgImage={content.hero_image || undefined}
              />
            </div>
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
};

// ===== HELPERS =====

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
