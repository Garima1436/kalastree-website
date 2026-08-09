-- Structured GI/product/artisan relationships.
--
-- products.gi_tag and artisans.gi_product were free-text strings with no
-- referential integrity to the gi_products table — the GI verification
-- engine (chat intelligence pipeline) needs a real FK so "is this product
-- GI-certified" is a deterministic lookup, not a string match. Both columns
-- are nullable: not every product/artisan is tied to a registered GI, and
-- existing rows are backfilled on a best-effort basis below.

alter table products add column if not exists gi_product_id uuid references gi_products(id);
alter table artisans add column if not exists gi_product_id uuid references gi_products(id);

create index if not exists products_gi_product_id_idx on products (gi_product_id);
create index if not exists artisans_gi_product_id_idx on artisans (gi_product_id);

-- Best-effort backfill: match existing free-text gi_tag/state onto
-- gi_products by (gi_tag, state). Rows that don't match cleanly are left
-- null rather than guessed — the verification engine treats null as
-- "not verified", not as an error.
update products p
set gi_product_id = g.id
from gi_products g
where p.gi_product_id is null
  and p.gi_tag is not null
  and p.state is not null
  and lower(trim(p.gi_tag)) = lower(trim(g.gi_tag))
  and lower(trim(p.state)) = lower(trim(g.state));

update artisans a
set gi_product_id = g.id
from gi_products g
where a.gi_product_id is null
  and a.gi_product is not null
  and lower(trim(a.gi_product)) = lower(trim(g.name))
  and lower(trim(a.state)) = lower(trim(g.state));
