import type { MenuItem, Modifier } from "@/hooks/useMenuItems";

export type OrderType = "delivery" | "pickup";

/**
 * Single source of truth for item pricing.
 * Uses per-size pickup/delivery prices when available, otherwise the item's
 * pickup/delivery/base price plus modifier prices.
 */
export const computeItemPrice = (
  item: MenuItem,
  selectedModifiers: Record<string, Modifier[]>,
  orderType: OrderType
): number => {
  const modifierPrice = Object.values(selectedModifiers)
    .flat()
    .reduce((sum, m) => sum + (m.price || 0), 0);

  const size = selectedModifiers["groesse"]?.[0];
  const usePickupSizePrice = orderType === "pickup" && size?.pickup_price != null;
  const useDeliverySizePrice = orderType === "delivery" && size?.delivery_price != null;

  const basePrice = usePickupSizePrice
    ? size!.pickup_price!
    : useDeliverySizePrice
      ? size!.delivery_price!
      : orderType === "pickup" && item.pickupPrice != null
        ? item.pickupPrice
        : orderType === "delivery" && item.deliveryPrice != null
          ? item.deliveryPrice
          : item.price;

  if (usePickupSizePrice || useDeliverySizePrice) {
    return basePrice + (modifierPrice - (size?.price || 0));
  }
  return basePrice + modifierPrice;
};
