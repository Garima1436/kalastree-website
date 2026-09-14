-- Fixes a bug in the previous migration (20260914100000): it checked
-- `current_user <> 'service_role'`, but Supabase's PostgREST layer does
-- not switch the Postgres session role to a literal 'service_role' user —
-- it keeps the connection as 'authenticator' and exposes the JWT's role
-- claim instead. That made current_user never equal 'service_role', so
-- the trigger blocked the legitimate service_role-authenticated update
-- path too (verified live: the real admin-promotion write started
-- failing after the first migration). auth.role() is Supabase's documented
-- helper for reading that JWT role claim and is what RLS policies use for
-- this exact check — using it here instead.

create or replace function prevent_role_self_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role changes must go through an admin action';
  end if;
  return new;
end;
$$ language plpgsql security definer;
