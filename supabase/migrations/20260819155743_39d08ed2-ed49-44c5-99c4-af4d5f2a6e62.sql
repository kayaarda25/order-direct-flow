CREATE TABLE public.print_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  printed_at timestamptz
);
GRANT ALL ON public.print_jobs TO service_role;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX print_jobs_status_idx ON public.print_jobs (status, created_at);