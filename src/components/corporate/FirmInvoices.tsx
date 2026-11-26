import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { corp, chf } from "@/lib/corporateApi";
import { buildInvoice, completedMonths, invoiceNumber, monthName } from "@/lib/corporateInvoice";
import { invoiceHtml } from "@/lib/invoiceDocument";

export default function FirmInvoices({ token, password }: { token: string; password: string }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  useEffect(() => { corp({ action: "firm_invoices", token, password }).then(setData).catch((e) => setErr(e.message)); }, [token, password]);

  const invoices = useMemo(() => data ? completedMonths(new Date(), 12)
    .map((m) => ({ month: m, inv: buildInvoice(m, data.batches, data.orders) }))
    .filter((x) => x.inv.total > 0) : [], [data]);

  const open = (month: string, inv: ReturnType<typeof buildInvoice>) => {
    const w = window.open("", "_blank");
    if (!w) { setErr("Bitte Pop-ups für diese Seite erlauben."); return; }
    try { w.document.write(invoiceHtml(data.client, month, inv, true)); w.document.close(); }
    catch (e: any) { w.close(); setErr(e.message); }
  };

  return (
    <section className="mt-12">
      <h2 className="font-heading text-2xl uppercase mb-1">Rechnungen</h2>
      <p className="text-sm text-muted-foreground mb-4">Jeweils am Monatsende wird automatisch die Rechnung für den Monat erstellt – mit QR-Einzahlungsschein.</p>
      {err && <p className="text-destructive text-sm mb-3">{err}</p>}
      {data && invoices.length === 0 && <p className="text-muted-foreground">Noch keine Rechnungen. Die erste erscheint nach Ende des ersten Bestellmonats.</p>}
      <div className="rounded-lg border border-border divide-y divide-border">
        {invoices.map(({ month, inv }) => (
          <div key={month} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-semibold">{monthName(month)}</div>
              <div className="text-xs text-muted-foreground">{invoiceNumber(data.client.slug, month)} · {inv.orders.length} Bestellungen an {inv.perDay.length} Tagen</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{chf(inv.total)}</span>
              <Button onClick={() => open(month, inv)}>Rechnung herunterladen</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
