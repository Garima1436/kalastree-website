-- ============================================================
-- KalaStree Schema v6 — Run in Supabase → SQL Editor
--
-- Adds optional Hindi translations for product name/description.
-- Both columns are nullable: existing products keep working with
-- English-only content, and the storefront falls back to the
-- English `name`/`description` whenever `name_hi`/`description_hi`
-- is null or empty. Populated either by hand (admin/artisan forms)
-- or via the auto-translate button, which calls the OpenAI API
-- and fills the field for the artisan/admin to review and edit
-- before saving.
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS name_hi TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_hi TEXT;
