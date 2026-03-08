export interface DeliveryZone {
  plz: string;
  city: string;
  minimumOrder: number;
  active: boolean;
}

export const deliveryZones: DeliveryZone[] = [
  { plz: "8048", city: "Zürich", minimumOrder: 40, active: true },
  { plz: "8952", city: "Schlieren", minimumOrder: 60, active: true },
];

export function getDeliveryZone(plz: string): DeliveryZone | undefined {
  return deliveryZones.find((z) => z.plz === plz && z.active);
}
