-- ResourceRecord RLS policy (for Supabase PostgREST + JWT claims)
-- Expected JWT custom claims:
--   app_role: "admin" | "store_all" | "store"
--   app_store_id: store id string (required when app_role = "store")
--
-- Example payload excerpt:
-- {
--   "sub": "app-user-id",
--   "role": "authenticated",
--   "app_role": "store",
--   "app_store_id": "store-a"
-- }

ALTER TABLE "ResourceRecord" ENABLE ROW LEVEL SECURITY;

-- Safety: no public grants (optional but recommended)
REVOKE ALL ON TABLE "ResourceRecord" FROM PUBLIC;

-- Supabase roles used by API
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ResourceRecord" TO authenticated;
GRANT SELECT ON TABLE "ResourceRecord" TO anon;

-- Read policy:
-- - admin / store_all: can read all rows
-- - store: only own store rows
CREATE POLICY "resource_record_select_policy"
ON "ResourceRecord"
FOR SELECT
TO authenticated, anon
USING (
  COALESCE(auth.jwt() ->> 'app_role', '') IN ('admin', 'store_all')
  OR (
    COALESCE(auth.jwt() ->> 'app_role', '') = 'store'
    AND "storeId" = auth.jwt() ->> 'app_store_id'
  )
);

-- Insert policy:
-- - admin / store_all: can insert any store
-- - store: must insert only own store
CREATE POLICY "resource_record_insert_policy"
ON "ResourceRecord"
FOR INSERT
TO authenticated
WITH CHECK (
  COALESCE(auth.jwt() ->> 'app_role', '') IN ('admin', 'store_all')
  OR (
    COALESCE(auth.jwt() ->> 'app_role', '') = 'store'
    AND "storeId" = auth.jwt() ->> 'app_store_id'
  )
);

-- Update policy:
-- - row visibility check + new-row check
CREATE POLICY "resource_record_update_policy"
ON "ResourceRecord"
FOR UPDATE
TO authenticated
USING (
  COALESCE(auth.jwt() ->> 'app_role', '') IN ('admin', 'store_all')
  OR (
    COALESCE(auth.jwt() ->> 'app_role', '') = 'store'
    AND "storeId" = auth.jwt() ->> 'app_store_id'
  )
)
WITH CHECK (
  COALESCE(auth.jwt() ->> 'app_role', '') IN ('admin', 'store_all')
  OR (
    COALESCE(auth.jwt() ->> 'app_role', '') = 'store'
    AND "storeId" = auth.jwt() ->> 'app_store_id'
  )
);

-- Delete policy:
CREATE POLICY "resource_record_delete_policy"
ON "ResourceRecord"
FOR DELETE
TO authenticated
USING (
  COALESCE(auth.jwt() ->> 'app_role', '') IN ('admin', 'store_all')
  OR (
    COALESCE(auth.jwt() ->> 'app_role', '') = 'store'
    AND "storeId" = auth.jwt() ->> 'app_store_id'
  )
);
