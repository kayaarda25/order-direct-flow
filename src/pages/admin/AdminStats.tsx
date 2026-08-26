import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, TrendingUp, ShoppingBag, Eye, Percent } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type RangeKey = "7" | "30" | "90";

interface OrderRow {
  created_at: string;
  total: number;
  payload: {
    order_type?: string;
    payment_type?: string;
    items?: { name?: string; quantity?: number }[];
  };
}

interface ViewRow {
  path: string;
  session_id: string;
  is_mobile: boolean;
  created_at: string;
}

const dayKey = (d: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));

const shortLabel = (key: string) =>
  new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit" }).format(
    new Date(`${key}T12:00:00Z`)
  );

const chf = (n: number) => "CHF " + n.toFixed(2);

const AdminStats = () => {
  const [range, setRange] = useState<RangeKey>("30");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const days = Number(range);
    const fromDate = new Date(Date.now() - (days - 1) * 86400e3);
    const from = dayKey(fromDate.toISOString());
    const to = dayKey(new Date().toISOString());

    const [ordersRes, viewsRes] = await Promise.all([
      supabase.functions.invoke("admin-orders", { body: { action: "list", from, to } }),
      supabase
        .from("page_views")
        .select("path, session_id, is_mobile, created_at")
        .gte("created_at", new Date(`${from}T00:00:00Z`).toISOString())
        .order("created_at", { ascending: true })
        .limit(20000),
    ]);

    const ordersData = ordersRes.data as { ok?: boolean; orders?: OrderRow[] } | null;
    setOrders(ordersData?.orders ?? []);
    setViews((viewsRes.data as ViewRow[]) ?? []);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const days = Number(range);
    const keys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      keys.push(dayKey(new Date(Date.now() - i * 86400e3).toISOString()));
    }

    const perDay = new Map<string, { orders: number; revenue: number; visitors: number; views: number }>();
    keys.forEach((k) => perDay.set(k, { orders: 0, revenue: 0, visitors: 0, views: 0 }));

    let revenue = 0;
    let delivery = 0;
    const payments = new Map<string, number>();
    const items = new Map<string, number>();
    const hours = new Map<number, number>();

    for (const o of orders) {
      const k = dayKey(o.created_at);
      const d = perDay.get(k);
      if (d) {
        d.orders += 1;
        d.revenue += Number(o.total) || 0;
      }
      revenue += Number(o.total) || 0;
      if ((o.payload?.order_type || "").toLowerCase() === "delivery") delivery += 1;
      const pay = (o.payload?.payment_type || "unbekannt").toUpperCase();
      payments.set(pay, (payments.get(pay) || 0) + 1);
      for (const it of o.payload?.items ?? []) {
        const name = String(it.name || "Artikel").toUpperCase();
        items.set(name, (items.get(name) || 0) + (it.quantity ?? 1));
      }
      const h = Number(
        new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", hour: "2-digit", hour12: false }).format(
          new Date(o.created_at)
        )
      );
      hours.set(h, (hours.get(h) || 0) + 1);
    }

    const sessionsPerDay = new Map<string, Set<string>>();
    const funnel = { home: 0, menu: 0, cart: 0, checkout: 0 };
    let mobileSessions = 0;
    const seenSessions = new Set<string>();

    for (const v of views) {
      const k = dayKey(v.created_at);
      const d = perDay.get(k);
      if (d) d.views += 1;
      if (!sessionsPerDay.has(k)) sessionsPerDay.set(k, new Set());
      sessionsPerDay.get(k)!.add(v.session_id);
      if (!seenSessions.has(v.session_id)) {
        seenSessions.add(v.session_id);
        if (v.is_mobile) mobileSessions += 1;
      }
      if (v.path === "/") funnel.home += 1;
      else if (v.path.startsWith("/menu")) funnel.menu += 1;
      else if (v.path.startsWith("/cart")) funnel.cart += 1;
      else if (v.path.startsWith("/checkout")) funnel.checkout += 1;
    }
    sessionsPerDay.forEach((set, k) => {
      const d = perDay.get(k);
      if (d) d.visitors = set.size;
    });

    const chart = keys.map((k) => ({
      label: shortLabel(k),
      Bestellungen: perDay.get(k)!.orders,
      Umsatz: Number(perDay.get(k)!.revenue.toFixed(2)),
      Besucher: perDay.get(k)!.visitors,
    }));

    const visitors = seenSessions.size;
    const conversion = visitors > 0 ? (orders.length / visitors) * 100 : 0;

    return {
      chart,
      revenue,
      orderCount: orders.length,
      avgBasket: orders.length ? revenue / orders.length : 0,
      delivery,
      pickup: orders.length - delivery,
      payments: [...payments.entries()].sort((a, b) => b[1] - a[1]),
      topItems: [...items.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
      hourChart: Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, "0")}h`, Bestellungen: hours.get(h) || 0 })),
      visitors,
      views: views.length,
      mobileShare: visitors ? (mobileSessions / visitors) * 100 : 0,
      conversion,
      funnel,
    };
  }, [orders, views, range]);

  const kpis = [
    { label: "Umsatz", value: chf(stats.revenue), icon: TrendingUp },
    { label: "Bestellungen", value: String(stats.orderCount), icon: ShoppingBag },
    { label: "Besucher", value: String(stats.visitors), icon: Eye },
    { label: "Bestellrate", value: stats.conversion.toFixed(1) + " %", icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold mr-auto">Statistik</h1>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["7", "30", "90"] as RangeKey[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "ghost"}
              onClick={() => setRange(r)}
            >
              {r} Tage
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verlauf</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis yAxisId="left" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="Besucher" stroke="hsl(var(--muted-foreground))" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="Bestellungen" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="Umsatz" stroke="hsl(var(--chart-2, var(--primary)))" strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bestellungen pro Tageszeit</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hourChart}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="label" fontSize={10} interval={1} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Bestellungen" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Besucher-Trichter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Startseite", n: stats.funnel.home },
              { label: "Menü", n: stats.funnel.menu },
              { label: "Warenkorb", n: stats.funnel.cart },
              { label: "Kasse", n: stats.funnel.checkout },
              { label: "Bestellt", n: stats.orderCount },
            ].map((step, i, arr) => {
              const max = Math.max(1, arr[0].n);
              return (
                <div key={step.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{step.label}</span>
                    <span className="font-medium">{step.n}</span>
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div
                      className="h-2 rounded bg-primary"
                      style={{ width: `${Math.min(100, (step.n / max) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-2">
              Mobil: {stats.mobileShare.toFixed(0)} % · Seitenaufrufe: {stats.views}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top-Artikel</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topItems.length === 0 && <p className="text-sm text-muted-foreground">Keine Verkäufe im Zeitraum.</p>}
            <ul className="space-y-2">
              {stats.topItems.map(([name, qty]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="truncate mr-2">{name}</span>
                  <span className="font-medium">{qty}×</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aufteilung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Lieferung</span><span className="font-medium">{stats.delivery}</span></div>
            <div className="flex justify-between"><span>Abholung</span><span className="font-medium">{stats.pickup}</span></div>
            <div className="flex justify-between border-t border-border pt-2"><span>Durchschnittsbon</span><span className="font-medium">{chf(stats.avgBasket)}</span></div>
            {stats.payments.map(([pay, n]) => (
              <div key={pay} className="flex justify-between"><span>{pay}</span><span className="font-medium">{n}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;
