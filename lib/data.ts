import {
  Award,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FolderKanban,
  Gamepad2,
  Home,
  Mail,
  Map,
  Rocket,
  ServerCog,
  ShieldCheck,
  Target,
  Trophy,
  Users,
} from "lucide-react";

export type Stage =
  | "L0_diagnostic"
  | "L1_problem"
  | "L2_solution"
  | "L3_traction"
  | "L4_committee"
  | "L5_alumni";

export type Checkpoint = "make_it" | "sell_it" | "look_after_it";
export type MaturityPhase = "ideation" | "pre_incubation" | "incubation";
export type DeliverableStatus = "draft" | "submitted" | "reviewed" | "needs_changes" | "accepted";
export type BonusStatus = "submitted" | "needs_changes" | "accepted" | "rejected";
export type BonusType =
  | "prospect_interviews"
  | "waitlist"
  | "demo_ready"
  | "first_sale"
  | "additional_sales"
  | "pilot_commitment"
  | "retention_followup";

export type TeamRole = "owner" | "co_founder" | "contributor";
export type AppRole = "founder" | "mentor" | "reviewer" | "committee_member" | "eic_admin";

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
};

export type TeamMember = {
  userId: string;
  fullName: string;
  email: string;
  roleInProject: TeamRole;
};

export type Startup = {
  id: string;
  name: string;
  slug: string;
  cohort: string;
  summary: string;
  sector: string;
  maturityPhase: MaturityPhase;
  checkpointFocus: Checkpoint;
  stage: Stage;
  status: "active" | "paused" | "dropped" | "graduated";
  healthStatus: "strong" | "watch" | "blocked";
  nextAction: string;
  coachNotes: string;
  totalXp: number;
  createdAt: string;
  lastActivity: string;
  team: TeamMember[];
  coach: Profile;
};

export type Deliverable = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  docUrl: string;
  status: DeliverableStatus;
  checkpoint: Checkpoint;
  stage: Stage;
  pendingXp: number;
  baseXp: number;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  mailtoOpenedAt?: string;
};

export type BonusEvent = {
  id: string;
  projectId: string;
  type: BonusType;
  title: string;
  proofUrl: string;
  quantity: number;
  status: BonusStatus;
  checkpoint: Checkpoint;
  stage: Stage;
  claimedXp: number;
  awardedXp: number;
  countsTowardStage: number;
  prestigeXp: number;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

export type ActivityItem = {
  id: string;
  projectId: string;
  action: string;
  actor: string;
  checkpoint: Checkpoint;
  createdAt: string;
  metadata: string;
};

export type JourneyPhaseId =
  | "entering"
  | "onboarding"
  | "bootcamp"
  | "validation"
  | "committee"
  | "post_bootcamp";

export type JourneyPhase = {
  id: JourneyPhaseId;
  label: string;
  audience: string;
  goal: string;
  founderAction: string;
  coachAction: string;
  eicAction: string;
  output: string;
  checkpoint?: Checkpoint;
};

export type FounderKycStatus = "missing" | "partial" | "complete" | "verified";

export type FounderKyc = {
  userId: string;
  avatarUrl: string;
  phone: string;
  cinOrPassport: string;
  schoolOrOrg: string;
  roleTitle: string;
  status: FounderKycStatus;
};

export type ProjectHolderKyc = {
  projectId: string;
  logoUrl: string;
  legalName: string;
  projectHolderType: "student" | "researcher" | "alumni" | "external";
  ideaOneLiner: string;
  problemStatement: string;
  targetCustomer: string;
  status: FounderKycStatus;
};

export type BootcampDay = "day_1" | "day_2" | "day_3";
export type BootcampDeliverableKind = "session" | "atelier" | "presentation" | "pitch" | "admin";

export type BootcampDeliverable = {
  id: string;
  day: BootcampDay;
  start: string;
  end: string;
  duration: string;
  title: string;
  objective: string;
  expectedOutput: string;
  checkpoint: Checkpoint;
  stage: Stage;
  kind: BootcampDeliverableKind;
  xp: number;
  isActive: boolean;
  isRequired: boolean;
  gameMasterNote: string;
};

export const stages: { id: Stage; label: string; targetXp: number }[] = [
  { id: "L0_diagnostic", label: "L0 Diagnostic", targetXp: 0 },
  { id: "L1_problem", label: "L1 Problem", targetXp: 100 },
  { id: "L2_solution", label: "L2 Solution", targetXp: 250 },
  { id: "L3_traction", label: "L3 Traction", targetXp: 600 },
  { id: "L4_committee", label: "L4 Committee", targetXp: 800 },
  { id: "L5_alumni", label: "L5 Alumni", targetXp: 1000 },
];

export const checkpoints: {
  id: Checkpoint;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Rocket;
}[] = [
  {
    id: "make_it",
    label: "Make it",
    shortLabel: "Make",
    description: "Problem clarity, prototype, demo readiness, and first user feedback.",
    icon: Rocket,
  },
  {
    id: "sell_it",
    label: "Sell it",
    shortLabel: "Sell",
    description: "Prospects, waitlist, pilot commitments, first sale, and repeated sales.",
    icon: Target,
  },
  {
    id: "look_after_it",
    label: "Look after it",
    shortLabel: "Care",
    description: "Customer follow-up, satisfaction, support, repeat usage, and learning loop.",
    icon: ShieldCheck,
  },
];

export const navItems = [
  { href: "/", label: "Cockpit", icon: Home, roles: ["eic_admin", "mentor", "reviewer"] as AppRole[] },
  { href: "/journey", label: "Journey", icon: Map, roles: ["founder", "mentor", "reviewer", "committee_member", "eic_admin"] as AppRole[] },
  { href: "/onboarding", label: "Onboarding", icon: ClipboardList, roles: ["founder", "mentor", "eic_admin"] as AppRole[] },
  { href: "/startup/atlas-soil", label: "My startup", icon: Rocket, roles: ["founder", "eic_admin"] as AppRole[] },
  { href: "/coach", label: "Coach", icon: Users, roles: ["mentor", "reviewer", "eic_admin"] as AppRole[] },
  { href: "/admin", label: "Admin", icon: BarChart3, roles: ["eic_admin"] as AppRole[] },
  { href: "/admin/startups", label: "Startups", icon: FolderKanban, roles: ["eic_admin"] as AppRole[] },
  { href: "/admin/game", label: "Game master", icon: Gamepad2, roles: ["mentor", "reviewer", "eic_admin"] as AppRole[] },
  { href: "/review", label: "Review queue", icon: ClipboardCheck, roles: ["mentor", "reviewer", "eic_admin"] as AppRole[] },
  { href: "/committee", label: "Committee", icon: Trophy, roles: ["committee_member", "eic_admin"] as AppRole[] },
  { href: "/ops", label: "Ops", icon: ServerCog, roles: ["eic_admin"] as AppRole[] },
  { href: "/mailto", label: "Mailto", icon: Mail, roles: ["founder", "mentor", "reviewer", "eic_admin"] as AppRole[] },
];

export const journeyPhases: JourneyPhase[] = [
  {
    id: "entering",
    label: "Entering",
    audience: "Candidate founder",
    goal: "Capture the idea, founder profile, and cohort fit before bootcamp starts.",
    founderAction: "Complete diagnostic and share one clear problem statement.",
    coachAction: "Triage fit and flag unclear assumptions.",
    eicAction: "Create startup record, founder accounts, and initial maturity phase.",
    output: "Accepted candidate with a startup workspace.",
    checkpoint: "make_it",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    audience: "Accepted team",
    goal: "Pre-bootcamp setup: simple founder profile, logo, and KYC for project holders.",
    founderAction: "Complete founder profile, role, phone, identity reference, project logo, and one-line idea.",
    coachAction: "Check team clarity and flag missing KYC before bootcamp starts.",
    eicAction: "Verify profile completeness and unlock the bootcamp quest board.",
    output: "Verified project holder profile and ready team workspace.",
    checkpoint: "make_it",
  },
  {
    id: "bootcamp",
    label: "Bootcamp",
    audience: "Active startup",
    goal: "Move through Make it, Sell it, and Look after it with proof, not slides.",
    founderAction: "Submit deliverables and bonus claims with HTTPS proof links.",
    coachAction: "Review submissions, request changes, and validate XP.",
    eicAction: "Monitor blockers, attendance, and validation queue.",
    output: "Validated learning, demo, interviews, waitlist, sales, or retention proof.",
    checkpoint: "sell_it",
  },
  {
    id: "validation",
    label: "Validation",
    audience: "Coach and EIC",
    goal: "Turn submitted proof into accepted XP, stage progress, or corrective feedback.",
    founderAction: "React to needs-changes feedback quickly.",
    coachAction: "Accept, reject, or request changes with short notes.",
    eicAction: "Watch SLA, XP distribution, and teams stuck in pending state.",
    output: "Confirmed XP and clean activity history.",
    checkpoint: "sell_it",
  },
  {
    id: "committee",
    label: "Committee",
    audience: "Committee-ready startup",
    goal: "Prepare go/no-go discussion from evidence, not manual slide chasing.",
    founderAction: "Finalize strongest proof and answer coach comments.",
    coachAction: "Curate dossier and highlight risks.",
    eicAction: "Export committee CSV/EML and record decision.",
    output: "Go, no-go, conditional, or deferred decision.",
    checkpoint: "look_after_it",
  },
  {
    id: "post_bootcamp",
    label: "Post-bootcamp",
    audience: "Alumni or follow-up team",
    goal: "Keep useful startups warm through retention, support, repeat usage, and alumni reporting.",
    founderAction: "Submit follow-up, retention, repeat sales, and support learning proof.",
    coachAction: "Check whether the startup still has momentum after the program.",
    eicAction: "Track alumni status, impact, and next support path.",
    output: "Post-bootcamp health and next support decision.",
    checkpoint: "look_after_it",
  },
];

export const founderKyc: FounderKyc[] = [
  {
    userId: "usr-yasmine",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Yasmine%20El%20Idrissi",
    phone: "+212 6 10 20 30 40",
    cinOrPassport: "AA000001",
    schoolOrOrg: "UEMF",
    roleTitle: "CEO / business lead",
    status: "verified",
  },
  {
    userId: "usr-adam",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Adam%20Berrada",
    phone: "+212 6 20 30 40 50",
    cinOrPassport: "AA000002",
    schoolOrOrg: "UEMF",
    roleTitle: "Product lead",
    status: "complete",
  },
  {
    userId: "usr-nour",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Nour%20El%20Fassi",
    phone: "",
    cinOrPassport: "",
    schoolOrOrg: "UEMF",
    roleTitle: "Research support",
    status: "partial",
  },
];

export const projectHolderKyc: ProjectHolderKyc[] = [
  {
    projectId: "prj-atlas",
    logoUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=Atlas%20Soil",
    legalName: "Atlas Soil",
    projectHolderType: "student",
    ideaOneLiner: "Affordable soil diagnostics for small farms before paid pilots.",
    problemStatement: "Small farms lack quick soil insight before investing in crop decisions.",
    targetCustomer: "Small and mid-sized farms around Fes-Meknes.",
    status: "verified",
  },
  {
    projectId: "prj-medina",
    logoUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=Medina%20Pay",
    legalName: "Medina Pay",
    projectHolderType: "student",
    ideaOneLiner: "Simple payment workflow for medina merchants.",
    problemStatement: "Merchants lose sales and tracking because payment remains fragmented.",
    targetCustomer: "Small medina merchants with mixed cash and digital flows.",
    status: "partial",
  },
];

export const bootcampDeliverables: BootcampDeliverable[] = [
  {
    id: "bc-d1-intro-pitch",
    day: "day_1",
    start: "15:30",
    end: "17:00",
    duration: "01:30",
    title: "Introduction et Ice-Breaker",
    objective: "Presentation du programme and 1 min pitch.",
    expectedOutput: "1 min Pitch",
    checkpoint: "make_it",
    stage: "L0_diagnostic",
    kind: "pitch",
    xp: 40,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Warm-up quest. Keep it fast and non-technical.",
  },
  {
    id: "bc-d1-market-study",
    day: "day_1",
    start: "20:30",
    end: "21:00",
    duration: "00:30",
    title: "Session 1 - Etude de marche",
    objective: "Methodologie de l'etude de marche, cartographie marche, positionnement.",
    expectedOutput: "Cartographie Valeur/Prix",
    checkpoint: "make_it",
    stage: "L1_problem",
    kind: "session",
    xp: 60,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Use this to force market framing before solution talk.",
  },
  {
    id: "bc-d1-market-map",
    day: "day_1",
    start: "21:00",
    end: "22:00",
    duration: "01:00",
    title: "Atelier 1",
    objective: "Realiser sa cartographie marche.",
    expectedOutput: "Cartographie marche",
    checkpoint: "make_it",
    stage: "L1_problem",
    kind: "atelier",
    xp: 80,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Deliverable can replace long market study decks.",
  },
  {
    id: "bc-d1-competition",
    day: "day_1",
    start: "22:00",
    end: "22:30",
    duration: "00:30",
    title: "Session 2 - Analyse de la concurrence",
    objective: "Realiser sa grille comparative.",
    expectedOutput: "Grille comparative",
    checkpoint: "make_it",
    stage: "L1_problem",
    kind: "session",
    xp: 60,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Short quest; deactivate if teams already have competitors mapped.",
  },
  {
    id: "bc-d2-compare-presentation",
    day: "day_2",
    start: "10:30",
    end: "11:00",
    duration: "00:30",
    title: "Presentation grille comparative",
    objective: "Present comparative grid and receive coach corrections.",
    expectedOutput: "Grille comparative",
    checkpoint: "make_it",
    stage: "L1_problem",
    kind: "presentation",
    xp: 50,
    isActive: true,
    isRequired: false,
    gameMasterNote: "Good checkpoint for teams that rushed Day 1.",
  },
  {
    id: "bc-d2-persona",
    day: "day_2",
    start: "11:00",
    end: "11:30",
    duration: "00:30",
    title: "Session 3 - Comprendre sa cible",
    objective: "Realiser son personae.",
    expectedOutput: "Fiche personae (1-2)",
    checkpoint: "make_it",
    stage: "L1_problem",
    kind: "session",
    xp: 70,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Founder must name a real target, not a generic segment.",
  },
  {
    id: "bc-d2-environment",
    day: "day_2",
    start: "12:30",
    end: "13:00",
    duration: "00:30",
    title: "Session 4 - Environnement",
    objective: "Comprendre environnement reglementaire/legal and identify opportunities/weaknesses.",
    expectedOutput: "SWOT et PESTEL",
    checkpoint: "make_it",
    stage: "L1_problem",
    kind: "session",
    xp: 70,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Useful risk-control quest for regulated ideas.",
  },
  {
    id: "bc-d2-technical-feasibility",
    day: "day_2",
    start: "13:30",
    end: "15:00",
    duration: "01:30",
    title: "Session 5 - Faisabilite technique + Atelier 5",
    objective: "Description produit/service, ressources techniques, plan de developpement.",
    expectedOutput: "Fiche produit avec plan de developpement, MoSCoW, plan d'implementation/marche",
    checkpoint: "make_it",
    stage: "L2_solution",
    kind: "atelier",
    xp: 150,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Main Make it quest. Can be swapped with a demo-ready quest.",
  },
  {
    id: "bc-d2-financial-feasibility",
    day: "day_2",
    start: "15:00",
    end: "16:30",
    duration: "01:30",
    title: "Session 6 - Faisabilite financiere + Atelier 6",
    objective: "Cout, depenses, seuil de rentabilite, ressources necessaires.",
    expectedOutput: "Fiche des depenses",
    checkpoint: "sell_it",
    stage: "L2_solution",
    kind: "atelier",
    xp: 120,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Bridge toward selling by forcing cost and resource clarity.",
  },
  {
    id: "bc-d2-commercial-feasibility",
    day: "day_2",
    start: "20:30",
    end: "21:00",
    duration: "00:30",
    title: "Session 6 - Faisabilite commerciale",
    objective: "Prix, canaux, strategie marketing.",
    expectedOutput: "Commercial feasibility note",
    checkpoint: "sell_it",
    stage: "L3_traction",
    kind: "session",
    xp: 90,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Can be swapped with first-sale or waitlist quests for advanced teams.",
  },
  {
    id: "bc-d2-risk-mitigation",
    day: "day_2",
    start: "21:00",
    end: "21:30",
    duration: "00:30",
    title: "Session 7 - Risques et mitigation",
    objective: "Comprendre les risques et mesures d'attenuation possible.",
    expectedOutput: "Matrice des risques",
    checkpoint: "look_after_it",
    stage: "L3_traction",
    kind: "session",
    xp: 90,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Good Look after it entry point before committee.",
  },
  {
    id: "bc-d2-pitch",
    day: "day_2",
    start: "21:30",
    end: "22:00",
    duration: "00:30",
    title: "Session 8 - Pitchs",
    objective: "Pitch practice before final jury.",
    expectedOutput: "Pitch draft",
    checkpoint: "sell_it",
    stage: "L3_traction",
    kind: "pitch",
    xp: 80,
    isActive: true,
    isRequired: false,
    gameMasterNote: "Practice quest, not the final committee artifact.",
  },
  {
    id: "bc-d3-remise-livrables",
    day: "day_3",
    start: "10:00",
    end: "10:15",
    duration: "00:15",
    title: "Remise des livrables",
    objective: "Submit fiches depenses, Canva 4/7P, matrice des risques.",
    expectedOutput: "Complete deliverable pack",
    checkpoint: "look_after_it",
    stage: "L4_committee",
    kind: "admin",
    xp: 120,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Locks the proof pack before final pitch.",
  },
  {
    id: "bc-d3-final-pitch",
    day: "day_3",
    start: "10:30",
    end: "12:10",
    duration: "01:40",
    title: "Session Pitch finale",
    objective: "Final pitch and risk matrix defense.",
    expectedOutput: "Matrice de risques + final pitch",
    checkpoint: "sell_it",
    stage: "L4_committee",
    kind: "pitch",
    xp: 180,
    isActive: true,
    isRequired: true,
    gameMasterNote: "Final boss quest for bootcamp.",
  },
  {
    id: "bc-d3-deliberation",
    day: "day_3",
    start: "12:10",
    end: "12:40",
    duration: "00:30",
    title: "Deliberation",
    objective: "Jury/coach decision and next-step assignment.",
    expectedOutput: "Decision and post-bootcamp next action",
    checkpoint: "look_after_it",
    stage: "L4_committee",
    kind: "admin",
    xp: 0,
    isActive: true,
    isRequired: true,
    gameMasterNote: "No founder XP; admin decision gate.",
  },
];

export const profiles: Profile[] = [
  { id: "usr-yasmine", fullName: "Yasmine El Idrissi", email: "yasmine@startup.ma", role: "founder" },
  { id: "usr-adam", fullName: "Adam Berrada", email: "adam@startup.ma", role: "founder" },
  { id: "usr-nour", fullName: "Nour El Fassi", email: "nour@startup.ma", role: "founder" },
  { id: "usr-karim", fullName: "Karim Mansouri", email: "karim@startup.ma", role: "founder" },
  { id: "usr-amina", fullName: "Dr. Amina Chraibi", email: "amina.chraibi@uemf.ma", role: "mentor" },
  { id: "usr-nabil", fullName: "Nabil Rami", email: "nabil.rami@uemf.ma", role: "reviewer" },
  { id: "usr-eic", fullName: "EIC Office", email: "eic@uemf.ma", role: "eic_admin" },
];

export const startups: Startup[] = [
  {
    id: "prj-atlas",
    name: "Atlas Soil",
    slug: "atlas-soil",
    cohort: "pilot-2026-S1",
    summary: "Low-cost soil diagnostics for small farms preparing their first paid pilots.",
    sector: "AgriTech",
    maturityPhase: "pre_incubation",
    checkpointFocus: "sell_it",
    stage: "L3_traction",
    status: "active",
    healthStatus: "strong",
    nextAction: "Validate first invoice and follow up with the pilot farm.",
    coachNotes: "Strong founder momentum. Keep sales proof clean and short.",
    totalXp: 650,
    createdAt: "2026-04-02",
    lastActivity: "2026-05-04",
    team: [
      { userId: "usr-yasmine", fullName: "Yasmine El Idrissi", email: "yasmine@startup.ma", roleInProject: "owner" },
      { userId: "usr-adam", fullName: "Adam Berrada", email: "adam@startup.ma", roleInProject: "co_founder" },
      { userId: "usr-nour", fullName: "Nour El Fassi", email: "nour@startup.ma", roleInProject: "contributor" },
    ],
    coach: profiles[4],
  },
  {
    id: "prj-medina",
    name: "Medina Pay",
    slug: "medina-pay",
    cohort: "pilot-2026-S1",
    summary: "Payment workflow for small medina merchants that still sell mostly offline.",
    sector: "FinTech",
    maturityPhase: "ideation",
    checkpointFocus: "make_it",
    stage: "L2_solution",
    status: "active",
    healthStatus: "watch",
    nextAction: "Interview 5 more merchants before building the next prototype version.",
    coachNotes: "Needs tighter problem evidence before pushing more product work.",
    totalXp: 410,
    createdAt: "2026-04-05",
    lastActivity: "2026-05-02",
    team: [
      { userId: "usr-karim", fullName: "Karim Mansouri", email: "karim@startup.ma", roleInProject: "owner" },
      { userId: "usr-nour", fullName: "Nour El Fassi", email: "nour@startup.ma", roleInProject: "co_founder" },
    ],
    coach: profiles[5],
  },
  {
    id: "prj-aqua",
    name: "AquaLoop",
    slug: "aqualoop",
    cohort: "pilot-2026-S1",
    summary: "Water reuse monitoring kit for campus and small hospitality sites.",
    sector: "Climate",
    maturityPhase: "ideation",
    checkpointFocus: "make_it",
    stage: "L1_problem",
    status: "active",
    healthStatus: "watch",
    nextAction: "Turn discovery notes into a one-page prototype test plan.",
    coachNotes: "Promising but early. Keep the next task small.",
    totalXp: 180,
    createdAt: "2026-04-09",
    lastActivity: "2026-05-01",
    team: [
      { userId: "usr-adam", fullName: "Adam Berrada", email: "adam@startup.ma", roleInProject: "owner" },
      { userId: "usr-karim", fullName: "Karim Mansouri", email: "karim@startup.ma", roleInProject: "contributor" },
    ],
    coach: profiles[4],
  },
  {
    id: "prj-origine",
    name: "Origine Lab",
    slug: "origine-lab",
    cohort: "pilot-2026-S1",
    summary: "Traceability and customer story tools for local craft food producers.",
    sector: "FoodTech",
    maturityPhase: "incubation",
    checkpointFocus: "look_after_it",
    stage: "L4_committee",
    status: "active",
    healthStatus: "strong",
    nextAction: "Collect retention proof from first two paying producers.",
    coachNotes: "Ready for committee discussion if follow-up evidence is accepted.",
    totalXp: 820,
    createdAt: "2026-03-28",
    lastActivity: "2026-05-04",
    team: [
      { userId: "usr-yasmine", fullName: "Yasmine El Idrissi", email: "yasmine@startup.ma", roleInProject: "owner" },
      { userId: "usr-nour", fullName: "Nour El Fassi", email: "nour@startup.ma", roleInProject: "co_founder" },
    ],
    coach: profiles[5],
  },
];

export const deliverables: Deliverable[] = [
  {
    id: "del-001",
    projectId: "prj-atlas",
    title: "First farm pilot proof",
    description: "Pilot contract and short test protocol for the first farm client.",
    docUrl: "https://docs.example.com/atlas-first-pilot",
    status: "submitted",
    checkpoint: "sell_it",
    stage: "L3_traction",
    pendingXp: 10,
    baseXp: 150,
    submittedBy: "Yasmine El Idrissi",
    submittedAt: "2026-05-04T09:15:00Z",
    mailtoOpenedAt: "2026-05-04T09:16:00Z",
  },
  {
    id: "del-002",
    projectId: "prj-medina",
    title: "Merchant interview synthesis",
    description: "Eight interview notes and a problem pattern summary.",
    docUrl: "https://docs.example.com/medina-merchant-interviews",
    status: "needs_changes",
    checkpoint: "make_it",
    stage: "L1_problem",
    pendingXp: 10,
    baseXp: 100,
    submittedBy: "Karim Mansouri",
    submittedAt: "2026-05-02T15:20:00Z",
    reviewedBy: "Nabil Rami",
    reviewedAt: "2026-05-03T10:00:00Z",
    reviewNotes: "Add direct quotes and separate merchants by segment.",
  },
  {
    id: "del-003",
    projectId: "prj-origine",
    title: "Customer follow-up loop",
    description: "Support notes and repeat usage evidence from two producers.",
    docUrl: "https://docs.example.com/origine-retention-loop",
    status: "accepted",
    checkpoint: "look_after_it",
    stage: "L4_committee",
    pendingXp: 0,
    baseXp: 120,
    submittedBy: "Yasmine El Idrissi",
    submittedAt: "2026-05-01T11:00:00Z",
    reviewedBy: "Nabil Rami",
    reviewedAt: "2026-05-02T12:00:00Z",
    reviewNotes: "Clear proof of repeat usage.",
  },
];

export const bonusRules: Record<
  BonusType,
  {
    label: string;
    checkpoint: Checkpoint;
    unitXp: number;
    capPerStage: number;
    oncePerStartup?: boolean;
    description: string;
  }
> = {
  prospect_interviews: {
    label: "Prospect/client interviews",
    checkpoint: "sell_it",
    unitXp: 5,
    capPerStage: 100,
    description: "Validate learning from 1 to N real prospects or clients.",
  },
  waitlist: {
    label: "Waitlist",
    checkpoint: "sell_it",
    unitXp: 2,
    capPerStage: 100,
    description: "Show a small but real demand signal before building too much.",
  },
  demo_ready: {
    label: "Demo ready",
    checkpoint: "make_it",
    unitXp: 150,
    capPerStage: 150,
    oncePerStartup: true,
    description: "A working demo link that a coach can open and understand.",
  },
  first_sale: {
    label: "First sale",
    checkpoint: "sell_it",
    unitXp: 300,
    capPerStage: 300,
    oncePerStartup: true,
    description: "First verified paying client. This is the big one.",
  },
  additional_sales: {
    label: "Additional sales",
    checkpoint: "sell_it",
    unitXp: 75,
    capPerStage: 300,
    description: "Repeated verified sales after the first client.",
  },
  pilot_commitment: {
    label: "Pilot commitment / LOI",
    checkpoint: "sell_it",
    unitXp: 150,
    capPerStage: 300,
    description: "Signed pilot, LOI, or serious written commitment.",
  },
  retention_followup: {
    label: "Customer follow-up / retention",
    checkpoint: "look_after_it",
    unitXp: 50,
    capPerStage: 200,
    description: "Follow-up proof, satisfaction, repeat usage, or support learning.",
  },
};

export const bonusEvents: BonusEvent[] = [
  {
    id: "bon-001",
    projectId: "prj-atlas",
    type: "first_sale",
    title: "First paid farm diagnostic",
    proofUrl: "https://docs.example.com/atlas-first-sale",
    quantity: 1,
    status: "accepted",
    checkpoint: "sell_it",
    stage: "L3_traction",
    claimedXp: 300,
    awardedXp: 300,
    countsTowardStage: 210,
    prestigeXp: 90,
    submittedBy: "Yasmine El Idrissi",
    submittedAt: "2026-05-03T10:30:00Z",
    reviewedBy: "Dr. Amina Chraibi",
    reviewedAt: "2026-05-03T16:00:00Z",
    reviewNotes: "Verified first paid client.",
  },
  {
    id: "bon-002",
    projectId: "prj-medina",
    type: "prospect_interviews",
    title: "Merchant discovery batch",
    proofUrl: "https://docs.example.com/medina-discovery-batch",
    quantity: 8,
    status: "submitted",
    checkpoint: "sell_it",
    stage: "L2_solution",
    claimedXp: 40,
    awardedXp: 0,
    countsTowardStage: 0,
    prestigeXp: 0,
    submittedBy: "Karim Mansouri",
    submittedAt: "2026-05-03T13:45:00Z",
  },
  {
    id: "bon-003",
    projectId: "prj-origine",
    type: "retention_followup",
    title: "Producer follow-up notes",
    proofUrl: "https://docs.example.com/origine-followup",
    quantity: 3,
    status: "accepted",
    checkpoint: "look_after_it",
    stage: "L4_committee",
    claimedXp: 150,
    awardedXp: 150,
    countsTowardStage: 120,
    prestigeXp: 30,
    submittedBy: "Yasmine El Idrissi",
    submittedAt: "2026-05-02T08:00:00Z",
    reviewedBy: "Nabil Rami",
    reviewedAt: "2026-05-02T14:00:00Z",
  },
];

export const activity: ActivityItem[] = [
  {
    id: "act-001",
    projectId: "prj-atlas",
    action: "Bonus accepted",
    actor: "Dr. Amina Chraibi",
    checkpoint: "sell_it",
    createdAt: "2026-05-03T16:00:00Z",
    metadata: "First sale accepted, 300 XP awarded.",
  },
  {
    id: "act-002",
    projectId: "prj-medina",
    action: "Deliverable needs changes",
    actor: "Nabil Rami",
    checkpoint: "make_it",
    createdAt: "2026-05-03T10:00:00Z",
    metadata: "Add direct quotes and merchant segmentation.",
  },
  {
    id: "act-003",
    projectId: "prj-origine",
    action: "Retention proof accepted",
    actor: "Nabil Rami",
    checkpoint: "look_after_it",
    createdAt: "2026-05-02T14:00:00Z",
    metadata: "Follow-up loop accepted for committee readiness.",
  },
];

export const committees = [
  {
    id: "com-2026-05",
    cohort: "pilot-2026-S1",
    scheduledAt: "2026-05-21T14:00:00+01:00",
    location: "EIC UEMF, Salle Innovation",
    status: "planned",
    members: [
      { name: "Dr. Amina Chraibi", email: "amina.chraibi@uemf.ma" },
      { name: "Nabil Rami", email: "nabil.rami@uemf.ma" },
      { name: "EIC Office", email: "eic@uemf.ma" },
    ],
    dossiers: [
      { projectId: "prj-atlas", decision: "pending", notes: "Strong traction, review unit economics." },
      { projectId: "prj-origine", decision: "pending", notes: "Ready for go/no-go discussion." },
    ],
  },
];

export const opsChecklist = [
  { date: "D-14", title: "Provision host", owner: "Omar", done: true },
  { date: "D-10", title: "Apply schema and seed missions", owner: "Omar", done: true },
  { date: "D-7", title: "Deploy app, smoke test, restore drill", owner: "Omar + tester", done: false },
  { date: "D-3", title: "Load founder accounts and send invites", owner: "EIC Staff", done: false },
  { date: "D-1", title: "UAT: review queue, mailto, exports", owner: "EIC Team", done: false },
  { date: "D-Day", title: "Kickoff cohort and launch L0", owner: "All", done: false },
];

export const risks = [
  {
    id: "R1",
    label: "Supabase production setup",
    level: "High",
    mitigation: "Keep demo fallback locally, then test auth/RLS with founder and staff accounts before launch.",
  },
  {
    id: "R2",
    label: "Mailto cannot prove email delivery",
    level: "Medium",
    mitigation: "Track mailto opened time and keep validation state inside the dashboard.",
  },
  {
    id: "R3",
    label: "Bonus XP gaming",
    level: "Medium",
    mitigation: "Require HTTPS proof links and coach/admin validation before confirmed XP.",
  },
  {
    id: "R4",
    label: "Stage inflation from sales bonuses",
    level: "Medium",
    mitigation: "Cap bonus XP that counts toward gates at 35% of each stage threshold.",
  },
];

export function getStartup(projectIdOrSlug: string) {
  return startups.find((project) => project.id === projectIdOrSlug || project.slug === projectIdOrSlug);
}

export function getCommittee(committeeId: string) {
  return committees.find((committee) => committee.id === committeeId) ?? committees[0];
}

export function stageTarget(stage: Stage) {
  const index = stages.findIndex((item) => item.id === stage);
  return stages[index + 1]?.targetXp ?? stages[index]?.targetXp ?? 1000;
}

export function stageProgress(stage: Stage, xp: number) {
  const target = stageTarget(stage);
  if (target === 0) return 100;
  return Math.min(100, Math.round((xp / target) * 100));
}

export function checkpointLabel(checkpoint: Checkpoint) {
  return checkpoints.find((item) => item.id === checkpoint)?.label ?? checkpoint;
}

export function calculateBonusClaim(type: BonusType, quantity: number) {
  const rule = bonusRules[type];
  const raw = rule.unitXp * Math.max(1, quantity);
  return Math.min(raw, rule.capPerStage);
}

export function projectDeliverables(projectId: string) {
  return deliverables.filter((item) => item.projectId === projectId);
}

export function projectBonuses(projectId: string) {
  return bonusEvents.filter((item) => item.projectId === projectId);
}

export function projectActivity(projectId: string) {
  return activity.filter((item) => item.projectId === projectId);
}

export function getFounderKyc(userId: string) {
  return founderKyc.find((item) => item.userId === userId);
}

export function getProjectHolderKyc(projectId: string) {
  return projectHolderKyc.find((item) => item.projectId === projectId);
}

export function activeBootcampDeliverables() {
  return bootcampDeliverables.filter((item) => item.isActive);
}

export function bootcampByDay() {
  return (["day_1", "day_2", "day_3"] as BootcampDay[]).map((day) => ({
    day,
    label: day === "day_1" ? "Jour 1" : day === "day_2" ? "Jour 2" : "Jour 3",
    items: bootcampDeliverables.filter((item) => item.day === day),
  }));
}

export function xpSummary(projectId: string) {
  const project = getStartup(projectId);
  const acceptedDeliverables = projectDeliverables(projectId).filter((item) => item.status === "accepted");
  const pendingDeliverables = projectDeliverables(projectId).filter((item) => item.status === "submitted");
  const acceptedBonuses = projectBonuses(projectId).filter((item) => item.status === "accepted");
  const submittedBonuses = projectBonuses(projectId).filter((item) => item.status === "submitted");
  const coreXp = acceptedDeliverables.reduce((sum, item) => sum + item.baseXp, 0);
  const pendingXp =
    pendingDeliverables.reduce((sum, item) => sum + item.pendingXp, 0) +
    submittedBonuses.reduce((sum, item) => sum + Math.min(10, item.claimedXp), 0);
  const bonusXp = acceptedBonuses.reduce((sum, item) => sum + item.countsTowardStage, 0);
  const prestigeXp = acceptedBonuses.reduce((sum, item) => sum + item.prestigeXp, 0);
  const confirmedXp = project?.totalXp ?? coreXp + bonusXp;
  const target = project ? stageTarget(project.stage) : 1000;
  const bonusCap = Math.round(target * 0.35);
  const bonusCapUsed = Math.min(100, Math.round((bonusXp / bonusCap) * 100));

  return {
    confirmedXp,
    coreXp,
    bonusXp,
    pendingXp,
    prestigeXp,
    target,
    progress: Math.min(100, Math.round((confirmedXp / target) * 100)),
    bonusCap,
    bonusCapUsed,
    toNextGate: Math.max(0, target - confirmedXp),
  };
}

export function xpSummaryFrom(project: Startup, projectDeliverablesList: Deliverable[], projectBonusList: BonusEvent[]) {
  const acceptedDeliverables = projectDeliverablesList.filter((item) => item.status === "accepted");
  const pendingDeliverables = projectDeliverablesList.filter((item) => item.status === "submitted");
  const acceptedBonuses = projectBonusList.filter((item) => item.status === "accepted");
  const submittedBonuses = projectBonusList.filter((item) => item.status === "submitted");
  const coreXp = acceptedDeliverables.reduce((sum, item) => sum + item.baseXp, 0);
  const pendingXp =
    pendingDeliverables.reduce((sum, item) => sum + item.pendingXp, 0) +
    submittedBonuses.reduce((sum, item) => sum + Math.min(10, item.claimedXp), 0);
  const bonusXp = acceptedBonuses.reduce((sum, item) => sum + item.countsTowardStage, 0);
  const prestigeXp = acceptedBonuses.reduce((sum, item) => sum + item.prestigeXp, 0);
  const confirmedXp = project.totalXp;
  const target = stageTarget(project.stage);
  const bonusCap = Math.round(target * 0.35);
  const bonusCapUsed = bonusCap > 0 ? Math.min(100, Math.round((bonusXp / bonusCap) * 100)) : 0;

  return {
    confirmedXp,
    coreXp,
    bonusXp,
    pendingXp,
    prestigeXp,
    target,
    progress: target > 0 ? Math.min(100, Math.round((confirmedXp / target) * 100)) : 100,
    bonusCap,
    bonusCapUsed,
    toNextGate: Math.max(0, target - confirmedXp),
  };
}

export function checkpointSummary(projectId: string) {
  return checkpoints.map((checkpoint) => {
    const acceptedDeliverables = projectDeliverables(projectId).filter(
      (item) => item.checkpoint === checkpoint.id && item.status === "accepted",
    );
    const pendingDeliverables = projectDeliverables(projectId).filter(
      (item) => item.checkpoint === checkpoint.id && item.status === "submitted",
    );
    const acceptedBonuses = projectBonuses(projectId).filter(
      (item) => item.checkpoint === checkpoint.id && item.status === "accepted",
    );
    const xp =
      acceptedDeliverables.reduce((sum, item) => sum + item.baseXp, 0) +
      acceptedBonuses.reduce((sum, item) => sum + item.awardedXp, 0);
    const pending =
      pendingDeliverables.reduce((sum, item) => sum + item.pendingXp, 0) +
      projectBonuses(projectId)
        .filter((item) => item.checkpoint === checkpoint.id && item.status === "submitted")
        .reduce((sum, item) => sum + Math.min(10, item.claimedXp), 0);

    return {
      ...checkpoint,
      xp,
      pending,
      completion: Math.min(100, Math.round((xp / 300) * 100)),
    };
  });
}

export function checkpointSummaryFrom(projectDeliverablesList: Deliverable[], projectBonusList: BonusEvent[]) {
  return checkpoints.map((checkpoint) => {
    const acceptedDeliverables = projectDeliverablesList.filter(
      (item) => item.checkpoint === checkpoint.id && item.status === "accepted",
    );
    const pendingDeliverables = projectDeliverablesList.filter(
      (item) => item.checkpoint === checkpoint.id && item.status === "submitted",
    );
    const acceptedBonuses = projectBonusList.filter(
      (item) => item.checkpoint === checkpoint.id && item.status === "accepted",
    );
    const submittedBonuses = projectBonusList.filter(
      (item) => item.checkpoint === checkpoint.id && item.status === "submitted",
    );
    const xp =
      acceptedDeliverables.reduce((sum, item) => sum + item.baseXp, 0) +
      acceptedBonuses.reduce((sum, item) => sum + item.awardedXp, 0);
    const pending =
      pendingDeliverables.reduce((sum, item) => sum + item.pendingXp, 0) +
      submittedBonuses.reduce((sum, item) => sum + Math.min(10, item.claimedXp), 0);

    return {
      ...checkpoint,
      xp,
      pending,
      completion: Math.min(100, Math.round((xp / 300) * 100)),
    };
  });
}

export function dashboardMetrics() {
  const pendingValidations =
    deliverables.filter((item) => item.status === "submitted").length +
    bonusEvents.filter((item) => item.status === "submitted").length;
  const blocked = startups.filter((project) => project.healthStatus === "blocked" || project.healthStatus === "watch");
  const firstSales = bonusEvents.filter((item) => item.type === "first_sale" && item.status === "accepted");

  return [
    { label: "Active startups", value: startups.length.toString(), hint: "Pilot cohort projects", icon: FolderKanban },
    { label: "Pending validation", value: pendingValidations.toString(), hint: "Coach/admin review queue", icon: ClipboardCheck },
    { label: "First sales", value: firstSales.length.toString(), hint: "Verified client payments", icon: Award },
    { label: "Watch list", value: blocked.length.toString(), hint: "Needs coach attention", icon: Target },
  ];
}

export function statusTone(status: string) {
  if (["accepted", "validated", "active", "strong", "planned", "graduated"].includes(status)) return "green";
  if (["submitted", "in_review", "reviewed", "watch"].includes(status)) return "blue";
  if (["needs_changes", "pending", "paused"].includes(status)) return "gold";
  return "red";
}

export function committeeDossierRows(committeeId: string) {
  const committee = getCommittee(committeeId);
  return committee.dossiers.map((dossier) => {
    const project = getStartup(dossier.projectId);
    return {
      committee_id: committee.id,
      project_name: project?.name ?? dossier.projectId,
      total_xp: project?.totalXp ?? 0,
      stage: project?.stage ?? "unknown",
      checkpoint_focus: project?.checkpointFocus ?? "unknown",
      maturity_phase: project?.maturityPhase ?? "unknown",
      decision: dossier.decision,
      decision_notes: dossier.notes,
      decided_at: "",
    };
  });
}

export function mailtoUrl({ to, subject, body }: { to: string | string[]; subject: string; body: string }) {
  const recipients = Array.isArray(to) ? to.join(",") : to;
  return `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
}

export function deliverableMailBody({
  startup,
  title,
  checkpoint,
  docUrl,
  message,
}: {
  startup: Startup;
  title: string;
  checkpoint: Checkpoint;
  docUrl: string;
  message: string;
}) {
  return `Bonjour ${startup.coach.fullName},

Nouvelle preuve a valider pour ${startup.name}.

Checkpoint: ${checkpointLabel(checkpoint)}
Titre: ${title}
Lien: ${docUrl}

Message fondateur:
${message}

Dashboard: https://eic-game.uemf.ma/startup/${startup.slug}

Equipe EIC`;
}

export function inviteBody(name = "Founder") {
  return `Bonjour ${name},

Bienvenue dans EIC Venture Journey.

Votre compte pilote a ete cree. Connectez-vous a https://eic-game.uemf.ma, ouvrez votre startup, puis soumettez votre premiere preuve.

Equipe EIC`;
}

export function reviewReminderBody(projectName: string, reviewer: string) {
  return `Bonjour ${reviewer},

La startup ${projectName} attend une validation. Objectif SLA pilote: moins de 72h.

Merci d'ajouter une decision ou des notes dans le dashboard EIC.

Equipe EIC`;
}

export function committeeBody(committeeId: string) {
  const committee = getCommittee(committeeId);
  const dossiers = committee.dossiers
    .map((dossier) => `- ${getStartup(dossier.projectId)?.name ?? dossier.projectId}: ${dossier.notes}`)
    .join("\n");

  return `Bonjour,

Convocation au comite ${committee.cohort}
Date: ${new Date(committee.scheduledAt).toLocaleString("fr-FR")}
Lieu: ${committee.location}

Dossiers:
${dossiers}

Merci de preparer vos retours avant la session.

Equipe EIC`;
}
