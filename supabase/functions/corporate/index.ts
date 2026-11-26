import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  isOrderingOpen, nextDeliveryDate, cutoffInstant, canAutoRelease,
  corporateUnitPrice, isItemAllowed, type MenuRow,
} from "../_shared/corporate.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clip = (v: unknown, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

type Line = { item_id: string; quantity: number; selected?: Record<string, string[]>; notes?: string };

async function loadMenu(client: any): Promise<MenuRow[]> {
  const { data } = await db.from("menu_items").select("id,name,price,delivery_price,modifier_groups,category,description,image_url,station,sort_order")
    .eq("available", true).order("sort_order");
  return (data || []).filter((m: any) => isItemAllowed(client, m.id));
}

async function priceLines(client: any, raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) throw new Error("Bitte mindestens ein Produkt wählen");
  const menu = await loadMenu(client);
  const out: any[] = [];
  for (const l of raw as Line[]) {
    const item = menu.find((m) => m.id === l.item_id) as any;
    if (!item) throw new Error("Produkt nicht verfügbar");
    const qty = Math.min(20, Math.max(1, Math.floor(Number(l.quantity) || 1)));
    const selected: Record<string, string[]> = {};
    const labels: string[] = [];
    for (const g of item.modifier_groups || []) {
      const ids = (l.selected?.[g.id] || []).filter((id: string) => g.options.some((o: any) => o.id === id));
      const pick = g.multiSelect ? ids : ids.slice(0, 1);
      if (g.required && pick.length === 0) throw new Error(`${item.name}: ${g.name}`);
      selected[g.id] = pick;
      pick.forEach((id: string) => labels.push(g.options.find((o: any) => o.id === id).name));
    }
    const unit = corporateUnitPrice(item, selected, client);
    out.push({ item_id: item.id, name: item.name, station: item.station || "general", quantity: qty, selected,
      modifiers: labels.join(", "), notes: clip(l.notes, 150), unit_price: unit });
  }
  const total = Math.round(out.reduce((s, l) => s + l.unit_price * l.quantity, 0) * 100) / 100;
  return { lines: out, total };
}

function publicClient(c: any) {
  const next = nextDeliveryDate(c, new Date());
  return {
    id: c.id, slug: c.slug, name: c.name, delivery_time: c.delivery_time, cutoff_time: c.cutoff_time,
    delivery_days: c.delivery_days, next_delivery: next,
    cutoff_at: next ? cutoffInstant(c, next).toISOString() : null,
    discount_percent: c.discount_percent, special_prices: c.special_prices,
  };
}

async function release(c: any, date: string, by: string) {
  const { data: existing } = await db.from("corporate_batches").select("id").eq("client_id", c.id).eq("delivery_date", date).maybeSingle();
  if (existing) return { ok: false, error: "Bereits freigegeben" };
  const { data: orders } = await db.from("corporate_orders").select("*").eq("client_id", c.id).eq("delivery_date", date).eq("status", "active").order("created_at");
  if (!orders?.length) return { ok: false, error: "Keine Bestellungen" };
  const total = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const { error: bErr } = await db.from("corporate_batches").insert({ client_id: c.id, delivery_date: date, order_count: orders.length, total, released_by: by });
  if (bErr) return { ok: false, error: "Bereits freigegeben" };

  const items = orders.flatMap((o: any) => (o.items as any[]).map((l) => ({
    name: l.name, quantity: l.quantity, price: l.unit_price, station: l.station,
    modifiers: l.modifiers || undefined,
    notes: [`FÜR: ${o.employee_name}`, l.notes].filter(Boolean).join(" | "),
  })));
  const dateCh = date.split("-").reverse().join(".");
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/forward-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    body: JSON.stringify({
      order_ref: `corp-${c.id}-${date}`,
      customer_name: `FIRMA ${c.name}`,
      customer_phone: c.contact_phone || "0444313233",
      customer_email: c.contact_email || "",
      customer_address: c.delivery_address || "",
      order_type: "delivery",
      payment_type: "Monatsrechnung",
      scheduled_time: `${dateCh} ${c.delivery_time}`,
      special_notes: `FIRMENBESTELLUNG ${c.name} | ${orders.length} Mitarbeiter-Bestellungen | Lieferung ${dateCh} ${c.delivery_time} | Zahlung: Monatsrechnung`,
      items, subtotal: total, total,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok === false || body?.error) {
    await db.from("corporate_batches").delete().eq("client_id", c.id).eq("delivery_date", date);
    return { ok: false, error: "Übermittlung an Piratino fehlgeschlagen, bitte erneut versuchen" };
  }
  return { ok: true, order_count: orders.length, total };
}

async function firmAdmin(body: any) {
  const { data: c } = await db.from("corporate_clients").select("*").eq("admin_token", clip(body.token, 80)).eq("active", true).maybeSingle();
  if (!c || clip(body.password, 60) !== c.admin_password) return null;
  return c;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const action = clip(body.action, 40);
    const now = new Date();

    // ---------- Mitarbeiter ----------
    if (action === "client") {
      const { data: c } = await db.from("corporate_clients").select("*").eq("slug", clip(body.slug, 60).toLowerCase()).eq("active", true).maybeSingle();
      if (!c) return json(404, { error: "Firma nicht gefunden" });
      const menu = await loadMenu(c);
      return json(200, { client: publicClient(c), menu: menu.map((m: any) => ({ ...m, corporate_price: corporateUnitPrice(m, {}, c) })) });
    }
    if (action === "place") {
      const { data: c } = await db.from("corporate_clients").select("*").eq("slug", clip(body.slug, 60).toLowerCase()).eq("active", true).maybeSingle();
      if (!c) return json(404, { error: "Firma nicht gefunden" });
      const name = clip(body.employee_name, 80);
      if (name.length < 2) return json(400, { error: "Bitte Vor- und Nachnamen eingeben" });
      const date = nextDeliveryDate(c, now);
      if (!date) return json(400, { error: "Zurzeit kein Liefertag offen" });
      const { data: done } = await db.from("corporate_batches").select("id").eq("client_id", c.id).eq("delivery_date", date).maybeSingle();
      if (done) return json(400, { error: "Die Sammelbestellung wurde bereits freigegeben" });
      const { lines, total } = await priceLines(c, body.items);
      const { data, error } = await db.from("corporate_orders").insert({ client_id: c.id, delivery_date: date, employee_name: name, items: lines, total }).select("id,edit_token,delivery_date,total").single();
      if (error) throw error;
      return json(200, { order: data });
    }
    if (action === "get_order" || action === "update_order" || action === "cancel_order") {
      const { data: o } = await db.from("corporate_orders").select("*, corporate_clients(*)").eq("edit_token", clip(body.edit_token, 80)).maybeSingle();
      if (!o) return json(404, { error: "Bestellung nicht gefunden" });
      const c = (o as any).corporate_clients;
      const { data: done } = await db.from("corporate_batches").select("id").eq("client_id", c.id).eq("delivery_date", o.delivery_date).maybeSingle();
      const open = !done && isOrderingOpen(c, o.delivery_date, now);
      if (action === "get_order") {
        const menu = await loadMenu(c);
        return json(200, { order: { ...o, corporate_clients: undefined }, client: publicClient(c), open,
          cutoff_at: cutoffInstant(c, o.delivery_date).toISOString(),
          menu: menu.map((m: any) => ({ ...m, corporate_price: corporateUnitPrice(m, {}, c) })) });
      }
      if (!open) return json(400, { error: "Bestellschluss vorbei – keine Änderungen mehr möglich" });
      if (action === "cancel_order") {
        await db.from("corporate_orders").update({ status: "cancelled", updated_at: now.toISOString() }).eq("id", o.id);
        return json(200, { ok: true });
      }
      const { lines, total } = await priceLines(c, body.items);
      const name = clip(body.employee_name, 80) || o.employee_name;
      await db.from("corporate_orders").update({ items: lines, total, employee_name: name, status: "active", updated_at: now.toISOString() }).eq("id", o.id);
      return json(200, { ok: true, total });
    }

    // ---------- Firmenadministrator ----------
    if (action.startsWith("firm_")) {
      const c = await firmAdmin(body);
      if (!c) return json(401, { error: "Zugang ungültig" });
      const date = clip(body.date, 10) || nextDeliveryDate(c, now) || "";
      if (action === "firm_overview") {
        const { data: orders } = await db.from("corporate_orders").select("*").eq("client_id", c.id).eq("delivery_date", date).eq("status", "active").order("created_at");
        const { data: batch } = await db.from("corporate_batches").select("*").eq("client_id", c.id).eq("delivery_date", date).maybeSingle();
        const menu = await loadMenu(c);
        return json(200, { client: { ...publicClient(c), min_orders: c.min_orders, auto_release: c.auto_release, allow_auto_below_min: c.allow_auto_below_min, delivery_address: c.delivery_address },
          date, cutoff_at: date ? cutoffInstant(c, date).toISOString() : null, open: !!date && isOrderingOpen(c, date, now),
          orders: orders || [], batch, menu: menu.map((m: any) => ({ ...m, corporate_price: corporateUnitPrice(m, {}, c) })) });
      }
      if (action === "firm_set_auto") {
        await db.from("corporate_clients").update({ auto_release: !!body.auto_release }).eq("id", c.id);
        return json(200, { ok: true });
      }
      const { data: done } = await db.from("corporate_batches").select("id").eq("client_id", c.id).eq("delivery_date", date).maybeSingle();
      if (done) return json(400, { error: "Bereits freigegeben" });
      if (action === "firm_release") return json(200, await release(c, date, "firma"));
      if (action === "firm_delete") {
        await db.from("corporate_orders").update({ status: "cancelled" }).eq("id", clip(body.order_id, 60)).eq("client_id", c.id);
        return json(200, { ok: true });
      }
      if (action === "firm_save") {
        const { lines, total } = await priceLines(c, body.items);
        const name = clip(body.employee_name, 80);
        if (name.length < 2) return json(400, { error: "Name fehlt" });
        if (body.order_id) {
          await db.from("corporate_orders").update({ items: lines, total, employee_name: name, updated_at: now.toISOString() }).eq("id", clip(body.order_id, 60)).eq("client_id", c.id);
        } else {
          await db.from("corporate_orders").insert({ client_id: c.id, delivery_date: date, employee_name: name, items: lines, total });
        }
        return json(200, { ok: true });
      }
    }

    // ---------- Piratino-Admin: manuelle Freigabe ----------
    if (action === "admin_release") {
      const auth = req.headers.get("Authorization") || "";
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
      const { data: isAdmin } = await userClient.rpc("is_admin");
      if (!isAdmin) return json(401, { error: "Nicht erlaubt" });
      const { data: c } = await db.from("corporate_clients").select("*").eq("id", clip(body.client_id, 60)).maybeSingle();
      if (!c) return json(404, { error: "Firma nicht gefunden" });
      return json(200, await release(c, clip(body.date, 10), "piratino"));
    }

    // ---------- Automatische Freigabe (zeitgesteuert) ----------
    if (action === "auto_release") {
      const { data: clients } = await db.from("corporate_clients").select("*").eq("active", true).eq("auto_release", true);
      const results: unknown[] = [];
      const today = new Date(now.getTime()).toISOString().slice(0, 10);
      for (const c of clients || []) {
        for (const date of [today, new Date(now.getTime() + 86400000).toISOString().slice(0, 10)]) {
          if (!c.delivery_days.includes(((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7) + 1)) continue;
          const cut = cutoffInstant(c, date).getTime();
          if (now.getTime() < cut || now.getTime() > cut + 6 * 3600000) continue;
          const { count } = await db.from("corporate_orders").select("id", { count: "exact", head: true }).eq("client_id", c.id).eq("delivery_date", date).eq("status", "active");
          if (!canAutoRelease(c, count || 0)) continue;
          results.push({ client: c.slug, date, ...(await release(c, date, "automatisch")) });
        }
      }
      return json(200, { ok: true, results });
    }

    return json(400, { error: "Unbekannte Aktion" });
  } catch (e) {
    console.error(e);
    return json(400, { error: e instanceof Error ? e.message : "Fehler" });
  }
});
