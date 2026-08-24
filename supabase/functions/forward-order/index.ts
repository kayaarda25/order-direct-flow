import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface DispatchRow {
  order_ref: string;
  fingerprint: string;
  pos1_ok: boolean;
  pos2_ok: boolean;
  print_queued: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
    if (!WEBHOOK_SECRET) {
      throw new Error("WEBHOOK_SECRET is not configured");
    }

    const WEBHOOK_URL =
      "https://lxcfuvlhtfnprqwevopw.supabase.co/functions/v1/receive-order";

    // Optional second POS target
    const WEBHOOK_URL_2 = Deno.env.get("WEBHOOK_URL_2");
    const WEBHOOK_SECRET_2 = Deno.env.get("WEBHOOK_SECRET_2");

    const orderData = await req.json();

    // Map cart items to the expected format
    const items = orderData.items.map(
      (item: {
        name: string;
        quantity: number;
        price: number;
        station: string;
        modifiers?: string;
        notes?: string;
      }) => ({
        name: item.name,
        quantity: item.quantity,
        price: typeof item.price === "number" ? item.price : 0,
        station: item.station,
        ...(item.modifiers ? { modifiers: item.modifiers } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      })
    );

    const webhookBody = {
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address,
      order_type: orderData.order_type,
      payment_type: orderData.payment_type,
      special_notes: orderData.special_notes,
      ...(orderData.scheduled_time ? { scheduled_time: orderData.scheduled_time } : {}),
      items,
    };

    // Split "Strasse 12, 8048 Zürich" into street / zip / city for POS 2
    const rawAddress: string = orderData.customer_address ?? "";
    const addressParts = rawAddress.split(",").map((p: string) => p.trim()).filter(Boolean);
    const street = addressParts[0] ?? "";
    const cityPart = addressParts.slice(1).join(" ").trim();
    const zipMatch = cityPart.match(/\b(\d{4,5})\b/);
    const zip = zipMatch?.[1] ?? "";
    const city = cityPart.replace(zip, "").trim();

    const fullName: string = (orderData.customer_name ?? "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? "Gast";
    const lastName = nameParts.slice(1).join(" ") || "-";

    // POS 2 (Felsen POS) expects a different schema
    const webhookBody2 = {
      type: orderData.order_type === "delivery" ? "delivery" : "takeaway",
      customer: {
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone: orderData.customer_phone,
        address: rawAddress,
        street,
        zip,
        city,
      },
      notes: orderData.special_notes ?? "",
      ...(orderData.scheduled_time ? { scheduled_time: orderData.scheduled_time } : {}),
      items: items.map((i: { name: string; quantity: number; price: number; station: string; modifiers?: string; notes?: string }) => ({
        product_name: i.name,
        qty: i.quantity,
        unit_price: i.price,
        station: i.station,
        ...(i.modifiers
          ? {
              modifiers: i.modifiers
                .split(",")
                .map((m: string) => m.trim())
                .filter(Boolean),
            }
          : {}),
        ...(i.notes ? { notes: i.notes } : {}),
      })),
    };

    console.log("Sending order to webhook(s):", JSON.stringify(webhookBody));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---------- Duplicate protection ----------
    // The client sends a stable order_ref per checkout attempt. A retry after a
    // failure must only reach the systems that have NOT received the order yet.
    const fingerprint = await sha256(
      [orderData.customer_phone ?? "", fullName, JSON.stringify(items)].join("|")
    );
    let orderRef: string =
      typeof orderData.order_ref === "string" && orderData.order_ref
        ? orderData.order_ref
        : `fp-${fingerprint.slice(0, 24)}`;

    let dispatch: DispatchRow | null = null;
    {
      const { data } = await supabase
        .from("order_dispatches")
        .select("order_ref, fingerprint, pos1_ok, pos2_ok, print_queued")
        .eq("order_ref", orderRef)
        .maybeSingle();
      dispatch = data;
    }

    // Fallback for clients without order_ref: same fingerprint within 10 minutes
    if (!dispatch && !orderData.order_ref) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("order_dispatches")
        .select("order_ref, fingerprint, pos1_ok, pos2_ok, print_queued")
        .eq("fingerprint", fingerprint)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        dispatch = data;
        orderRef = data.order_ref;
      }
    }

    // Same ref but changed cart contents -> treat as a new order
    if (dispatch && dispatch.fingerprint !== fingerprint) {
      orderRef = `${orderRef}-${fingerprint.slice(0, 8)}`;
      const { data } = await supabase
        .from("order_dispatches")
        .select("order_ref, fingerprint, pos1_ok, pos2_ok, print_queued")
        .eq("order_ref", orderRef)
        .maybeSingle();
      dispatch = data;
    }

    if (!dispatch) {
      const { data: inserted, error: insErr } = await supabase
        .from("order_dispatches")
        .insert({ order_ref: orderRef, fingerprint, payload: webhookBody })
        .select("order_ref, fingerprint, pos1_ok, pos2_ok, print_queued")
        .single();
      if (insErr) {
        // Lost an insert race -> re-read the existing row
        const { data: again } = await supabase
          .from("order_dispatches")
          .select("order_ref, fingerprint, pos1_ok, pos2_ok, print_queued")
          .eq("order_ref", orderRef)
          .maybeSingle();
        dispatch = again;
      } else {
        dispatch = inserted;
      }
    }

    const pos1Done = dispatch?.pos1_ok === true;
    const pos2Done = dispatch?.pos2_ok === true;
    const printDone = dispatch?.print_queued === true;

    // Queue the order for the local print agent exactly once
    if (!printDone) {
      try {
        const itemsTotal = items.reduce(
          (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
          0
        );
        const deliveryFee = Number(webhookBody.delivery_fee) || 0;
        const discount = Number(webhookBody.discount) || 0;
        const total = Number.isFinite(Number(webhookBody.total_amount)) && webhookBody.total_amount != null
          ? Number(webhookBody.total_amount)
          : itemsTotal + deliveryFee - discount;
        const { error: qErr } = await supabase
          .from("print_jobs")
          .insert({ payload: { ...webhookBody, total, delivery_fee: deliveryFee, discount } });
        if (qErr) {
          console.error("print_jobs insert failed:", qErr.message);
        } else {
          console.log("Order queued for print agent");
          await supabase
            .from("order_dispatches")
            .update({ print_queued: true, updated_at: new Date().toISOString() })
            .eq("order_ref", orderRef);
        }
      } catch (e) {
        console.error("print_jobs insert error:", e instanceof Error ? e.message : String(e));
      }
    } else {
      console.log("Print job already queued for this order - skipping duplicate");
    }

    const send = async (url: string, secret: string, label: string, payload: unknown) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": secret,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error(`${label} failed [${res.status}]: ${text.slice(0, 2000)}`);
        const isHtml = text.trim().startsWith("<");
        const detail = isHtml
          ? "Antwort war eine Webseite (HTML), nicht eine API. Die Webhook-URL zeigt wahrscheinlich auf die POS-Webseite statt auf den Bestell-Endpunkt."
          : text.slice(0, 300);
        throw new Error(`${label} returned ${res.status}: ${detail}`);
      }
      console.log(`${label} response:`, text.slice(0, 1000));
      return text.slice(0, 1000);
    };

    // Only contact the systems that have not confirmed this order yet
    const tasks: { key: "pos1_ok" | "pos2_ok"; p: Promise<string> }[] = [];
    if (!pos1Done) {
      tasks.push({ key: "pos1_ok", p: send(WEBHOOK_URL, WEBHOOK_SECRET, "POS 1", webhookBody) });
    } else {
      console.log("POS 1 already confirmed this order - skipping duplicate");
    }
    if (WEBHOOK_URL_2) {
      if (!pos2Done) {
        tasks.push({
          key: "pos2_ok",
          p: send(WEBHOOK_URL_2, WEBHOOK_SECRET_2 ?? WEBHOOK_SECRET, "POS 2", webhookBody2),
        });
      } else {
        console.log("POS 2 already confirmed this order - skipping duplicate");
      }
    } else {
      console.log("WEBHOOK_URL_2 not configured - skipping second POS");
    }

    const settled = await Promise.allSettled(tasks.map((t) => t.p));
    const failed: string[] = [];
    const responses: string[] = [];
    for (let i = 0; i < tasks.length; i++) {
      const r = settled[i];
      if (r.status === "fulfilled") {
        responses.push(r.value);
        await supabase
          .from("order_dispatches")
          .update({ [tasks[i].key]: true, updated_at: new Date().toISOString() })
          .eq("order_ref", orderRef);
      } else {
        failed.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
      }
    }

    if (failed.length > 0) {
      throw new Error(failed.join(" | "));
    }

    const nothingSent = tasks.length === 0 && (pos1Done || pos2Done || printDone);

    return new Response(
      JSON.stringify({
        success: true,
        deduplicated: nothingSent,
        webhook_response: responses.join(" | "),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error forwarding order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
