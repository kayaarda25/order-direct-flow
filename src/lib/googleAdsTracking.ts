import { supabase } from "@/integrations/supabase/client";

export type GoogleConsentDecision = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const CONSENT_STORAGE_KEY = "piratino_cookie_consent";

export const GOOGLE_ADS_SEND_TO = "AW-18410080660/jzitCLSv1eccEJSTzspE";
export const GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO = "AW-18410080660/FRasCIaR5egcEJSTzspE";

export const updateGoogleConsent = (decision: GoogleConsentDecision) => {
  window.gtag?.("consent", "update", {
    ad_storage: decision,
    ad_user_data: decision,
    ad_personalization: decision,
    analytics_storage: decision,
  });
};

/** The consent verdict for anything that sends personal data to Google. */
export const hasAdConsent = (): boolean => {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
  } catch {
    return false;
  }
};

/** Enhanced conversions: only with explicit consent, and only the email. */
const setUserDataIfConsented = async () => {
  if (!hasAdConsent()) return;
  try {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (email) {
      window.gtag?.("set", "user_data", { email });
    }
  } catch {
    // Enhanced conversions are optional; the conversion itself still fires.
  }
};

export const trackGoogleAdsPurchase = async ({
  value,
  transactionId,
}: {
  value: number;
  transactionId: string;
}) => {
  await setUserDataIfConsented();
  window.gtag?.("event", "conversion", {
    send_to: GOOGLE_ADS_SEND_TO,
    value,
    currency: "CHF",
    transaction_id: transactionId,
  });
};

export const trackGoogleAdsBeginCheckout = ({ value }: { value: number }) => {
  window.gtag?.("event", "conversion", {
    send_to: GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO,
    value,
    currency: "CHF",
  });
};
