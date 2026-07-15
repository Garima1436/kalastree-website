-- ============================================================
-- KalaStree Schema v7 — Run in Supabase → SQL Editor
--
-- Adds optional Hindi translations for the GI Products educational
-- catalog (gi_products table) — the same pattern as v6 did for
-- shop products. All columns are nullable: existing entries keep
-- showing English content, and the public GI Products page falls
-- back to the English field whenever the _hi version is null or
-- empty. Populated by hand or via the auto-translate button in
-- Admin → GI Products, which calls the OpenAI API.
-- ============================================================

ALTER TABLE gi_products ADD COLUMN IF NOT EXISTS name_hi TEXT;
ALTER TABLE gi_products ADD COLUMN IF NOT EXISTS tagline_hi TEXT;
ALTER TABLE gi_products ADD COLUMN IF NOT EXISTS women_role_hi TEXT;
ALTER TABLE gi_products ADD COLUMN IF NOT EXISTS history_hi TEXT;
ALTER TABLE gi_products ADD COLUMN IF NOT EXISTS materials_hi TEXT;
