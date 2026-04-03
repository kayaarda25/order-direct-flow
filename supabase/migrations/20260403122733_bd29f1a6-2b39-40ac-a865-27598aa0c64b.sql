-- Delete duplicate pizza_pass rows, keeping only the one with highest pizza_count
DELETE FROM public.pizza_pass
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.pizza_pass
  ORDER BY user_id, pizza_count DESC, updated_at DESC
);

-- Add unique constraint on user_id to prevent future duplicates
ALTER TABLE public.pizza_pass ADD CONSTRAINT pizza_pass_user_id_unique UNIQUE (user_id);