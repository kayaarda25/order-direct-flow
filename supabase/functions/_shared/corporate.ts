// Gemeinsame Regeln für Firmenbestellungen (Server + Tests). Keine Deno-APIs verwenden.
export type CorpClient = {
  delivery_days: number[]; // 1 = Montag ... 7 = Sonntag
  delivery_time: string; // "12:00"
  cutoff_time: string; // "10:30"
  min_orders: number;
  discount_percent: number;
  special_prices: Record<string, number>;
  allowed_item_ids: string[];
  auto_release: boolean;
  allow_auto_below_min: boolean;
};

const TZ = "Europe/Zurich";

/** Datum (YYYY-MM-DD), Wochentag (1-7) und Minuten seit Mitternacht in Zürich */
export function zurichParts(now: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[p.weekday as string] ?? 1;
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: wd, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const weekdayOf = (date: string) => { const w = new Date(date + "T12:00:00Z").getUTCDay(); return w === 0 ? 7 : w; };

/** Zeitpunkt (UTC) des Bestellschlusses für ein Lieferdatum */
export function cutoffInstant(client: Pick<CorpClient, "cutoff_time">, date: string): Date {
  const mins = toMin(client.cutoff_time);
  const guess = new Date(`${date}T00:00:00Z`).getTime() + mins * 60000;
  // Zürich-Offset ermitteln
  const zp = zurichParts(new Date(guess));
  const zMin = (new Date(zp.date + "T00:00:00Z").getTime() - new Date(date + "T00:00:00Z").getTime()) / 60000 + zp.minutes;
  return new Date(guess - (zMin - mins) * 60000);
}

/** Darf für dieses Lieferdatum noch bestellt / geändert werden? */
export function isOrderingOpen(client: Pick<CorpClient, "cutoff_time" | "delivery_days">, date: string, now: Date) {
  if (!client.delivery_days.includes(weekdayOf(date))) return false;
  return now.getTime() < cutoffInstant(client, date).getTime();
}

/** Nächster Liefertag, für den noch bestellt werden kann */
export function nextDeliveryDate(client: Pick<CorpClient, "cutoff_time" | "delivery_days">, now: Date): string | null {
  const today = zurichParts(now).date;
  for (let i = 0; i < 15; i++) {
    const d = addDays(today, i);
    if (isOrderingOpen(client, d, now)) return d;
  }
  return null;
}

/** Darf die Sammelbestellung automatisch freigegeben werden? */
export function canAutoRelease(client: Pick<CorpClient, "auto_release" | "allow_auto_below_min" | "min_orders">, orderCount: number) {
  if (!client.auto_release || orderCount === 0) return false;
  return orderCount >= client.min_orders || client.allow_auto_below_min;
}

type Mod = { id: string; name: string; price?: number; delivery_price?: number | null };
type Group = { id: string; name: string; multiSelect?: boolean; required?: boolean; options: Mod[] };
export type MenuRow = { id: string; name: string; price: number; delivery_price: number | null; modifier_groups: Group[] };

const round05 = (n: number) => Math.round(n * 20) / 20;

/** Firmenpreis für ein Produkt mit gewählten Optionen (Gruppen-ID -> Options-IDs) */
export function corporateUnitPrice(item: MenuRow, selected: Record<string, string[]>, client: Pick<CorpClient, "discount_percent" | "special_prices">) {
  let base = Number(item.delivery_price ?? item.price);
  let extras = 0;
  for (const g of item.modifier_groups || []) {
    for (const oid of selected[g.id] || []) {
      const o = g.options.find((x) => x.id === oid);
      if (!o) continue;
      if (g.id === "groesse" && o.delivery_price != null) base = Number(o.delivery_price);
      else extras += Number(o.price || 0);
    }
  }
  const special = client.special_prices?.[item.id];
  if (special != null && special !== ("" as unknown)) base = Number(special);
  const full = base + extras;
  return round05(full * (1 - (Number(client.discount_percent) || 0) / 100));
}

export function isItemAllowed(client: Pick<CorpClient, "allowed_item_ids">, itemId: string) {
  return !client.allowed_item_ids?.length || client.allowed_item_ids.includes(itemId);
}
