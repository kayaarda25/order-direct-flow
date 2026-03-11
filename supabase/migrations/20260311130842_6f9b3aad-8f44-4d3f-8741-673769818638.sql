
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS modifier_groups jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS bestseller boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS popular boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS station text NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
