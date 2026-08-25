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

    const details: string[] = [];
    const addDetail = (line: unknown) => {
      const clean = clip(line, 200);
      const label = clean.includes(":") ? clean.split(":")[0].trim().toUpperCase() : "";
      const hasSameLabel = label ? details.some((detail) => detail.split(":")[0].trim().toUpperCase() === label) : false;
      if (clean && !details.includes(clean) && !hasSameLabel && details.length < 30) details.push(clean);
    };

    if (kind === "reservation") {
      addDetail("ART: TISCHRESERVATION");
      addDetail(body.date || body.event_date ? `DATUM: ${clip(body.date || body.event_date, 40)}` : "");
      addDetail(body.time || body.event_time ? `UHRZEIT: ${clip(body.time || body.event_time, 40)}` : "");
      addDetail(body.persons ? `PERSONEN: ${clip(String(body.persons), 20)}` : "");
      addDetail("ORT: Pizza Piratino, Badenerstrasse 696, 8048 Zuerich");
    }

    if (kind === "catering") {
      addDetail("ART: CATERING ANFRAGE");
      addDetail(body.package_name ? `PAKET: ${clip(body.package_name, 80)}` : "");
      addDetail(body.persons ? `PERSONEN: ${clip(String(body.persons), 20)}` : "");
      addDetail(body.company ? `FIRMA: ${clip(body.company, 100)}` : "");
      addDetail(body.date || body.event_date ? `DATUM: ${clip(body.date || body.event_date, 40)}` : "");
      addDetail(body.time || body.event_time ? `UHRZEIT: ${clip(body.time || body.event_time, 40)}` : "");
      addDetail(body.total_price ? `RICHTPREIS: CHF ${clip(String(body.total_price), 30)}` : "");
    }

    if (Array.isArray(body.details)) {
      body.details.forEach(addDetail);
    }

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
      special_notes: clip(body.message || body.special_notes || body.notes, 500),
      event_date: clip(body.date || body.event_date, 40),
      event_time: clip(body.time || body.event_time, 40),
      persons: typeof body.persons === "number" ? body.persons : clip(body.persons, 20),
      company: clip(body.company, 100),
      package_name: clip(body.package_name, 100),
      package_id: clip(body.package_id, 60),
      total_price: typeof body.total_price === "number" ? body.total_price : clip(body.total_price, 30),
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
