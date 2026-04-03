
CREATE OR REPLACE FUNCTION public.redeem_free_pizza(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has free pizzas available
  IF NOT EXISTS (
    SELECT 1 FROM public.pizza_pass 
    WHERE user_id = p_user_id AND free_pizzas_available > 0
  ) THEN
    RETURN false;
  END IF;

  -- Decrement free pizzas
  UPDATE public.pizza_pass
  SET free_pizzas_available = free_pizzas_available - 1, updated_at = now()
  WHERE user_id = p_user_id AND free_pizzas_available > 0;

  RETURN true;
END;
$$;
