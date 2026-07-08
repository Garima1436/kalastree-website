-- ============================================================
-- KalaStree Schema v5 — Run in Supabase → SQL Editor
--
-- Fixes: admin-added products only set artisan_id (link to the
-- artisans table), never submitted_by (the auth user that the
-- artisan's "My Products" panel filters on). The API now sets both
-- (see /api/admin/products POST/PATCH). This backfills products
-- that were assigned to an artisan before that fix, so they show
-- up in that artisan's panel too.
-- ============================================================

UPDATE products p
SET submitted_by = a.user_id
FROM artisans a
WHERE p.artisan_id = a.id
  AND p.submitted_by IS NULL
  AND a.user_id IS NOT NULL;
