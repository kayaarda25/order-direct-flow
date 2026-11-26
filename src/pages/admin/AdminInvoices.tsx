import { useEffect, useMemo, useState } from "react";
import { SwissQRBill } from "swissqrbill/svg";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { buildInvoice, CREDITOR, dueDate, invoiceNumber, parseAddress } from "@/lib/corporateInvoice";

const chf = (n: number) => `CHF ${n.toFixed(2)}`;
const ch = (d: string | Date) => new Date(typeof d === "string" ? d + "T12:00:00" : d).toLocaleDateString("de-CH");
const esc = (s: string) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const prevMonth = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };
const monthName = (m: string) => new Date(m + "-15").toLocaleDateString("de-CH", { month: "long", year: "numeric" });

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
    const no = invoiceNumber(c.slug, month);
    const issued = new Date();
    const debtorAddr = parseAddress(c.billing_address || c.delivery_address || "");
    let qr = "";
    try {
      qr = new SwissQRBill({
        amount: inv.total, currency: "CHF",
        creditor: { name: CREDITOR.name, address: CREDITOR.address, buildingNumber: CREDITOR.buildingNumber, zip: CREDITOR.zip, city: CREDITOR.city, country: "CH", account: CREDITOR.account },
        ...(debtorAddr.zip ? { debtor: { name: c.name.slice(0, 70), address: debtorAddr.street.slice(0, 70) || "-", zip: debtorAddr.zip, city: debtorAddr.city || "-", country: "CH" } } : {}),
        message: `Rechnung ${no}`,
      }, { language: "DE" }).toString();
    } catch (e: any) { toast({ title: "QR-Code fehlgeschlagen", description: e.message, variant: "destructive" }); return; }
    const lines = inv.orders.map((o) => `<tr><td>${ch(o.delivery_date)}</td><td>${esc(o.employee_name)}</td><td>${o.items.map((i) => `${i.quantity}x ${esc(i.name)}${i.modifiers ? ` (${esc(i.modifiers)})` : ""}`).join("<br>")}</td><td class="r">${chf(Number(o.total))}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${no}</title><style>
      @page{size:A4;margin:0} body{font-family:Arial,sans-serif;font-size:10pt;margin:0;color:#111}
      .page{width:210mm;min-height:297mm;position:relative;padding:18mm 18mm 110mm;box-sizing:border-box}
      h1{font-size:18pt;margin:18mm 0 4mm} table{width:100%;border-collapse:collapse;margin-top:6mm} td,th{padding:3px 4px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top} .r{text-align:right}
      .sum td{border:none;font-weight:bold} .qr{position:absolute;left:0;bottom:0;width:210mm;height:105mm} .qr svg{width:210mm;height:105mm}
      @media print{.noprint{display:none}}</style></head><body>
      <div class="noprint" style="padding:8px;background:#eee"><button onclick="print()">Drucken / als PDF speichern</button></div>
      <div class="page">
        <div style="display:flex;justify-content:space-between"><div><strong>${CREDITOR.name}</strong><br>${CREDITOR.address} ${CREDITOR.buildingNumber}<br>${CREDITOR.zip} ${CREDITOR.city}<br>+41 44 431 32 33 · piratino@hotmail.com<br>${CREDITOR.vatNo}</div>
        <div style="margin-top:22mm;width:80mm">${esc(c.name)}<br>${esc(c.billing_address || c.delivery_address || "").replace(/\n/g, "<br>")}</div></div>
        <h1>Rechnung ${no}</h1>
        <div>Firmenbestellungen ${monthName(month)} · Rechnungsdatum ${ch(issued)} · zahlbar bis ${ch(dueDate(issued, c.payment_terms_days))}</div>
        <table><tr><th>Lieferung</th><th>Mitarbeiter</th><th>Bestellung</th><th class="r">Betrag</th></tr>${lines}
        <tr class="sum"><td colspan="3" class="r">Total inkl. MwSt</td><td class="r">${chf(inv.total)}</td></tr>
        <tr class="sum" style="font-weight:normal"><td colspan="3" class="r">davon MwSt ${CREDITOR.vatRate}% (netto ${chf(inv.net)})</td><td class="r">${chf(inv.vat)}</td></tr></table>
        <p>Vielen Dank für Ihre Bestellungen. Bitte überweisen Sie den Betrag mit dem untenstehenden QR-Einzahlungsschein.</p>
        <div class="qr">${qr}</div>
      </div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast({ title: "Pop-up blockiert", description: "Bitte Pop-ups für diese Seite erlauben.", variant: "destructive" }); return; }
    w.document.write(html); w.document.close();
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
