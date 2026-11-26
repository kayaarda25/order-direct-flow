import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import CorpMenuPicker from "@/components/corporate/CorpMenuPicker";
import { corp, chf, fmtDate, remaining, type CorpLine } from "@/lib/corporateApi";
import FirmInvoices from "@/components/corporate/FirmInvoices";

const FirmaAdminPage = () => {
  const { token = "" } = useParams();
  const [pw, setPw] = useState(sessionStorage.getItem(`corpadm:${token}`) || "");
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<{ id?: string; name: string; lines: CorpLine[] } | null>(null);
  const [now, setNow] = useState(Date.now());

  const call = (action: string, extra: Record<string, unknown> = {}) => corp({ action, token, password: pw, date: d?.date, ...extra });
  const load = async () => {
    setErr("");
    try { const r = await corp({ action: "firm_overview", token, password: pw }); setD(r); sessionStorage.setItem(`corpadm:${token}`, pw); }
    catch (e: any) { setErr(e.message); setD(null); }
  };
  useEffect(() => { if (pw) load(); const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const run = async (fn: () => Promise<any>) => { setErr(""); try { const r = await fn(); if (r?.ok === false) setErr(r.error); await load(); } catch (e: any) { setErr(e.message); } };

  if (!d) return (
    <div className="container mx-auto px-4 py-24 max-w-sm">
      <Helmet><title>Firmenadministration | Pizza Piratino</title><meta name="robots" content="noindex" /></Helmet>
      <h1 className="font-heading text-3xl uppercase mb-4">Firmenadministration</h1>
      <Input type="password" placeholder="Passwort" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
      <Button className="w-full mt-3" onClick={load}>Anmelden</Button>
      {err && <p className="text-destructive text-sm mt-3">{err}</p>}
    </div>
  );

  const c = d.client;
  const count = d.orders.length;
  const total = d.orders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const belowMin = count < c.min_orders;
  const canEdit = !d.batch;

  return (
    <div className="container mx-auto px-4 py-10">
      <p className="text-sm uppercase tracking-wider text-primary">Firmenadministration</p>
      <h1 className="font-heading text-4xl uppercase">{c.name}</h1>
      {!d.date ? <p className="mt-4">Zurzeit ist kein Liefertag offen.</p> : (
        <>
          <div className="grid sm:grid-cols-4 gap-3 my-6">
            {[["Lieferung", `${fmtDate(d.date)}, ${c.delivery_time} Uhr`], ["Bestellschluss", `${c.cutoff_time} Uhr · ${remaining(d.cutoff_at, now)}`], ["Bestellungen", `${count} (min. ${c.min_orders})`], ["Gesamtbetrag", chf(total)]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-card p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="font-semibold">{v}</div></div>
            ))}
          </div>
          {belowMin && !d.batch && <p className="mb-4 rounded-md border border-destructive p-3 text-destructive">Achtung: Mindestbestellmenge von {c.min_orders} Bestellungen noch nicht erreicht.{c.auto_release && !c.allow_auto_below_min ? " Die automatische Freigabe findet so nicht statt." : ""}</p>}
          {d.batch ? (
            <p className="mb-6 rounded-md border border-primary p-3">Sammelbestellung freigegeben am {new Date(d.batch.released_at).toLocaleString("de-CH")} – Piratino hat sie erhalten.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Button size="lg" disabled={!count} onClick={() => confirm(`Sammelbestellung mit ${count} Bestellungen jetzt an Piratino senden?`) && run(() => call("firm_release"))}>Sammelbestellung freigeben</Button>
              <label className="flex items-center gap-2 text-sm"><Switch checked={c.auto_release} onCheckedChange={(v) => run(() => call("firm_set_auto", { auto_release: v }))} /> Automatisch beim Bestellschluss freigeben</label>
              <Button variant="outline" onClick={() => setEdit({ name: "", lines: [] })}>Bestellung hinzufügen</Button>
            </div>
          )}
          {err && <p className="text-destructive mb-4">{err}</p>}
          {edit && (
            <div className="rounded-lg border border-border p-4 mb-8">
              <h2 className="font-heading text-2xl uppercase mb-3">{edit.id ? "Bestellung bearbeiten" : "Neue Bestellung"}</h2>
              <Input className="max-w-sm mb-4" placeholder="Name des Mitarbeiters" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              <CorpMenuPicker menu={d.menu} lines={edit.lines} onChange={(lines) => setEdit({ ...edit, lines })} discount={Number(c.discount_percent) || 0} />
              <div className="flex gap-2 mt-4">
                <Button onClick={() => run(async () => { const r = await call("firm_save", { order_id: edit.id, employee_name: edit.name, items: edit.lines }); setEdit(null); return r; })}>Speichern</Button>
                <Button variant="ghost" onClick={() => setEdit(null)}>Abbrechen</Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-card"><tr><th className="text-left p-3">Mitarbeiter</th><th className="text-left p-3">Produkte</th><th className="text-right p-3">Betrag</th><th className="p-3"></th></tr></thead>
              <tbody>
                {d.orders.map((o: any) => (
                  <tr key={o.id} className="border-t border-border align-top">
                    <td className="p-3 font-medium">{o.employee_name}</td>
                    <td className="p-3">{o.items.map((l: any, i: number) => <div key={i}>{l.quantity}x {l.name}{l.modifiers ? ` (${l.modifiers})` : ""}{l.notes ? ` – ${l.notes}` : ""}</div>)}</td>
                    <td className="p-3 text-right">{chf(o.total)}</td>
                    <td className="p-3 text-right whitespace-nowrap">{canEdit && <>
                      <Button size="sm" variant="outline" onClick={() => setEdit({ id: o.id, name: o.employee_name, lines: o.items })}>Bearbeiten</Button>{" "}
                      <Button size="sm" variant="ghost" onClick={() => confirm("Bestellung löschen?") && run(() => call("firm_delete", { order_id: o.id }))}>Löschen</Button></>}
                    </td>
                  </tr>
                ))}
                {!count && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Noch keine Bestellungen.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      <FirmInvoices token={token} password={pw} />
    </div>
  );
};
export default FirmaAdminPage;
