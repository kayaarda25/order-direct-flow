import { type SectionLayout, DEFAULT_LAYOUT } from "@/hooks/useSiteContent";
import { AlignLeft, AlignCenter, AlignRight, Columns2, Columns3, Columns4, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutPanelProps {
  layout: Partial<SectionLayout>;
  onChange: (layout: Partial<SectionLayout>) => void;
  sectionType: string;
}

const ToggleBtn = ({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "h-8 w-8 rounded flex items-center justify-center transition-colors",
      active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
    )}
  >
    {children}
  </button>
);

const LayoutPanel = ({ layout, onChange, sectionType }: LayoutPanelProps) => {
  const l = { ...DEFAULT_LAYOUT, ...layout };
  const set = (partial: Partial<SectionLayout>) => onChange({ ...layout, ...partial });

  const showImagePosition = ['hero', 'about', 'image_block', 'banner', 'cta'].includes(sectionType);
  const showColumns = ['gallery'].includes(sectionType);

  return (
    <div className="space-y-5">
      {/* Text Alignment */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Textausrichtung</label>
        <div className="flex gap-1">
          <ToggleBtn active={l.textAlign === 'left'} onClick={() => set({ textAlign: 'left' })} title="Links">
            <AlignLeft className="h-4 w-4" />
          </ToggleBtn>
          <ToggleBtn active={l.textAlign === 'center'} onClick={() => set({ textAlign: 'center' })} title="Zentriert">
            <AlignCenter className="h-4 w-4" />
          </ToggleBtn>
          <ToggleBtn active={l.textAlign === 'right'} onClick={() => set({ textAlign: 'right' })} title="Rechts">
            <AlignRight className="h-4 w-4" />
          </ToggleBtn>
        </div>
      </div>

      {/* Image Position */}
      {showImagePosition && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Bildposition</label>
          <div className="flex flex-wrap gap-1">
            {(['left', 'right', 'top', 'bottom', 'background'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => set({ imagePosition: pos })}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  l.imagePosition === pos ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                {pos === 'left' && 'Links'}
                {pos === 'right' && 'Rechts'}
                {pos === 'top' && 'Oben'}
                {pos === 'bottom' && 'Unten'}
                {pos === 'background' && 'Hintergrund'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Columns */}
      {showColumns && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Spalten</label>
          <div className="flex gap-1">
            <ToggleBtn active={l.columns === 2} onClick={() => set({ columns: 2 })} title="2 Spalten">
              <Columns2 className="h-4 w-4" />
            </ToggleBtn>
            <ToggleBtn active={l.columns === 3} onClick={() => set({ columns: 3 })} title="3 Spalten">
              <Columns3 className="h-4 w-4" />
            </ToggleBtn>
            <ToggleBtn active={l.columns === 4} onClick={() => set({ columns: 4 })} title="4 Spalten">
              <Columns4 className="h-4 w-4" />
            </ToggleBtn>
          </div>
        </div>
      )}

      {/* Background */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Hintergrund</label>
        <div className="flex gap-1">
          {([
            { val: 'white' as const, label: 'Weiss', preview: 'bg-white border border-border' },
            { val: 'dark' as const, label: 'Dunkel', preview: 'bg-[hsl(0_45%_14%)]' },
            { val: 'accent' as const, label: 'Akzent', preview: 'bg-amber-100' },
          ]).map((bg) => (
            <button
              key={bg.val}
              onClick={() => set({ bgColor: bg.val })}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                l.bgColor === bg.val ? "ring-2 ring-primary" : "hover:bg-secondary"
              )}
            >
              <span className={cn("w-4 h-4 rounded-full", bg.preview)} />
              {bg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Padding */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Abstand</label>
        <div className="flex gap-1">
          {([
            { val: 'sm' as const, label: 'Klein' },
            { val: 'md' as const, label: 'Mittel' },
            { val: 'lg' as const, label: 'Gross' },
          ]).map((p) => (
            <button
              key={p.val}
              onClick={() => set({ padding: p.val })}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                l.padding === p.val ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayoutPanel;
