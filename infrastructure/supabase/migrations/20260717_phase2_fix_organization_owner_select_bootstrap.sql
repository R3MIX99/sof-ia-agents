-- INSERT ... RETURNING exige que la fila resultante también satisfaga la
-- política de SELECT. En el momento de crear una organización todavía no
-- existe la fila de organization_members del propietario, por lo que
-- is_organization_member(id) es falso y el INSERT con .select() fallaba
-- con "new row violates row-level security policy". El propietario debe
-- poder ver siempre su propia organización, incluso antes de que exista
-- esa membresía.
alter policy "organizations_select_members" on public.organizations
  using (
    public.is_organization_member(id)
    or owner_id = (select auth.uid())
  );
