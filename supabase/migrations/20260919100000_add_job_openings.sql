-- Job openings listed on the public Careers page, managed by admins from
-- the admin panel (/admin/careers).
--
-- Unlike most tables in this repo, row-level security is ENABLED here, on
-- purpose: with no INSERT/UPDATE/DELETE policy defined, nobody using the
-- public (anon) or a signed-in user's key can write to this table at all.
-- Only the server's service-role key can (it bypasses RLS), and that is used
-- solely by /api/admin/careers after it has verified the caller is an admin.
-- So "only admins can list open positions" holds at the database level, not
-- just in application code.

create table if not exists job_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_hi text,
  location text not null,
  employment_type text not null
    check (employment_type in ('full_time', 'part_time', 'internship', 'contract')),
  description text not null,
  description_hi text,
  -- Lets an admin hide a role without deleting it (e.g. filled, or paused).
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists job_openings_active_created_idx
  on job_openings (is_active, created_at desc);

alter table job_openings enable row level security;

-- Anyone may read roles that are currently live; hidden ones stay private.
drop policy if exists "Public can read active job openings" on job_openings;
create policy "Public can read active job openings"
  on job_openings for select
  using (is_active);
