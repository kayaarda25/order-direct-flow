CREATE TABLE public.order_dispatches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref text NOT NULL UNIQUE,
  fingerprint text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  pos1_ok boolean NOT NULL DEFAULT false,
  pos2_ok boolean NOT NULL DEFAULT false,
  print_queued boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_dispatches TO service_role;
ALTER TABLE public.order_dispatches ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_order_dispatches_fingerprint ON public.order_dispatches (fingerprint, created_at);