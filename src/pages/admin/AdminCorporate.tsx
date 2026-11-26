import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { corp } from "@/lib/corporateApi";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const empty = {
  slug: "", name: "", billing_address: "", delivery_address: "", contact_name: "", contact_email: "", contact_phone: "", invoice_email: "",
  delivery_days: [1, 2, 3, 4, 5], delivery_time: "12:00", cutoff_time: "10:30", min_orders: 1, discount_percent: 0,
  special_prices: {} as Record<string, number>, allowed_item_ids: [] as string[], payment_terms_days: 14,
  auto_release: false, allow_auto_below_min: false, active: true,
};

const AdminCorporate = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const load = async () => {
    const [{ data: c }, { data: m }, { data: o }, { data: b }] = await Promise.all([
      supabase.from("corporate_clients").select("*").order("name"),
      supabase.from("menu_items").select("id,name,category").eq("available", true).order("sort_order"),
      supabase.from("corporate_orders").select("client_id,delivery_date,total").eq("status", "active").gte("delivery_date", new Date().toISOString().slice(0, 10)),
      supabase.from("corporate_batches").select("client_id,delivery_date"),
    ]);
    setClients(c || []); setMenu(m || []); setOrders(o || []); setBatches(b || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const f = { ...form, slug: String(form.slug).toLowerCase().replace(/[^a-z0-9-]/g, "") };
    if (!f.slug || !f.name) { toast({ title: "Firmenname und Link-Name sind nötig", variant: "destructive" }); return; }
    const { id, admin_token, admin_password, created_at, updated_at, ...data } = f;
    const { error } = id ? await supabase.from("corporate_clients").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id) : await supabase.from("corporate_clients").insert(data);
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Gespeichert" }); setForm(null); load();
  };
  const del = async (id: string) => { if (!confirm("Firma und alle ihre Bestellungen löschen?")) return; await supabase.from("corporate_clients").delete().eq("id", id); load(); };
  const release = async (client_id: string, date: string) => {
    try { const r = await corp({ action: "admin_release", client_id, date }); toast({ title: r.ok ? "Freigegeben und an Kasse/Drucker gesendet" : r.error }); load(); }
    catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };
  const copy = (t: string) => { navigator.clipboard.writeText(t); toast({ title: "Kopiert" }); };
  const field = (k: string, label: string, type = "text") => (
    <div><label className="text-sm font-medium block mb-1">{label}</label>
      <Input type={type} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: type === "number" ? Number(e.target.value) : e.target.value })} /></div>
  );
  const origin = "https://piratino-pizzeria.ch";

  if (form) return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{form.id ? "Firma bearbeiten" : "Neue Firma"}</h1>
      <Card className="mb-4"><CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
        {field("name", "Firmenname")}
        {field("slug", "Link-Name (piratino-pizzeria.ch/firma/...)")}
        <div><label className="text-sm font-medium block mb-1">Rechnungsadresse</label><Textarea value={form.billing_address || ""} onChange={(e) => setForm({ ...form, billing_address: e.target.value })} /></div>
        <div><label className="text-sm font-medium block mb-1">Lieferadresse</label><Textarea value={form.delivery_address || ""} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} /></div>
        {field("contact_name", "Kontaktperson")}
        {field("contact_email", "E-Mail Kontaktperson", "email")}
        {field("contact_phone", "Telefon Kontaktperson")}
        {field("invoice_email", "E-Mail für Monatsrechnungen", "email")}
      </CardContent></Card>
      <Card className="mb-4"><CardHeader><CardTitle className="text-base">Lieferung und Bestellschluss</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">{DAYS.map((d, i) => {
          const on = form.delivery_days.includes(i + 1);
          return <Button key={d} type="button" size="sm" variant={on ? "default" : "outline"} onClick={() => setForm({ ...form, delivery_days: on ? form.delivery_days.filter((x: number) => x !== i + 1) : [...form.delivery_days, i + 1].sort() })}>{d}</Button>;
        })}</div>
        <div className="grid sm:grid-cols-4 gap-4">
          {field("delivery_time", "Lieferzeit", "time")}
          {field("cutoff_time", "Bestellschluss", "time")}
          {field("min_orders", "Mindestbestellmenge", "number")}
          {field("payment_terms_days", "Zahlungsfrist (Tage)", "number")}
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.auto_release} onCheckedChange={(v) => setForm({ ...form, auto_release: v })} /> Automatisch beim Bestellschluss freigeben</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.allow_auto_below_min} onCheckedChange={(v) => setForm({ ...form, allow_auto_below_min: v })} /> Auch unter der Mindestbestellmenge automatisch freigeben</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Aktiv</label>
      </CardContent></Card>
      <Card className="mb-4"><CardHeader><CardTitle className="text-base">Preise und Produkte</CardTitle></CardHeader><CardContent>
        <div className="max-w-xs mb-4">{field("discount_percent", "Rabatt auf alles (%)", "number")}</div>
        <p className="text-sm text-muted-foreground mb-2">Haken = für diese Firma bestellbar (keiner gewählt = alle). Sonderpreis leer lassen = normaler Preis.</p>
        <div className="max-h-96 overflow-y-auto border rounded">
          {menu.map((m) => {
            const on = form.allowed_item_ids.includes(m.id);
            return <div key={m.id} className="flex items-center gap-3 px-3 py-1.5 border-b text-sm">
              <input type="checkbox" checked={on} onChange={() => setForm({ ...form, allowed_item_ids: on ? form.allowed_item_ids.filter((x: string) => x !== m.id) : [...form.allowed_item_ids, m.id] })} />
              <span className="flex-1">{m.name} <span className="text-muted-foreground">({m.category})</span></span>
              <Input className="w-24 h-8" type="number" step="0.05" placeholder="Sonderpreis" value={form.special_prices[m.id] ?? ""}
                onChange={(e) => { const sp = { ...form.special_prices }; if (e.target.value === "") delete sp[m.id]; else sp[m.id] = Number(e.target.value); setForm({ ...form, special_prices: sp }); }} />
            </div>;
          })}
        </div>
      </CardContent></Card>
      <div className="flex gap-2"><Button onClick={save}>Speichern</Button><Button variant="ghost" onClick={() => setForm(null)}>Abbrechen</Button></div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Firmenkunden</h1>
        <Button onClick={() => setForm({ ...empty })}>Neue Firma</Button>
      </div>
      <div className="space-y-4">
        {clients.map((c) => {
          const open = Object.entries(orders.filter((o) => o.client_id === c.id).reduce((a: any, o) => { (a[o.delivery_date] ||= []).push(o); return a; }, {}))
            .filter(([d]) => !batches.some((b) => b.client_id === c.id && b.delivery_date === d));
          return (
            <Card key={c.id}><CardContent className="pt-6 space-y-2 text-sm">
              <div className="flex justify-between flex-wrap gap-2">
                <div><div className="font-semibold text-base">{c.name} {!c.active && <span className="text-muted-foreground">(inaktiv)</span>}</div>
                  <div className="text-muted-foreground">{c.delivery_days.map((d: number) => DAYS[d - 1]).join(", ")} · Lieferung {c.delivery_time} · Schluss {c.cutoff_time} · min. {c.min_orders} · {c.auto_release ? "automatische Freigabe" : "manuelle Freigabe"}</div></div>
                <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setForm({ ...c })}>Bearbeiten</Button><Button size="sm" variant="destructive" onClick={() => del(c.id)}>Löschen</Button></div>
              </div>
              <div>Mitarbeiter-Link: <button className="underline" onClick={() => copy(`${origin}/firma/${c.slug}`)}>{origin}/firma/{c.slug}</button></div>
              <div>Firmenadmin-Link: <button className="underline" onClick={() => copy(`${origin}/firma-admin/${c.admin_token}`)}>{origin}/firma-admin/{c.admin_token}</button> · Passwort: <code>{c.admin_password}</code></div>
              {open.map(([d, list]: any) => (
                <div key={d} className="flex items-center gap-3 rounded bg-muted p-2">
                  <span>{d.split("-").reverse().join(".")}: {list.length} Bestellungen, CHF {list.reduce((s: number, o: any) => s + Number(o.total), 0).toFixed(2)}</span>
                  <Button size="sm" onClick={() => confirm("Jetzt an Kasse und Drucker senden?") && release(c.id, d)}>Jetzt freigeben</Button>
                </div>
              ))}
            </CardContent></Card>
          );
        })}
        {!clients.length && <p className="text-muted-foreground">Noch keine Firmenkunden.</p>}
      </div>
    </div>
  );
};
export default AdminCorporate;
