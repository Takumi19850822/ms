-- AppUser RLS policy (for Supabase PostgREST + JWT claims)
-- Expected JWT custom claims:
--   app_role: "admin" | "store_all" | "store"
--
-- Note:
-- - Admin can manage all users.
-- - Non-admin can only read/update self row (no create/delete).

ALTER TABLE "AppUser" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "AppUser" FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AppUser" TO authenticated;

CREATE POLICY "app_user_select_policy"
ON "AppUser"
FOR SELECT
TO authenticated
USING (
  COALESCE(auth.jwt() ->> 'app_role', '') = 'admin'
  OR id = auth.jwt() ->> 'sub'
);

CREATE POLICY "app_user_insert_policy"
ON "AppUser"
FOR INSERT
TO authenticated
WITH CHECK (
  COALESCE(auth.jwt() ->> 'app_role', '') = 'admin'
);

CREATE POLICY "app_user_update_policy"
ON "AppUser"
FOR UPDATE
TO authenticated
USING (
  COALESCE(auth.jwt() ->> 'app_role', '') = 'admin'
  OR id = auth.jwt() ->> 'sub'
)
WITH CHECK (
  COALESCE(auth.jwt() ->> 'app_role', '') = 'admin'
  OR id = auth.jwt() ->> 'sub'
);

CREATE POLICY "app_user_delete_policy"
ON "AppUser"
FOR DELETE
TO authenticated
USING (
  COALESCE(auth.jwt() ->> 'app_role', '') = 'admin'
);
