import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agent-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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
    const token = Deno.env.get("PRINT_AGENT_TOKEN");
    const url = new URL(req.url);
    const provided = req.headers.get("x-agent-token") ?? url.searchParams.get("token") ?? "";
    if (!token || provided !== token) {
      return json(401, { ok: false, error: "unauthorized" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Agent acknowledges a printed job
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];
      if (ids.length === 0) return json(400, { ok: false, error: "id fehlt" });
      const { error } = await supabase
        .from("print_jobs")
        .update({ status: "printed", printed_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      return json(200, { ok: true, acked: ids.length });
    }

    // Agent polls for new jobs
    const { data, error } = await supabase
      .from("print_jobs")
      .select("id, payload, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);
    if (error) throw error;

    return json(200, { ok: true, jobs: data ?? [] });
  } catch (error: unknown) {
    console.error("print-queue error:", error);
    return json(500, { ok: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});
