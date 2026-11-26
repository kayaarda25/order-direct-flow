import { describe, it, expect } from "vitest";
import { buildInvoice, parseAddress, CREDITOR, completedMonths } from "@/lib/corporateInvoice";

const o = (d: string, t: number) => ({ delivery_date: d, employee_name: "Anna", total: t, items: [] });

describe("Die Monatsrechnung enthält nur freigegebene Firmenbestellungen des Monats", () => {
  it("Bestellungen eines nicht freigegebenen Tages werden nicht verrechnet", () => {
    const inv = buildInvoice("2026-11", [{ delivery_date: "2026-11-02" }], [o("2026-11-02", 22.5), o("2026-11-03", 18)]);
    expect(inv.total).toBe(22.5);
  });
  it("Bestellungen aus dem Vormonat erscheinen nicht auf der Novemberrechnung", () => {
    const inv = buildInvoice("2026-11", [{ delivery_date: "2026-10-30" }, { delivery_date: "2026-11-02" }], [o("2026-10-30", 30), o("2026-11-02", 20)]);
    expect(inv.total).toBe(20);
  });
  it("Die MwSt von 2,6 % ist im Total enthalten", () => {
    const inv = buildInvoice("2026-11", [{ delivery_date: "2026-11-02" }], [o("2026-11-02", 102.6)]);
    expect(inv.vat).toBe(2.6);
  });
});

describe("Rechnungen laufen auf die Piratino AG", () => {
  it("Zahlungsempfänger ist die Piratino AG an der Badenerstrasse 696 in 8048 Zürich", () => {
    expect([CREDITOR.name, CREDITOR.address, CREDITOR.buildingNumber, CREDITOR.zip, CREDITOR.city]).toEqual(["Piratino AG", "Badenerstrasse", "696", "8048", "Zürich"]);
  });
  it("Eine mehrzeilige Firmenadresse wird in Strasse, PLZ und Ort zerlegt", () => {
    expect(parseAddress("RUBI AG\nFlüelastrasse 30\n 8047 Zürich")).toEqual({ street: "Flüelastrasse 30", zip: "8047", city: "Zürich" });
  });
});

describe("Rechnungen werden einmal pro Monat nach Monatsende erstellt", () => {
  it("Am 26. November gibt es noch keine Novemberrechnung, die neueste ist Oktober", () => {
    const months = completedMonths(new Date("2026-11-26T12:00:00Z"));
    expect(months[0]).toBe("2026-10");
    expect(months).not.toContain("2026-11");
  });
  it("Am 1. Dezember ist die Novemberrechnung verfügbar", () => {
    expect(completedMonths(new Date("2026-12-01T12:00:00Z"))[0]).toBe("2026-11");
  });
});
