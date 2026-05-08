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
