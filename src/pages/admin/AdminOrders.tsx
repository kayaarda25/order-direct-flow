import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Printer, RefreshCw, FileBarChart, Bike, ShoppingBag, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

interface AdminOrder {
  order_ref: string;
  created_at: string;
  time: string;
  payload: OrderPayload;
  total: number;
  pos1_ok: boolean;
  pos2_ok: boolean;
  print_queued: boolean;
}

const money = (n: number) => `CHF ${(Number(n) || 0).toFixed(2)}`;

const toZurich = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });

const REPORT_TYPES = [
  { value: "daily_report", label: "Tagesbericht" },
  { value: "weekly_report", label: "Wochenbericht" },
  { value: "monthly_report", label: "Monatsbericht" },
  { value: "quarterly_report", label: "Quartalsbericht" },
  { value: "yearly_report", label: "Jahresbericht" },
  { value: "range_report", label: "Zeitraum wählen" },
  { value: "item_report", label: "Artikelbericht" },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// Gibt {from, to} für den gewählten Berichtstyp zurück (Basis: ausgewähltes Datum)
function reportRange(type: string, date: string, rangeFrom: string, rangeTo: string, quarter: number, year: number): { from: string; to: string } {
  const base = new Date(`${date}T12:00:00Z`);
  if (type === "quarterly_report") {
    const p = (n: number) => String(n).padStart(2, "0");
    const lastDay = new Date(Date.UTC(year, quarter * 3, 0)).getUTCDate();
    return { from: `${year}-${p((quarter - 1) * 3 + 1)}-01`, to: `${year}-${p(quarter * 3)}-${p(lastDay)}` };
  }
  if (type === "yearly_report") {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
  if (type === "weekly_report") {
    const day = base.getUTCDay() || 7; // Montag = 1
    const monday = new Date(base); monday.setUTCDate(base.getUTCDate() - day + 1);
    const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
    return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
  }
  if (type === "monthly_report") {
    const y = base.getUTCFullYear(), m = base.getUTCMonth();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const p = (n: number) => String(n).padStart(2, "0");
    return { from: `${y}-${p(m + 1)}-01`, to: `${y}-${p(m + 1)}-${p(last)}` };
  }
  if (type === "range_report") {
    return { from: rangeFrom, to: rangeTo || rangeFrom };
  }
  return { from: date, to: date };
}

const AdminOrders = () => {
  const today = toZurich(new Date());
  const [date, setDate] = useState(today);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [reportType, setReportType] = useState<string>("daily_report");
  const [rangeFrom, setRangeFrom] = useState(today);
  const [rangeTo, setRangeTo] = useState(today);
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [reprinting, setReprinting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-orders", {
      body: { action: "list", date },
    });
    if (error || !data?.ok) {
      toast({
        title: "Fehler beim Laden",
        description: data?.error || error?.message,
        variant: "destructive",
      });
      setOrders([]);
    } else {
      setOrders(data.orders || []);
    }
    setLoading(false);
  }, [date, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const printReport = async () => {
    setPrinting(true);
    const { from, to } = reportRange(reportType, date, rangeFrom, rangeTo, quarter, year);
    const isItems = reportType === "item_report";
    const { data, error } = await supabase.functions.invoke("admin-orders", {
      body: isItems
        ? { action: "print_items", from, to }
        : { action: "print_report", report_type: reportType, from, to },
    });
    setPrinting(false);
    if (error || !data?.ok) {
      toast({ title: "Druck fehlgeschlagen", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Bericht gesendet",
      description: "Der Bericht wird in wenigen Sekunden am Drucker ausgedruckt.",
    });
  };

  const reprintOrder = async (orderRef: string) => {
    setReprinting(orderRef);
    const { data, error } = await supabase.functions.invoke("admin-orders", {
      body: { action: "reprint", order_ref: orderRef },
    });
    setReprinting(null);
    if (error || !data?.ok) {
      toast({ title: "Nachdruck fehlgeschlagen", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Bestellung erneut an Drucker gesendet" });
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("admin-orders", {
      body: { action: "delete", order_ref: orderToDelete.order_ref },
    });
    setDeleting(false);
    setOrderToDelete(null);
    if (error || !data?.ok) {
      toast({ title: "Löschen fehlgeschlagen", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Bestellung gelöscht" });
    fetchOrders();
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const deliveryCount = orders.filter((o) => o.payload.order_type === "delivery").length;
  const pickupCount = orders.length - deliveryCount;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Bestellungen</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 pt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Bericht</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {reportType === "range_report" || reportType === "item_report" ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Von</label>
                <Input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="w-auto" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Bis</label>
                <Input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="w-auto" />
              </div>
            </>
          ) : reportType === "quarterly_report" ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Quartal</label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value))}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>Q{q}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Jahr</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          ) : reportType === "yearly_report" ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Jahr</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pb-2">
              Basis: oben gewähltes Datum ({date})
            </p>
          )}
          <Button onClick={printReport} disabled={printing || loading}>
            <FileBarChart className="mr-2 h-4 w-4" />
            {printing ? "Sende..." : "Bericht drucken"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Bestellungen</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{orders.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Umsatz</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{money(totalRevenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lieferung</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{deliveryCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Abholung</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{pickupCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeit</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Artikel</TableHead>
                <TableHead>Zahlung</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Laden...</TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Keine Bestellungen an diesem Tag.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.order_ref}>
                    <TableCell className="whitespace-nowrap font-medium">{o.time}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.payload.customer_name || "Gast"}</div>
                      <div className="text-xs text-muted-foreground">{o.payload.customer_phone}</div>
                      {o.payload.order_type === "delivery" && o.payload.customer_address && (
                        <div className="text-xs text-muted-foreground">{o.payload.customer_address}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.payload.order_type === "delivery" ? (
                        <Badge variant="secondary"><Bike className="mr-1 h-3 w-3" />Lieferung</Badge>
                      ) : (
                        <Badge variant="outline"><ShoppingBag className="mr-1 h-3 w-3" />Abholung</Badge>
                      )}
                      {o.payload.scheduled_time && (
                        <div className="text-xs text-muted-foreground mt-1">{o.payload.scheduled_time}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      {(o.payload.items || []).map((it, i) => (
                        <div key={i} className="text-sm">
                          {it.quantity ?? 1}x {it.name}
                          {it.modifiers && <span className="text-xs text-muted-foreground"> (+{it.modifiers})</span>}
                        </div>
                      ))}
                      {o.payload.special_notes && (
                        <div className="text-xs italic text-muted-foreground mt-1">"{o.payload.special_notes}"</div>
                      )}
                    </TableCell>
                    <TableCell className="uppercase text-sm">{o.payload.payment_type || "-"}</TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">{money(o.total)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={o.pos1_ok ? "default" : "destructive"} className="w-fit">POS 1</Badge>
                        <Badge variant={o.pos2_ok ? "default" : "destructive"} className="w-fit">POS 2</Badge>
                        <Badge variant={o.print_queued ? "default" : "secondary"} className="w-fit">Druck</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Bon erneut drucken"
                          disabled={reprinting === o.order_ref}
                          onClick={() => reprintOrder(o.order_ref)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Bestellung löschen"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setOrderToDelete(o)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestellung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {orderToDelete && (
                <>
                  Bestellung von <strong>{orderToDelete.payload.customer_name || "Gast"}</strong> um{" "}
                  <strong>{orderToDelete.time}</strong> ({money(orderToDelete.total)}) wird unwiderruflich aus dem
                  System gelöscht. Bereits an POS und Drucker gesendete Aufträge bleiben dort bestehen.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOrder}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Lösche..." : "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrders;
