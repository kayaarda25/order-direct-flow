export type GoogleConsentDecision = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GOOGLE_ADS_SEND_TO = "AW-18410080660/jzitCLSv1eccEJSTzspE";

export const updateGoogleConsent = (decision: GoogleConsentDecision) => {
  window.gtag?.("consent", "update", {
    ad_storage: decision,
    ad_user_data: decision,
    ad_personalization: decision,
    analytics_storage: decision,
  });
};

export const trackGoogleAdsPurchase = ({
  value,
  transactionId,
}: {
  value: number;
  transactionId: string;
}) => {
  window.gtag?.("event", "conversion", {
    send_to: GOOGLE_ADS_SEND_TO,
    value,
    currency: "CHF",
    transaction_id: transactionId,
  });
};
