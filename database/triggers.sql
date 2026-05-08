create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_updated before update on profiles
  for each row execute function tg_set_updated_at();

create trigger trg_projects_updated before update on projects
  for each row execute function tg_set_updated_at();

create trigger trg_subs_updated before update on submissions
  for each row execute function tg_set_updated_at();

create trigger trg_founder_kyc_updated before update on founder_kyc
  for each row execute function tg_set_updated_at();

create trigger trg_project_holder_kyc_updated before update on project_holder_kyc
  for each row execute function tg_set_updated_at();

create trigger trg_bootcamp_deliverables_updated before update on bootcamp_deliverables
  for each row execute function tg_set_updated_at();

create or replace function public.tg_on_submission_validated()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_xp int;
begin
  if new.status = 'validated' and (old.status is distinct from 'validated') then
    select xp into v_xp from missions where id = new.mission_id;
    insert into xp_ledger(project_id, submission_id, delta, reason)
      values (new.project_id, new.id, v_xp, 'mission validated: ' || new.mission_id);
    update projects set total_xp = total_xp + v_xp where id = new.project_id;
  end if;
  return new;
end $$;

create trigger trg_submission_validated after update on submissions
  for each row execute function tg_on_submission_validated();

create trigger trg_deliverables_updated before update on deliverables
  for each row execute function tg_set_updated_at();

create trigger trg_bonus_events_updated before update on bonus_events
  for each row execute function tg_set_updated_at();

create or replace function public.tg_on_deliverable_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into xp_ledger(project_id, source_type, source_id, xp_state, checkpoint, counts_toward_stage, delta, reason)
    values (new.project_id, 'deliverable', new.id::text, 'pending', new.checkpoint, false, new.pending_xp, 'deliverable submitted: ' || new.title);
  insert into startup_activity(project_id, actor, action, checkpoint, metadata)
    values (new.project_id, new.submitted_by, 'deliverable_submitted', new.checkpoint, jsonb_build_object('title', new.title));
  return new;
end $$;

create trigger trg_deliverable_submitted after insert on deliverables
  for each row execute function tg_on_deliverable_submitted();

create or replace function public.tg_on_deliverable_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    insert into xp_ledger(project_id, source_type, source_id, xp_state, checkpoint, counts_toward_stage, delta, reason)
      values (new.project_id, 'deliverable', new.id::text, 'confirmed', new.checkpoint, true, new.base_xp, 'deliverable accepted: ' || new.title);
    update projects set total_xp = total_xp + new.base_xp where id = new.project_id;
    insert into startup_activity(project_id, actor, action, checkpoint, metadata)
      values (new.project_id, new.reviewed_by, 'deliverable_accepted', new.checkpoint, jsonb_build_object('title', new.title, 'xp', new.base_xp));
  end if;
  return new;
end $$;

create trigger trg_deliverable_accepted after update on deliverables
  for each row execute function tg_on_deliverable_accepted();

create or replace function public.tg_on_bonus_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    insert into xp_ledger(project_id, source_type, source_id, xp_state, checkpoint, counts_toward_stage, delta, reason)
      values (new.project_id, 'bonus_event', new.id::text, 'confirmed', new.checkpoint, true, new.counts_toward_stage, 'bonus accepted: ' || new.title);
    if new.prestige_xp > 0 then
      insert into xp_ledger(project_id, source_type, source_id, xp_state, checkpoint, counts_toward_stage, delta, reason)
        values (new.project_id, 'bonus_event', new.id::text, 'prestige', new.checkpoint, false, new.prestige_xp, 'bonus prestige: ' || new.title);
    end if;
    update projects set total_xp = total_xp + new.counts_toward_stage where id = new.project_id;
    insert into startup_activity(project_id, actor, action, checkpoint, metadata)
      values (new.project_id, new.reviewed_by, 'bonus_accepted', new.checkpoint, jsonb_build_object('title', new.title, 'xp', new.awarded_xp));
  end if;
  return new;
end $$;

create trigger trg_bonus_accepted after update on bonus_events
  for each row execute function tg_on_bonus_accepted();
