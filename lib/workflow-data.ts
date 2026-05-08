import {
  type BonusEvent,
  type BonusStatus,
  type BonusType,
  type BootcampDay,
  type BootcampDeliverable,
  type BootcampDeliverableKind,
  type Checkpoint,
  type Deliverable,
  type DeliverableStatus,
  type FounderKyc,
  type FounderKycStatus,
  type ProjectHolderKyc,
  type Stage,
  type Startup,
  activity,
  bonusEvents,
  bootcampDeliverables,
  deliverables,
  founderKyc,
  getStartup,
  projectActivity,
  projectBonuses,
  projectDeliverables,
  projectHolderKyc,
  startups,
} from "@/lib/data";
import { createClient } from "@/utils/supabase/server";

type DbProject = {
  id: string;
  name: string;
  slug: string;
  cohort: string;
  summary: string | null;
  sector: string | null;
  maturity_phase: Startup["maturityPhase"];
  checkpoint_focus: Checkpoint;
  stage: Stage;
  status: Startup["status"];
  health_status: Startup["healthStatus"];
  next_action: string | null;
  coach_notes: string | null;
  total_xp: number;
  created_at: string;
  updated_at?: string;
};

type DbDeliverable = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  doc_url: string;
  status: DeliverableStatus;
  checkpoint: Checkpoint;
  stage: Stage;
  pending_xp: number;
  base_xp: number;
  submitted_at: string;
  review_notes: string | null;
  mailto_opened_at: string | null;
};

type DbBonus = {
  id: string;
  project_id: string;
  bonus_type: BonusType;
  title: string;
  proof_url: string;
  quantity: number;
  status: BonusStatus;
  checkpoint: Checkpoint;
  stage: Stage;
  claimed_xp: number;
  awarded_xp: number;
  counts_toward_stage: number;
  prestige_xp: number;
  submitted_at: string;
  review_notes: string | null;
};

type DbFounderKyc = {
  user_id: string;
  avatar_url: string | null;
  phone: string;
  cin_or_passport: string;
  school_or_org: string;
  role_title: string;
  status: FounderKycStatus;
};

type DbProjectHolderKyc = {
  project_id: string;
  logo_url: string;
  legal_name: string;
  project_holder_type: ProjectHolderKyc["projectHolderType"];
  idea_one_liner: string;
  problem_statement: string;
  target_customer: string;
  status: FounderKycStatus;
};

type DbBootcampDeliverable = {
  id: string;
  day: BootcampDay;
  start_time: string;
  end_time: string;
  duration: string;
  title: string;
  objective: string;
  expected_output: string;
  checkpoint: Checkpoint;
  stage: Stage;
  kind: BootcampDeliverableKind;
  xp: number;
  is_active: boolean;
  is_required: boolean;
  game_master_note: string | null;
};

function mapProject(row: DbProject, fallback?: Startup): Startup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    cohort: row.cohort,
    summary: row.summary ?? fallback?.summary ?? "",
    sector: row.sector ?? fallback?.sector ?? "",
    maturityPhase: row.maturity_phase,
    checkpointFocus: row.checkpoint_focus,
    stage: row.stage,
    status: row.status,
    healthStatus: row.health_status,
    nextAction: row.next_action ?? "",
    coachNotes: row.coach_notes ?? "",
    totalXp: row.total_xp,
    createdAt: row.created_at,
    lastActivity: row.updated_at ?? row.created_at,
    team: fallback?.team ?? [],
    coach: fallback?.coach ?? {
      id: "usr-eic",
      fullName: "EIC Office",
      email: "eic@uemf.ma",
      role: "eic_admin",
    },
  };
}

function mapDeliverable(row: DbDeliverable): Deliverable {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    docUrl: row.doc_url,
    status: row.status,
    checkpoint: row.checkpoint,
    stage: row.stage,
    pendingXp: row.pending_xp,
    baseXp: row.base_xp,
    submittedBy: "",
    submittedAt: row.submitted_at,
    reviewNotes: row.review_notes ?? undefined,
    mailtoOpenedAt: row.mailto_opened_at ?? undefined,
  };
}

function mapBonus(row: DbBonus): BonusEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.bonus_type,
    title: row.title,
    proofUrl: row.proof_url,
    quantity: row.quantity,
    status: row.status,
    checkpoint: row.checkpoint,
    stage: row.stage,
    claimedXp: row.claimed_xp,
    awardedXp: row.awarded_xp,
    countsTowardStage: row.counts_toward_stage,
    prestigeXp: row.prestige_xp,
    submittedBy: "",
    submittedAt: row.submitted_at,
    reviewNotes: row.review_notes ?? undefined,
  };
}

function mapFounderKyc(row: DbFounderKyc, fallback?: FounderKyc): FounderKyc {
  return {
    userId: row.user_id,
    avatarUrl: row.avatar_url ?? fallback?.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${row.user_id}`,
    phone: row.phone,
    cinOrPassport: row.cin_or_passport,
    schoolOrOrg: row.school_or_org,
    roleTitle: row.role_title,
    status: row.status,
  };
}

function mapProjectHolderKyc(row: DbProjectHolderKyc): ProjectHolderKyc {
  return {
    projectId: row.project_id,
    logoUrl: row.logo_url,
    legalName: row.legal_name,
    projectHolderType: row.project_holder_type,
    ideaOneLiner: row.idea_one_liner,
    problemStatement: row.problem_statement,
    targetCustomer: row.target_customer,
    status: row.status,
  };
}

function mapBootcampDeliverable(row: DbBootcampDeliverable): BootcampDeliverable {
  return {
    id: row.id,
    day: row.day,
    start: row.start_time,
    end: row.end_time,
    duration: row.duration,
    title: row.title,
    objective: row.objective,
    expectedOutput: row.expected_output,
    checkpoint: row.checkpoint,
    stage: row.stage,
    kind: row.kind,
    xp: row.xp,
    isActive: row.is_active,
    isRequired: row.is_required,
    gameMasterNote: row.game_master_note ?? "",
  };
}

function groupBootcampByDay(items: BootcampDeliverable[]) {
  return [
    { day: "day_1" as const, label: "Jour 1", items: items.filter((item) => item.day === "day_1") },
    { day: "day_2" as const, label: "Jour 2", items: items.filter((item) => item.day === "day_2") },
    { day: "day_3" as const, label: "Jour 3", items: items.filter((item) => item.day === "day_3") },
  ];
}

export async function getStartupWorkflow(slug: string) {
  const fallback = getStartup(slug);
  const supabase = await createClient();
  if (!supabase) {
    return {
      startup: fallback,
      deliverables: fallback ? projectDeliverables(fallback.id) : [],
      bonuses: fallback ? projectBonuses(fallback.id) : [],
      activity: fallback ? projectActivity(fallback.id) : [],
      source: "demo" as const,
    };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<DbProject>();

  const startup = project ? mapProject(project, fallback) : fallback;
  if (!startup) return { startup: undefined, deliverables: [], bonuses: [], activity: [], source: "supabase" as const };

  const [{ data: deliverableRows }, { data: bonusRows }] = await Promise.all([
    supabase.from("deliverables").select("*").eq("project_id", startup.id).order("submitted_at", { ascending: false }),
    supabase.from("bonus_events").select("*").eq("project_id", startup.id).order("submitted_at", { ascending: false }),
  ]);

  return {
    startup,
    deliverables: deliverableRows?.map((row) => mapDeliverable(row as DbDeliverable)) ?? projectDeliverables(startup.id),
    bonuses: bonusRows?.map((row) => mapBonus(row as DbBonus)) ?? projectBonuses(startup.id),
    activity: projectActivity(startup.id),
    source: "supabase" as const,
  };
}

export async function getOnboardingWorkflow(projectId: string, userId: string) {
  const fallbackFounder = founderKyc.find((item) => item.userId === userId);
  const fallbackProject = projectHolderKyc.find((item) => item.projectId === projectId);
  const supabase = await createClient();

  if (!supabase) {
    return { founder: fallbackFounder, project: fallbackProject, source: "demo" as const };
  }

  const [{ data: founderRow }, { data: projectRow }] = await Promise.all([
    supabase.from("founder_kyc").select("*").eq("user_id", userId).maybeSingle<DbFounderKyc>(),
    supabase.from("project_holder_kyc").select("*").eq("project_id", projectId).maybeSingle<DbProjectHolderKyc>(),
  ]);

  return {
    founder: founderRow ? mapFounderKyc(founderRow, fallbackFounder) : fallbackFounder,
    project: projectRow ? mapProjectHolderKyc(projectRow) : fallbackProject,
    source: "supabase" as const,
  };
}

export async function getBootcampDeliverables() {
  const supabase = await createClient();
  if (!supabase) return { quests: bootcampDeliverables, source: "demo" as const };

  const { data, error } = await supabase
    .from("bootcamp_deliverables")
    .select("*")
    .order("day", { ascending: true })
    .order("start_time", { ascending: true });

  if (error || !data?.length) return { quests: bootcampDeliverables, source: "demo" as const };

  return {
    quests: data.map((row) => mapBootcampDeliverable(row as DbBootcampDeliverable)),
    source: "supabase" as const,
  };
}

export async function getActiveBootcampDeliverables() {
  const { quests, source } = await getBootcampDeliverables();
  return { quests: quests.filter((quest) => quest.isActive), source };
}

export async function getBootcampByDay() {
  const { quests, source } = await getBootcampDeliverables();
  return { days: groupBootcampByDay(quests), source };
}

export async function getCohortWorkflow() {
  const supabase = await createClient();
  if (!supabase) return { startups, deliverables, bonuses: bonusEvents, activity, source: "demo" as const };

  const [{ data: projectRows }, { data: deliverableRows }, { data: bonusRows }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("deliverables").select("*").order("submitted_at", { ascending: false }),
    supabase.from("bonus_events").select("*").order("submitted_at", { ascending: false }),
  ]);

  const mappedStartups =
    projectRows?.map((row) => {
      const fallback = startups.find((startup) => startup.id === (row as DbProject).id || startup.slug === (row as DbProject).slug);
      return mapProject(row as DbProject, fallback);
    }) ?? startups;

  return {
    startups: mappedStartups,
    deliverables: deliverableRows?.map((row) => mapDeliverable(row as DbDeliverable)) ?? deliverables,
    bonuses: bonusRows?.map((row) => mapBonus(row as DbBonus)) ?? bonusEvents,
    activity,
    source: "supabase" as const,
  };
}
