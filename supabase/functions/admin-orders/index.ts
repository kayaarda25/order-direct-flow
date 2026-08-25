import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const TZ = "Europe/Zurich";
const W = 42; // Papierbreite Epson TM-T20III (Font A)

const money = (n: unknown) => (Number(n) || 0).toFixed(2);

function rw(l: string, r: string): string {
  r = String(r);
  l = String(l).slice(0, W - r.length - 1);
  return l + " ".repeat(Math.max(1, W - l.length - r.length)) + r;
}

function zurichDateString(d: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));
}

function zurichTime(d: Date | string): string {
  return new Intl.DateTimeFormat("de-CH", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

interface OrderItem {
  name?: string;
  quantity?: number;
  price?: number;
  modifiers?: string;
  notes?: string;
}

interface OrderPayload {
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  order_type?: string;
  payment_type?: string;
  special_notes?: string;
  scheduled_time?: string;
  items?: OrderItem[];
  total?: number;
}

function orderTotal(p: OrderPayload): number {
  if (p.total != null && Number(p.total) > 0) return Number(p.total);
  return (p.items ?? []).reduce(
    (s, i) => s + Number(i.price ?? 0) * (i.quantity ?? 1),
    0
  );
}

type Line = { k: string; s: string };

function niceDay(d: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${d}T12:00:00Z`));
}

function shortDay(d: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${d}T12:00:00Z`));
}

function periodLabel(from: string, to: string): string {
  return from === to ? niceDay(from) : shortDay(from) + " - " + shortDay(to);
}

const MWST_RATE = 0.026; // reduzierter Satz Take-away CH
const mwstOf = (gross: number) => gross - gross / (1 + MWST_RATE);

function buildReportLines(title: string, from: string, to: string, orders: { created_at: string; payload: OrderPayload }[]): Line[] {
  const L: Line[] = [];
  const add = (k: string, s: string) => L.push({ k, s });
  const sep = "-".repeat(W);

  add("L", "Piratino");
  add("A", "Badenerstrasse 696");
  add("A", "8048 Zuerich");
  add("A", "Tel: 044 431 32 33");
  add("N", "");
  add("C", periodLabel(from, to));
  add("T", title);
  add("N", "");

  let grand = 0;
  let nDelivery = 0;
  let nPickup = 0;
  const payTotals = new Map<string, number>();
  const itemCount = new Map<string, { qty: number; total: number }>();

  for (const o of orders) {
    const p = o.payload || {};
    const total = orderTotal(p);
    grand += total;
    const isDelivery = (p.order_type || "").toLowerCase() === "delivery";
    if (isDelivery) nDelivery++; else nPickup++;
    const pay = (p.payment_type || "unbekannt").toUpperCase();
    payTotals.set(pay, (payTotals.get(pay) || 0) + total);

    add("B", rw(zurichTime(o.created_at) + "  " + (p.customer_name || "Gast"), "CHF " + money(total)));
    add("S", isDelivery ? "  Lieferung" : "  Abholung");
    for (const it of p.items ?? []) {
      const name = String(it.name || "Artikel").toUpperCase();
      const qty = it.quantity ?? 1;
      const lineTotal = Number(it.price ?? 0) * qty;
      add("S", rw(" " + qty + "X  " + name, money(lineTotal)));
      const entry = itemCount.get(name) || { qty: 0, total: 0 };
      entry.qty += qty;
      entry.total += lineTotal;
      itemCount.set(name, entry);
      if (it.modifiers) add("S", "     + " + it.modifiers);
    }
    if (p.special_notes) add("S", "     ! " + p.special_notes);
    add("N", sep);
  }

  add("B", rw("Bestellungen:", String(orders.length)));
  add("S", rw("  Lieferung:", String(nDelivery)));
  add("S", rw("  Abholung:", String(nPickup)));
  add("N", "");
  add("B", "Zahlungen:");
  for (const [pay, sum] of [...payTotals.entries()].sort()) {
    add("S", rw("  " + pay + ":", "CHF " + money(sum)));
  }
  add("N", "");
  add("B", "Top-Artikel:");
  const top = [...itemCount.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
  for (const [name, c] of top) {
    add("S", rw(" " + c.qty + "X  " + name, money(c.total)));
  }
  add("N", sep);
  add("T", "TOTAL  CHF " + money(grand));
  add("N", sep);
  add("N", "");
  add("F", "CHE-412.694.003 MWST");
  add("N", "");
  return L;
}

function buildItemReportLines(from: string, to: string, orders: { created_at: string; payload: OrderPayload }[]): Line[] {
  const L: Line[] = [];
  const add = (k: string, s: string) => L.push({ k, s });
  const sep = "-".repeat(W);

  add("L", "Piratino");
  add("A", "Badenerstrasse 696");
  add("A", "8048 Zuerich");
  add("N", "");
  add("C", periodLabel(from, to));
  add("T", "ARTIKELBERICHT");
  add("N", "");

  const itemCount = new Map<string, { qty: number; total: number }>();
  let grand = 0;
  for (const o of orders) {
    for (const it of (o.payload?.items ?? [])) {
      const name = String(it.name || "Artikel").toUpperCase();
      const qty = it.quantity ?? 1;
      const lineTotal = Number(it.price ?? 0) * qty;
      grand += lineTotal;
      const entry = itemCount.get(name) || { qty: 0, total: 0 };
      entry.qty += qty;
      entry.total += lineTotal;
      itemCount.set(name, entry);
    }
  }

  add("B", rw("Artikel (" + orders.length + " Bestellungen)", ""));
  add("N", sep);
  const sorted = [...itemCount.entries()].sort((a, b) => b[1].qty - a[1].qty);
  for (const [name, c] of sorted) {
    add("S", rw(" " + c.qty + "X  " + name, money(c.total)));
  }
  if (sorted.length === 0) add("S", "  Keine Verkaeufe");
  add("N", sep);
  add("B", rw("Artikel gesamt:", String(sorted.reduce((s, [, c]) => s + c.qty, 0))));
  add("T", "TOTAL  CHF " + money(grand));
  add("N", sep);
  add("N", "");
  return L;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ---------- Admin-Authentifizierung ----------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { ok: false, error: "Unauthorized" });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(401, { ok: false, error: "Unauthorized" });
    }
    const userId = userData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: adminRow } = await admin
      .from("admin_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!adminRow) {
      return json(403, { ok: false, error: "Kein Admin-Zugriff" });
    }

    // ---------- Parameter ----------
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const action: string = body.action || url.searchParams.get("action") || "list";
    const today = zurichDateString(new Date());
    const fromDate: string = body.from || url.searchParams.get("from") || body.date || today;
    const toDate: string = body.to || url.searchParams.get("to") || body.date || fromDate;

    // Alle Dispatches im Zeitfenster (Zuercher Zeit, grob gefasst, dann genau gefiltert)
    const fromUtc = new Date(`${fromDate}T00:00:00Z`).getTime();
    const toUtc = new Date(`${toDate}T00:00:00Z`).getTime();
    const from = new Date(fromUtc - 6 * 3600e3).toISOString();
    const to = new Date(toUtc + 30 * 3600e3).toISOString();

    const { data: rows, error } = await admin
      .from("order_dispatches")
      .select("order_ref, payload, pos1_ok, pos2_ok, print_queued, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const orders = (rows ?? []).filter((r) => {
      const d = zurichDateString(r.created_at);
      return d >= fromDate && d <= toDate;
    });

    // ---------- Aktionen ----------
    if (action === "list") {
      return json(200, {
        ok: true,
        date: fromDate,
        from: fromDate,
        to: toDate,
        orders: orders.map((r) => ({
          order_ref: r.order_ref,
          created_at: r.created_at,
          time: zurichTime(r.created_at),
          payload: r.payload,
          total: orderTotal((r.payload as OrderPayload) || {}),
          pos1_ok: r.pos1_ok,
          pos2_ok: r.pos2_ok,
          print_queued: r.print_queued,
        })),
      });
    }

    if (action === "print_report") {
      const reportType: string = body.report_type || "daily_report";
      const titles: Record<string, string> = {
        daily_report: "TAGESBERICHT",
        weekly_report: "WOCHENBERICHT",
        monthly_report: "MONATSBERICHT",
        quarterly_report: "QUARTALSBERICHT",
        range_report: "BERICHT ZEITRAUM",
      };
      const title = titles[reportType] || "BERICHT";
      const lines = buildReportLines(title, fromDate, toDate, orders as { created_at: string; payload: OrderPayload }[]);
      const { error: insErr } = await admin.from("print_jobs").insert({
        payload: {
          job_type: "report",
          report_type: reportType,
          silent: true,
          copies: 1,
          date: fromDate,
          from: fromDate,
          to: toDate,
          lines,
        },
      });
      if (insErr) throw insErr;
      return json(200, { ok: true, from: fromDate, to: toDate, order_count: orders.length, message: title + " an Drucker gesendet" });
    }

    if (action === "print_items") {
      const lines = buildItemReportLines(fromDate, toDate, orders as { created_at: string; payload: OrderPayload }[]);
      const { error: insErr } = await admin.from("print_jobs").insert({
        payload: {
          job_type: "report",
          report_type: "item_report",
          silent: true,
          copies: 1,
          date: fromDate,
          from: fromDate,
          to: toDate,
          lines,
        },
      });
      if (insErr) throw insErr;
      return json(200, { ok: true, from: fromDate, to: toDate, order_count: orders.length, message: "Artikelbericht an Drucker gesendet" });
    }

    if (action === "reprint") {
      const orderRef: string = body.order_ref || "";
      if (!orderRef) return json(400, { ok: false, error: "order_ref fehlt" });
      const { data: row, error: rErr } = await admin
        .from("order_dispatches")
        .select("payload")
        .eq("order_ref", orderRef)
        .maybeSingle();
      if (rErr || !row) return json(404, { ok: false, error: "Bestellung nicht gefunden" });
      const payload = (row.payload as OrderPayload) || {};
      const { error: insErr } = await admin.from("print_jobs").insert({
        payload: { ...payload, total: orderTotal(payload) },
      });
      if (insErr) throw insErr;
      return json(200, { ok: true, message: "Bestellung erneut an Drucker gesendet" });
    }

    if (action === "delete") {
      const orderRef: string = body.order_ref || "";
      if (!orderRef) return json(400, { ok: false, error: "order_ref fehlt" });
      const { data: deleted, error: dErr } = await admin
        .from("order_dispatches")
        .delete()
        .eq("order_ref", orderRef)
        .select("order_ref");
      if (dErr) throw dErr;
      if (!deleted || deleted.length === 0) {
        return json(404, { ok: false, error: "Bestellung nicht gefunden" });
      }
      return json(200, { ok: true, deleted: deleted.length, message: "Bestellung gelöscht" });
    }

    return json(400, { ok: false, error: "Unbekannte Aktion: " + action });
  } catch (e: unknown) {
    console.error("admin-orders error:", e);
    return json(500, { ok: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
});
