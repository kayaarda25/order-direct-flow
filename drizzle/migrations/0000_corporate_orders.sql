CREATE TABLE public.corporate_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  billing_address text,
  delivery_address text,
  contact_name text,
  contact_email text,
  contact_phone text,
  invoice_email text,
  delivery_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  delivery_time text NOT NULL DEFAULT '12:00',
  cutoff_time text NOT NULL DEFAULT '10:30',
  min_orders integer NOT NULL DEFAULT 1,
  discount_percent numeric NOT NULL DEFAULT 0,
  special_prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed_item_ids uuid[] NOT NULL DEFAULT '{}',
  payment_terms_days integer NOT NULL DEFAULT 14,
  auto_release boolean NOT NULL DEFAULT false,
  allow_auto_below_min boolean NOT NULL DEFAULT false,
  admin_token text NOT NULL DEFAULT encode(gen_random_bytes(18),'hex'),
  admin_password text NOT NULL DEFAULT substr(encode(gen_random_bytes(6),'hex'),1,8),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.corporate_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.corporate_clients(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  employee_name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  edit_token text NOT NULL DEFAULT encode(gen_random_bytes(18),'hex'),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.corporate_orders(client_id, delivery_date);
CREATE TABLE public.corporate_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.corporate_clients(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  status text NOT NULL DEFAULT 'released',
  released_by text,
  order_count integer NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  released_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, delivery_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_clients, public.corporate_orders, public.corporate_batches TO authenticated;
GRANT ALL ON public.corporate_clients, public.corporate_orders, public.corporate_batches TO service_role;
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage corporate clients" ON public.corporate_clients FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins manage corporate orders" ON public.corporate_orders FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins manage corporate batches" ON public.corporate_batches FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());