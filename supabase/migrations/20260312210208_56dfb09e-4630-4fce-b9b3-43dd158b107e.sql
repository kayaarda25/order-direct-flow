
-- Profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  phone text,
  points_balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Loyalty rewards (the tiers)
CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  points_required integer NOT NULL,
  reward_name text NOT NULL,
  reward_description text,
  category text NOT NULL DEFAULT 'general',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards" ON public.loyalty_rewards
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Admins can manage rewards" ON public.loyalty_rewards
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Insert default reward tiers
INSERT INTO public.loyalty_rewards (points_required, reward_name, reward_description, category, sort_order) VALUES
  (150, 'Getränk klein', 'Ein kleines Softgetränk nach Wahl', 'drinks', 1),
  (250, 'Dessert', 'Ein Dessert nach Wahl (Tiramisu, Panna Cotta)', 'desserts', 2),
  (500, 'Pasta', 'Eine Pasta nach Wahl aus unserer Karte', 'main', 3),
  (750, 'Pizza 24cm', 'Eine Pizza 24cm nach Wahl', 'main', 4),
  (1000, 'Pizza 32cm', 'Eine Pizza 32cm nach Wahl aus der Karte', 'main', 5),
  (1500, 'Ganzes Menü', 'Pizza 32cm + Getränk + Dessert nach Wahl', 'menu', 6);

-- Loyalty transactions (points history)
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL,
  description text,
  order_total numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON public.loyalty_transactions
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "System can insert transactions" ON public.loyalty_transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Function to award points
CREATE OR REPLACE FUNCTION public.award_points(p_user_id uuid, p_order_total numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
BEGIN
  v_points := floor(p_order_total) * 5;
  
  INSERT INTO public.loyalty_transactions (user_id, points, type, description, order_total)
  VALUES (p_user_id, v_points, 'earned', 'Punkte für Bestellung', p_order_total);
  
  UPDATE public.profiles
  SET points_balance = points_balance + v_points, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN v_points;
END;
$$;

-- Function to redeem reward
CREATE OR REPLACE FUNCTION public.redeem_reward(p_user_id uuid, p_reward_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points_required integer;
  v_reward_name text;
  v_balance integer;
BEGIN
  SELECT points_required, reward_name INTO v_points_required, v_reward_name
  FROM public.loyalty_rewards WHERE id = p_reward_id AND active = true;
  
  IF NOT FOUND THEN RETURN false; END IF;
  
  SELECT points_balance INTO v_balance FROM public.profiles WHERE id = p_user_id;
  IF v_balance < v_points_required THEN RETURN false; END IF;
  
  INSERT INTO public.loyalty_transactions (user_id, points, type, description)
  VALUES (p_user_id, -v_points_required, 'redeemed', 'Eingelöst: ' || v_reward_name);
  
  UPDATE public.profiles
  SET points_balance = points_balance - v_points_required, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;
