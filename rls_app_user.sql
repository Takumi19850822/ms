-- Supabase Auth profile table and RLS helpers
-- This table holds application-specific user attributes.
CREATE TABLE IF NOT EXISTS public.app_user_profile (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('admin', 'store', 'store_all')),
  store_id text,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_user_profile_role_idx ON public.app_user_profile(role);
CREATE INDEX IF NOT EXISTS app_user_profile_store_id_idx ON public.app_user_profile(store_id);
CREATE INDEX IF NOT EXISTS app_user_profile_is_active_idx ON public.app_user_profile(is_active);

CREATE OR REPLACE FUNCTION public.app_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_user_profile_touch_updated_at ON public.app_user_profile;
CREATE TRIGGER app_user_profile_touch_updated_at
BEFORE UPDATE ON public.app_user_profile
FOR EACH ROW
EXECUTE FUNCTION public.app_touch_updated_at();

CREATE OR REPLACE FUNCTION public.app_current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.app_user_profile p
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_current_store_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.store_id
  FROM public.app_user_profile p
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_current_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT p.is_active
    FROM public.app_user_profile p
    WHERE p.id = auth.uid()
    LIMIT 1
  ), false)
$$;

CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT p.role = 'admin'
    FROM public.app_user_profile p
    WHERE p.id = auth.uid()
    LIMIT 1
  ), false)
$$;

REVOKE ALL ON FUNCTION public.app_current_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_current_store_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_current_is_active() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_is_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.app_current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_current_store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_current_is_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_is_admin() TO authenticated;

ALTER TABLE public.app_user_profile ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_user_profile FROM PUBLIC;
GRANT SELECT ON TABLE public.app_user_profile TO authenticated;

DROP POLICY IF EXISTS app_user_profile_select_policy ON public.app_user_profile;
DROP POLICY IF EXISTS app_user_profile_insert_policy ON public.app_user_profile;
DROP POLICY IF EXISTS app_user_profile_update_policy ON public.app_user_profile;
DROP POLICY IF EXISTS app_user_profile_delete_policy ON public.app_user_profile;

CREATE POLICY app_user_profile_select_policy
ON public.app_user_profile
FOR SELECT
TO authenticated
USING (
  public.app_is_admin()
  OR id = auth.uid()
);

CREATE POLICY app_user_profile_insert_policy
ON public.app_user_profile
FOR INSERT
TO authenticated
WITH CHECK (
  public.app_is_admin()
);

CREATE POLICY app_user_profile_update_policy
ON public.app_user_profile
FOR UPDATE
TO authenticated
USING (
  public.app_is_admin()
  OR id = auth.uid()
)
WITH CHECK (
  public.app_is_admin()
  OR id = auth.uid()
);

CREATE POLICY app_user_profile_delete_policy
ON public.app_user_profile
FOR DELETE
TO authenticated
USING (
  public.app_is_admin()
);
