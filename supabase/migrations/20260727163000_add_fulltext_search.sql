-- Full-text search for products and artisans.
--
-- The app previously searched with `ilike '%term%'` (a leading wildcard),
-- which cannot use a standard btree index and forces a full table scan on
-- every keystroke. This adds a generated tsvector column + GIN index per
-- table, and the app code now queries via Postgres full-text search
-- (see src/app/shop/page.tsx and src/components/NavSearch.tsx).

alter table products add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(gi_tag, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(state, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored;

create index if not exists products_search_vector_idx on products using gin (search_vector);

alter table artisans add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(craft, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(state, '')), 'B')
  ) stored;

create index if not exists artisans_search_vector_idx on artisans using gin (search_vector);
