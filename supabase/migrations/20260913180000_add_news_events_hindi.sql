-- Hindi counterparts for News & Events content, matching the title/body_hi
-- pattern already used on gi_products (name_hi, tagline_hi, etc.).
alter table news_events add column if not exists title_hi text;
alter table news_events add column if not exists body_hi text;
