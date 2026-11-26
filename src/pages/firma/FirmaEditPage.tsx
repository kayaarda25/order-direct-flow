import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CorpMenuPicker from "@/components/corporate/CorpMenuPicker";
import { corp, chf, fmtDate, remaining, type CorpLine, type CorpMenuItem } from "@/lib/corporateApi";

const FirmaEditPage = () => {
  const { token = "" } = useParams();
  const [d, setD] = useState<any>(null);
  const [menu, setMenu] = useState<CorpMenuItem[]>([]);
  const [lines, setLines] = useState<CorpLine[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());

  const load = () => corp({ action: "get_order", edit_token: token }).then((r) => {
    setD(r); setMenu(r.menu); setName(r.order.employee_name); setLines(r.order.items);
  }).catch((e) => setErr(e.message));
  useEffect(() => { load(); const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, [token]);

  const save = async () => { setErr(""); setMsg(""); try { const r = await corp({ action: "update_order", edit_token: token, employee_name: name, items: lines }); setMsg(`Gespeichert – neuer Betrag ${chf(r.total)}`); load(); } catch (e: any) { setErr(e.message); } };
  const cancel = async () => { if (!confirm("Bestellung wirklich stornieren?")) return; try { await corp({ action: "cancel_order", edit_token: token }); setMsg("Bestellung storniert"); load(); } catch (e: any) { setErr(e.message); } };

  if (!d) return <div className="py-24 text-center">{err || "Laden..."}</div>;
  const cancelled = d.order.status === "cancelled";
  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet><title>Meine Firmenbestellung | Pizza Piratino</title><meta name="robots" content="noindex" /></Helmet>
      <p className="text-sm uppercase tracking-wider text-primary">{d.client.name}</p>
      <h1 className="font-heading text-4xl uppercase">Meine Bestellung</h1>
      <p className="text-muted-foreground mt-2 mb-6">Lieferung {fmtDate(d.order.delivery_date)} um {d.client.delivery_time} Uhr · {d.open ? `Ändern möglich noch ${remaining(d.cutoff_at, now)}` : "Bestellschluss vorbei – keine Änderungen mehr möglich"}</p>
      {cancelled && <p className="mb-4 font-medium text-destructive">Diese Bestellung ist storniert.{d.open ? " Du kannst sie unten neu speichern." : ""}</p>}
      {d.open ? (
        <>
          <div className="max-w-md mb-6"><label className="text-sm font-medium block mb-1">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <CorpMenuPicker menu={menu} lines={lines} onChange={setLines} discount={Number(d.client.discount_percent) || 0} />
          <div className="flex gap-3 mt-6">
            <Button onClick={save}>Änderungen speichern</Button>
            {!cancelled && <Button variant="outline" onClick={cancel}>Bestellung stornieren</Button>}
          </div>
        </>
      ) : (
        <ul className="max-w-md space-y-2">{d.order.items.map((l: any, i: number) => <li key={i} className="flex justify-between"><span>{l.quantity}x {l.name} {l.modifiers && <span className="text-xs text-muted-foreground">({l.modifiers})</span>}</span><span>{chf(l.unit_price * l.quantity)}</span></li>)}
          <li className="flex justify-between font-semibold border-t border-border pt-2"><span>Total</span><span>{chf(d.order.total)}</span></li></ul>
      )}
      {msg && <p className="mt-4 text-primary">{msg}</p>}
      {err && <p className="mt-4 text-destructive">{err}</p>}
    </div>
  );
};
export default FirmaEditPage;
