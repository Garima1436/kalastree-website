-- Generic admin-editable key/value site settings (e.g. the WhatsApp contact
-- number for the floating WhatsApp button) — lets these be changed from the
-- admin panel without a code deploy. Read via supabaseAdmin (service role)
-- from server components/routes only, same as other admin-managed tables in
-- this project — no RLS policy is defined here, consistent with how the
-- rest of the schema in this repo is managed.

create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into site_settings (key, value)
values ('whatsapp_number', null)
on conflict (key) do nothing;
