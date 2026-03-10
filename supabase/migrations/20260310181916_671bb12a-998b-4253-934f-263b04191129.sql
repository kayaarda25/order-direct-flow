
-- Opening hours table
CREATE TABLE public.opening_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_ranges jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

ALTER TABLE public.opening_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view opening hours" ON public.opening_hours
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can update opening hours" ON public.opening_hours
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can insert opening hours" ON public.opening_hours
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can delete opening hours" ON public.opening_hours
  FOR DELETE TO authenticated USING (is_admin());

-- Delivery zones table
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plz text NOT NULL UNIQUE,
  city text NOT NULL,
  minimum_order numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view delivery zones" ON public.delivery_zones
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert delivery zones" ON public.delivery_zones
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update delivery zones" ON public.delivery_zones
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete delivery zones" ON public.delivery_zones
  FOR DELETE TO authenticated USING (is_admin());

-- Site settings (key-value store for content)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can update site settings" ON public.site_settings
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can insert site settings" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can delete site settings" ON public.site_settings
  FOR DELETE TO authenticated USING (is_admin());

-- Seed opening hours
INSERT INTO public.opening_hours (day_of_week, time_ranges) VALUES
  (0, '[[14, 0, 22, 0]]'),
  (1, '[[11, 0, 14, 0], [17, 0, 22, 0]]'),
  (2, '[[11, 0, 14, 0], [17, 0, 22, 0]]'),
  (3, '[[11, 0, 14, 0], [17, 0, 22, 0]]'),
  (4, '[[11, 0, 14, 0], [17, 0, 22, 0]]'),
  (5, '[[11, 0, 14, 0], [17, 0, 23, 0]]'),
  (6, '[[11, 0, 23, 0]]');

-- Seed delivery zones
INSERT INTO public.delivery_zones (plz, city, minimum_order, active) VALUES
  ('8048', 'Zürich', 40, true),
  ('8952', 'Schlieren', 60, true);
