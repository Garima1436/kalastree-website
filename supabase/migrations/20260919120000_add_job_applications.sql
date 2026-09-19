-- Career applications, stored so admins can review them in /admin/careers/applications.
-- Row-level security is on with NO policies: nothing can read or write these rows
-- except the server's service key (used only by the application form route and the
-- admin API after an admin check).
create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references job_openings(id) on delete set null,
  role text not null,
  name text not null,
  email text not null,
  phone text not null,
  location text not null,
  link text,
  message text not null,
  resume_path text,
  resume_name text,
  status text not null default 'new' check (status in ('new', 'shortlisted', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists job_applications_created_idx on job_applications (created_at desc);
create index if not exists job_applications_job_idx on job_applications (job_id);

alter table job_applications enable row level security;

-- Private bucket for resumes (4 MB cap). No storage policies are created, so only
-- the service key can upload or download; admins get short-lived signed links.
insert into storage.buckets (id, name, public, file_size_limit)
values ('resumes', 'resumes', false, 4194304)
on conflict (id) do nothing;
