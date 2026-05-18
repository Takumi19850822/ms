-- ResourceRecord RLS policy (for Supabase Auth users)
-- Uses public.app_user_profile and auth.uid() for authorization.

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

ALTER TABLE "ResourceRecord" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "ResourceRecord" FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ResourceRecord" TO authenticated;

DROP POLICY IF EXISTS resource_record_select_policy ON "ResourceRecord";
DROP POLICY IF EXISTS resource_record_insert_policy ON "ResourceRecord";
DROP POLICY IF EXISTS resource_record_update_policy ON "ResourceRecord";
DROP POLICY IF EXISTS resource_record_delete_policy ON "ResourceRecord";

CREATE POLICY resource_record_select_policy
ON "ResourceRecord"
FOR SELECT
TO authenticated
USING (
  public.app_current_is_active()
  AND (
    public.app_current_role() IN ('admin', 'store_all')
    OR (
      public.app_current_role() = 'store'
      AND "storeId" = public.app_current_store_id()
    )
  )
);

CREATE POLICY resource_record_insert_policy
ON "ResourceRecord"
FOR INSERT
TO authenticated
WITH CHECK (
  public.app_current_is_active()
  AND (
    public.app_current_role() IN ('admin', 'store_all')
    OR (
      public.app_current_role() = 'store'
      AND "storeId" = public.app_current_store_id()
    )
  )
);

CREATE POLICY resource_record_update_policy
ON "ResourceRecord"
FOR UPDATE
TO authenticated
USING (
  public.app_current_is_active()
  AND (
    public.app_current_role() IN ('admin', 'store_all')
    OR (
      public.app_current_role() = 'store'
      AND "storeId" = public.app_current_store_id()
    )
  )
)
WITH CHECK (
  public.app_current_is_active()
  AND (
    public.app_current_role() IN ('admin', 'store_all')
    OR (
      public.app_current_role() = 'store'
      AND "storeId" = public.app_current_store_id()
    )
  )
);

CREATE POLICY resource_record_delete_policy
ON "ResourceRecord"
FOR DELETE
TO authenticated
USING (
  public.app_current_is_active()
  AND (
    public.app_current_role() IN ('admin', 'store_all')
    OR (
      public.app_current_role() = 'store'
      AND "storeId" = public.app_current_store_id()
    )
  )
);
