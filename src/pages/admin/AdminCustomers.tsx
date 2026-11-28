import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Users, ShoppingBag, Coins, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CustomerSummary } from '../../../supabase/functions/_shared/customers';

const money = (n: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n);
const date = (d: string | null) => d ? new Date(d).toLocaleDateString('de-CH', { timeZone: 'Europe/Zurich' }) : '–';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('spent');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<CustomerSummary | null>(null);
  const [page, setPage] = useState(0);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data, error } = await supabase.functions.invoke('admin-orders', { body: { action: 'customers' } });
      if (error || !data?.ok) throw new Error(data?.error || 'Kunden konnten nicht geladen werden.');
      setCustomers(data.customers ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Kunden konnten nicht geladen werden.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(0); }, [search, filter, sort]);
  const filtered = useMemo(() => customers.filter(c =>
    (filter === 'all' || (filter === 'registered' ? c.registered : !c.registered)) &&
    [c.name, c.phone, c.email, c.address].join(' ').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'lastOrder' ? (b.lastOrder ?? '').localeCompare(a.lastOrder ?? '') :
    sort === 'points' ? (b.points ?? -1) - (a.points ?? -1) : sort === 'orderCount' ? b.orderCount - a.orderCount : b.spent - a.spent), [customers, search, filter, sort]);
  const totals = customers.reduce((s, c) => ({ count: s.count + c.orderCount, spent: s.spent + c.spent, points: s.points + (c.points ?? 0) }), { count: 0, spent: 0, points: 0 });
  return <div className="space-y-6 min-w-0 text-foreground">
    <div className="flex items-center justify-between gap-4"><h1 className="text-2xl font-bold text-foreground">Kunden</h1><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Aktualisieren</Button></div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {[{ title: 'Kunden insgesamt', value: customers.length.toLocaleString('de-CH'), icon: Users }, { title: 'Bestellungen', value: totals.count.toLocaleString('de-CH'), icon: ShoppingBag }, { title: 'Ausgaben insgesamt', value: money(totals.spent), icon: Coins }, { title: 'Punkte insgesamt', value: totals.points.toLocaleString('de-CH'), icon: Coins }].map(k => <Card key={k.title}><CardContent className="p-4"><div className="flex gap-2 items-center text-muted-foreground text-sm"><k.icon className="w-4 h-4 shrink-0" />{k.title}</div><div className="text-base sm:text-xl font-bold mt-2 break-words">{k.value}</div></CardContent></Card>)}
    </div>
    <div className="flex flex-col lg:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input aria-label="Kunden suchen" className="pl-9" placeholder="Name, E-Mail, Telefon oder Adresse" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <Select value={filter} onValueChange={setFilter}><SelectTrigger className="lg:w-48" aria-label="Kundentyp"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle Kunden</SelectItem><SelectItem value="registered">Mit Kundenkonto</SelectItem><SelectItem value="guests">Gäste</SelectItem></SelectContent></Select>
      <Select value={sort} onValueChange={setSort}><SelectTrigger className="lg:w-52" aria-label="Kunden sortieren"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="spent">Höchste Ausgaben</SelectItem><SelectItem value="orderCount">Meiste Bestellungen</SelectItem><SelectItem value="points">Meiste Punkte</SelectItem><SelectItem value="lastOrder">Letzte Bestellung</SelectItem><SelectItem value="name">Name A–Z</SelectItem></SelectContent></Select>
    </div>
    {error ? <div role="alert" className="text-destructive">{error}</div> : loading ? <p className="text-muted-foreground" role="status">Kunden werden geladen …</p> : <>
      <div className="overflow-x-auto border rounded-md"><table className="w-full text-sm"><thead className="bg-muted/50"><tr>{['Kunde', 'Punkte', 'Bestellungen', 'Ausgaben', 'Ø Bestellung', 'Letzte Bestellung', ''].map((h, i) => <th key={i} className="text-left p-3 whitespace-nowrap font-medium">{h}</th>)}</tr></thead><tbody>{filtered.slice(page * 25, (page + 1) * 25).map(c => <tr key={c.id} className="border-t hover:bg-muted/30"><td className="p-3 min-w-52"><div className="font-medium">{c.name}</div><div className="text-muted-foreground break-all">{c.email || c.phone || '–'}</div><div className="text-xs text-muted-foreground">{c.registered ? 'Kundenkonto' : 'Gast'}</div></td><td className="p-3 tabular-nums">{c.points?.toLocaleString('de-CH') ?? '–'}</td><td className="p-3 tabular-nums">{c.orderCount}</td><td className="p-3 whitespace-nowrap tabular-nums">{money(c.spent)}{c.estimatedOrders > 0 && <div className="text-xs text-muted-foreground">{c.estimatedOrders} ohne gespeichertes Endtotal</div>}</td><td className="p-3 whitespace-nowrap">{c.orderCount ? money(c.spent / c.orderCount) : '–'}</td><td className="p-3 whitespace-nowrap">{date(c.lastOrder)}</td><td className="p-3"><Button variant="ghost" size="icon" aria-label={`Details für ${c.name}`} title="Kundendetails" onClick={() => setSelected(c)}><ChevronRight className="h-4 w-4" /></Button></td></tr>)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-muted-foreground">Keine Kunden gefunden.</p>}</div>
      <div className="flex flex-wrap justify-between items-center gap-3 text-sm"><span className="text-muted-foreground">{filtered.length} Kunden · Seite {page + 1} von {Math.max(1, Math.ceil(filtered.length / 25))}</span><div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Zurück</Button><Button variant="outline" disabled={(page + 1) * 25 >= filtered.length} onClick={() => setPage(p => p + 1)}>Weiter</Button></div></div>
    </>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="admin-theme text-foreground max-w-3xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}><DialogHeader><DialogTitle className="break-words pr-6">{selected?.name}</DialogTitle></DialogHeader>{selected && <div className="space-y-5">
      <div className="space-y-1 text-sm break-words"><p>{selected.email || 'Keine E-Mail gespeichert'}</p><p>{selected.phone || 'Keine Telefonnummer gespeichert'}</p><p>{selected.address || 'Keine Adresse gespeichert'}</p></div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">{[['Punkte', selected.points ?? '–'], ['Bestellungen', selected.orderCount], ['Ausgaben', money(selected.spent)], ['Gratis-Pizzen', selected.freePizzas ?? '–']].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-bold mt-1">{value}</dd></div>)}</dl>
      {selected.registered && <p className="text-sm text-muted-foreground">Pizza-Pass: {selected.pizzaCount} Pizzen gesammelt</p>}
      <h2 className="font-semibold">Bestellverlauf</h2>{!selected.orders.length && <p className="text-muted-foreground text-sm">Noch keine gespeicherten Bestellungen.</p>}
      {selected.orders.map(o => <div key={o.ref} className="border-t pt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">{date(o.date)} · {new Date(o.date).toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' })}</span><span className="font-semibold whitespace-nowrap">{money(o.total)}{o.estimated ? ' *' : ''}</span></div><div className="text-muted-foreground">{o.payload.order_type === 'delivery' ? 'Lieferung' : o.payload.order_type === 'pickup' ? 'Abholung' : 'Punktekauf'}{o.payload.payment_type ? ` · ${o.payload.payment_type}` : ''}</div>{o.payload.items?.map((i, n) => <div key={n}>{i.quantity ?? 1} × {i.name}{i.modifiers && <span className="text-muted-foreground"> · {i.modifiers}</span>}{i.notes && <p className="text-muted-foreground">{i.notes}</p>}</div>)}{o.payload.special_notes && <p className="text-muted-foreground">Bemerkung: {o.payload.special_notes}</p>}{o.estimated && <p className="text-xs text-muted-foreground">* Artikelsumme; ursprünglicher Rabatt nicht gespeichert.</p>}</div>)}
    </div>}</DialogContent></Dialog>
  </div>;
}