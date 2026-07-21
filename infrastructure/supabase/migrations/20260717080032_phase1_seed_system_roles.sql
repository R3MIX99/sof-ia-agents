insert into public.roles (organization_id, name, permissions, is_system_role)
select null, v.name, v.permissions, true
from (
  values
    ('admin', '{"organization:manage": true, "members:manage": true, "widgets:manage": true, "billing:view": true}'::jsonb),
    ('member', '{"widgets:manage": true}'::jsonb)
) as v(name, permissions)
where not exists (
  select 1 from public.roles r where r.is_system_role and r.name = v.name
);
