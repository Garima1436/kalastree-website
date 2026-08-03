-- Subcategory refinement within the 4 top-level product categories
-- (textile, handicraft, agricultural, food). See SUBCATEGORY_META in
-- src/lib/types.ts for the allowed values per category.

alter table products add column if not exists subcategory text;

create index if not exists products_subcategory_idx on products (subcategory);
