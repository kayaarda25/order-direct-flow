import { useState, useRef, useCallback, useEffect } from "react";
import { type ElementPosition } from "@/hooks/useSiteContent";
import { Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorElement {
  id: string;
  label: string;
  defaultX: number;
  defaultY: number;
  defaultWidth?: number;
  defaultScale?: number;
  render: (scale: number) => React.ReactNode;
}

interface FreePositionEditorProps {
  elements: EditorElement[];
  positions: Record<string, ElementPosition>;
  onChange: (positions: Record<string, ElementPosition>) => void;
  bgColor?: string;
  bgImage?: string;
  aspectRatio?: number; // width/height, default 16/9
}

const FreePositionEditor = ({
  elements,
  positions,
  onChange,
  bgColor = "hsl(var(--background))",
  bgImage,
  aspectRatio = 16 / 9,
}: FreePositionEditorProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number; elemX: number; elemY: number }>({ x: 0, y: 0, elemX: 0, elemY: 0 });

  const getPos = (id: string): ElementPosition => {
    const el = elements.find((e) => e.id === id);
    return positions[id] || {
      x: el?.defaultX ?? 10,
      y: el?.defaultY ?? 10,
      width: el?.defaultWidth,
      scale: el?.defaultScale ?? 1,
    };
  };

  const updatePos = useCallback(
    (id: string, update: Partial<ElementPosition>) => {
      const current = getPos(id);
      onChange({ ...positions, [id]: { ...current, ...update } });
    },
    [positions, onChange, elements]
  );

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(id);
    setDragging(id);
    const pos = getPos(id);
    dragStart.current = { x: e.clientX, y: e.clientY, elemX: pos.x, elemY: pos.y };
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
      const newX = Math.max(-10, Math.min(90, dragStart.current.elemX + dx));
      const newY = Math.max(-10, Math.min(90, dragStart.current.elemY + dy));
      updatePos(dragging, { x: newX, y: newY });
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, updatePos]);

  const adjustScale = (id: string, delta: number) => {
    const pos = getPos(id);
    const newScale = Math.max(0.2, Math.min(3, (pos.scale || 1) + delta));
    updatePos(id, { scale: newScale });
  };

  const resetElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (el) {
      updatePos(id, {
        x: el.defaultX,
        y: el.defaultY,
        scale: el.defaultScale ?? 1,
        width: el.defaultWidth,
      });
    }
  };

  const resetAll = () => {
    const newPositions: Record<string, ElementPosition> = {};
    elements.forEach((el) => {
      newPositions[el.id] = {
        x: el.defaultX,
        y: el.defaultY,
        scale: el.defaultScale ?? 1,
        width: el.defaultWidth,
      };
    });
    onChange(newPositions);
  };

  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative rounded-lg border-2 border-border overflow-hidden select-none"
        style={{
          paddingBottom: `${(1 / aspectRatio) * 100}%`,
          background: bgImage
            ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${bgImage}) center/cover`
            : bgColor,
        }}
        onClick={() => setSelected(null)}
      >
        {elements.map((el) => {
          const pos = getPos(el.id);
          const isSelected = selected === el.id;
          const isDragging = dragging === el.id;

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleMouseDown(e, el.id)}
              onClick={(e) => { e.stopPropagation(); setSelected(el.id); }}
              className={cn(
                "absolute cursor-move transition-shadow",
                isSelected && "ring-2 ring-blue-500 ring-offset-1",
                isDragging && "z-50 shadow-2xl"
              )}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `scale(${pos.scale || 1})`,
                transformOrigin: "top left",
              }}
            >
              {el.render(pos.scale || 1)}
              {isSelected && (
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {selected && (
            <>
              <span className="text-xs text-muted-foreground mr-1">
                {elements.find((e) => e.id === selected)?.label}:
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => adjustScale(selected, -0.1)}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground w-8 text-center">
                {Math.round((getPos(selected).scale || 1) * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => adjustScale(selected, 0.1)}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => resetElement(selected)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </>
          )}
          {!selected && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3" /> Elemente anklicken & verschieben
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetAll}>
          Alle zurücksetzen
        </Button>
      </div>

      {/* Element list */}
      <div className="space-y-1">
        {elements.map((el) => {
          const pos = getPos(el.id);
          return (
            <div
              key={el.id}
              onClick={() => setSelected(el.id)}
              className={cn(
                "flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors",
                selected === el.id ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
              )}
            >
              <span>{el.label}</span>
              <span className="text-muted-foreground">
                x:{Math.round(pos.x)}% y:{Math.round(pos.y)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FreePositionEditor;
