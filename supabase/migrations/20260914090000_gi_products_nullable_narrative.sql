-- The 8 curated narrative/cosmetic columns on gi_products were defined
-- NOT NULL back when the table only ever held the 26 hand-written cards.
-- The bulk import of all officially registered GI entries from the IP
-- India registry (state/gi_tag/year/category are real, verified facts)
-- has no editorial content to put in these fields, and inventing a
-- tagline/history/women's-role claim for ~600 products would be
-- fabrication, not data entry — so these need to become optional.
alter table gi_products
  alter column accent drop not null,
  alter column emoji drop not null,
  alter column tagline drop not null,
  alter column women_role drop not null,
  alter column history drop not null,
  alter column materials drop not null,
  alter column district drop not null,
  alter column women_percent drop not null;
