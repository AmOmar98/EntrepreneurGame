"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  httpsUrl,
  onboardingSchema,
  fichesEntretienSchema,
  submissionSchema,
  evaluationSchema,
  composerKindSchema,
  validationRuleSchema,
  rubricSchema,
  slugifyToKey,
} from "@/lib/schemas";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { pathForRole } from "@/lib/auth";
import type { AppRole } from "@/lib/types";
import {
  BONUS_DEFAULTS,
  BONUS_MULTIPLIER_CAP,
  type BonusType,
  type MoscowBucket,
} from "@/lib/types";
import {
  parseCsv,
  dedupeCsvRows,
  slugifyTeam,
  type ImportReport,
} from "@/lib/admin-import";
import { addJurorByEmail, removeJuror } from "@/lib/jurors";
import type { PitchModeState } from "@/lib/types";

export type WorkflowState = {
  ok: boolean;
  message: string;
  // WR-05 : optional severity flag so client UIs can style warn-vs-success
  // without coupling on French substring matches. Backwards-compatible —
  // existing callers/consumers ignore this field.
  severity?: "ok" | "warn" | "error";
  // quick-260512-24v deferred #4: optional mailto: draft for fallback email
  // channel after a successful in-app insert (help_requests).
  mailto?: string;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signIn(_prev: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Auth backend not configured." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Auth backend not configured." };
  }
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, message: error.message };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Login succeeded but no user." };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (profile?.app_role ?? "player") as AppRole;
  redirect(pathForRole(role));
}

export async function signOut(): Promise<void> {
  if (!hasSupabaseEnv()) return;
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.auth.signOut();
  redirect("/login");
}

// ============================================================================
// Onboarding (ONBOARD-02, ONBOARD-03, DATA-04)
// ============================================================================


export async function saveOnboarding(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Auth backend not configured." };
  }
  const parsed = onboardingSchema.safeParse({
    teamName: formData.get("teamName"),
    idea: formData.get("idea"),
    q1: formData.get("q1"),
    q2: formData.get("q2"),
    q3: formData.get("q3"),
    q4: formData.get("q4"),
    q5: formData.get("q5"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Auth backend not configured." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) {
    return { ok: false, message: membershipError.message };
  }
  if (!membership) {
    return { ok: false, message: "Aucun Player rattache a votre compte." };
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, onboarded_at, score_engagement")
    .eq("id", membership.player_id)
    .maybeSingle();
  if (playerError) {
    return { ok: false, message: playerError.message };
  }
  if (!player) {
    return { ok: false, message: "Player introuvable." };
  }
  if (player.onboarded_at) {
    return { ok: true, message: "Onboarding deja complete." };
  }

  const currentEngagement = Number(player.score_engagement ?? 0);
  const { error: updateError } = await supabase
    .from("players")
    .update({
      name: parsed.data.teamName,
      idea: parsed.data.idea,
      onboarded_at: new Date().toISOString(),
      score_engagement: currentEngagement + 10,
      // Onboarding completion bumps the Player off L0_diagnostic (the default)
      // onto L1_problem so the journey track shows L0=done, L1=current.
      // Without this, the L0 node stays "current/À rendre" forever even after
      // the KYC form is filled. See memory project_onboarding_level_bump_sql.
      // W-3 (14-04): write both enum column and text FK to prevent drift after
      // the levels_v2 migration is applied (Plan 05 operator checkpoint).
      current_level: "L1_problem",
      current_level_text: "L1_problem",
    })
    .eq("id", player.id);
  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/journey");
  revalidatePath("/onboarding");
  return { ok: true, message: "Onboarding enregistre." };
}

// ============================================================================
// Submission V1 (SUBMIT-01, SUBMIT-02, SUBMIT-04, DATA-04)
// ============================================================================

// quick-260519-l1l + smoke-j1 fix 2026-05-19 : Auto-validation system
// evaluator UUID is now hardcoded in the SECURITY DEFINER trigger
// `trg_auto_eval_fiches_entretien` (G01 = o.ameur@ueuromed.org =
// 59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334). See
// .planning/quick/260519-smoke-prod-j1/fix_h1_auto_eval_trigger.sql

// quick-260519-l1l : Hard-block exception R3 signed Omar 2026-05-19. The
// fiches-entretien-v1 deliverable REQUIRES that prep-questions-v1 was already
// validated by mentor first. This is the ONLY hard-block in the pilot — every
// other inter-deliverable transition stays amber-warn-only per R3 cardinal rule.
const HARD_BLOCK_DEPENDENCIES: Record<string, string> = {
  "fiches-entretien-v1": "prep-questions-v1",
};

// quick-260519-l1l : 10-URL HTTPS array shape for fiches-entretien-v1.
// proof_text stores JSON.stringify({ fiches: [{ url: string }, ...] }) with
// exactly 10 entries, each a valid https:// URL. Zod errors here are *technical*
// payload validators (R2 distinction : pedagogical rubric warnings vs payload
// schema errors — schema errors block parsing, rubric warnings never block).
// Schemas moved to lib/schemas.ts (pure module, importable in Vitest unit tests).

export async function submitDeliverable(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const rawProofUrl = formData.get("proofUrl");
  const rawProofText = formData.get("proofText");
  const parsed = submissionSchema.safeParse({
    deliverableTemplateId: formData.get("deliverableTemplateId"),
    kind: formData.get("kind"),
    proofUrl: typeof rawProofUrl === "string" && rawProofUrl.length > 0 ? rawProofUrl : undefined,
    proofText:
      typeof rawProofText === "string" && rawProofText.length > 0 ? rawProofText : undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  // Ownership check (SUBMIT-04 applicative gate, defense-in-depth alongside RLS).
  const { data: membership, error: memberErr } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberErr) {
    return { ok: false, message: memberErr.message };
  }
  if (!membership) {
    return { ok: false, message: "Aucun Player rattache a votre compte." };
  }

  // quick-260519-l1l : Resolve template slug + ENGINE-05 columns to dispatch on
  // special flows (hard-block dependency + auto-validation).
  // ENGINE-05: also fetch composer_kind + auto_validate for data-driven dispatch.
  // Pre-migration defensive: columns may be absent → fallback to slug-based behavior.
  const { data: tplRow, error: tplErr } = await supabase
    .from("deliverable_templates")
    .select("slug, composer_kind, auto_validate")
    .eq("id", parsed.data.deliverableTemplateId)
    .maybeSingle();
  if (tplErr) {
    return { ok: false, message: tplErr.message };
  }
  if (!tplRow) {
    return { ok: false, message: "Livrable inconnu." };
  }
  const tplData = tplRow as { slug: string; composer_kind?: string | null; auto_validate?: boolean | null };
  const templateSlug = tplData.slug;
  // ENGINE-05: data-driven auto-validate check (pre-migration: fallback to slug literal).
  const isAutoValidate =
    (tplData.composer_kind === "multi_url" && tplData.auto_validate === true)
    || (!tplData.composer_kind && templateSlug === "fiches-entretien-v1");

  // quick-260519-l1l : Hard-block 2A→2B (R3 exception, Omar 2026-05-19).
  // If this deliverable depends on another being validated first, check that
  // dependency. Defense in depth: composer also disables submit DOM-side, but
  // server is the source of truth — rejects with explicit pedagogical message.
  const dependsOnSlug = HARD_BLOCK_DEPENDENCIES[templateSlug];
  if (dependsOnSlug) {
    const { data: depRow } = await supabase
      .from("deliverable_templates")
      .select("id")
      .eq("slug", dependsOnSlug)
      .maybeSingle();
    if (depRow) {
      const { data: depSubs } = await supabase
        .from("submissions")
        .select("status")
        .eq("player_id", membership.player_id)
        .eq("deliverable_template_id", (depRow as { id: string }).id)
        .order("version", { ascending: false })
        .limit(1);
      const depValidated =
        depSubs && depSubs.length > 0 && (depSubs[0] as { status: string }).status === "validated";
      if (!depValidated) {
        return {
          ok: false,
          severity: "warn",
          message:
            "Préparation 2A à valider par votre mentor avant de débloquer les fiches d'entretien (02b).",
        };
      }
    }
  }

  // quick-260519-l1l + smoke-j1 fix 2026-05-19 : Auto-validation flow for
  // multi_url auto_validate templates (formerly keyed on fiches-entretien-v1 slug).
  // ENGINE-05: now dispatches on isAutoValidate (composer_kind=multi_url + auto_validate=true
  // from DB column, with pre-migration fallback to slug literal — see above).
  // Player inserts submission with status='validated'.
  // The synthetic evaluations row is now inserted server-side by trigger
  // `trg_auto_eval_fiches_entretien` (SECURITY DEFINER, bypasses RLS
  // `evaluations_mentor_self_insert`) — see
  // .planning/quick/260519-smoke-prod-j1/fix_h1_auto_eval_trigger.sql
  // - Parse 10-URL JSON payload.
  // - Insert submissions row with status='validated' directly.
  // - Trigger fires AFTER INSERT, creates eval row (scores fiche_1..10=25,
  //   total=250, verdict='validate_v1', evaluator=G01 UUID).
  // - Skip mailto (no mentor notif needed for auto-validated submission).
  if (isAutoValidate) {
    if (parsed.data.kind !== "proof_text" || !parsed.data.proofText) {
      return {
        ok: false,
        message: "Format attendu : 10 URLs HTTPS encodées en JSON (proof_text).",
      };
    }
    let fichesJson: unknown;
    try {
      fichesJson = JSON.parse(parsed.data.proofText);
    } catch {
      return { ok: false, message: "proof_text doit être un JSON { fiches: [...] } valide." };
    }
    const fichesParsed = fichesEntretienSchema.safeParse(fichesJson);
    if (!fichesParsed.success) {
      return {
        ok: false,
        message:
          fichesParsed.error.issues[0]?.message ??
          "10 fiches HTTPS requises (format JSON { fiches: [{url}, ...] }).",
      };
    }

    // Check no existing submission already validated.
    const { data: existing } = await supabase
      .from("submissions")
      .select("id, version, status")
      .eq("player_id", membership.player_id)
      .eq("deliverable_template_id", parsed.data.deliverableTemplateId)
      .order("version", { ascending: false });
    if (existing && existing.length > 0) {
      const latest = existing[0] as { id: string; status: string };
      if (latest.status === "validated") {
        return { ok: false, message: "Fiches déjà soumises et validées." };
      }
    }

    // Insert submission row (status validated direct).
    // Auto-eval row is created server-side by trigger
    // trg_auto_eval_fiches_entretien (SECURITY DEFINER) — no client-side insert
    // needed, RLS evaluations_mentor_self_insert no longer blocks the Player.
    const { error: subErr } = await supabase.from("submissions").insert({
      player_id: membership.player_id,
      deliverable_template_id: parsed.data.deliverableTemplateId,
      version: 1,
      kind: "proof_text",
      proof_url: null,
      proof_text: parsed.data.proofText,
      status: "validated",
      submitted_by: user.id,
    });
    if (subErr) {
      return { ok: false, message: subErr.message };
    }

    revalidatePath("/journey");
    revalidatePath(`/journey/deliverable/${parsed.data.deliverableTemplateId}`);
    revalidatePath("/mentor");
    return {
      ok: true,
      severity: "ok",
      message: "10 fiches d'entretien soumises et validées automatiquement.",
    };
  }

  // Block duplicate V1 (SUBMIT-02: lock until V2 is requested - V2 lives in Phase 3).
  const { data: existing, error: selErr } = await supabase
    .from("submissions")
    .select("id, version, status")
    .eq("player_id", membership.player_id)
    .eq("deliverable_template_id", parsed.data.deliverableTemplateId)
    .order("version", { ascending: false });
  if (selErr) {
    return { ok: false, message: selErr.message };
  }
  if (existing && existing.length > 0) {
    const latest = existing[0] as { id: string; version: number; status: string };
    if (latest.version === 2) {
      return { ok: false, message: "V2 deja soumise." };
    }
    // latest.version === 1
    if (latest.status === "submitted_v1") {
      return {
        ok: false,
        message: "Une soumission V1 existe deja. Attendez le feedback du Mentor.",
      };
    }
    if (latest.status === "validated") {
      return { ok: false, message: "Livrable deja valide." };
    }
    if (latest.status === "rejected") {
      return { ok: false, message: "Livrable rejete. Contactez le Mentor." };
    }
    if (latest.status === "feedback_received") {
      // V2 path (SUBMIT-03): the Mentor requested a V2 after evaluating V1.
      const { error: insV2Err } = await supabase.from("submissions").insert({
        player_id: membership.player_id,
        deliverable_template_id: parsed.data.deliverableTemplateId,
        version: 2,
        kind: parsed.data.kind,
        proof_url: parsed.data.kind === "proof_url" ? parsed.data.proofUrl : null,
        proof_text: parsed.data.kind === "proof_text" ? parsed.data.proofText : null,
        status: "submitted_v2",
        submitted_by: user.id,
      });
      if (insV2Err) {
        return { ok: false, message: insV2Err.message };
      }
      revalidatePath("/journey");
      revalidatePath(`/journey/deliverable/${parsed.data.deliverableTemplateId}`);
      revalidatePath("/mentor");
      return { ok: true, message: "Soumission V2 enregistree." };
    }
    // draft / submitted_v2 / unknown fallback
    return { ok: false, message: "Soumission impossible dans l'etat actuel." };
  }

  const { error: insErr } = await supabase.from("submissions").insert({
    player_id: membership.player_id,
    deliverable_template_id: parsed.data.deliverableTemplateId,
    version: 1,
    kind: parsed.data.kind,
    proof_url: parsed.data.kind === "proof_url" ? parsed.data.proofUrl : null,
    proof_text: parsed.data.kind === "proof_text" ? parsed.data.proofText : null,
    status: "submitted_v1",
    submitted_by: user.id,
  });
  if (insErr) {
    return { ok: false, message: insErr.message };
  }

  revalidatePath("/journey");
  revalidatePath(`/journey/deliverable/${parsed.data.deliverableTemplateId}`);
  return { ok: true, message: "Livrable soumis." };
}

// ============================================================================
// Evaluation (EVAL-02, EVAL-03, SCORE-01, DATA-04)
// ============================================================================
//
// Mentor (or GameMaster) submits a rubric scoring + feedback + verdict for a
// given submission. Persists 1 row in `evaluations` then updates
// `submissions.status` according to the verdict. The Postgres trigger
// `trg_evaluation_recalc` recomputes `players.score_project` automatically;
// we never touch that column from TypeScript (SCORE-01).

// evaluationSchema moved to lib/schemas.ts (re-imported above).

export async function evaluateSubmission(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  // Parse scoresJson -> Record<string, number> before validation.
  const rawScoresJson = formData.get("scoresJson");
  let scoresParsed: unknown = {};
  if (typeof rawScoresJson === "string" && rawScoresJson.length > 0) {
    try {
      scoresParsed = JSON.parse(rawScoresJson);
    } catch {
      return { ok: false, message: "Notes invalides (JSON)." };
    }
  }

  const rawExpectedAction = formData.get("expectedAction");
  const parsed = evaluationSchema.safeParse({
    submissionId: formData.get("submissionId"),
    feedback: formData.get("feedback") ?? "",
    verdict: formData.get("verdict"),
    expectedAction:
      typeof rawExpectedAction === "string" && rawExpectedAction.length > 0
        ? rawExpectedAction
        : undefined,
    scores: scoresParsed,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  // Role gate (defense-in-depth alongside RLS).
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "mentor" && role !== "game_master") {
    return { ok: false, message: "Acces reserve aux mentors." };
  }

  // Load submission.
  const { data: subRow, error: subErr } = await supabase
    .from("submissions")
    .select("id, version, player_id, deliverable_template_id, status")
    .eq("id", parsed.data.submissionId)
    .maybeSingle();
  if (subErr) {
    return { ok: false, message: subErr.message };
  }
  if (!subRow) {
    return { ok: false, message: "Submission introuvable." };
  }
  const submission = subRow as {
    id: string;
    version: number;
    player_id: string;
    deliverable_template_id: string;
    status: string;
  };

  // Verdict / version coherence.
  if (submission.version === 1) {
    if (parsed.data.verdict === "validate_v2") {
      return { ok: false, message: "Verdict invalide pour une soumission V1." };
    }
  } else if (submission.version === 2) {
    if (parsed.data.verdict === "request_v2" || parsed.data.verdict === "validate_v1") {
      return { ok: false, message: "Verdict invalide pour une soumission V2." };
    }
  }

  // Load template rubric to validate scores and compute total.
  const { data: tplRow, error: tplErr } = await supabase
    .from("deliverable_templates")
    .select("id, rubric")
    .eq("id", submission.deliverable_template_id)
    .maybeSingle();
  if (tplErr) {
    return { ok: false, message: tplErr.message };
  }
  if (!tplRow) {
    return { ok: false, message: "Modele de livrable introuvable." };
  }
  const rubric = (tplRow as { rubric: { key: string; label: string; max: number }[] | null })
    .rubric;
  const criteria = Array.isArray(rubric) ? rubric : [];

  let totalScore = 0;
  for (const criterion of criteria) {
    const value = parsed.data.scores[criterion.key];
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { ok: false, message: `Score manquant pour le critere ${criterion.label}.` };
    }
    if (value < 0 || value > criterion.max) {
      return { ok: false, message: `Score invalide pour le critere ${criterion.label}.` };
    }
    totalScore += value;
  }

  // Applicative unique check (readable error before relying on DB 23505).
  const { data: existingEval, error: existingErr } = await supabase
    .from("evaluations")
    .select("id")
    .eq("submission_id", submission.id)
    .eq("evaluator_id", user.id)
    .maybeSingle();
  if (existingErr) {
    return { ok: false, message: existingErr.message };
  }
  if (existingEval) {
    return { ok: false, message: "Vous avez deja evalue cette soumission." };
  }

  // Insert evaluation row. The trg_evaluation_recalc Postgres trigger will
  // recompute players.score_project automatically (SCORE-01).
  // expected_action is only persisted when verdict=request_v2 (MNT-04).
  const expectedActionToPersist =
    parsed.data.verdict === "request_v2"
      ? (parsed.data.expectedAction ?? "").trim()
      : null;
  const { error: insErr } = await supabase.from("evaluations").insert({
    submission_id: submission.id,
    evaluator_id: user.id,
    scores: parsed.data.scores,
    total_score: totalScore,
    feedback: parsed.data.feedback,
    verdict: parsed.data.verdict,
    expected_action: expectedActionToPersist,
  });
  if (insErr) {
    if ((insErr as { code?: string }).code === "23505") {
      return { ok: false, message: "Vous avez deja evalue cette soumission." };
    }
    return { ok: false, message: insErr.message };
  }

  // Map verdict -> submission status (EVAL-03).
  const nextStatus =
    parsed.data.verdict === "validate_v1" || parsed.data.verdict === "validate_v2"
      ? "validated"
      : parsed.data.verdict === "request_v2"
        ? "feedback_received"
        : "rejected";

  const { error: updErr } = await supabase
    .from("submissions")
    .update({ status: nextStatus })
    .eq("id", submission.id);
  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  revalidatePath("/mentor");
  revalidatePath(`/mentor/submission/${submission.id}`);
  revalidatePath(`/journey/deliverable/${submission.deliverable_template_id}`);
  revalidatePath("/journey");

  // MNT-05 — confirmation toast payload. The client (mentor-confirmation-banner)
  // parses message as JSON when ok=true to render
  // "Score envoye . +X XP attribues a [equipe] . Player notifie".
  const xpAwarded =
    parsed.data.verdict === "validate_v1" || parsed.data.verdict === "validate_v2"
      ? Math.round(totalScore)
      : 0;

  // Best-effort fetch of the player name for the toast (non-blocking on error).
  let teamName: string | null = null;
  const { data: playerRow } = await supabase
    .from("players")
    .select("name")
    .eq("id", submission.player_id)
    .maybeSingle();
  if (playerRow) {
    teamName = (playerRow as { name: string }).name;
  }

  const payload = JSON.stringify({
    kind: "mentor_evaluation_sent",
    xp: xpAwarded,
    team: teamName,
    verdict: parsed.data.verdict,
  });
  return { ok: true, message: payload };
}

// ============================================================================
// Mentor flow — Phase 8 (MNT-03)
// Async tagged comments tied to a submission. Used by both mentors and player
// members of the team to discuss a submission asynchronously (no live chat).
// RLS gates writes; we still defense-in-depth role/membership-check here so
// that error messages are readable.
// ============================================================================

const addCommentSchema = z.object({
  submissionId: z.string().uuid(),
  tag: z.enum(["remarque", "a_corriger"]),
  body: z.string().min(1).max(2000),
});

export async function addEvaluationCommentFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const rawBody = formData.get("body");
  const parsed = addCommentSchema.safeParse({
    submissionId: formData.get("submissionId"),
    tag: formData.get("tag"),
    body: typeof rawBody === "string" ? rawBody.trim() : rawBody,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  // Resolve role + membership; both mentors and team members can post.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;

  // Load submission to know which player_id it belongs to (for membership
  // gate when role=player).
  const { data: subRow, error: subErr } = await supabase
    .from("submissions")
    .select("id, player_id, deliverable_template_id")
    .eq("id", parsed.data.submissionId)
    .maybeSingle();
  if (subErr) {
    return { ok: false, message: subErr.message };
  }
  if (!subRow) {
    return { ok: false, message: "Submission introuvable." };
  }
  const submission = subRow as {
    id: string;
    player_id: string;
    deliverable_template_id: string;
  };

  if (role !== "mentor" && role !== "game_master") {
    // Player path — must be a member of the submission's player.
    const { data: membership } = await supabase
      .from("player_members")
      .select("player_id")
      .eq("user_id", user.id)
      .eq("player_id", submission.player_id)
      .maybeSingle();
    if (!membership) {
      return { ok: false, message: "Acces refuse." };
    }
  }

  const { error: insErr } = await supabase.from("evaluation_comments").insert({
    submission_id: submission.id,
    author_user_id: user.id,
    tag: parsed.data.tag,
    body: parsed.data.body,
  });
  if (insErr) {
    return { ok: false, message: insErr.message };
  }

  revalidatePath("/mentor");
  revalidatePath(`/mentor/submission/${submission.id}`);
  revalidatePath(`/journey/deliverable/${submission.deliverable_template_id}`);
  revalidatePath("/journey");
  return { ok: true, message: "Commentaire publie." };
}

// ============================================================================
// CSV Import (ONBOARD-01, ADMIN-01) - GameMaster bulk import
// ============================================================================

export type ImportWorkflowState = WorkflowState & { report?: ImportReport };

const importSchema = z.object({
  csvText: z.string().min(10).max(200_000),
  cohortSlug: z.string().min(2).max(64).default("hack-days-mai-2026"),
});

const DEFAULT_COHORT_NAME = "Digi-Hackathon Mai 2026";

type ServiceClient = ReturnType<typeof createServiceClient>;

function buildServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === "replace-me") return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * GameMaster CSV bulk import.
 * - Idempotent: re-running the same CSV produces created=0, membersAdded=0.
 * - Service-role optional: when absent, missing users are flagged invitesSkipped.
 * - All Supabase errors are surfaced via report.errors; never throws.
 */
export async function importPlayersCsv(
  _prev: ImportWorkflowState,
  formData: FormData,
): Promise<ImportWorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  // 1. Validate input.
  const parsed = importSchema.safeParse({
    csvText: formData.get("csvText"),
    cohortSlug: formData.get("cohortSlug") ?? "hack-days-mai-2026",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  // 2. AuthZ: must be authenticated game_master.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve aux GameMasters." };
  }

  // 3. Parse + dedupe.
  const { rows: parsedRows, errors: parseErrors } = parseCsv(parsed.data.csvText);
  const rows = dedupeCsvRows(parsedRows);
  const report: ImportReport = {
    created: 0,
    alreadyExisted: 0,
    membersAdded: 0,
    invitesSent: 0,
    invitesSkipped: 0,
    errors: parseErrors.map((e) => ({ line: e.line, email: e.email, reason: e.reason })),
  };
  if (rows.length === 0) {
    return {
      ok: report.errors.length === 0,
      message: "Aucune ligne valide a importer.",
      report,
    };
  }

  // 4. Resolve current event (GM-designated active event via is_active).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    report.errors.push({ reason: `events: ${eventErr.message}` });
    return { ok: false, message: eventErr.message, report };
  }
  if (!eventRow) {
    report.errors.push({ reason: "Aucun event configure." });
    return { ok: false, message: "Aucun event configure.", report };
  }
  const eventId = (eventRow as { id: string }).id;

  // 5. Resolve / upsert cohort by (event_id, slug).
  const cohortSlug = parsed.data.cohortSlug;
  const { data: existingCohort, error: cohortSelErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId)
    .eq("slug", cohortSlug)
    .maybeSingle();
  if (cohortSelErr) {
    report.errors.push({ reason: `cohorts select: ${cohortSelErr.message}` });
    return { ok: false, message: cohortSelErr.message, report };
  }
  let cohortId: string;
  if (existingCohort) {
    cohortId = (existingCohort as { id: string }).id;
  } else {
    const { data: insCohort, error: cohortInsErr } = await supabase
      .from("cohorts")
      .insert({ event_id: eventId, slug: cohortSlug, name: DEFAULT_COHORT_NAME })
      .select("id")
      .maybeSingle();
    if (cohortInsErr || !insCohort) {
      const msg = cohortInsErr?.message ?? "cohort insert failed";
      report.errors.push({ reason: `cohorts insert: ${msg}` });
      return { ok: false, message: msg, report };
    }
    cohortId = (insCohort as { id: string }).id;
  }

  // 6. Service-role admin client (optional, for invites + auth.users lookup).
  const adminClient = buildServiceClient();

  // Helper: resolve user_id for an email. Tries admin API first, then profiles.
  async function resolveUserIdByEmail(email: string): Promise<string | null> {
    if (adminClient) {
      // listUsers with a filter — Supabase does not expose a direct "by email" endpoint
      // in supabase-js v2; we use admin.listUsers with a per-page scan limited to 1000.
      // For pilot scale (< 100 emails) this is fine.
      try {
        const { data, error } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (!error && data?.users) {
          const found = data.users.find(
            (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
          );
          if (found) return found.id;
        }
      } catch {
        // fall through to profiles lookup
      }
    }
    const { data } = await supabase!
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    return (data as { user_id?: string } | null)?.user_id ?? null;
  }

  // 7. Iterate CSV rows.
  for (const row of rows) {
    const baseSlug = slugifyTeam(row.teamName);
    if (!baseSlug) {
      report.errors.push({ reason: `Slug vide pour team_name="${row.teamName}"` });
      continue;
    }

    // Find existing player by base slug.
    const { data: existingPlayer, error: playerSelErr } = await supabase
      .from("players")
      .select("id, name, cohort_id, slug")
      .eq("slug", baseSlug)
      .maybeSingle();
    if (playerSelErr) {
      report.errors.push({ reason: `players select: ${playerSelErr.message}` });
      continue;
    }

    let playerId: string;
    let isNewPlayer = false;
    if (
      existingPlayer &&
      (existingPlayer as { cohort_id: string }).cohort_id === cohortId &&
      (existingPlayer as { name: string }).name === row.teamName
    ) {
      playerId = (existingPlayer as { id: string }).id;
      report.alreadyExisted += 1;
    } else {
      // Slug collision in another cohort: append "-{cohortSlug}".
      const slugToUse = existingPlayer ? `${baseSlug}-${cohortSlug}` : baseSlug;
      const { data: insPlayer, error: playerInsErr } = await supabase
        .from("players")
        .insert({
          cohort_id: cohortId,
          slug: slugToUse,
          name: row.teamName,
          idea: row.projectPitch,
        })
        .select("id")
        .maybeSingle();
      if (playerInsErr || !insPlayer) {
        report.errors.push({
          reason: `players insert "${row.teamName}": ${playerInsErr?.message ?? "unknown"}`,
        });
        continue;
      }
      playerId = (insPlayer as { id: string }).id;
      report.created += 1;
      isNewPlayer = true;
    }

    // Process emails: leader first (team_role='owner'), then members ('contributor').
    const emailEntries: { email: string; teamRole: "owner" | "contributor" }[] = [
      { email: row.leaderEmail, teamRole: "owner" },
      ...row.memberEmails.map((e) => ({ email: e, teamRole: "contributor" as const })),
    ];

    for (const entry of emailEntries) {
      const email = entry.email.toLowerCase();
      try {
        let userId = await resolveUserIdByEmail(email);

        // Invite via service role if user missing.
        if (!userId) {
          if (!adminClient) {
            report.invitesSkipped += 1;
            report.errors.push({
              email,
              reason: "service role missing - invite skipped",
            });
            continue;
          }
          const { data: invite, error: inviteErr } =
            await adminClient.auth.admin.inviteUserByEmail(email, {
              data: { team_name: row.teamName },
            });
          if (inviteErr || !invite?.user) {
            report.errors.push({
              email,
              reason: `invite: ${inviteErr?.message ?? "unknown"}`,
            });
            continue;
          }
          userId = invite.user.id;
          report.invitesSent += 1;
        }

        // Ensure profiles row exists (so role-gating works on first login).
        // Upsert app_role='player' + email; do not override an existing role.
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("user_id, app_role")
          .eq("user_id", userId)
          .maybeSingle();
        if (!existingProfile) {
          const { error: profileInsErr } = await supabase.from("profiles").insert({
            user_id: userId,
            app_role: "player",
            email,
          });
          if (profileInsErr && !profileInsErr.message.includes("duplicate")) {
            report.errors.push({ email, reason: `profile insert: ${profileInsErr.message}` });
          }
        }

        // Idempotent player_member upsert: select first, then insert if missing.
        const { data: existingMember } = await supabase
          .from("player_members")
          .select("id")
          .eq("player_id", playerId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!existingMember) {
          const { error: memberInsErr } = await supabase.from("player_members").insert({
            player_id: playerId,
            user_id: userId,
            role: "player",
            team_role: entry.teamRole,
          });
          if (memberInsErr) {
            // Unique constraint -> treat as already-linked (idempotent).
            if ((memberInsErr as { code?: string }).code !== "23505") {
              report.errors.push({
                email,
                reason: `member insert: ${memberInsErr.message}`,
              });
            }
            continue;
          }
          report.membersAdded += 1;
        }
      } catch (err) {
        report.errors.push({
          email,
          reason: `unexpected: ${(err as Error).message}`,
        });
      }
    }

    // Defensive: if newly created player but no leader linked, log it (not a failure).
    if (isNewPlayer) {
      // no-op marker for readability
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/players/import");

  const ok = report.errors.length === 0;
  const message = ok
    ? `Import termine: ${report.created} cree(s), ${report.alreadyExisted} deja existant(s), ${report.membersAdded} membre(s) ajoute(s), ${report.invitesSent} invite(s).`
    : `Import termine avec ${report.errors.length} erreur(s).`;
  return { ok, message, report };
}

// ============================================================================
// Jury (JURY-01, JURY-02, DATA-04) - Mentor saves 5x20 pitch scores per Player.
// Upsert into pitch_scores with unique (event_id, player_id, juror_id).
// juror_id is forced server-side from auth.uid() (T-05-03 mitigation).
// ============================================================================

// Design v2 (polish/design-v2-match): only c1..c4 are presented to jurors
// (Innovation / Faisabilite technique / Modele economique / Equipe). c5 is
// kept in the DB for backward-compat with the 5-criteria schema (legacy
// scores). New submissions force c5=0; lib/results.ts normalises pitchAvg
// to /100 regardless of the column count (c5>0 ? sum : sum * 5/4).
const pitchScoreSchema = z.object({
  playerId: z.string().uuid(),
  eventId: z.string().uuid(),
  c1: z.coerce.number().int().min(0).max(20),
  c2: z.coerce.number().int().min(0).max(20),
  c3: z.coerce.number().int().min(0).max(20),
  c4: z.coerce.number().int().min(0).max(20),
  c5: z.coerce.number().int().min(0).max(20).optional().default(0),
  // quick-260520-124 V4 — optional per-criterion + global comments (session mode).
  commentC1: z.string().max(500).optional().nullable(),
  commentC2: z.string().max(500).optional().nullable(),
  commentC3: z.string().max(500).optional().nullable(),
  commentC4: z.string().max(500).optional().nullable(),
  commentC5: z.string().max(500).optional().nullable(),
  commentGlobal: z.string().max(2000).optional().nullable(),
  // quick-260520-124 ext (Task 2, 2026-05-20) — isDraft + verdict (panel session).
  // isDraft default false (submit explicite via "Valider") ; "true" string en
  // provenance de <button name="isDraft" value="true"> coerce en boolean.
  isDraft: z.coerce.boolean().optional().default(false),
  verdict: z
    .enum(["not_convinced", "needs_work", "convinced", "favorite"])
    .optional()
    .nullable(),
  // Phase 16: optional dynamic scores jsonb (format: JSON object key->number).
  // Tolerant: absent or parse failure → legacy c1..c5 path (no breakage).
  scoresJson: z.string().optional().nullable(),
});

export async function savePitchScoreFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Auth backend not configured." };
  }
  const parsed = pitchScoreSchema.safeParse({
    playerId: formData.get("playerId"),
    eventId: formData.get("eventId"),
    c1: formData.get("c1"),
    c2: formData.get("c2"),
    c3: formData.get("c3"),
    c4: formData.get("c4"),
    c5: formData.get("c5"),
    // quick-260520-124 V4 — optional comments. Empty strings normalised to null.
    commentC1: formData.get("commentC1") || null,
    commentC2: formData.get("commentC2") || null,
    commentC3: formData.get("commentC3") || null,
    commentC4: formData.get("commentC4") || null,
    commentC5: formData.get("commentC5") || null,
    commentGlobal: formData.get("commentGlobal") || null,
    // quick-260520-124 ext — isDraft + verdict (panel session V3/V4).
    // FormData.get returns null when absent ; Zod default kicks in for isDraft.
    isDraft: formData.get("isDraft"),
    verdict: formData.get("verdict") || null,
    // Phase 16: dynamic scores jsonb. Empty string normalized to null (legacy path).
    scoresJson: formData.get("scoresJson") || null,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Auth backend not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  // Role gate (defense-in-depth alongside RLS).
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "mentor" && role !== "game_master") {
    return { ok: false, message: "Acces reserve aux Mentors." };
  }

  // Upsert with onConflict on the triple key (event_id, player_id, juror_id).
  // juror_id is set from auth.uid() server-side, never read from FormData.
  // quick-260520-124 V4 — include optional comment fields. Upsert payload only
  // contains comment keys if NOT undefined, so the JSON serialisation skips
  // them when V1/V3 (no comments) submits, keeping the legacy path
  // schema-tolerant if the migration is not yet applied.
  const hasComments =
    parsed.data.commentC1 !== undefined ||
    parsed.data.commentC2 !== undefined ||
    parsed.data.commentC3 !== undefined ||
    parsed.data.commentC4 !== undefined ||
    parsed.data.commentC5 !== undefined ||
    parsed.data.commentGlobal !== undefined;
  const payload: Record<string, unknown> = {
    event_id: parsed.data.eventId,
    player_id: parsed.data.playerId,
    juror_id: user.id,
    c1: parsed.data.c1,
    c2: parsed.data.c2,
    c3: parsed.data.c3,
    c4: parsed.data.c4,
    c5: parsed.data.c5,
  };
  if (hasComments) {
    payload.comment_c1 = parsed.data.commentC1 ?? null;
    payload.comment_c2 = parsed.data.commentC2 ?? null;
    payload.comment_c3 = parsed.data.commentC3 ?? null;
    payload.comment_c4 = parsed.data.commentC4 ?? null;
    payload.comment_c5 = parsed.data.commentC5 ?? null;
    payload.comment_global = parsed.data.commentGlobal ?? null;
  }
  // quick-260520-124 ext — is_draft + verdict (panel session). Always include
  // is_draft so the column reflects intent. Verdict only included if non-null
  // to keep payload schema-tolerant (pre-migration : column may not exist).
  payload.is_draft = parsed.data.isDraft;
  if (parsed.data.verdict) {
    payload.verdict = parsed.data.verdict;
  }

  // Phase 16: parse scoresJson for dynamic path (tolerant: skip on failure).
  // T-16-04: JSON.parse ignore on failure — legacy c1..c5 path remains authoritative.
  if (parsed.data.scoresJson) {
    try {
      const scoresPayload = JSON.parse(parsed.data.scoresJson) as Record<string, number>;
      if (scoresPayload && typeof scoresPayload === "object" && !Array.isArray(scoresPayload)) {
        if (Object.keys(scoresPayload).length > 0) {
          payload.scores = scoresPayload;
        }
      }
    } catch {
      // Ignore parse failure — legacy c1..c5 path used
    }
  }

  const { error: upsertErr } = await supabase
    .from("pitch_scores")
    .upsert(payload, { onConflict: "event_id,player_id,juror_id" });
  if (upsertErr) {
    // quick-260520-124 ext — graceful degradation if migration not yet applied.
    const msg = upsertErr.message ?? "";
    if (msg.includes("is_draft") || msg.includes("verdict")) {
      delete payload.is_draft;
      delete payload.verdict;
      const { error: retryErr } = await supabase
        .from("pitch_scores")
        .upsert(payload, { onConflict: "event_id,player_id,juror_id" });
      if (retryErr) {
        return { ok: false, message: retryErr.message };
      }
    } else if (msg.includes("scores") || msg.includes("column")) {
      // Phase 16: pre-migration tolerance for scores column not yet applied.
      delete payload.scores;
      const { error: retryErr } = await supabase
        .from("pitch_scores")
        .upsert(payload, { onConflict: "event_id,player_id,juror_id" });
      if (retryErr) {
        return { ok: false, message: retryErr.message };
      }
    } else {
      return { ok: false, message: upsertErr.message };
    }
  }

  revalidatePath("/jury");
  revalidatePath("/results");
  // quick-260520-124 ext — toast varies by isDraft.
  return {
    ok: true,
    message: parsed.data.isDraft
      ? "Brouillon enregistre. Tu peux ajuster et valider plus tard."
      : "Notes enregistrees.",
  };
}

// ============================================================================
// Results publication (JURY-05, DATA-04) - GameMaster only.
// Sets events.results_published_at; idempotent (re-publish returns ok with
// "deja publies" message).
// ============================================================================

const publishResultsSchema = z.object({
  eventId: z.string().uuid(),
});

export async function publishResultsFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Auth backend not configured." };
  }
  const parsed = publishResultsSchema.safeParse({
    eventId: formData.get("eventId"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Auth backend not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  // Role gate (T-05-06): only game_master may publish.
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve au GameMaster." };
  }

  // Load event.
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id, results_published_at")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (eventErr) {
    return { ok: false, message: eventErr.message };
  }
  if (!eventRow) {
    return { ok: false, message: "Aucun event actif." };
  }
  const event = eventRow as { id: string; results_published_at: string | null };

  // Idempotent: already published -> ok with explicit message.
  if (event.results_published_at) {
    revalidatePath("/results");
    return { ok: true, message: "Resultats deja publies." };
  }

  // Guard against publishing a ranking with players missing pitch jury votes
  // (defensive pre-pilot fix B, AgreenTech 2026-05-11). Without this guard,
  // a player with 0 pitch_scores receives pitchAvg=0 → combined=0.20*scoreProject
  // and appears at the bottom of the ranking silently. Force GM to verify
  // jury attendance before publication.
  const { data: cohortRows, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", event.id);
  if (cohortErr) {
    return { ok: false, message: cohortErr.message };
  }
  const cohortIds = ((cohortRows ?? []) as { id: string }[]).map((r) => r.id);
  if (cohortIds.length > 0) {
    const { data: playerRows, error: playerErr } = await supabase
      .from("players")
      .select("id, name")
      .in("cohort_id", cohortIds);
    if (playerErr) {
      return { ok: false, message: playerErr.message };
    }
    const players = (playerRows ?? []) as { id: string; name: string }[];

    const { data: scoreRows, error: scoreErr } = await supabase
      .from("pitch_scores")
      .select("player_id")
      .eq("event_id", event.id);
    if (scoreErr) {
      return { ok: false, message: scoreErr.message };
    }
    const scoredSet = new Set<string>();
    for (const r of (scoreRows ?? []) as { player_id: string }[]) {
      scoredSet.add(r.player_id);
    }

    const missingPlayers = players
      .filter((p) => !scoredSet.has(p.id))
      .map((p) => p.name);
    if (missingPlayers.length > 0) {
      const preview = missingPlayers.slice(0, 5).join(", ");
      const suffix = missingPlayers.length > 5 ? "..." : "";
      const plural = missingPlayers.length > 1 ? "s" : "";
      return {
        ok: false,
        severity: "error",
        message: `Publication bloquee : ${missingPlayers.length} porteur${plural} sans note jury (${preview}${suffix}). Verifiez le vote des jures avant publication.`,
      };
    }
  }

  // Conditional update (only when still null) to avoid races.
  const { error: updErr } = await supabase
    .from("events")
    .update({ results_published_at: new Date().toISOString() })
    .eq("id", event.id)
    .is("results_published_at", null);
  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  revalidatePath("/results");
  return { ok: true, message: "Resultats publies." };
}

// ============================================================================
// Phase 9 — GameMaster live mode (GMR-06, GMR-09)
// ============================================================================

// ---- GMR-06 — toggle deliverable_templates.is_active -----------------------

const toggleDeliverableSchema = z.object({
  templateId: z.string().uuid(),
  nextActive: z.coerce.boolean(),
});

export async function toggleDeliverableActiveFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const rawNext = formData.get("nextActive");
  const parsed = toggleDeliverableSchema.safeParse({
    templateId: formData.get("templateId"),
    nextActive: rawNext === "true" || rawNext === "1" || rawNext === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  // Role gate (defense-in-depth alongside RLS).
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve au GameMaster." };
  }

  const { error: updErr } = await supabase
    .from("deliverable_templates")
    .update({ is_active: parsed.data.nextActive })
    .eq("id", parsed.data.templateId);
  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  revalidatePath("/admin/deliverables");
  revalidatePath("/journey");
  return {
    ok: true,
    message: parsed.data.nextActive ? "Livrable active." : "Livrable masque.",
  };
}

// ---- GMR-09 — create announcement ------------------------------------------

const announcementSchema = z
  .object({
    kind: z.enum(["info", "urgence", "celebration", "appel"]),
    targetKind: z.enum(["all", "level", "teams", "mentors"]),
    targetIds: z.array(z.string()).default([]),
    body: z.string().min(1).max(2000),
    title: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetKind === "level" || data.targetKind === "teams") {
      if (!data.targetIds || data.targetIds.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Selectionnez au moins une cible.",
          path: ["targetIds"],
        });
      }
    }
  });

export async function createAnnouncementFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  // targetIds may arrive as multiple form values for the same name. We collect
  // both `targetIds` (multi-select) and a CSV-encoded fallback `targetIdsCsv`.
  let targetIds: string[] = formData.getAll("targetIds").map(String).filter(Boolean);
  if (targetIds.length === 0) {
    const csv = formData.get("targetIdsCsv");
    if (typeof csv === "string" && csv.length > 0) {
      targetIds = csv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const rawBody = formData.get("body");
  const rawTitle = formData.get("title");
  const parsed = announcementSchema.safeParse({
    kind: formData.get("kind"),
    targetKind: formData.get("targetKind"),
    targetIds,
    body: typeof rawBody === "string" ? rawBody.trim() : rawBody,
    title:
      typeof rawTitle === "string" && rawTitle.trim().length > 0 ? rawTitle.trim() : undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  // Role gate (defense-in-depth alongside RLS).
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve au GameMaster." };
  }

  // Resolve current event (GM-designated active event via is_active).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    return { ok: false, message: eventErr.message };
  }
  if (!eventRow) {
    return { ok: false, message: "Aucun event configure." };
  }
  const eventId = (eventRow as { id: string }).id;

  const { error: insErr } = await supabase.from("announcements").insert({
    event_id: eventId,
    kind: parsed.data.kind,
    target_kind: parsed.data.targetKind,
    target_ids:
      parsed.data.targetKind === "all" || parsed.data.targetKind === "mentors"
        ? []
        : parsed.data.targetIds,
    body: parsed.data.body,
    title: parsed.data.title ?? null,
    created_by_user_id: user.id,
  });
  if (insErr) {
    return { ok: false, message: insErr.message };
  }

  revalidatePath("/admin/announce");
  revalidatePath("/journey");
  return { ok: true, message: "Annonce diffusee." };
}

// ============================================================================
// Bonus events (T3X-EXPANSION wave 2 / plan 06 — D-02 / D-03)
// Player submit URL preuve -> INSERT bonus_events status='submitted'
// Mentor review -> UPDATE status='validated'|'rejected' + reviewed_by/at + feedback
// R1 preserved : multiplier_factor stocke en DB / TS, JAMAIS dans WorkflowState.message
// R2 preserved : zod safeParse + return {ok:false, message}, no throw
// R3 preserved : aucun blocage cross-mission via cette action
// ============================================================================

const bonusClaimSchema = z.object({
  type: z.enum(["bonus_verbatims_terrain", "bonus_dev_plan", "bonus_prototype_draft"]),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  docUrl: httpsUrl,
});

export async function claimBonusEventFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const rawDescription = formData.get("description");
  const parsed = bonusClaimSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description:
      typeof rawDescription === "string" && rawDescription.length > 0 ? rawDescription : undefined,
    docUrl: formData.get("docUrl"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return { ok: false, message: "Aucun Player rattache a votre compte." };
  }
  const playerId = (membership as { player_id: string }).player_id;

  // R3 : pas de check "deja claime" hard. On autorise re-claim apres rejet.
  // Mais on bloque double "submitted" en attente review (UX clarity, pas pedagogical block).
  const { data: pending } = await supabase
    .from("bonus_events")
    .select("id, status")
    .eq("project_id", playerId)
    .eq("type", parsed.data.type)
    .eq("status", "submitted")
    .maybeSingle();
  if (pending) {
    return { ok: false, message: "Bonus deja soumis, en attente de validation Mentor." };
  }

  const defaults = BONUS_DEFAULTS[parsed.data.type as BonusType];
  // Cap multiplier_factor a BONUS_MULTIPLIER_CAP (defense-in-depth, le DDL CHECK l'enforce aussi)
  const multiplierFactor = Math.min(defaults.multiplierFactor, BONUS_MULTIPLIER_CAP);

  const { error: insErr } = await supabase.from("bonus_events").insert({
    project_id: playerId,
    type: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    doc_url: parsed.data.docUrl,
    status: "submitted",
    multiplier_factor: multiplierFactor,
    multiplier_scope: defaults.scope,
    claimed_by: user.id,
    claimed_at: new Date().toISOString(),
  });
  if (insErr) return { ok: false, message: insErr.message };

  revalidatePath("/journey");
  revalidatePath(`/journey/bonus/${parsed.data.type}`);
  revalidatePath("/mentor");
  return { ok: true, message: "Bonus soumis. Le Mentor va le valider." };
}

const bonusReviewSchema = z.object({
  bonusEventId: z.string().uuid(),
  decision: z.enum(["validated", "rejected"]),
  feedback: z.string().min(0).max(2000),
});

export async function reviewBonusEventFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const rawFeedback = formData.get("feedback");
  const parsed = bonusReviewSchema.safeParse({
    bonusEventId: formData.get("bonusEventId"),
    decision: formData.get("decision"),
    feedback: typeof rawFeedback === "string" ? rawFeedback : "",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  // RLS bonus_events_mentor_update gate via is_mentor() — defense-in-depth applicative aussi
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "mentor" && role !== "game_master") {
    return { ok: false, message: "Action reservee aux Mentors." };
  }

  // WR-01 : guard against re-review (or two mentors stepping on each other).
  // Conditional UPDATE on status='submitted' + select returning rows lets us
  // detect zero-row updates and surface a clear message.
  const { data: updRows, error: updErr } = await supabase
    .from("bonus_events")
    .update({
      status: parsed.data.decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      feedback: parsed.data.feedback,
    })
    .eq("id", parsed.data.bonusEventId)
    .eq("status", "submitted")
    .select("id");
  if (updErr) return { ok: false, message: updErr.message };
  if (!updRows || updRows.length === 0) {
    return { ok: false, message: "Bonus deja evalue ou inexistant." };
  }

  revalidatePath("/mentor");
  revalidatePath(`/mentor/bonus/${parsed.data.bonusEventId}`);
  revalidatePath("/journey");
  return {
    ok: true,
    message:
      parsed.data.decision === "validated"
        ? "Bonus valide. Le Player verra son badge Boost."
        : "Bonus rejete avec feedback.",
  };
}

// ============================================================================
// MoSCoW Kanban (T3X-EXPANSION wave 2 / plan 06 — D-04)
// Player CRUD ses cartes + reorder DnD batch + submit deliverable
// R3 preserve : pas de validation hard >= 2 MUST / >= 1 WONT (warn-only via rubric)
// ============================================================================

const moscowBucketEnum = z.enum(["must", "should", "could", "wont"]);

const moscowCreateSchema = z.object({
  deliverableTemplateId: z.string().uuid(),
  bucket: moscowBucketEnum,
  ord: z.coerce.number().int().min(0).max(999).default(0),
  feature: z.string().min(1).max(200),
  pourquoi: z.string().max(500).default(""),
  contrainte: z.string().max(200).default(""),
});

export async function createMoscowCardFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const rawOrd = formData.get("ord");
  const rawPourquoi = formData.get("pourquoi");
  const rawContrainte = formData.get("contrainte");
  const parsed = moscowCreateSchema.safeParse({
    deliverableTemplateId: formData.get("deliverableTemplateId"),
    bucket: formData.get("bucket"),
    ord: typeof rawOrd === "string" && rawOrd.length > 0 ? rawOrd : 0,
    feature: formData.get("feature"),
    pourquoi: typeof rawPourquoi === "string" ? rawPourquoi : "",
    contrainte: typeof rawContrainte === "string" ? rawContrainte : "",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { ok: false, message: "Aucun Player rattache." };
  const playerId = (membership as { player_id: string }).player_id;

  const { error: insErr } = await supabase.from("moscow_cards").insert({
    project_id: playerId,
    deliverable_template_id: parsed.data.deliverableTemplateId,
    bucket: parsed.data.bucket,
    ord: parsed.data.ord,
    feature: parsed.data.feature,
    pourquoi: parsed.data.pourquoi,
    contrainte: parsed.data.contrainte,
    created_by: user.id,
  });
  if (insErr) return { ok: false, message: insErr.message };

  revalidatePath(`/journey/deliverable/${parsed.data.deliverableTemplateId}`);
  revalidatePath("/journey");
  return { ok: true, message: "Carte ajoutee." };
}

const moscowUpdateSchema = z.object({
  cardId: z.string().uuid(),
  bucket: moscowBucketEnum,
  ord: z.coerce.number().int().min(0).max(999),
  feature: z.string().min(1).max(200),
  pourquoi: z.string().max(500).default(""),
  contrainte: z.string().max(200).default(""),
});

export async function updateMoscowCardFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const rawOrd = formData.get("ord");
  const rawPourquoi = formData.get("pourquoi");
  const rawContrainte = formData.get("contrainte");
  const parsed = moscowUpdateSchema.safeParse({
    cardId: formData.get("cardId"),
    bucket: formData.get("bucket"),
    ord: typeof rawOrd === "string" && rawOrd.length > 0 ? rawOrd : 0,
    feature: formData.get("feature"),
    pourquoi: typeof rawPourquoi === "string" ? rawPourquoi : "",
    contrainte: typeof rawContrainte === "string" ? rawContrainte : "",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const { error: updErr } = await supabase
    .from("moscow_cards")
    .update({
      bucket: parsed.data.bucket,
      ord: parsed.data.ord,
      feature: parsed.data.feature,
      pourquoi: parsed.data.pourquoi,
      contrainte: parsed.data.contrainte,
    })
    .eq("id", parsed.data.cardId);
  if (updErr) return { ok: false, message: updErr.message };

  revalidatePath("/journey");
  return { ok: true, message: "Carte mise a jour." };
}

const moscowDeleteSchema = z.object({
  cardId: z.string().uuid(),
});

export async function deleteMoscowCardFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const parsed = moscowDeleteSchema.safeParse({ cardId: formData.get("cardId") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "ID invalide" };
  }

  const { error: delErr } = await supabase
    .from("moscow_cards")
    .delete()
    .eq("id", parsed.data.cardId);
  if (delErr) return { ok: false, message: delErr.message };

  revalidatePath("/journey");
  return { ok: true, message: "Carte supprimee." };
}

const moscowReorderItemSchema = z.object({
  id: z.string().uuid(),
  bucket: moscowBucketEnum,
  ord: z.coerce.number().int().min(0).max(999),
});

const moscowReorderSchema = z.object({
  deliverableTemplateId: z.string().uuid(),
  items: z.array(moscowReorderItemSchema).min(1).max(200),
});

export async function reorderMoscowCardsFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const rawItems = formData.get("items");
  let items: unknown;
  try {
    items = typeof rawItems === "string" ? JSON.parse(rawItems) : null;
  } catch {
    return { ok: false, message: "Items JSON invalide." };
  }

  const parsed = moscowReorderSchema.safeParse({
    deliverableTemplateId: formData.get("deliverableTemplateId"),
    items,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  // Batch UPDATE via boucle (Supabase JS lib n'a pas de bulk update conditionnel propre)
  for (const it of parsed.data.items) {
    const { error: updErr } = await supabase
      .from("moscow_cards")
      .update({ bucket: it.bucket, ord: it.ord })
      .eq("id", it.id);
    if (updErr) return { ok: false, message: updErr.message };
  }

  revalidatePath(`/journey/deliverable/${parsed.data.deliverableTemplateId}`);
  revalidatePath("/journey");
  return { ok: true, message: "Ordre Kanban sauvegarde." };
}

const moscowSubmitSchema = z.object({
  deliverableTemplateId: z.string().uuid(),
});

export async function submitMoscowDeliverableFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const parsed = moscowSubmitSchema.safeParse({
    deliverableTemplateId: formData.get("deliverableTemplateId"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { ok: false, message: "Aucun Player rattache." };
  const playerId = (membership as { player_id: string }).player_id;

  // R3 warn-only : count >=2 MUST + >=1 WONT pour message d'avertissement (NOT blocage)
  const { data: cards } = await supabase
    .from("moscow_cards")
    .select("bucket")
    .eq("project_id", playerId)
    .eq("deliverable_template_id", parsed.data.deliverableTemplateId);
  const counts: Record<MoscowBucket, number> = { must: 0, should: 0, could: 0, wont: 0 };
  for (const c of (cards ?? []) as { bucket: MoscowBucket }[]) {
    counts[c.bucket]++;
  }

  // Build snapshot URL (Plan 10 implements the route SSR viewer).
  // WR-02 : prefer NEXT_PUBLIC_SITE_URL env var so preview deployments and
  // future hostname changes don't point the snapshot to the wrong origin.
  // Falls back to the prod hostname literal to preserve current behavior
  // when env is unset.
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrepreneur-game-six.vercel.app";
  const snapshotUrl = `${baseUrl}/journey/deliverable/${parsed.data.deliverableTemplateId}/moscow-snapshot?p=${playerId}`;

  // INSERT submission row kind='proof_url' directement (reuse submitDeliverable logic inline)
  const { error: insErr } = await supabase.from("submissions").insert({
    player_id: playerId,
    deliverable_template_id: parsed.data.deliverableTemplateId,
    version: 1,
    kind: "proof_url",
    proof_url: snapshotUrl,
    status: "submitted_v1",
    submitted_by: user.id,
  });
  if (insErr) {
    // Si deja submitted_v1 (unique constraint), ne pas bloquer durement
    if ((insErr as { code?: string }).code === "23505") {
      return {
        ok: false,
        message: "Soumission V1 deja existante. Editez vos cartes puis attendez le feedback Mentor.",
      };
    }
    return { ok: false, message: insErr.message };
  }

  revalidatePath("/journey");
  revalidatePath(`/journey/deliverable/${parsed.data.deliverableTemplateId}`);
  revalidatePath("/mentor");

  // R2/R3 : warn-only message si recommandations non remplies
  const warns: string[] = [];
  if (counts.must < 2) warns.push("recommandation : >=2 cartes MUST");
  if (counts.wont < 1) warns.push("recommandation : >=1 carte WONT (anti scope-creep)");
  const warningSuffix = warns.length > 0 ? ` (${warns.join(" ; ")})` : "";

  return {
    ok: true,
    message: `Kanban MoSCoW soumis V1.${warningSuffix} Le Mentor va le valider.`,
    // WR-05 : structured severity flag — clients style on this rather than
    // substring-matching the French message text.
    severity: warns.length > 0 ? "warn" : "ok",
  };
}

// ============================================================================
// Pitch order (polish/design-v2-match V10) — GameMaster reorders the pitch
// passage order. Persisted in events.pitch_order_json as {playerId: slot}.
// Slots are 1-indexed and contiguous. R1 gate: pitch_order_published_at must
// stay set so Player /journey/pitch-prep can read its slot once published.
// ============================================================================

const setPitchOrderSchema = z.object({
  eventId: z.string().uuid(),
  // JSON-stringified Array<string> of player UUIDs in target order.
  orderedPlayerIds: z.string().min(2).max(8192),
  publish: z.coerce.boolean().optional().default(true),
});

export async function setPitchOrderFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const parsed = setPitchOrderSchema.safeParse({
    eventId: formData.get("eventId"),
    orderedPlayerIds: formData.get("orderedPlayerIds"),
    publish: formData.get("publish"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  let ids: unknown;
  try {
    ids = JSON.parse(parsed.data.orderedPlayerIds);
  } catch {
    return { ok: false, message: "orderedPlayerIds doit etre un JSON Array." };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, message: "Liste d'IDs vide ou invalide." };
  }
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const playerIds = (ids as unknown[]).filter(
    (v): v is string => typeof v === "string" && uuidRe.test(v),
  );
  if (playerIds.length !== (ids as unknown[]).length) {
    return { ok: false, message: "IDs invalides detectes." };
  }
  const dedup = Array.from(new Set(playerIds));
  if (dedup.length !== playerIds.length) {
    return { ok: false, message: "IDs en double dans la liste." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  // Role gate: game_master only.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Reserve au GameMaster." };
  }

  const orderJson: Record<string, number> = {};
  playerIds.forEach((pid, i) => {
    orderJson[pid] = i + 1;
  });

  const patch: Record<string, unknown> = { pitch_order_json: orderJson };
  if (parsed.data.publish) {
    patch.pitch_order_published_at = new Date().toISOString();
  }

  const { error: updErr } = await supabase
    .from("events")
    .update(patch)
    .eq("id", parsed.data.eventId);
  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  revalidatePath("/admin");
  revalidatePath("/jury");
  revalidatePath("/journey/pitch-prep");
  return { ok: true, message: `Ordre de passage enregistre (${playerIds.length} equipes).` };
}

// ============================================================================
// Help Requests (quick-260512-24v) -- Player calls for mentor support
// Dual-mode: demo returns synthetic success. R1 NA / R2 NA / R3 OK.
// ============================================================================

const helpRequestSchema = z.object({
  message: z.string().min(1).max(500),
  // quick-260512-24v deferred #5: optional mission context detected client-side.
  mission_context: z.string().max(120).optional().nullable(),
});

// quick-260512-24v deferred #1: rate-limit — at most 1 open request per Player
// per RATE_LIMIT_WINDOW_SECONDS. Keeps J1/J2 mentor pool from being saturated
// by accidental double-clicks or anxious Players spamming the FAB.
const RATE_LIMIT_WINDOW_SECONDS = 60;

export async function createHelpRequestFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  const parsed = helpRequestSchema.safeParse({
    message: formData.get("message"),
    mission_context: formData.get("mission_context"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Message invalide.",
      severity: "error",
    };
  }
  if (!hasSupabaseEnv()) {
    return {
      ok: true,
      message: "Mode démo — requête simulée.",
      severity: "warn",
    };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configuré.", severity: "error" };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifié.", severity: "error" };
  }

  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const playerId = (membership as { player_id: string } | null)?.player_id;
  if (!playerId) {
    return {
      ok: false,
      message: "Aucun Player rattaché à votre compte.",
      severity: "error",
    };
  }

  // Deferred #1 — rate limit: refuse if a Player already has an unresolved
  // request OR if their latest request was created in the last 60s. Idempotent
  // on accidental double-submit. Mentor still sees the original request.
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000,
  ).toISOString();
  const { data: recent } = await supabase
    .from("help_requests")
    .select("id, status, created_at")
    .eq("player_id", playerId)
    .or(
      `status.in.(open,acknowledged),created_at.gte.${windowStart}`,
    )
    .limit(1);
  if (recent && recent.length > 0) {
    return {
      ok: true,
      message: "Un mentor a déjà ta dernière demande — patiente un instant.",
      severity: "warn",
    };
  }

  const { error } = await supabase.from("help_requests").insert({
    player_id: playerId,
    requested_by: user.id,
    message: parsed.data.message,
    mission_context: parsed.data.mission_context ?? null,
  });
  if (error) {
    return { ok: false, message: error.message, severity: "error" };
  }
  revalidatePath("/mentor");
  revalidatePath("/admin");
  revalidatePath("/journey");

  // Deferred #4 — mailto fallback: build draft addressed to mentor pool + EIC
  // admins. Failure to query emails MUST NOT fail the action — in-app insert
  // already succeeded. mailto: stays optional ("Aussi envoyer par email" button).
  let mailto: string | undefined;
  try {
    const { data: staff } = await supabase
      .from("profiles")
      .select("email, app_role")
      .in("app_role", ["mentor", "game_master", "eic_admin"]);
    const recipients = Array.from(
      new Set(
        (staff ?? [])
          .map((r) => (r as { email: string | null }).email)
          .filter((e): e is string => Boolean(e)),
      ),
    );
    if (recipients.length > 0) {
      const subject = "[EIC Aide] Demande de coup de pouce";
      const body = `${parsed.data.message}\n\n---\nEnvoyé via l'app EIC Venture Journey (in-app + email fallback).`;
      mailto = `mailto:${recipients.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  } catch {
    // Silent: mailto is a fallback, in-app insert is the canonical path.
  }

  return {
    ok: true,
    message: "Message envoyé. Un mentor te rejoint.",
    severity: "ok",
    mailto,
  };
}

const helpIdSchema = z.object({ id: z.string().uuid() });

export async function acknowledgeHelpRequest(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) return;
  const parsed = helpIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // Deferred #3 — mentor self-claim: also assign the mentor to the request
  // so the inbox can render an "assignée à moi" badge. Idempotent: if
  // assigned_mentor_id was already set (another mentor claimed first), this
  // update is a no-op because of the `is null` filter below.
  await supabase
    .from("help_requests")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
      assigned_mentor_id: user.id,
    })
    .eq("id", parsed.data.id)
    .eq("status", "open")
    .is("assigned_mentor_id", null); // idempotent — first-clicker wins
  revalidatePath("/mentor");
  revalidatePath("/admin");
}

export async function assignHelpRequest(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) return;
  const parsed = helpIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // Deferred #3 — explicit "Je prends" without changing status. First-clicker
  // wins via `is null` filter. Mentor can still ack/resolve afterwards.
  await supabase
    .from("help_requests")
    .update({ assigned_mentor_id: user.id })
    .eq("id", parsed.data.id)
    .is("assigned_mentor_id", null);
  revalidatePath("/mentor");
  revalidatePath("/admin");
}

export async function resolveHelpRequest(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) return;
  const parsed = helpIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("help_requests")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", parsed.data.id)
    .in("status", ["open", "acknowledged"]);
  revalidatePath("/mentor");
  revalidatePath("/admin");
}

// ============================================================================
// Pitch mode + Jurors (quick-260519-jpr Wave 2 - GameMaster only)
// ============================================================================

// ---- setPitchModeStateFlow ------------------------------------------------
// State machine transitions allowed:
//   off ↔ live
//   live ↔ closed
//   closed → off (reset for a new cycle)
// Forbidden: off→closed direct, live→off direct (force pass-through).
const pitchModeTransitions: Record<PitchModeState, PitchModeState[]> = {
  off: ["live"],
  live: ["off", "closed"],
  closed: ["live", "off"],
};

const setPitchModeStateSchema = z.object({
  eventId: z.string().uuid(),
  next: z.enum(["off", "live", "closed"]),
});

export async function setPitchModeStateFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configuré." };
  }
  const parsed = setPitchModeStateSchema.safeParse({
    eventId: formData.get("eventId"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configuré." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Réservé GameMaster." };
  }

  // Load current state to validate transition.
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("pitch_mode_state")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (eventErr) return { ok: false, message: eventErr.message };
  if (!eventRow) return { ok: false, message: "Événement introuvable." };
  const current = ((eventRow as { pitch_mode_state: PitchModeState | null }).pitch_mode_state ??
    "off") as PitchModeState;
  const next = parsed.data.next;

  if (current === next) {
    return { ok: true, message: `Mode pitch déjà : ${next}` };
  }
  if (!pitchModeTransitions[current].includes(next)) {
    return { ok: false, message: "Transition non autorisée." };
  }

  // Guard: cannot go live without at least one juror invited.
  if (next === "live") {
    const { count, error: countErr } = await supabase
      .from("jurors")
      .select("user_id", { count: "exact", head: true })
      .eq("event_id", parsed.data.eventId);
    if (countErr) return { ok: false, message: countErr.message };
    if (!count || count === 0) {
      return {
        ok: false,
        message: "Invite au moins un juror avant de passer en live.",
      };
    }
  }

  const { error: updErr } = await supabase
    .from("events")
    .update({ pitch_mode_state: next })
    .eq("id", parsed.data.eventId);
  if (updErr) return { ok: false, message: updErr.message };

  revalidatePath("/admin");
  revalidatePath("/jury");
  revalidatePath("/results");
  return { ok: true, message: `Mode pitch : ${next}` };
}

// ---- addJurorFlow ---------------------------------------------------------
const addJurorSchema = z.object({
  eventId: z.string().uuid(),
  email: z.string().email(),
});

export async function addJurorFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configuré." };
  }
  const parsed = addJurorSchema.safeParse({
    eventId: formData.get("eventId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configuré." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Réservé GameMaster." };
  }

  const result = await addJurorByEmail(parsed.data.eventId, parsed.data.email);
  if (result.ok) {
    revalidatePath("/admin");
  }
  return { ok: result.ok, message: result.message };
}

// ---- removeJurorFlow ------------------------------------------------------
const removeJurorSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function removeJurorFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configuré." };
  }
  const parsed = removeJurorSchema.safeParse({
    eventId: formData.get("eventId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configuré." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Réservé GameMaster." };
  }

  const result = await removeJuror(parsed.data.eventId, parsed.data.userId);
  if (result.ok) {
    revalidatePath("/admin");
  }
  return { ok: result.ok, message: result.message };
}

// ---- ENGINE-04 — create event + cohort --------------------------------------

const createEventSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug doit etre en minuscules, chiffres et tirets uniquement."),
  organizationId: z.string().uuid().nullable().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  cohortName: z.string().min(1),
});

export async function createEventFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const rawOrgId = formData.get("organizationId");
  const parsed = createEventSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    organizationId: typeof rawOrgId === "string" && rawOrgId.length > 0 ? rawOrgId : null,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    cohortName: formData.get("cohortName"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve au GameMaster." };
  }

  const { data: newEvent, error: eventErr } = await supabase
    .from("events")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      organization_id: parsed.data.organizationId ?? null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      is_active: false,
    })
    .select("id")
    .single();
  if (eventErr || !newEvent) {
    return { ok: false, message: eventErr?.message ?? "Erreur creation event." };
  }

  const { error: cohortErr } = await supabase.from("cohorts").insert({
    event_id: (newEvent as { id: string }).id,
    slug: parsed.data.slug,
    name: parsed.data.cohortName,
  });
  if (cohortErr) {
    return { ok: false, message: cohortErr.message };
  }

  revalidatePath("/admin/events");
  return { ok: true, message: "Event cree avec succes." };
}

// ---- ENGINE-03 / TENANT-03 — activate event (single-active invariant) -------

const activateEventSchema = z.object({
  eventId: z.string().uuid(),
});

export async function activateEventFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const parsed = activateEventSchema.safeParse({
    eventId: formData.get("eventId"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve au GameMaster." };
  }

  // Resolve the event's organization_id so we can scope the deactivation.
  const { data: evtRow, error: evtErr } = await supabase
    .from("events")
    .select("organization_id")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (evtErr) {
    return { ok: false, message: evtErr.message };
  }

  const orgId = (evtRow as { organization_id: string | null } | null)?.organization_id ?? null;

  // Step 1: deactivate all events in the same org (single-active invariant).
  // Always scope: org events when orgId is set, null-org events only when orgId is null.
  // Never issue an unbounded UPDATE (would deactivate every event across all orgs).
  let deactivateQuery = supabase.from("events").update({ is_active: false });
  if (orgId) {
    deactivateQuery = deactivateQuery.eq("organization_id", orgId) as typeof deactivateQuery;
  } else {
    deactivateQuery = deactivateQuery.is("organization_id", null) as typeof deactivateQuery;
  }
  const { error: deactivateErr } = await deactivateQuery;
  if (deactivateErr) {
    return { ok: false, message: deactivateErr.message };
  }

  // Step 2: activate target event.
  const { error: activateErr } = await supabase
    .from("events")
    .update({ is_active: true })
    .eq("id", parsed.data.eventId);
  if (activateErr) {
    return { ok: false, message: activateErr.message };
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin");
  revalidatePath("/journey");
  return { ok: true, message: "Event active." };
}

// ---- ENGINE-03 — clone event (missions + templates, self-FK remap) ----------

const cloneEventSchema = z.object({
  eventId: z.string().uuid(),
});

type MissionRow = {
  id: string;
  event_id: string;
  title: string;
  level_id: string | null;
  ord: number;
  kind: string | null;
  scheduled_at: string | null;
};

type TemplateRow = {
  id: string;
  mission_id: string;
  slug: string;
  title: string;
  description: string | null;
  rubric: unknown;
  max_score: number;
  ord: number;
  is_bonus: boolean;
  is_active: boolean | null;
  composer_kind: string | null;
  template_url: string | null;
  auto_validate: boolean | null;
  soft_recommends_before: string | null;
  validation_rules: unknown;
};

export async function cloneEventFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const parsed = cloneEventSchema.safeParse({
    eventId: formData.get("eventId"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifie." };
  }

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve au GameMaster." };
  }

  // 1. Fetch source event.
  const { data: srcEvent, error: srcEvtErr } = await supabase
    .from("events")
    .select("id, slug, name, starts_at, ends_at, organization_id, is_active")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (srcEvtErr || !srcEvent) {
    return { ok: false, message: srcEvtErr?.message ?? "Event source introuvable." };
  }

  const src = srcEvent as {
    id: string;
    slug: string;
    name: string;
    starts_at: string;
    ends_at: string;
    organization_id: string | null;
    is_active: boolean | null;
  };

  // 2. Insert cloned event.
  const clonedSlug = `${src.slug}-clone-${Date.now()}`;
  const { data: newEvent, error: newEvtErr } = await supabase
    .from("events")
    .insert({
      name: `${src.name} (copie)`,
      slug: clonedSlug,
      starts_at: src.starts_at,
      ends_at: src.ends_at,
      organization_id: src.organization_id,
      is_active: false,
    })
    .select("id")
    .single();
  if (newEvtErr || !newEvent) {
    return { ok: false, message: newEvtErr?.message ?? "Erreur creation event clone." };
  }
  const newEventId = (newEvent as { id: string }).id;

  // 3. Fetch source missions.
  const { data: srcMissions, error: missionErr } = await supabase
    .from("missions")
    .select("id, event_id, title, level_id, ord, kind, scheduled_at")
    .eq("event_id", parsed.data.eventId)
    .order("ord", { ascending: true });
  if (missionErr) {
    return { ok: false, message: missionErr.message };
  }

  // old mission id -> new mission id
  const missionIdMap = new Map<string, string>();

  for (const m of (srcMissions ?? []) as MissionRow[]) {
    const { data: newMission, error: mErr } = await supabase
      .from("missions")
      .insert({
        event_id: newEventId,
        title: m.title,
        level_id: m.level_id,
        ord: m.ord,
        kind: m.kind,
        scheduled_at: m.scheduled_at,
      })
      .select("id")
      .single();
    if (mErr || !newMission) {
      return { ok: false, message: mErr?.message ?? "Erreur clonage mission." };
    }
    missionIdMap.set(m.id, (newMission as { id: string }).id);
  }

  // 4. Fetch source deliverable_templates for all source missions.
  const srcMissionIds = (srcMissions ?? []).map((m: MissionRow) => m.id);
  let srcTemplates: TemplateRow[] = [];
  if (srcMissionIds.length > 0) {
    const { data: tplData, error: tplErr } = await supabase
      .from("deliverable_templates")
      .select(
        "id, mission_id, slug, title, description, rubric, max_score, ord, is_bonus, is_active, composer_kind, template_url, auto_validate, soft_recommends_before, validation_rules",
      )
      .in("mission_id", srcMissionIds)
      .order("ord", { ascending: true });
    if (tplErr) {
      return { ok: false, message: tplErr.message };
    }
    srcTemplates = (tplData ?? []) as TemplateRow[];
  }

  // old template id -> new template id
  const templateIdMap = new Map<string, string>();

  // WR-05: single timestamp + per-item index to guarantee unique slugs even
  // when the loop completes within the same millisecond.
  const cloneTs = Date.now();

  // Pass 1: insert all clones with soft_recommends_before=null (avoids self-FK constraint during insert).
  for (let tplIdx = 0; tplIdx < srcTemplates.length; tplIdx++) {
    const tpl = srcTemplates[tplIdx];
    const newMissionId = missionIdMap.get(tpl.mission_id);
    if (!newMissionId) {
      return { ok: false, message: `Mission cible introuvable pour template ${tpl.slug}.` };
    }
    const { data: newTpl, error: tplInsertErr } = await supabase
      .from("deliverable_templates")
      .insert({
        mission_id: newMissionId,
        slug: `${tpl.slug}-clone-${cloneTs}-${tplIdx}`,
        title: tpl.title,
        description: tpl.description,
        rubric: tpl.rubric,
        max_score: tpl.max_score,
        ord: tpl.ord,
        is_bonus: tpl.is_bonus,
        is_active: tpl.is_active === null ? true : tpl.is_active,
        composer_kind: tpl.composer_kind ?? "simple",
        template_url: tpl.template_url,
        auto_validate: tpl.auto_validate ?? false,
        soft_recommends_before: null,
        validation_rules: tpl.validation_rules ?? [],
      })
      .select("id")
      .single();
    if (tplInsertErr || !newTpl) {
      return { ok: false, message: tplInsertErr?.message ?? "Erreur clonage template." };
    }
    templateIdMap.set(tpl.id, (newTpl as { id: string }).id);
  }

  // Pass 2: remap soft_recommends_before via old->new template map.
  // Only templates that had a non-null soft_recommends_before need updating.
  // CR-03: on any remap failure, best-effort cleanup to avoid orphaned records.
  for (const tpl of srcTemplates) {
    if (!tpl.soft_recommends_before) continue;
    const newTplId = templateIdMap.get(tpl.id);
    const newPrereqId = templateIdMap.get(tpl.soft_recommends_before);
    if (!newTplId) continue;
    // If the prereq exists in the clone map, remap; otherwise leave null (points to outside the clone).
    if (!newPrereqId) continue;
    const { error: remapErr } = await supabase
      .from("deliverable_templates")
      .update({ soft_recommends_before: newPrereqId })
      .eq("id", newTplId);
    if (remapErr) {
      // Best-effort cleanup: delete cloned templates, missions, event (FK-safe order).
      const newTemplateIds = [...templateIdMap.values()];
      if (newTemplateIds.length > 0) {
        await supabase.from("deliverable_templates").delete().in("id", newTemplateIds);
      }
      const newMissionIds = [...missionIdMap.values()];
      if (newMissionIds.length > 0) {
        await supabase.from("missions").delete().in("id", newMissionIds);
      }
      await supabase.from("events").delete().eq("id", newEventId);
      return { ok: false, message: `Clone echoue (nettoyage effectue): ${remapErr.message}` };
    }
  }

  revalidatePath("/admin/events");
  return {
    ok: true,
    message: `Event clone avec succes. Vous pouvez maintenant le modifier. /admin/events/${newEventId}/missions`,
  };
}

// ============================================================================
// Phase 15 / Plan 03 — Mission CRUD + reorder + template save (ENGINE-01/02)
// ============================================================================

// ---- createMissionFlow ------------------------------------------------------

const createMissionSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1),
  levelId: z.string().min(1),
  kind: z.enum(["atelier", "session", "presentation", "pitch", "admin"]),
  scheduledAt: z.string().nullable().optional(),
  ord: z.coerce.number().int().min(0),
});

export async function createMissionFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Mode demo — aucune ecriture possible." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const parsed = createMissionSchema.safeParse({
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    levelId: formData.get("levelId"),
    kind: formData.get("kind"),
    scheduledAt: formData.get("scheduledAt") || null,
    ord: formData.get("ord"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  const { error: insertErr } = await supabase
    .from("missions")
    .insert({
      event_id: parsed.data.eventId,
      title: parsed.data.title,
      level_id: parsed.data.levelId,
      kind: parsed.data.kind,
      scheduled_at: parsed.data.scheduledAt ?? null,
      ord: parsed.data.ord,
    });
  if (insertErr) return { ok: false, message: insertErr.message };

  revalidatePath(`/admin/events/${parsed.data.eventId}/missions`, "page");
  revalidatePath("/journey");
  return { ok: true, message: "Mission creee." };
}

// ---- updateMissionFlow ------------------------------------------------------

const updateMissionSchema = z.object({
  missionId: z.string().uuid(),
  eventId: z.string().uuid(),
  title: z.string().min(1),
  levelId: z.string().min(1),
  kind: z.enum(["atelier", "session", "presentation", "pitch", "admin"]),
  scheduledAt: z.string().nullable().optional(),
  ord: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean(),
});

export async function updateMissionFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Mode demo — aucune ecriture possible." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const rawIsActive = formData.get("isActive");
  const parsed = updateMissionSchema.safeParse({
    missionId: formData.get("missionId"),
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    levelId: formData.get("levelId"),
    kind: formData.get("kind"),
    scheduledAt: formData.get("scheduledAt") || null,
    ord: formData.get("ord"),
    isActive: rawIsActive === "true" || rawIsActive === "1" || rawIsActive === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  const { error: updErr } = await supabase
    .from("missions")
    .update({
      title: parsed.data.title,
      level_id: parsed.data.levelId,
      kind: parsed.data.kind,
      scheduled_at: parsed.data.scheduledAt ?? null,
      ord: parsed.data.ord,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.missionId);
  if (updErr) return { ok: false, message: updErr.message };

  revalidatePath(`/admin/events/${parsed.data.eventId}/missions`, "page");
  revalidatePath("/journey");
  return { ok: true, message: "Mission mise a jour." };
}

// ---- reorderMissionFlow -----------------------------------------------------

const reorderMissionSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(
    z.object({ id: z.string().uuid(), ord: z.number().int().min(0) })
  ),
});

export async function reorderMissionFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Mode demo — aucune ecriture possible." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(formData.get("items") as string ?? "[]");
  } catch {
    return { ok: false, message: "Donnees de reorder invalides." };
  }

  const parsed = reorderMissionSchema.safeParse({
    eventId: formData.get("eventId"),
    items: rawItems,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  // Batch UPDATE loop (same pattern as reorderMoscowCardsFlow)
  for (const it of parsed.data.items) {
    const { error: updErr } = await supabase
      .from("missions")
      .update({ ord: it.ord })
      .eq("id", it.id);
    if (updErr) return { ok: false, message: updErr.message };
  }

  revalidatePath(`/admin/events/${parsed.data.eventId}/missions`, "page");
  revalidatePath("/journey");
  return { ok: true, message: "Ordre sauvegarde." };
}

// ---- saveDeliverableTemplateFlow --------------------------------------------

// slugifyToKey imported from @/lib/schemas (WR-02 canonical implementation)

const saveDeliverableTemplateSchema = z.object({
  templateId: z.string().uuid().nullable().optional(),
  missionId: z.string().uuid(),
  eventId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  composerKind: composerKindSchema,
  templateUrl: httpsUrl.nullable().optional(),
  autoValidate: z.coerce.boolean(),
  isBonus: z.coerce.boolean(),
  maxScore: z.coerce.number().int().min(1).max(200),
  ord: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean(),
  softRecommendsBefore: z.string().uuid().nullable().optional(),
  rubric: rubricSchema,
  validationRules: z.array(validationRuleSchema),
});

export async function saveDeliverableTemplateFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Mode demo — aucune ecriture possible." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  // Parse rubric JSON from hidden input
  let rawRubric: unknown;
  let rawValidationRules: unknown;
  try {
    rawRubric = JSON.parse(formData.get("rubric") as string ?? "[]");
  } catch {
    return { ok: false, message: "Rubric JSON invalide." };
  }
  try {
    rawValidationRules = JSON.parse(formData.get("validationRules") as string ?? "[]");
  } catch {
    return { ok: false, message: "ValidationRules JSON invalide." };
  }

  const rawTemplateId = formData.get("templateId") as string | null;
  const rawSoftRecommends = formData.get("softRecommendsBefore") as string | null;
  const rawTemplateUrl = formData.get("templateUrl") as string | null;

  const parsed = saveDeliverableTemplateSchema.safeParse({
    templateId: rawTemplateId || null,
    missionId: formData.get("missionId"),
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    composerKind: formData.get("composerKind"),
    templateUrl: rawTemplateUrl || null,
    autoValidate: formData.get("autoValidate") === "true" || formData.get("autoValidate") === "on",
    isBonus: formData.get("isBonus") === "true" || formData.get("isBonus") === "on",
    maxScore: formData.get("maxScore"),
    ord: formData.get("ord"),
    isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on" || formData.get("isActive") === null,
    softRecommendsBefore: rawSoftRecommends || null,
    rubric: rawRubric,
    validationRules: rawValidationRules,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  // Normalize rubric: ensure each criterion has a key (slugify from label when absent).
  // CRITICAL: rubric MUST be stored as [{key, label, max}] — mentor eval forms depend on this exact shape.
  const normalizedRubric = parsed.data.rubric.map((c) => ({
    key: c.key && c.key.trim() ? c.key.trim() : slugifyToKey(c.label),
    label: c.label,
    max: c.max,
  }));

  const payload = {
    mission_id: parsed.data.missionId,
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description,
    composer_kind: parsed.data.composerKind,
    template_url: parsed.data.templateUrl ?? null,
    auto_validate: parsed.data.autoValidate,
    is_bonus: parsed.data.isBonus,
    max_score: parsed.data.maxScore,
    ord: parsed.data.ord,
    is_active: parsed.data.isActive,
    soft_recommends_before: parsed.data.softRecommendsBefore ?? null,
    rubric: normalizedRubric,
    validation_rules: parsed.data.validationRules,
  };

  if (parsed.data.templateId) {
    // UPDATE existing template
    const { error: updErr } = await supabase
      .from("deliverable_templates")
      .update(payload)
      .eq("id", parsed.data.templateId);
    if (updErr) return { ok: false, message: updErr.message };
  } else {
    // INSERT new template
    const { error: insertErr } = await supabase
      .from("deliverable_templates")
      .insert(payload);
    if (insertErr) return { ok: false, message: insertErr.message };
  }

  revalidatePath(`/admin/events/${parsed.data.eventId}/missions`, "page");
  revalidatePath("/journey");
  revalidatePath("/mentor");
  return { ok: true, message: "Livrable enregistre." };
}

// ============================================================================
// Phase 15 / Plan 04 — Program levels CRUD (LEVELS-04)
// ============================================================================

const createLevelSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  ord: z.coerce.number().int().min(0),
});

export async function createLevelFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const parsed = createLevelSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    description: formData.get("description") ?? undefined,
    ord: formData.get("ord"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  const { error: insErr } = await supabase.from("levels_v2").insert({
    id: parsed.data.id,
    label: parsed.data.label,
    description: parsed.data.description ?? null,
    ord: parsed.data.ord,
  });
  if (insErr) return { ok: false, message: insErr.message };

  revalidatePath("/admin/levels");
  revalidatePath("/journey");
  return { ok: true, message: "Niveau cree." };
}

const updateLevelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
});

export async function updateLevelFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const parsed = updateLevelSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    description: formData.get("description") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  const { error: updErr } = await supabase
    .from("levels_v2")
    .update({ label: parsed.data.label, description: parsed.data.description ?? null })
    .eq("id", parsed.data.id);
  if (updErr) return { ok: false, message: updErr.message };

  revalidatePath("/admin/levels");
  revalidatePath("/journey");
  return { ok: true, message: "Niveau mis a jour." };
}

const reorderLevelSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), ord: z.coerce.number().int().min(0) })).min(1),
});

export async function reorderLevelFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const rawItems = formData.get("items");
  let items: unknown;
  try {
    items = typeof rawItems === "string" ? JSON.parse(rawItems) : null;
  } catch {
    return { ok: false, message: "Items JSON invalide." };
  }

  const parsed = reorderLevelSchema.safeParse({ items });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  for (const it of parsed.data.items) {
    const { error: updErr } = await supabase
      .from("levels_v2")
      .update({ ord: it.ord })
      .eq("id", it.id);
    if (updErr) return { ok: false, message: updErr.message };
  }

  revalidatePath("/admin/levels");
  revalidatePath("/journey");
  return { ok: true, message: "Ordre sauvegarde." };
}

const deleteLevelSchema = z.object({
  id: z.string().min(1),
});

export async function deleteLevelFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Backend non configure." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  const parsed = deleteLevelSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  // Guard: block delete when missions reference this level.
  const { count, error: countErr } = await supabase
    .from("missions")
    .select("id", { count: "exact", head: true })
    .eq("level_id", parsed.data.id);
  if (countErr) return { ok: false, message: countErr.message };

  if (count && count > 0) {
    return {
      ok: false,
      message: `Ce niveau est utilise par ${count} mission${count > 1 ? "s" : ""}.`,
    };
  }

  const { error: delErr } = await supabase
    .from("levels_v2")
    .delete()
    .eq("id", parsed.data.id);
  if (delErr) return { ok: false, message: delErr.message };

  revalidatePath("/admin/levels");
  revalidatePath("/journey");
  return { ok: true, message: "Niveau supprime." };
}

// ============================================================================
// Phase 15 / ENGINE-07 — GM date simulation cookie setter (WR-04)
// ============================================================================

const SIMULATE_DATE_COOKIE = "gsd_simulate_date";

const setSimulatedDateSchema = z.object({
  simulateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

/**
 * Sets or clears the gsd_simulate_date httpOnly cookie (GM-only).
 * Pass simulateDate="" or omit to clear.
 */
export async function setSimulatedDateFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  const raw = (formData.get("simulateDate") as string | null) ?? "";
  const parsed = setSimulatedDateSchema.safeParse({ simulateDate: raw || null });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Date invalide (YYYY-MM-DD)." };
  }

  const cookieStore = await cookies();
  if (parsed.data.simulateDate) {
    cookieStore.set(SIMULATE_DATE_COOKIE, parsed.data.simulateDate, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  } else {
    cookieStore.delete(SIMULATE_DATE_COOKIE);
  }

  revalidatePath("/admin/levels");
  return {
    ok: true,
    message: parsed.data.simulateDate
      ? `Simulation active : ${parsed.data.simulateDate}`
      : "Simulation desactivee.",
  };
}
