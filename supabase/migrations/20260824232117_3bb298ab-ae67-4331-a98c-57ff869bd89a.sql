CREATE TABLE IF NOT EXISTS public.catering_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id TEXT,
  package_name TEXT,
  persons INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  street TEXT,
  plz TEXT,
  city TEXT,
  event_date DATE,
  event_time TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.catering_inquiries TO anon;
GRANT SELECT, INSERT ON public.catering_inquiries TO authenticated;
GRANT ALL ON public.catering_inquiries TO service_role;

ALTER TABLE public.catering_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a catering inquiry" ON public.catering_inquiries;
CREATE POLICY "Anyone can submit a catering inquiry"
ON public.catering_inquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read catering inquiries" ON public.catering_inquiries;
CREATE POLICY "Admins can read catering inquiries"
ON public.catering_inquiries FOR SELECT TO authenticated
USING (public.is_admin());