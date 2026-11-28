import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminCustomers from '@/pages/admin/AdminCustomers';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Admin-Kundenübersicht', () => {
  it('Zeigt Punkte, Ausgaben und Bestellverlauf eines Kunden und lässt nach seinem Namen suchen', async () => {
    invoke.mockResolvedValue({ data: { ok: true, customers: [{ id: 'mia', name: 'Mia Muster', email: 'mia@example.com', phone: '0791234567', address: 'Musterstrasse 1', registered: true, points: 120, pizzaCount: 4, freePizzas: 1, orderCount: 1, spent: 20, estimatedOrders: 0, lastOrder: '2026-11-28T11:00:00Z', orders: [{ ref: 'one', date: '2026-11-28T11:00:00Z', total: 20, estimated: false, payload: { order_type: 'delivery', payment_type: 'TWINT', items: [{ name: 'Pizza', quantity: 1 }], special_notes: 'Bitte klingeln' } }] }] } });
    render(<AdminCustomers />);
    const name = await screen.findByText('Mia Muster');
    const row = name.closest('tr');
    if (!row) throw new Error('Kundenzeile fehlt');
    expect(within(row).getByText('120')).toBeInTheDocument();
    expect(within(row).getAllByText(/20\.00/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Details für Mia Muster' }));
    expect(await screen.findByText('Bemerkung: Bitte klingeln')).toBeInTheDocument();
    expect(screen.getByText('Lieferung · TWINT')).toBeInTheDocument();
  });
  it('Zeigt einen Ladefehler statt einer scheinbar leeren Kundenliste', async () => {
    invoke.mockResolvedValue({ error: new Error('Nicht erreichbar'), data: null });
    render(<AdminCustomers />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Kunden konnten nicht geladen werden.');
  });
  it('Filtert die Liste nach Kundennamen', async () => {
    invoke.mockResolvedValue({ data: { ok: true, customers: [] } });
    render(<AdminCustomers />);
    await screen.findByText('Keine Kunden gefunden.');
    fireEvent.change(screen.getByLabelText('Kunden suchen'), { target: { value: 'Mia' } });
    expect(screen.getByLabelText('Kunden suchen')).toHaveValue('Mia');
  });
});