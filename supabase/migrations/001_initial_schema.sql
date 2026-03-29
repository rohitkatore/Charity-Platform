BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_numbers(nums integer[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    nums IS NULL
    OR (
      cardinality(nums) = 5
      AND (SELECT bool_and(n BETWEEN 1 AND 45) FROM unnest(nums) AS n)
      AND cardinality(ARRAY(SELECT DISTINCT n FROM unnest(nums) AS n)) = 5
    )
  );
$$;

CREATE TABLE public.charities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  website_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  avatar_url text,
  role text NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  subscription_status text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'lapsed')),
  subscription_plan text CHECK (subscription_plan IN ('monthly', 'yearly')),
  subscription_id text,
  stripe_customer_id text,
  subscription_renewal_date timestamptz,
  charity_id uuid REFERENCES public.charities(id),
  charity_contribution_percent integer NOT NULL DEFAULT 10 CHECK (charity_contribution_percent BETWEEN 10 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.charity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_id uuid NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.golf_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 45),
  score_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_month date NOT NULL CHECK (draw_month = date_trunc('month', draw_month)::date),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  draw_type text NOT NULL CHECK (draw_type IN ('random', 'algorithmic')),
  winning_numbers integer[] CHECK (public.is_valid_numbers(winning_numbers)),
  total_prize_pool numeric(10,2) NOT NULL DEFAULT 0,
  jackpot_pool numeric(10,2) NOT NULL DEFAULT 0,
  jackpot_rolled_over boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE public.draw_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_numbers integer[] NOT NULL CHECK (public.is_valid_numbers(entry_numbers)),
  match_count integer CHECK (match_count BETWEEN 0 AND 5),
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prize_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  match_count integer NOT NULL CHECK (match_count IN (3, 4, 5)),
  pool_share_percent numeric(5,2) NOT NULL CHECK (pool_share_percent IN (25, 35, 40)),
  prize_pool_amount numeric(10,2) NOT NULL DEFAULT 0,
  winner_count integer NOT NULL DEFAULT 0,
  prize_per_winner numeric(10,2) NOT NULL DEFAULT 0,
  rolled_over boolean NOT NULL DEFAULT false,
  UNIQUE (draw_id, match_count)
);

CREATE TABLE public.winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.draws(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  draw_entry_id uuid NOT NULL REFERENCES public.draw_entries(id),
  match_count integer NOT NULL CHECK (match_count BETWEEN 3 AND 5),
  prize_amount numeric(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  proof_url text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (draw_entry_id)
);

CREATE TABLE public.charity_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  charity_id uuid NOT NULL REFERENCES public.charities(id),
  amount numeric(10,2) NOT NULL,
  contribution_month date NOT NULL,
  is_independent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_golf_scores_user_id ON public.golf_scores(user_id);
CREATE INDEX idx_golf_scores_user_date_desc ON public.golf_scores(user_id, score_date DESC, created_at DESC);
CREATE INDEX idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX idx_winners_user_id ON public.winners(user_id);
CREATE INDEX idx_charity_contributions_user_id ON public.charity_contributions(user_id);

CREATE OR REPLACE FUNCTION public.prune_golf_scores_to_five()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.golf_scores
  WHERE id IN (
    SELECT gs.id
    FROM public.golf_scores gs
    WHERE gs.user_id = NEW.user_id
    ORDER BY gs.score_date DESC, gs.created_at DESC
    OFFSET 5
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_golf_scores_prune_to_five
AFTER INSERT ON public.golf_scores
FOR EACH ROW
EXECUTE FUNCTION public.prune_golf_scores_to_five();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_select_admin_all
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY profiles_update_admin_all
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY golf_scores_select_own
ON public.golf_scores
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY golf_scores_insert_own
ON public.golf_scores
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY golf_scores_update_own
ON public.golf_scores
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY golf_scores_delete_own
ON public.golf_scores
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY golf_scores_select_admin_all
ON public.golf_scores
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY golf_scores_update_admin_all
ON public.golf_scores
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY draws_read_authenticated
ON public.draws
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY draws_admin_insert
ON public.draws
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY draws_admin_update
ON public.draws
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY draws_admin_delete
ON public.draws
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY draw_entries_read_authenticated
ON public.draw_entries
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY draw_entries_admin_insert
ON public.draw_entries
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY draw_entries_admin_update
ON public.draw_entries
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY draw_entries_admin_delete
ON public.draw_entries
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY prize_tiers_read_authenticated
ON public.prize_tiers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY prize_tiers_admin_insert
ON public.prize_tiers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY prize_tiers_admin_update
ON public.prize_tiers
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY prize_tiers_admin_delete
ON public.prize_tiers
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY winners_select_own
ON public.winners
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY winners_select_admin_all
ON public.winners
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY winners_update_admin_all
ON public.winners
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY charities_read_public
ON public.charities
FOR SELECT
TO public
USING (true);

CREATE POLICY charities_admin_insert
ON public.charities
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY charities_admin_update
ON public.charities
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY charities_admin_delete
ON public.charities
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY charity_events_read_public
ON public.charity_events
FOR SELECT
TO public
USING (true);

CREATE POLICY charity_events_admin_insert
ON public.charity_events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY charity_events_admin_update
ON public.charity_events
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY charity_events_admin_delete
ON public.charity_events
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY charity_contributions_select_own
ON public.charity_contributions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY charity_contributions_select_admin_all
ON public.charity_contributions
FOR SELECT
TO authenticated
USING (public.is_admin());

COMMIT;
