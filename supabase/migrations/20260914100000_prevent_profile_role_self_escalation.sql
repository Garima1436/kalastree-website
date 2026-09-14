-- SECURITY FIX: any signed-in user could set their own profiles.role to
-- 'admin' directly (RLS allowed self-updates to the profile row without
-- excluding the role column), which defeats every admin-only check in the
-- app since they all trust profiles.role. Verified live with a throwaway
-- test account before writing this fix.
--
-- The legitimate role-change path (an admin promoting another user via
-- /api/admin/users) already writes through the service_role key and
-- already blocks self-promotion at the app layer, so this only needs to
-- close the direct-database gap: block any role change that isn't made
-- by service_role (which bypasses RLS but NOT triggers).

create or replace function prevent_role_self_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role and current_user <> 'service_role' then
    raise exception 'role changes must go through an admin action';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_role_self_escalation on profiles;
create trigger trg_prevent_role_self_escalation
  before update on profiles
  for each row
  execute function prevent_role_self_escalation();
