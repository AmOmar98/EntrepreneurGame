-- ============================================================================
-- Verification probe F-16-01 — emits NOTICE rows for table_privileges on
-- public.evaluation_comments. No DDL effect, fully idempotent.
-- ============================================================================
do $$
declare
  r record;
begin
  raise notice '--- F-16-01 verify: information_schema.table_privileges ---';
  for r in
    select grantee, privilege_type
      from information_schema.table_privileges
     where table_schema = 'public'
       and table_name = 'evaluation_comments'
       and grantee in ('authenticated', 'service_role')
     order by grantee, privilege_type
  loop
    raise notice 'grantee=% privilege=%', r.grantee, r.privilege_type;
  end loop;

  raise notice '--- F-16-01 verify: pg_default_acl for schema public ---';
  for r in
    select defaclrole::regrole::text as role_name,
           defaclobjtype as obj_type,
           defaclacl::text as acl
      from pg_default_acl
     where defaclnamespace = 'public'::regnamespace
     order by role_name, obj_type
  loop
    raise notice 'role=% obj_type=% acl=%', r.role_name, r.obj_type, r.acl;
  end loop;
end $$;
