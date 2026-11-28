export interface CustomerPayload {
  customer_name?: string; customer_phone?: string; customer_email?: string; customer_address?: string;
  total?: number; payment_type?: string; order_type?: string; special_notes?: string;
  items?: { name?: string; quantity?: number; price?: number; notes?: string; modifiers?: string }[];
}
export interface CustomerOrder { order_ref: string; created_at: string; payload: CustomerPayload; pos1_ok?: boolean; pos2_ok?: boolean }
export interface CustomerProfile { id: string; display_name: string | null; email: string | null; phone: string | null; points_balance: number; created_at: string }
export interface CustomerTransaction { id: string; user_id: string; order_total: number; created_at: string }
export interface CustomerSummary {
  id: string; name: string; email: string; phone: string; address: string; registered: boolean; points: number | null;
  pizzaCount: number | null; freePizzas: number | null; orderCount: number; spent: number; estimatedOrders: number;
  lastOrder: string | null; orders: { ref: string; date: string; total: number; estimated: boolean; payload: CustomerPayload }[];
}

export function customerPhone(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.startsWith('0041') ? '41' + digits.slice(4) : digits.startsWith('0') ? '41' + digits.slice(1) : digits;
}

export function buildCustomers(
  profiles: CustomerProfile[], dispatches: CustomerOrder[],
  prints: { created_at: string; payload: CustomerPayload }[], transactions: CustomerTransaction[],
  passes: { user_id: string; pizza_count: number; free_pizzas_available: number }[],
): CustomerSummary[] {
  const customers = new Map<string, CustomerSummary>();
  const identities = new Map<string, string[]>();
  const addIdentity = (key: string, id: string) => { if (key) identities.set(key, [...(identities.get(key) ?? []), id]); };
  for (const p of profiles) {
    const pass = passes.find(x => x.user_id === p.id);
    customers.set(p.id, { id: p.id, name: p.display_name || p.email || 'Kunde', email: p.email || '', phone: p.phone || '', address: '', registered: true, points: p.points_balance,
      pizzaCount: pass?.pizza_count ?? 0, freePizzas: pass?.free_pizzas_available ?? 0, orderCount: 0, spent: 0, estimatedOrders: 0, lastOrder: null, orders: [] });
    if (p.phone) addIdentity('phone:' + customerPhone(p.phone), p.id);
    if (p.email) addIdentity('email:' + p.email.toLowerCase().trim(), p.id);
  }
  const consumed = new Set<string>();
  const accepted = dispatches.filter(o => o.pos1_ok || o.pos2_ok).sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const order of accepted) {
    const p = order.payload;
    const signature = (v: CustomerPayload) => JSON.stringify([v.customer_name, customerPhone(v.customer_phone), v.items]);
    const receipt = prints.filter(r => r.payload.total != null && signature(r.payload) === signature(p) && Math.abs(Date.parse(r.created_at) - Date.parse(order.created_at)) < 60000)
      .sort((a, b) => Math.abs(Date.parse(a.created_at) - Date.parse(order.created_at)) - Math.abs(Date.parse(b.created_at) - Date.parse(order.created_at)))[0];
    const knownTotal = p.total ?? receipt?.payload.total;
    const total = Number(knownTotal ?? (p.items ?? []).reduce((s, i) => s + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0));
    const phone = customerPhone(p.customer_phone);
    const email = (p.customer_email ?? '').toLowerCase().trim();
    const ids = identities.get('phone:' + phone) ?? identities.get('email:' + email) ?? [];
    const candidates = transactions.filter(t => !consumed.has(t.id) && Math.abs(Date.parse(t.created_at) - Date.parse(order.created_at)) < 120000 && Math.abs(Number(t.order_total) - total) < 0.01);
    const transaction = candidates.length === 1 ? candidates[0] : undefined;
    const profileId = ids.length === 1 ? ids[0] : transaction?.user_id;
    if (transaction && (!profileId || profileId === transaction.user_id)) consumed.add(transaction.id);
    const id = profileId && customers.has(profileId) ? profileId : phone ? 'phone:' + phone : email ? 'email:' + email : 'order:' + order.order_ref;
    let c = customers.get(id);
    if (!c) {
      c = { id, name: p.customer_name || 'Gast', email: p.customer_email || '', phone: p.customer_phone || '', address: '', registered: false, points: null, pizzaCount: null, freePizzas: null, orderCount: 0, spent: 0, estimatedOrders: 0, lastOrder: null, orders: [] };
      customers.set(id, c);
    }
    c.name = p.customer_name || c.name;
    c.phone = p.customer_phone || c.phone;
    c.address = p.customer_address || c.address;
    c.orders.push({ ref: order.order_ref, date: order.created_at, total, estimated: knownTotal == null, payload: p });
  }
  for (const t of transactions) {
    const c = customers.get(t.user_id);
    if (c && !consumed.has(t.id)) c.orders.push({ ref: 'points:' + t.id, date: t.created_at, total: Number(t.order_total), estimated: false, payload: {} });
  }
  return [...customers.values()].map(c => {
    c.orders.sort((a, b) => b.date.localeCompare(a.date));
    c.orderCount = c.orders.length;
    c.spent = Math.round(c.orders.reduce((s, o) => s + o.total, 0) * 100) / 100;
    c.estimatedOrders = c.orders.filter(o => o.estimated).length;
    c.lastOrder = c.orders[0]?.date ?? null;
    return c;
  }).sort((a, b) => b.spent - a.spent);
}