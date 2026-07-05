-- ============================================================
-- KalaStree Schema v3 — Run in Supabase → SQL Editor
-- Adds a human-readable, collision-proof order number.
--
-- Format:  KS-YYMMDD-<REGION>-<SEQUENCE>
-- Example: KS-260705-RJ-000123   (domestic, Rajasthan, order #123)
--          KS-260705-INT-000124  (international order)
--
-- REGION is a 2-letter Indian state code, or "INT" when country
-- is not India, or "XX" as a safe fallback if the state can't be
-- matched (never blocks order creation).
--
-- SEQUENCE is backed by an auto-incrementing identity column, so
-- it can never repeat regardless of date/region collisions.
-- ============================================================

-- Country wasn't tracked before (site was India-only); default keeps
-- every historical and current order correctly marked as domestic.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'India';

-- Guaranteed-unique, ever-increasing counter — the actual uniqueness
-- guarantee for order_number comes from this, not from date/region.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_seq BIGINT GENERATED ALWAYS AS IDENTITY;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.state_code(p_state TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE upper(trim(coalesce(p_state, '')))
    WHEN 'ANDHRA PRADESH'     THEN 'AP'
    WHEN 'ARUNACHAL PRADESH'  THEN 'AR'
    WHEN 'ASSAM'              THEN 'AS'
    WHEN 'BIHAR'              THEN 'BR'
    WHEN 'CHHATTISGARH'       THEN 'CG'
    WHEN 'GOA'                THEN 'GA'
    WHEN 'GUJARAT'            THEN 'GJ'
    WHEN 'HARYANA'            THEN 'HR'
    WHEN 'HIMACHAL PRADESH'   THEN 'HP'
    WHEN 'JAMMU & KASHMIR'    THEN 'JK'
    WHEN 'JHARKHAND'          THEN 'JH'
    WHEN 'KARNATAKA'          THEN 'KA'
    WHEN 'KERALA'             THEN 'KL'
    WHEN 'MADHYA PRADESH'     THEN 'MP'
    WHEN 'MAHARASHTRA'        THEN 'MH'
    WHEN 'MANIPUR'            THEN 'MN'
    WHEN 'MEGHALAYA'          THEN 'ML'
    WHEN 'MIZORAM'            THEN 'MZ'
    WHEN 'NAGALAND'           THEN 'NL'
    WHEN 'ODISHA'             THEN 'OD'
    WHEN 'PUNJAB'             THEN 'PB'
    WHEN 'RAJASTHAN'          THEN 'RJ'
    WHEN 'SIKKIM'             THEN 'SK'
    WHEN 'TAMIL NADU'         THEN 'TN'
    WHEN 'TELANGANA'          THEN 'TG'
    WHEN 'TRIPURA'            THEN 'TR'
    WHEN 'UTTAR PRADESH'      THEN 'UP'
    WHEN 'UTTARAKHAND'        THEN 'UK'
    WHEN 'WEST BENGAL'        THEN 'WB'
    WHEN 'DELHI'              THEN 'DL'
    WHEN 'LADAKH'             THEN 'LA'
    ELSE 'XX'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
DECLARE
  region TEXT;
BEGIN
  IF NEW.order_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF upper(trim(coalesce(NEW.country, 'India'))) <> 'INDIA' THEN
    region := 'INT';
  ELSE
    region := public.state_code(NEW.state);
  END IF;

  NEW.order_number := 'KS-' || to_char(coalesce(NEW.created_at, now()), 'YYMMDD')
    || '-' || region || '-' || lpad(NEW.order_seq::text, 6, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON orders;
CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_order_number();

-- Backfill order numbers for any orders created before this migration.
UPDATE orders
SET order_number = 'KS-' || to_char(created_at, 'YYMMDD') || '-' ||
  (CASE WHEN upper(trim(coalesce(country, 'India'))) <> 'INDIA' THEN 'INT' ELSE public.state_code(state) END)
  || '-' || lpad(order_seq::text, 6, '0')
WHERE order_number IS NULL;
