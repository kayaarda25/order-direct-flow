// Monatsrechnung für Firmenkunden: Summe aller im Monat freigegebenen Sammelbestellungen.
export const CREDITOR = {
  name: "Piratino AG", address: "Badenerstrasse", buildingNumber: "696", zip: "8048", city: "Zürich", country: "CH",
  account: "CH8100278278105966601T".replace(/^(.{4})(.{4})(.{4})(.{4})(.{4})(.*)$/, "$1 $2 $3 $4 $5 $6"),
  vatNo: "CHE-412.694.003 MWST", vatRate: 2.6,
};

export type InvoiceOrder = { delivery_date: string; employee_name: string; total: number; items: { name: string; quantity: number; unit_price: number; modifiers?: string }[] };
export type InvoiceBatch = { delivery_date: string };

export function invoiceNumber(slug: string, month: string) {
  return `R-${month.replace("-", "")}-${slug.toUpperCase()}`;
}

/** Only orders of days whose collective order was released count. */
export function buildInvoice(month: string, batches: InvoiceBatch[], orders: InvoiceOrder[]) {
  const days = new Set(batches.filter((b) => b.delivery_date.startsWith(month)).map((b) => b.delivery_date));
  const billed = orders.filter((o) => days.has(o.delivery_date)).sort((a, b) => a.delivery_date.localeCompare(b.delivery_date));
  const perDay = [...days].sort().map((d) => {
    const os = billed.filter((o) => o.delivery_date === d);
    return { date: d, count: os.length, total: round(os.reduce((s, o) => s + Number(o.total), 0)) };
  });
  const total = round(perDay.reduce((s, d) => s + d.total, 0));
  const vat = round((total * CREDITOR.vatRate) / (100 + CREDITOR.vatRate));
  return { perDay, orders: billed, total, vat, net: round(total - vat) };
}

export function dueDate(issued: Date, termsDays: number) {
  const d = new Date(issued); d.setDate(d.getDate() + (termsDays || 14)); return d;
}

/** Split "Firma\nStrasse 12\n8047 Zürich" (or comma separated) into QR-bill address fields. */
export function parseAddress(raw: string) {
  const parts = (raw || "").split(/[,\n\r]+/).map((p) => p.trim()).filter(Boolean);
  const zi = parts.findIndex((p) => /^(CH-)?\d{4}\b/.test(p));
  if (zi < 0) return { street: parts[0] || "", zip: "", city: parts.slice(1).join(" ") };
  const m = parts[zi].match(/^(?:CH-)?(\d{4})\s*(.*)$/)!;
  const before = parts.slice(0, zi);
  return { street: before.find((p) => /\d/.test(p)) || before[before.length - 1] || "", zip: m[1], city: m[2] || parts[zi + 1] || "" };
}

const round = (n: number) => Math.round(n * 100) / 100;
