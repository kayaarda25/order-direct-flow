export interface DeliveryZone {
  plz: string;
  city: string;
  minimumOrder: number;
  active: boolean;
}

// Fallback only – live values come from the database.
export const deliveryZones: DeliveryZone[] = [
  { plz: "8047", city: "Zürich", minimumOrder: 25, active: true },
  { plz: "8048", city: "Zürich", minimumOrder: 20, active: true },
  { plz: "8049", city: "Zürich", minimumOrder: 30, active: true },
  { plz: "8952", city: "Schlieren", minimumOrder: 60, active: true },
];

export function getDeliveryZone(plz: string): DeliveryZone | undefined {
  return deliveryZones.find((z) => z.plz === plz && z.active);
}
