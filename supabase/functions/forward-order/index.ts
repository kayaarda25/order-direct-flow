import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    console.log("Sending order to webhook(s):", JSON.stringify(webhookBody));

    const send = async (url: string, secret: string, label: string) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": secret,
        },
        body: JSON.stringify(webhookBody),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error(`${label} failed [${res.status}]: ${text}`);
        throw new Error(`${label} returned ${res.status}: ${text}`);
      }
      console.log(`${label} response:`, text);
      return text;
    };

    const targets: Promise<string>[] = [
      send(WEBHOOK_URL, WEBHOOK_SECRET, "POS 1"),
    ];

    if (WEBHOOK_URL_2) {
      targets.push(
        send(WEBHOOK_URL_2, WEBHOOK_SECRET_2 ?? WEBHOOK_SECRET, "POS 2")
      );
    } else {
      console.log("WEBHOOK_URL_2 not configured - skipping second POS");
    }

    // Both targets must succeed
    const results = await Promise.allSettled(targets);
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (failed.length > 0) {
      throw new Error(
        failed.map((f) => (f.reason instanceof Error ? f.reason.message : String(f.reason))).join(" | ")
      );
    }
    const responseText = (results as PromiseFulfilledResult<string>[])
      .map((r) => r.value)
      .join(" | ");

    return new Response(
      JSON.stringify({ success: true, webhook_response: responseText }),
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
