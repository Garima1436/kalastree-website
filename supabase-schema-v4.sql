-- ============================================================
-- KalaStree Schema v4 — Run in Supabase → SQL Editor
--
-- Fixes: promoting a user to "artisan" from Admin → Users only
-- ever updated profiles.role. The public /artisans page reads from
-- the separate `artisans` table, so promoted users never appeared
-- there. The API now also creates a linked `artisans` row when a
-- user is promoted (see /api/admin/users PATCH), but profiles.role
-- must actually accept 'artisan' for that to persist.
-- ============================================================

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'artisan', 'user'));

-- Note: any user already promoted to role = 'artisan' before this fix
-- still has no linked `artisans` row (that's the bug this migration
-- fixes going forward). Re-promote them from Admin → Users to create
-- their artisans row, since there's no reliable automatic match here.
