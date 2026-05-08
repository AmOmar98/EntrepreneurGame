create or replace function public.has_role(_role app_role)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('mentor','reviewer','committee_member','eic_admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.founder_kyc enable row level security;
alter table public.project_holder_kyc enable row level security;
alter table public.bootcamp_deliverables enable row level security;
alter table public.missions enable row level security;
alter table public.submissions enable row level security;
alter table public.evidence enable row level security;
alter table public.coach_assignments enable row level security;
alter table public.deliverables enable row level security;
alter table public.bonus_events enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.startup_activity enable row level security;
alter table public.committees enable row level security;
alter table public.committee_dossiers enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles_self_or_staff_select"
on public.profiles for select
using (id = auth.uid() or public.is_staff());

create policy "projects_member_or_staff_select"
on public.projects for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = id and pm.user_id = auth.uid()
  )
);

create policy "projects_staff_insert"
on public.projects for insert
with check (public.has_role('eic_admin') or public.has_role('mentor'));

create policy "members_same_project_or_staff_select"
on public.project_members for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members self_pm
    where self_pm.project_id = project_id and self_pm.user_id = auth.uid()
  )
);

create policy "founder_kyc_self_or_staff_select"
on public.founder_kyc for select
using (user_id = auth.uid() or public.is_staff());

create policy "founder_kyc_self_insert"
on public.founder_kyc for insert
with check (user_id = auth.uid() or public.is_staff());

create policy "founder_kyc_self_or_staff_update"
on public.founder_kyc for update
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

create policy "project_holder_kyc_member_or_staff_select"
on public.project_holder_kyc for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "project_holder_kyc_member_insert"
on public.project_holder_kyc for insert
with check (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "project_holder_kyc_member_or_staff_update"
on public.project_holder_kyc for update
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
)
with check (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "bootcamp_deliverables_all_authenticated_select"
on public.bootcamp_deliverables for select
using (auth.role() = 'authenticated');

create policy "bootcamp_deliverables_staff_update"
on public.bootcamp_deliverables for update
using (public.is_staff())
with check (public.is_staff());

create policy "missions_all_authenticated_select"
on public.missions for select
using (auth.role() = 'authenticated');

create policy "submissions_member_or_staff_select"
on public.submissions for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "submissions_project_member_insert"
on public.submissions for insert
with check (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "submissions_reviewer_update"
on public.submissions for update
using (public.has_role('reviewer') or public.has_role('eic_admin'))
with check (public.has_role('reviewer') or public.has_role('eic_admin'));

create policy "evidence_member_or_staff_select"
on public.evidence for select
using (
  public.is_staff()
  or exists (
    select 1
    from public.submissions s
    join public.project_members pm on pm.project_id = s.project_id
    where s.id = submission_id and pm.user_id = auth.uid()
  )
);

create policy "coach_assignments_staff_or_member_select"
on public.coach_assignments for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "coach_assignments_admin_insert"
on public.coach_assignments for insert
with check (public.has_role('eic_admin'));

create policy "deliverables_member_or_staff_select"
on public.deliverables for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "deliverables_project_member_insert"
on public.deliverables for insert
with check (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "deliverables_staff_update"
on public.deliverables for update
using (public.is_staff())
with check (public.is_staff());

create policy "bonus_events_member_or_staff_select"
on public.bonus_events for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "bonus_events_project_member_insert"
on public.bonus_events for insert
with check (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "bonus_events_staff_update"
on public.bonus_events for update
using (public.is_staff())
with check (public.is_staff());

create policy "xp_ledger_member_or_staff_select"
on public.xp_ledger for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "startup_activity_member_or_staff_select"
on public.startup_activity for select
using (
  public.is_staff()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

create policy "committees_staff_select"
on public.committees for select
using (public.is_staff());

create policy "committee_dossiers_staff_select"
on public.committee_dossiers for select
using (public.is_staff());

create policy "audit_admin_select"
on public.audit_log for select
using (public.has_role('eic_admin'));
