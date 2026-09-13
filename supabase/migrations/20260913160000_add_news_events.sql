-- News & Events entries (press mentions, awards, announcements) shown on
-- the public "News & Events" page under About Us — admin-managed like
-- gi_products/artisans, no RLS policy defined here (consistent with the
-- rest of this schema).

create table if not exists news_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  body text,
  image_url text,
  external_link text,
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists news_events_published_at_idx on news_events (published_at desc);
