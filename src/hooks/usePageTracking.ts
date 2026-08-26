import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "piratino-visit-session";

const getSessionId = (): string => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "s-anon";
  }
};

/** Logs anonymous page views so the admin dashboard can show traffic stats. */
export const usePageTracking = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Admin pages are internal traffic – don't pollute the stats
    if (pathname.startsWith("/admin")) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;

    void supabase
      .from("page_views")
      .insert({
        path: pathname,
        session_id: getSessionId(),
        is_mobile: isMobile,
        referrer: referrer ? referrer.slice(0, 300) : null,
      })
      .then(() => undefined, () => undefined);
  }, [pathname]);
};
