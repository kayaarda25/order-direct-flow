import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import CorpMenuPicker from "@/components/corporate/CorpMenuPicker";
import { corp, chf, fmtDate, remaining, type CorpLine, type CorpMenuItem } from "@/lib/corporateApi";

const FirmaOrderPage = () => {
  const { slug = "" } = useParams();
  const key = `corp:${slug}`;
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  const [client, setClient] = useState<any>(null);
  const [menu, setMenu] = useState<CorpMenuItem[]>([]);
  const [err, setErr] = useState("");
  const [name, setName] = useState<string>(saved.name || "");
  const [lines, setLines] = useState<CorpLine[]>([]);
  const [remember, setRemember] = useState<boolean>(!!saved.last);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { corp({ action: "client", slug }).then((d) => { setClient(d.client); setMenu(d.menu); }).catch((e) => setErr(e.message)); }, [slug]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const submit = async () => {
    setErr("");
    if (name.trim().length < 2) { setErr("Bitte Vor- und Nachnamen eingeben"); return; }
    if (!lines.length) { setErr("Bitte mindestens ein Produkt wählen"); return; }
    setBusy(true);
    try {
      const d = await corp({ action: "place", slug, employee_name: name, items: lines });
      localStorage.setItem(key, JSON.stringify({ name, last: remember ? lines : undefined, orders: [...(saved.orders || []), d.order.edit_token].slice(-10) }));
      setDone(d.order);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  if (err && !client) return <div className="container mx-auto px-4 py-24 text-center"><h1 className="font-heading text-3xl mb-4">Firma nicht gefunden</h1><p className="text-muted-foreground">Bitte prüfe deinen Firmenlink.</p></div>;
  if (!client) return <div className="py-24 text-center">Laden...</div>;

  if (done) {
    const link = `${window.location.origin}/firma/bestellung/${done.edit_token}`;
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center">
        <h1 className="font-heading text-4xl uppercase mb-4">Danke, {name.split(" ")[0]}!</h1>
        <p className="mb-2">Deine Bestellung für <strong>{fmtDate(done.delivery_date)}</strong> um {client.delivery_time} Uhr ist eingegangen.</p>
        <p className="mb-6">Betrag: {chf(done.total)} – Bezahlung über die Monatsrechnung von {client.name}.</p>
        <div className="rounded-lg border border-border bg-card p-4 text-left text-sm mb-6">
          <p className="font-medium mb-1">Dein persönlicher Link zum Ändern oder Stornieren (bis {client.cutoff_time} Uhr):</p>
          <Link to={`/firma/bestellung/${done.edit_token}`} className="text-primary break-all underline">{link}</Link>
        </div>
        <Button onClick={() => { setDone(null); setLines([]); }}>Weitere Bestellung</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet><title>{`Firmenbestellung ${client.name} | Pizza Piratino`}</title><meta name="robots" content="noindex" /></Helmet>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wider text-primary">Firmenbestellung</p>
        <h1 className="font-heading text-4xl md:text-5xl uppercase">{client.name}</h1>
        {client.next_delivery ? (
          <p className="mt-2 text-muted-foreground">Lieferung {fmtDate(client.next_delivery)} um {client.delivery_time} Uhr · Bestellschluss {client.cutoff_time} Uhr · noch {remaining(client.cutoff_at, now)}</p>
        ) : <p className="mt-2 text-destructive">Zurzeit kann nicht bestellt werden.</p>}
      </header>
      <div className="max-w-md mb-8 space-y-3">
        <label className="text-sm font-medium block">Vor- und Nachname</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anna Muster" maxLength={80} />
        {saved.last?.length > 0 && lines.length === 0 && (
          <Button variant="outline" onClick={() => setLines(saved.last)}>Letzte Bestellung wiederholen</Button>
        )}
      </div>
      {client.next_delivery && <CorpMenuPicker menu={menu} lines={lines} onChange={setLines} discount={Number(client.discount_percent) || 0} />}
      {client.next_delivery && (
        <div className="max-w-md mt-8 space-y-3">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Bestellung für das nächste Mal merken</label>
          {err && <p className="text-destructive text-sm">{err}</p>}
          <Button size="lg" className="w-full" disabled={busy} onClick={submit}>{busy ? "Senden..." : "Bestellung bestätigen"}</Button>
          {saved.orders?.length > 0 && <p className="text-xs text-muted-foreground">Bestehende Bestellung ändern: nutze den persönlichen Link aus deiner Bestätigung.</p>}
        </div>
      )}
    </div>
  );
};
export default FirmaOrderPage;
