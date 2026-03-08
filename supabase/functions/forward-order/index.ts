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
        price: item.price,
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
      items,
    };

    console.log("Sending order to webhook:", JSON.stringify(webhookBody));

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify(webhookBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        `Webhook call failed [${response.status}]: ${responseText}`
      );
      throw new Error(
        `Webhook returned ${response.status}: ${responseText}`
      );
    }

    console.log("Webhook response:", responseText);

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
