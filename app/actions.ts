"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { pathForRole } from "@/lib/auth";
import type { AppRole } from "@/lib/types";

export type WorkflowState = { ok: boolean; message: string };

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

const submissionSchema = z
  .object({
    deliverableTemplateId: z.string().uuid(),
    kind: z.enum(["proof_url", "proof_text"]),
    proofUrl: z.string().optional(),
    proofText: z.string().max(4000).optional(),
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
    return {
      ok: false,
      message: "Une soumission V1 existe deja. Attendez le feedback du Mentor.",
    };
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

const evaluationSchema = z.object({
  submissionId: z.string().uuid(),
  feedback: z.string().min(0).max(4000),
  verdict: z.enum(["validate_v1", "request_v2", "validate_v2", "reject"]),
  // scores are sent as a JSON-encoded Record<string, number> via a hidden input.
  scores: z.record(z.string(), z.coerce.number().min(0).max(100)),
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

  const parsed = evaluationSchema.safeParse({
    submissionId: formData.get("submissionId"),
    feedback: formData.get("feedback") ?? "",
    verdict: formData.get("verdict"),
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
  const { error: insErr } = await supabase.from("evaluations").insert({
    submission_id: submission.id,
    evaluator_id: user.id,
    scores: parsed.data.scores,
    total_score: totalScore,
    feedback: parsed.data.feedback,
    verdict: parsed.data.verdict,
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
  return { ok: true, message: "Evaluation enregistree." };
}
