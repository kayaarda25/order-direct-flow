// Aktions-Gutscheine, die ausschliesslich über einen Werbelink aktiviert werden.
// Die Codes stehen nirgends auf der Website: sie werden nur gesetzt, wenn jemand
// die jeweilige Aktionsseite (aus der Google-Ads-Anzeige) öffnet.

export const PROMO_CODE = "PIRATINO10";
export const PROMO_PERCENT = 10;

/** Tagesmenü (Pizzamenü / Pastamenü) zum Aktionspreis statt CHF 25. */
export const MENU_PROMO_CODE = "MENU22";
export const MENU_PROMO_PRICE = 22;
export const MENU_PROMO_CATEGORY = "tagesmenu";

export type PromoCode = typeof PROMO_CODE | typeof MENU_PROMO_CODE;

const LS_PROMO = "piratino-promo";
const VALID: PromoCode[] = [PROMO_CODE, MENU_PROMO_CODE];

export const activatePromo = (code: PromoCode = PROMO_CODE) => {
  try {
    localStorage.setItem(LS_PROMO, code);
  } catch {
    /* ignore */
  }
};

export const getActivePromo = (): PromoCode | null => {
  try {
    const v = localStorage.getItem(LS_PROMO) as PromoCode | null;
    return v && VALID.includes(v) ? v : null;
  } catch {
    return null;
  }
};

export const clearPromo = () => {
  try {
    localStorage.removeItem(LS_PROMO);
  } catch {
    /* ignore */
  }
};

/** Rabattbetrag auf einen Zwischenbetrag, auf 5 Rappen gerundet. */
export const promoDiscountFor = (amount: number): number => {
  if (amount <= 0) return 0;
  return Math.round((amount * PROMO_PERCENT) / 100 / 0.05) * 0.05;
};

type PromoLineItem = {
  quantity: number;
  totalPrice: number;
  menuItem: { category?: string | null };
};

/**
 * Rabatt für den 22-Franken-Gutschein: jedes Menü aus der Tagesmenü-Kategorie
 * kostet CHF 22 statt des normalen Preises.
 */
export const menuPromoDiscountFor = (items: PromoLineItem[]): number => {
  const discount = items.reduce((sum, item) => {
    if (item.menuItem.category?.toLowerCase() !== MENU_PROMO_CATEGORY) return sum;
    const unit = item.quantity > 0 ? item.totalPrice / item.quantity : item.totalPrice;
    const diff = unit - MENU_PROMO_PRICE;
    return diff > 0 ? sum + diff * item.quantity : sum;
  }, 0);
  return Math.round(discount / 0.05) * 0.05;
};

/** Rabatt für den aktiven Gutschein. */
export const activePromoDiscount = (
  code: PromoCode | null,
  subtotal: number,
  items: PromoLineItem[],
): number => {
  if (code === PROMO_CODE) return promoDiscountFor(subtotal);
  if (code === MENU_PROMO_CODE) return menuPromoDiscountFor(items);
  return 0;
};

export const promoLabel = (code: PromoCode | null): string => {
  if (code === MENU_PROMO_CODE) return `Aktion: Menü CHF ${MENU_PROMO_PRICE}`;
  if (code === PROMO_CODE) return `Aktion ${PROMO_PERCENT}% Rabatt`;
  return "Aktion";
};
