import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { buildInvoice, invoiceNumber, monthName } from "@/lib/corporateInvoice";
import { invoiceHtml } from "@/lib/invoiceDocument";

const chf = (n: number) => `CHF ${n.toFixed(2)}`;
const ch = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("de-CH");
const prevMonth = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };

const AdminInvoices = () => {
  const { toast } = useToast();
  const [month, setMonth] = useState(prevMonth());
  const [clients, setClients] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const [y, m] = month.split("-").map(Number);
    const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    Promise.all([
      supabase.from("corporate_clients").select("*").order("name"),
      supabase.from("corporate_batches").select("client_id,delivery_date").gte("delivery_date", `${month}-01`).lt("delivery_date", end),
      supabase.from("corporate_orders").select("client_id,delivery_date,employee_name,total,items").eq("status", "active").gte("delivery_date", `${month}-01`).lt("delivery_date", end),
    ]).then(([c, b, o]) => { setClients(c.data || []); setBatches(b.data || []); setOrders(o.data || []); });
  }, [month]);

  const rows = useMemo(() => clients.map((c) => ({
    c, inv: buildInvoice(month, batches.filter((b) => b.client_id === c.id), orders.filter((o) => o.client_id === c.id)),
  })).filter((r) => r.inv.total > 0), [clients, batches, orders, month]);

  const open = (c: any, inv: ReturnType<typeof buildInvoice>) => {
    const w = window.open("", "_blank");
    if (!w) { toast({ title: "Pop-up blockiert", description: "Bitte Pop-ups für diese Seite erlauben.", variant: "destructive" }); return; }
    try { w.document.write(invoiceHtml(c, month, inv)); w.document.close(); }
    catch (e: any) { w.close(); toast({ title: "Rechnung fehlgeschlagen", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div><h1 className="text-2xl font-bold">Monatsrechnungen</h1><p className="text-sm text-muted-foreground">Werden automatisch aus allen freigegebenen Firmenbestellungen des Monats erstellt – mit QR-Einzahlungsschein.</p></div>
        <div><label className="text-sm block mb-1">Monat</label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
      </div>
      {rows.length === 0 && <p className="text-muted-foreground">Keine freigegebenen Firmenbestellungen in {monthName(month)}.</p>}
      {rows.map(({ c, inv }) => (
        <Card key={c.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">{c.name} <span className="text-sm font-normal text-muted-foreground">· {invoiceNumber(c.slug, month)}</span></CardTitle>
            <div className="flex gap-2">
              {c.invoice_email && <Button variant="outline" asChild><a href={`mailto:${c.invoice_email}?subject=${encodeURIComponent(`Rechnung ${invoiceNumber(c.slug, month)} – Piratino`)}&body=${encodeURIComponent(`Guten Tag\n\nIm Anhang erhalten Sie die Rechnung für die Firmenbestellungen ${monthName(month)} über ${chf(inv.total)}.\n\nFreundliche Grüsse\nPiratino AG`)}`}>E-Mail an {c.invoice_email}</a></Button>}
              <Button onClick={() => open(c, inv)}>Rechnung öffnen</Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">{inv.perDay.map((d) => <span key={d.date}>{ch(d.date)}: {d.count} Bestellungen · {chf(d.total)}</span>)}</div>
            <div className="mt-2 font-semibold">Total {chf(inv.total)} <span className="font-normal text-muted-foreground">(MwSt {chf(inv.vat)})</span></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
export default AdminInvoices;
