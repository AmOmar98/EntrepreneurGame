"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const onboardingSchema = z.object({
  teamName: z.string().min(2).max(80),
  idea: z.string().min(10).max(500),
  q1: z.coerce.number().int().min(1).max(5),
  q2: z.coerce.number().int().min(1).max(5),
  q3: z.coerce.number().int().min(1).max(5),
  q4: z.coerce.number().int().min(1).max(5),
  q5: z.coerce.number().int().min(1).max(5),
});

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
      current_level: "L1_problem",
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

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "URL doit commencer par https://");

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
const fichesEntretienSchema = z.object({
  fiches: z
    .array(z.object({ url: httpsUrl }))
    .length(10, "10 fiches d'entretien requises (URL HTTPS chacune)"),
});

const submissionSchema = z
  .object({
    deliverableTemplateId: z.string().uuid(),
    kind: z.enum(["proof_url", "proof_text"]),
    proofUrl: z.string().optional(),
    proofText: z.string().max(16000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "proof_url") {
      const r = httpsUrl.safeParse(data.proofUrl);
      if (!r.success) {
        ctx.addIssue({
          code: "custom",
          message: "URL https:// requise",
          path: ["proofUrl"],
        });
      }
    } else {
      if (!data.proofText || data.proofText.trim().length < 10) {
        ctx.addIssue({
          code: "custom",
          message: "Texte de preuve requis (>=10 caracteres)",
          path: ["proofText"],
        });
      }
    }
  });

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

  // quick-260519-l1l : Resolve template slug to dispatch on special flows
  // (hard-block dependency + auto-validation for fiches-entretien-v1).
  const { data: tplRow, error: tplErr } = await supabase
    .from("deliverable_templates")
    .select("slug")
    .eq("id", parsed.data.deliverableTemplateId)
    .maybeSingle();
  if (tplErr) {
    return { ok: false, message: tplErr.message };
  }
  if (!tplRow) {
    return { ok: false, message: "Livrable inconnu." };
  }
  const templateSlug = (tplRow as { slug: string }).slug;

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
  // fiches-entretien-v1. Player inserts submission with status='validated'.
  // The synthetic evaluations row is now inserted server-side by trigger
  // `trg_auto_eval_fiches_entretien` (SECURITY DEFINER, bypasses RLS
  // `evaluations_mentor_self_insert`) — see
  // .planning/quick/260519-smoke-prod-j1/fix_h1_auto_eval_trigger.sql
  // - Parse 10-URL JSON payload.
  // - Insert submissions row with status='validated' directly.
  // - Trigger fires AFTER INSERT, creates eval row (scores fiche_1..10=25,
  //   total=250, verdict='validate_v1', evaluator=G01 UUID).
  // - Skip mailto (no mentor notif needed for auto-validated submission).
  if (templateSlug === "fiches-entretien-v1") {
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

const evaluationSchema = z
  .object({
    submissionId: z.string().uuid(),
    feedback: z.string().min(0).max(4000),
    verdict: z.enum(["validate_v1", "request_v2", "validate_v2", "reject"]),
    expectedAction: z.string().max(500).optional(),
    // scores are sent as a JSON-encoded Record<string, number> via a hidden input.
    scores: z.record(z.string(), z.coerce.number().min(0).max(25)),
  })
  .superRefine((data, ctx) => {
    // MNT-04 — expected_action MUST be provided (and non-empty) when the
    // verdict is request_v2. Server-side validation; UI mirrors this.
    if (data.verdict === "request_v2") {
      const trimmed = (data.expectedAction ?? "").trim();
      if (trimmed.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["expectedAction"],
          message: "L'action attendue est obligatoire pour une demande de revision.",
        });
      }
    }
  });

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

  // 4. Resolve current event (latest by starts_at).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
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
  const { error: upsertErr } = await supabase.from("pitch_scores").upsert(
    {
      event_id: parsed.data.eventId,
      player_id: parsed.data.playerId,
      juror_id: user.id,
      c1: parsed.data.c1,
      c2: parsed.data.c2,
      c3: parsed.data.c3,
      c4: parsed.data.c4,
      c5: parsed.data.c5,
    },
    { onConflict: "event_id,player_id,juror_id" },
  );
  if (upsertErr) {
    return { ok: false, message: upsertErr.message };
  }

  revalidatePath("/jury");
  revalidatePath("/results");
  return { ok: true, message: "Notes enregistrees." };
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

  // Resolve current event (latest by starts_at — same heuristic as elsewhere).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
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
