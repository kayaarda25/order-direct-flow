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
                .map((m) => m.trim())
                .filter(Boolean),
            }
          : {}),
        ...(i.notes ? { notes: i.notes } : {}),
      })),
    };

    console.log("Sending order to webhook(s):", JSON.stringify(webhookBody));


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


    const targets: Promise<string>[] = [
      send(WEBHOOK_URL, WEBHOOK_SECRET, "POS 1", webhookBody),
    ];

    if (WEBHOOK_URL_2) {
      targets.push(
        send(WEBHOOK_URL_2, WEBHOOK_SECRET_2 ?? WEBHOOK_SECRET, "POS 2", webhookBody2)
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
