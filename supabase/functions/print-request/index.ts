import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const clip = (v: unknown, max = 300): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") return json(405, { ok: false, error: "method not allowed" });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json(400, { ok: false, error: "invalid body" });

    const kind = clip(body.kind, 20).toLowerCase();
    if (kind !== "reservation" && kind !== "catering") {
      return json(400, { ok: false, error: "kind muss 'reservation' oder 'catering' sein" });
    }

    const name = clip(body.name, 100);
    if (!name) return json(400, { ok: false, error: "name fehlt" });

    const details: string[] = Array.isArray(body.details)
      ? body.details.map((d: unknown) => clip(d, 200)).filter(Boolean).slice(0, 20)
      : [];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Einfache Duplikat-Sperre: identischer Name + Typ innerhalb von 2 Minuten
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: dupe } = await supabase
      .from("print_jobs")
      .select("id")
      .eq("status", "pending")
      .gte("created_at", since)
      .contains("payload", { order_type: kind, customer_name: name })
      .limit(1)
      .maybeSingle();
    if (dupe) return json(200, { ok: true, deduplicated: true });

    const payload = {
      order_type: kind,
      customer_name: name,
      customer_phone: clip(body.phone, 30),
      customer_email: clip(body.email, 120),
      customer_address: clip(body.address, 200),
      scheduled_time: clip(body.scheduled_time, 60),
      special_notes: clip(body.message, 500),
      details,
      items: [],
      skip_totals: true,
    };

    const { error } = await supabase.from("print_jobs").insert({ payload });
    if (error) throw error;

    return json(200, { ok: true });
  } catch (error: unknown) {
    console.error("print-request error:", error);
    return json(500, { ok: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});
