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
