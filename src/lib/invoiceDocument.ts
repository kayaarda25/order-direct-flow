import { SwissQRBill } from "swissqrbill/svg";
import { CREDITOR, dueDate, invoiceNumber, monthName, parseAddress, type buildInvoice } from "@/lib/corporateInvoice";

const chf = (n: number) => `CHF ${Number(n).toFixed(2)}`;
const ch = (d: string | Date) => new Date(typeof d === "string" ? d + "T12:00:00" : d).toLocaleDateString("de-CH");
const esc = (s: string) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

type Client = { slug: string; name: string; billing_address?: string | null; delivery_address?: string | null; payment_terms_days?: number };

/** Rechnung als druckbares A4-HTML mit QR-Einzahlungsschein. Rechnungsdatum = 1. Tag nach Monatsende. */
export function invoiceHtml(c: Client, month: string, inv: ReturnType<typeof buildInvoice>, autoPrint = false) {
  const no = invoiceNumber(c.slug, month);
  const [y, m] = month.split("-").map(Number);
  const issued = new Date(y, m, 1, 12);
  const addr = c.billing_address || c.delivery_address || "";
  const dz = parseAddress(addr);
  const qr = new SwissQRBill({
    amount: inv.total, currency: "CHF",
    creditor: { name: CREDITOR.name, address: CREDITOR.address, buildingNumber: CREDITOR.buildingNumber, zip: CREDITOR.zip, city: CREDITOR.city, country: "CH", account: CREDITOR.account },
    ...(dz.zip ? { debtor: { name: c.name.slice(0, 70), address: dz.street.slice(0, 70) || "-", zip: dz.zip, city: dz.city || "-", country: "CH" } } : {}),
    message: `Rechnung ${no}`,
  }, { language: "DE" }).toString();
  const lines = inv.orders.map((o) => `<tr><td>${ch(o.delivery_date)}</td><td>${esc(o.employee_name)}</td><td>${o.items.map((i) => `${i.quantity}x ${esc(i.name)}${i.modifiers ? ` (${esc(i.modifiers)})` : ""}`).join("<br>")}</td><td class="r">${chf(Number(o.total))}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Rechnung ${no}</title><style>
    @page{size:A4;margin:0} body{font-family:Arial,sans-serif;font-size:10pt;margin:0;color:#111}
    .page{width:210mm;min-height:297mm;position:relative;padding:18mm 18mm 110mm;box-sizing:border-box}
    h1{font-size:18pt;margin:18mm 0 4mm} table{width:100%;border-collapse:collapse;margin-top:6mm} td,th{padding:3px 4px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top} .r{text-align:right}
    tr{break-inside:avoid} .sum td{border:none;font-weight:bold} .qr{position:absolute;left:0;bottom:0;width:210mm;height:105mm} .qr svg{width:210mm;height:105mm}
    @media print{.noprint{display:none}}</style></head><body>
    <div class="noprint" style="padding:8px;background:#eee;font-family:Arial">Im Druckfenster «Als PDF speichern» wählen, um die Rechnung herunterzuladen. <button onclick="print()">Drucken / PDF</button></div>
    <div class="page">
      <div style="display:flex;justify-content:space-between"><div><strong>${CREDITOR.name}</strong><br>${CREDITOR.address} ${CREDITOR.buildingNumber}<br>${CREDITOR.zip} ${CREDITOR.city}<br>+41 44 431 32 33 · piratino@hotmail.com<br>${CREDITOR.vatNo}</div>
      <div style="margin-top:22mm;width:80mm">${esc(c.name)}<br>${esc(addr).replace(/\n/g, "<br>")}</div></div>
      <h1>Rechnung ${no}</h1>
      <div>Firmenbestellungen ${monthName(month)} · Rechnungsdatum ${ch(issued)} · zahlbar bis ${ch(dueDate(issued, c.payment_terms_days || 14))}</div>
      <table><tr><th>Lieferung</th><th>Mitarbeiter</th><th>Bestellung</th><th class="r">Betrag</th></tr>${lines}
      <tr class="sum"><td colspan="3" class="r">Total inkl. MwSt</td><td class="r">${chf(inv.total)}</td></tr>
      <tr class="sum" style="font-weight:normal"><td colspan="3" class="r">davon MwSt ${CREDITOR.vatRate}% (netto ${chf(inv.net)})</td><td class="r">${chf(inv.vat)}</td></tr></table>
      <p>Vielen Dank für Ihre Bestellungen. Bitte überweisen Sie den Betrag mit dem untenstehenden QR-Einzahlungsschein.</p>
      <div class="qr">${qr}</div>
    </div>${autoPrint ? "<script>window.onload=()=>setTimeout(()=>print(),300)</script>" : ""}</body></html>`;
}
