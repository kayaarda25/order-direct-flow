import { describe, it, expect } from "vitest";
import { isOrderingOpen, nextDeliveryDate, canAutoRelease, corporateUnitPrice } from "../../supabase/functions/_shared/corporate";

const rubi = {
  delivery_days: [1, 3, 5], delivery_time: "12:00", cutoff_time: "10:30", min_orders: 5,
  discount_percent: 0, special_prices: {}, allowed_item_ids: [], auto_release: true, allow_auto_below_min: false,
};
// Montag 30.11.2026, Zürich = UTC+1
const mon1029 = new Date("2026-11-30T09:29:00Z");
const mon1031 = new Date("2026-11-30T09:31:00Z");

describe("Mitarbeiter können nach dem Bestellschluss nicht mehr bestellen oder ändern", () => {
  it("Ein Mitarbeiter kann am Montag um 10:29 noch für Montag bestellen", () => {
    expect(isOrderingOpen(rubi, "2026-11-30", mon1029)).toBe(true);
  });
  it("Ein Mitarbeiter kann am Montag um 10:31 nicht mehr für Montag bestellen", () => {
    expect(isOrderingOpen(rubi, "2026-11-30", mon1031)).toBe(false);
  });
  it("Nach dem Bestellschluss am Montag ist der nächste Liefertag Mittwoch", () => {
    expect(nextDeliveryDate(rubi, mon1031)).toBe("2026-12-02");
  });
  it("An einem Dienstag ohne Lieferung kann nicht für Dienstag bestellt werden", () => {
    expect(isOrderingOpen(rubi, "2026-12-01", mon1029)).toBe(false);
  });
});

describe("Unter der Mindestbestellmenge wird nicht automatisch freigegeben", () => {
  it("Bei 4 von mindestens 5 Bestellungen wird nicht automatisch freigegeben", () => {
    expect(canAutoRelease(rubi, 4)).toBe(false);
  });
  it("Bei 5 Bestellungen wird automatisch freigegeben", () => {
    expect(canAutoRelease(rubi, 5)).toBe(true);
  });
  it("Wenn Piratino es erlaubt, werden auch 4 Bestellungen automatisch freigegeben", () => {
    expect(canAutoRelease({ ...rubi, allow_auto_below_min: true }, 4)).toBe(true);
  });
});

describe("Firmen erhalten ihre eigenen Preise und Rabatte", () => {
  const pizza = { id: "p1", name: "MARGHERITA", price: 20, delivery_price: 20, modifier_groups: [] };
  it("Mit 10 % Rabatt kostet eine Pizza für CHF 20 nur CHF 18", () => {
    expect(corporateUnitPrice(pizza, {}, { discount_percent: 10, special_prices: {} })).toBe(18);
  });
  it("Ein Sonderpreis von CHF 15 ersetzt den normalen Preis", () => {
    expect(corporateUnitPrice(pizza, {}, { discount_percent: 0, special_prices: { p1: 15 } })).toBe(15);
  });
});
