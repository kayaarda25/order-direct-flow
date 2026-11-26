import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const FirmenbestellungenPage = () => {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [f, setF] = useState({ company: "", name: "", email: "", phone: "", persons: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setState("busy");
    const message = `FIRMEN-LIEFERSERVICE ANFRAGE. Ca. ${f.persons || "?"} Mitarbeiter. ${f.message}`;
    const { error } = await supabase.from("catering_inquiries").insert({ package_id: "firmen", package_name: "Firmen-Lieferservice", persons: Number(f.persons) || 1, name: f.name, email: f.email, phone: f.phone, company: f.company, message });
    if (error) { setState("error"); return; }
    supabase.functions.invoke("print-request", { body: { kind: "catering", name: f.name, phone: f.phone, email: f.email, company: f.company, persons: f.persons, package_name: "Firmen-Lieferservice", message } }).catch(() => {});
    setState("sent");
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="container mx-auto px-4 py-16">
      <Helmet>
        <title>Firmenbestellungen – Mittagessen fürs Team | Pizza Piratino Zürich</title>
        <meta name="description" content="Pizza, Pasta und Salate für Ihr Team in Zürich: ein Firmenlink für alle Mitarbeiter, eine Sammellieferung, eine Monatsrechnung." />
      </Helmet>
      <h1 className="font-heading text-5xl uppercase text-center mb-4">Firmenbestellungen</h1>
      <p className="text-center max-w-2xl mx-auto text-muted-foreground mb-12">Mittagessen für Ihr Team, ohne Aufwand: Jeder Mitarbeiter bestellt selbst über Ihren Firmenlink, wir liefern alles zusammen zur gewünschten Zeit – jede Pizza mit Namen beschriftet. Bezahlt wird bequem per Monatsrechnung.</p>
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[["Link teilen", "Ihre Firma erhält einen eigenen Bestelllink für alle Mitarbeiter. Keine Registrierung nötig."], ["Bestellen", "Name eingeben, Essen wählen, fertig. Bis zum Bestellschluss änderbar."], ["Geliefert und verrechnet", "Eine Sammellieferung, beschriftet pro Person. Eine Rechnung am Monatsende mit QR-Einzahlungsschein."]].map(([t, x]) => (
          <div key={t} className="rounded-lg border border-border bg-card p-6"><h2 className="font-heading text-2xl uppercase mb-2">{t}</h2><p className="text-muted-foreground">{x}</p></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <form onSubmit={send} className="space-y-3">
          <h2 className="font-heading text-3xl uppercase">Zusammenarbeit anfragen</h2>
          {state === "sent" ? <p className="text-primary">Danke! Wir melden uns in Kürze bei Ihnen.</p> : <>
            <Input required placeholder="Firma" value={f.company} onChange={set("company")} />
            <Input required placeholder="Kontaktperson" value={f.name} onChange={set("name")} />
            <Input required type="email" placeholder="E-Mail" value={f.email} onChange={set("email")} />
            <Input placeholder="Telefon" value={f.phone} onChange={set("phone")} />
            <Input type="number" min={1} placeholder="Anzahl Mitarbeiter (ca.)" value={f.persons} onChange={set("persons")} />
            <Textarea placeholder="Gewünschte Liefertage und Zeiten" value={f.message} onChange={set("message")} />
            {state === "error" && <p className="text-destructive text-sm">Senden fehlgeschlagen, bitte erneut versuchen.</p>}
            <Button type="submit" disabled={state === "busy"}>Anfrage senden</Button>
          </>}
        </form>
        <div>
          <h2 className="font-heading text-3xl uppercase mb-3">Bereits Firmenkunde?</h2>
          <p className="text-muted-foreground mb-3">Geben Sie den Namen Ihres Firmenlinks ein (z. B. «rubi»).</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const s = code.trim().toLowerCase().replace(/.*\/firma\//, ""); if (s) nav(`/firma/${s}`); }}>
            <Input placeholder="firmenname" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button type="submit">Öffnen</Button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default FirmenbestellungenPage;
