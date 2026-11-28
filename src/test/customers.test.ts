import { describe, expect, it } from 'vitest';
import { buildCustomers, customerPhone } from '../../supabase/functions/_shared/customers';

describe('Kundenübersicht', () => {
  const profile = { id: 'account', display_name: 'Mia', email: 'mia@example.com', phone: null, points_balance: 120, created_at: '2026-11-01' };
  const payload = { customer_name: 'Mia Muster', customer_phone: '0791234567', items: [{ name: 'Pizza', price: 25, quantity: 1 }] };
  const order = { order_ref: 'one', created_at: '2026-11-28T11:00:00Z', payload, pos2_ok: true };
  it('Verknüpft den Punktekauf mit der Bestellung ohne doppelte Zählung und übernimmt den rabattierten Gesamtbetrag', () => {
    const result = buildCustomers([profile], [order], [{ created_at: order.created_at, payload: { ...payload, total: 20 } }], [{ id: 't', user_id: 'account', created_at: '2026-11-28T11:00:03Z', order_total: 20 }], []);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ points: 120, spent: 20, orderCount: 1, estimatedOrders: 0 });
  });
  it('Zeigt Gäste und Konten ohne Bestellungen und zählt abgewiesene Bestellungen nicht', () => {
    const result = buildCustomers([profile], [order, { ...order, order_ref: 'failed', pos2_ok: false }], [], [], []);
    expect(result).toHaveLength(2);
    expect(result.find(c => !c.registered)).toMatchObject({ orderCount: 1, spent: 25, points: null, estimatedOrders: 1 });
    expect(result.find(c => c.registered)?.orderCount).toBe(0);
  });
  it('Erkennt dieselbe Schweizer Telefonnummer in unterschiedlichen Schreibweisen', () => {
    expect(customerPhone('+41 79 123 45 67')).toBe(customerPhone('079 123 45 67'));
    expect(customerPhone('0041791234567')).toBe('41791234567');
  });
});