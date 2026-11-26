import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2 } from "lucide-react";
import { chf, type CorpLine, type CorpMenuItem } from "@/lib/corporateApi";

const CAT: Record<string, string> = { tagesmenu: "Tagesmenü", pizza: "Pizza", pasta: "Pasta", salat: "Salate", salate: "Salate", getraenke: "Getränke", dessert: "Dessert" };

export function lineEstimate(menu: CorpMenuItem[], l: CorpLine, discount = 0) {
  const item = menu.find((m) => m.id === l.item_id);
  if (!item) return l.unit_price || 0;
  let base = item.corporate_price; let extra = 0;
  for (const g of item.modifier_groups) for (const id of l.selected[g.id] || []) {
    const o = g.options.find((x) => x.id === id); if (!o) continue;
    if (g.id === "groesse" && o.delivery_price != null) base = o.delivery_price * (1 - discount / 100);
    else extra += (o.price || 0) * (1 - discount / 100);
  }
  return Math.round((base + extra) * 20) / 20;
}

export default function CorpMenuPicker({ menu, lines, onChange, discount = 0 }: { menu: CorpMenuItem[]; lines: CorpLine[]; onChange: (l: CorpLine[]) => void; discount?: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const groups = useMemo(() => {
    const g: Record<string, CorpMenuItem[]> = {};
    menu.forEach((m) => (g[m.category] ||= []).push(m));
    return Object.entries(g);
  }, [menu]);

  const add = (item: CorpMenuItem) => {
    const missing = item.modifier_groups.find((g) => g.required && !(sel[g.id]?.length));
    if (missing) { setError(`Bitte wählen: ${missing.name}`); return; }
    const modifiers = item.modifier_groups.flatMap((g) => (sel[g.id] || []).map((id) => g.options.find((o) => o.id === id)?.name)).filter(Boolean).join(", ");
    onChange([...lines, { item_id: item.id, name: item.name, quantity: 1, selected: sel, notes: note, modifiers }]);
    setOpen(null); setSel({}); setNote(""); setError("");
  };
  const total = lines.reduce((s, l) => s + lineEstimate(menu, l, discount) * l.quantity, 0);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      <div className="space-y-8">
        {groups.map(([cat, items]) => (
          <section key={cat}>
            <h2 className="font-heading text-2xl uppercase mb-3">{CAT[cat] || cat}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex gap-3">
                    {item.image_url && <img src={item.image_url} alt={item.name} loading="lazy" className="w-16 h-16 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-primary font-medium">{chf(item.corporate_price)}</div>
                      {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                    </div>
                  </div>
                  {open === item.id ? (
                    <div className="mt-3 space-y-2">
                      {item.modifier_groups.map((g) => (
                        <div key={g.id}>
                          <label className="text-xs font-medium block mb-1">{g.name}{g.required ? " *" : ""}</label>
                          {g.multiSelect ? (
                            <div className="flex flex-wrap gap-1">
                              {g.options.map((o) => {
                                const on = sel[g.id]?.includes(o.id);
                                return <button type="button" key={o.id} onClick={() => setSel({ ...sel, [g.id]: on ? sel[g.id].filter((x) => x !== o.id) : [...(sel[g.id] || []), o.id] })}
                                  className={`text-xs px-2 py-1 rounded border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{o.name}{o.price ? ` +${o.price}` : ""}</button>;
                              })}
                            </div>
                          ) : (
                            <select className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={sel[g.id]?.[0] || ""} onChange={(e) => setSel({ ...sel, [g.id]: e.target.value ? [e.target.value] : [] })}>
                              <option value="">Bitte wählen</option>
                              {g.options.map((o) => <option key={o.id} value={o.id}>{o.name}{o.delivery_price != null && g.id === "groesse" ? ` (CHF ${o.delivery_price})` : o.price ? ` (+CHF ${o.price})` : ""}</option>)}
                            </select>
                          )}
                        </div>
                      ))}
                      <Input placeholder="Bemerkung (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={150} />
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => add(item)}>Hinzufügen</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setOpen(null); setError(""); }}>Abbrechen</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => { setOpen(item.id); setSel({}); setNote(""); setError(""); }}>
                      <Plus className="h-4 w-4 mr-1" /> Auswählen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <aside className="lg:sticky lg:top-24 h-fit rounded-lg border border-border bg-card p-4">
        <h3 className="font-heading text-xl uppercase mb-3">Deine Auswahl</h3>
        {lines.length === 0 && <p className="text-sm text-muted-foreground">Noch nichts ausgewählt.</p>}
        <ul className="space-y-3">
          {lines.map((l, i) => (
            <li key={i} className="text-sm">
              <div className="flex justify-between gap-2"><span className="font-medium">{l.name}</span><span>{chf(lineEstimate(menu, l, discount) * l.quantity)}</span></div>
              {l.modifiers && <div className="text-xs text-muted-foreground">{l.modifiers}</div>}
              {l.notes && <div className="text-xs text-muted-foreground">Bemerkung: {l.notes}</div>}
              <div className="flex items-center gap-2 mt-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onChange(lines.map((x, j) => j === i ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}><Minus className="h-3 w-3" /></Button>
                <span>{l.quantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onChange(lines.map((x, j) => j === i ? { ...x, quantity: Math.min(20, x.quantity + 1) } : x))}><Plus className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" aria-label="Entfernen" onClick={() => onChange(lines.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border mt-4 pt-3 flex justify-between font-semibold"><span>Total</span><span>{chf(total)}</span></div>
        <p className="text-xs text-muted-foreground mt-1">Bezahlung per Monatsrechnung über deine Firma.</p>
      </aside>
    </div>
  );
}
