
-- Pizza pass tracking
CREATE TABLE public.pizza_pass (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pizza_count integer NOT NULL DEFAULT 0,
  passes_completed integer NOT NULL DEFAULT 0,
  free_pizzas_available integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pizza_pass ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pizza pass" ON public.pizza_pass
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own pizza pass" ON public.pizza_pass
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pizza pass" ON public.pizza_pass
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all pizza passes" ON public.pizza_pass
  FOR SELECT TO authenticated USING (is_admin());

-- Auto-create pizza pass on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_pizza_pass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pizza_pass (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_pizza_pass
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_pizza_pass();

-- Function to add pizza to pass
CREATE OR REPLACE FUNCTION public.add_pizzas_to_pass(p_user_id uuid, p_count integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current integer;
  v_new_total integer;
  v_free integer;
  v_completed integer;
BEGIN
  -- Ensure pass exists
  INSERT INTO public.pizza_pass (user_id) VALUES (p_user_id)
  ON CONFLICT DO NOTHING;
  
  SELECT pizza_count, free_pizzas_available, passes_completed 
  INTO v_current, v_free, v_completed
  FROM public.pizza_pass WHERE user_id = p_user_id;
  
  v_new_total := v_current + p_count;
  
  IF v_new_total >= 10 THEN
    v_free := v_free + (v_new_total / 10);
    v_completed := v_completed + (v_new_total / 10);
    v_new_total := v_new_total % 10;
  END IF;
  
  UPDATE public.pizza_pass 
  SET pizza_count = v_new_total, free_pizzas_available = v_free, passes_completed = v_completed, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object('pizza_count', v_new_total, 'free_pizzas_available', v_free);
END;
$$;
