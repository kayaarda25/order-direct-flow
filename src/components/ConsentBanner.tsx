import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateGoogleConsent, type GoogleConsentDecision } from "@/lib/googleAdsTracking";

const STORAGE_KEY = "piratino_cookie_consent";

const readStoredConsent = (): GoogleConsentDecision | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "granted" || saved === "denied" ? saved : null;
  } catch {
    return null;
  }
};

const saveStoredConsent = (decision: GoogleConsentDecision) => {
  try {
    localStorage.setItem(STORAGE_KEY, decision);
  } catch {
    // Consent still updates for this visit when storage is unavailable.
  }
};

const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = readStoredConsent();
    if (saved) {
      updateGoogleConsent(saved);
      return;
    }
    setVisible(true);
  }, []);

  const decide = (decision: GoogleConsentDecision) => {
    saveStoredConsent(decision);
    updateGoogleConsent(decision);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einstellungen"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-2xl backdrop-blur md:p-5"
    >
      <div className="container flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-foreground">
          Wir verwenden Cookies, um dir die bestmögliche Website-Erfahrung zu bieten. Du kannst zustimmen oder ablehnen.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => decide("denied")}>
            Ablehnen
          </Button>
          <Button type="button" onClick={() => decide("granted")}>
            Akzeptieren
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
