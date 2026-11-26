import { supabase } from "@/integrations/supabase/client";

export async function corp<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("corporate", { body });
  if (error) {
    let msg = "Fehler";
    try { msg = (await (error as any).context?.json())?.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export type CorpMenuItem = {
  id: string; name: string; category: string; description: string | null; image_url: string | null;
  corporate_price: number;
  modifier_groups: { id: string; name: string; multiSelect?: boolean; required?: boolean; options: { id: string; name: string; price?: number; delivery_price?: number | null }[] }[];
};
export type CorpLine = { item_id: string; name: string; quantity: number; selected: Record<string, string[]>; notes?: string; modifiers?: string; unit_price?: number };

export const chf = (n: number) => `CHF ${Number(n || 0).toFixed(2)}`;
export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("de-CH", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

export function useCountdown(iso: string | null) {
  return iso;
}
export function remaining(iso: string | null, now: number) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "Bestellschluss vorbei";
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h > 24 ? `${Math.floor(h / 24)} Tage ${h % 24} Std.` : `${h} Std. ${m} Min.`;
}
