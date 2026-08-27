// Aktions-Gutschein, der ausschliesslich über den Werbelink aktiviert werden kann.
// Der Code steht nirgends auf der Website: er wird nur gesetzt, wenn jemand
// /aktion (aus der Google-Ads-Anzeige) öffnet.

export const PROMO_CODE = "PIRATINO10";
export const PROMO_PERCENT = 10;
const LS_PROMO = "piratino-promo";

export const activatePromo = () => {
  try {
    localStorage.setItem(LS_PROMO, PROMO_CODE);
  } catch {
    /* ignore */
  }
};

export const getActivePromo = (): string | null => {
  try {
    return localStorage.getItem(LS_PROMO) === PROMO_CODE ? PROMO_CODE : null;
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
