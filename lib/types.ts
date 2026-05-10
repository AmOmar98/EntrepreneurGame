// Entrepreneur Game - TS domain types (single source of truth, mirrors PG enums in database/schema.sql).

// ============================================================================
// Enums (string-literal unions matching Postgres enums)
// ============================================================================

export type AppRole = "player" | "mentor" | "game_master";

export type PlayerStatus = "active" | "eliminated" | "completed";

export type TeamRole = "owner" | "co_founder" | "contributor";

export type LevelId =
  | "L0_diagnostic"
  | "L1_problem"
  | "L2_solution"
  | "L3_market"
  | "L4_business_model"
  | "L5_pitch"
  | "L6_traction"
  | "L7_alumni";

export type MissionKind = "atelier" | "session" | "presentation" | "pitch" | "admin";

export type SubmissionKind = "proof_url" | "proof_text";

export type SubmissionStatus =
  | "draft"
  | "submitted_v1"
  | "feedback_received"
  | "submitted_v2"
  | "validated"
  | "rejected";

export type Verdict = "validate_v1" | "request_v2" | "validate_v2" | "reject";

// ============================================================================
// Reference / catalog primitives
// ============================================================================

export type Event = {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string;
  resultsPublishedAt: string | null;
};

export type Level = {
  id: LevelId;
  ord: number;
  label: string;
  description: string;
};

export type Mission = {
  id: string;
  eventId: string;
  levelId: LevelId;
  ord: number;
  kind: MissionKind;
  title: string;
  scheduledAt: string | null;
};

export type RubricCriterion = {
  key: string;
  label: string;
  max: number;
};

export type DeliverableTemplate = {
  id: string;
  missionId: string;
  slug: string;
  title: string;
  description: string;
  rubric: RubricCriterion[];
  maxScore: number;
  ord: number;
};

export type Cohort = {
  id: string;
  eventId: string;
  slug: string;
  name: string;
};

// ============================================================================
// Identity / membership primitives
// ============================================================================

export type Profile = {
  userId: string;
  appRole: AppRole;
  fullName: string | null;
  email: string | null;
};

export type Player = {
  id: string;
  cohortId: string;
  slug: string;
  name: string;
  idea: string | null;
  currentLevel: LevelId;
  status: PlayerStatus;
  scoreProject: number;
  scoreEngagement: number;
  onboardedAt: string | null;
};

export type PlayerMember = {
  id: string;
  playerId: string;
  userId: string;
  role: AppRole;
  teamRole: TeamRole;
  joinedAt: string;
};

// ============================================================================
// Submission / evaluation aggregates
// ============================================================================

export type SubmissionBase = {
  id: string;
  playerId: string;
  deliverableTemplateId: string;
  kind: SubmissionKind;
  proofUrl: string | null;
  proofText: string | null;
  status: SubmissionStatus;
  submittedBy: string;
  submittedAt: string;
};

// Discriminated union on `version` (D-07: manual definition keeps V1/V2 distinction).
export type Submission =
  | (SubmissionBase & { version: 1 })
  | (SubmissionBase & { version: 2 });

export type Evaluation = {
  id: string;
  submissionId: string;
  evaluatorId: string;
  scores: Record<string, number>;
  totalScore: number;
  feedback: string;
  verdict: Verdict;
};

export type PitchScore = {
  id: string;
  eventId: string;
  playerId: string;
  jurorId: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  totalScore: number;
};

// ============================================================================
// Bonus events (T3X-EXPANSION wave 2 — D-02 / D-03)
// Mirror supabase/migrations/20260510170000_bonus_events_recreate.sql
// R1 preserved : multiplierFactor stocke en TS, JAMAIS rendu Player en chiffre
// (UI presents qualitative "Boost actif" badge — cf. Plan 08).
// ============================================================================

export type BonusType =
  | "bonus_verbatims_terrain"
  | "bonus_dev_plan"
  | "bonus_prototype_draft";

export type BonusStatus = "draft" | "submitted" | "validated" | "rejected";

export type MultiplierScope = "next_deliverable" | "rest_of_event";

export type BonusEvent = {
  id: string;
  projectId: string;
  type: BonusType;
  title: string;
  description: string;
  docUrl: string | null;
  status: BonusStatus;
  multiplierFactor: number; // [1.00..3.00] — R1: never display as number to Player
  multiplierScope: MultiplierScope;
  multiplierConsumedAt: string | null; // timestamptz when applied (next_deliverable scope)
  claimedAt: string;
  claimedBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  feedback: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Reference defaults for each BonusType — D-03 mechanism.
 * Server action claimBonusEventFlow (Plan 06) consults this map to set the
 * initial multiplier_factor and scope when a Player submits a claim.
 *
 * The values can be overridden per-claim by GameMaster via app/admin UI
 * (out-of-scope for this phase — runtime mutation through reviewBonusEventFlow
 * still respects the CHECK constraint [1.00..3.00] in DB).
 */
export const BONUS_DEFAULTS: Record<
  BonusType,
  { multiplierFactor: number; scope: MultiplierScope; titleFr: string }
> = {
  bonus_verbatims_terrain: {
    multiplierFactor: 1.5,
    scope: "next_deliverable",
    titleFr: "3 verbatims terrain agriculteurs",
  },
  bonus_dev_plan: {
    multiplierFactor: 1.5,
    scope: "next_deliverable",
    titleFr: "Plan de developpement (roadmap technique)",
  },
  bonus_prototype_draft: {
    multiplierFactor: 2.0,
    scope: "next_deliverable",
    titleFr: "Prototype draft (croquis / wireframe / photo)",
  },
};

/**
 * Global cap on multiplier_factor — D-03 anti-stacking abuse.
 * lib/score.ts Plan 07 uses Math.min(BONUS_MULTIPLIER_CAP, applicableFactor)
 * to enforce.
 */
export const BONUS_MULTIPLIER_CAP = 3.0;

// ============================================================================
// MoSCoW Kanban cards (T3X-EXPANSION wave 2 — D-04)
// Mirror supabase/migrations/20260510170100_moscow_cards.sql
// ============================================================================

export type MoscowBucket = "must" | "should" | "could" | "wont";

export type MoscowCard = {
  id: string;
  projectId: string;
  deliverableTemplateId: string;
  bucket: MoscowBucket;
  ord: number;
  feature: string;
  pourquoi: string;
  contrainte: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};
