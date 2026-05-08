"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { bonusRules, calculateBonusClaim, type BonusType } from "@/lib/data";
import { createClient } from "@/utils/supabase/server";

export type WorkflowState = {
  ok: boolean;
  message: string;
  mailto?: string;
};

const httpsUrl = z.string().url().refine((value) => value.startsWith("https://"), "Only https:// links are accepted.");

const deliverableSchema = z.object({
  projectId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(3),
  docUrl: httpsUrl,
  checkpoint: z.enum(["make_it", "sell_it", "look_after_it"]),
  stage: z.enum(["L0_diagnostic", "L1_problem", "L2_solution", "L3_traction", "L4_committee", "L5_alumni"]),
  baseXp: z.coerce.number().min(25).max(150),
});

const bonusSchema = z.object({
  projectId: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum([
    "prospect_interviews",
    "waitlist",
    "demo_ready",
    "first_sale",
    "additional_sales",
    "pilot_commitment",
    "retention_followup",
  ]),
  title: z.string().min(3),
  proofUrl: httpsUrl,
  quantity: z.coerce.number().int().min(1).max(500),
  stage: z.enum(["L0_diagnostic", "L1_problem", "L2_solution", "L3_traction", "L4_committee", "L5_alumni"]),
});

const kycSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  phone: z.string().min(6),
  cinOrPassport: z.string().min(3),
  schoolOrOrg: z.string().min(2),
  roleTitle: z.string().min(2),
  logoUrl: httpsUrl,
  legalName: z.string().min(2),
  projectHolderType: z.enum(["student", "researcher", "alumni", "external"]),
  ideaOneLiner: z.string().min(8),
  problemStatement: z.string().min(8),
  targetCustomer: z.string().min(3),
});

const questSchema = z.object({
  questId: z.string().min(1),
  title: z.string().min(3),
  objective: z.string().min(3),
  expectedOutput: z.string().min(3),
  xp: z.coerce.number().min(0).max(500),
  isActive: z.coerce.boolean(),
});

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function submitDeliverable(formData: FormData) {
  const parsed = deliverableSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    slug: formValue(formData, "slug"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    docUrl: formValue(formData, "docUrl"),
    checkpoint: formValue(formData, "checkpoint"),
    stage: formValue(formData, "stage"),
    baseXp: formValue(formData, "baseXp"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("deliverables").insert({
      project_id: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      doc_url: parsed.data.docUrl,
      status: "submitted",
      checkpoint: parsed.data.checkpoint,
      stage: parsed.data.stage,
      pending_xp: 10,
      base_xp: parsed.data.baseXp,
      submitted_by: user?.id,
      submitted_at: new Date().toISOString(),
    });

    if (error) return;
  }

  revalidatePath(`/startup/${parsed.data.slug}`);
  revalidatePath("/coach");
  revalidatePath("/admin");
}

export async function submitDeliverableFlow(_prevState: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const parsed = deliverableSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    slug: formValue(formData, "slug"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    docUrl: formValue(formData, "docUrl"),
    checkpoint: formValue(formData, "checkpoint"),
    stage: formValue(formData, "stage"),
    baseXp: formValue(formData, "baseXp"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid proof." };
  }

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("deliverables").insert({
      project_id: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      doc_url: parsed.data.docUrl,
      status: "submitted",
      checkpoint: parsed.data.checkpoint,
      stage: parsed.data.stage,
      pending_xp: 10,
      base_xp: parsed.data.baseXp,
      submitted_by: user?.id,
      submitted_at: new Date().toISOString(),
    });

    if (error) return { ok: false, message: error.message };
  }

  const coachEmail = formValue(formData, "coachEmail") || "eic@uemf.ma";
  const coachName = formValue(formData, "coachName") || "Coach";
  const startupName = formValue(formData, "startupName") || "Startup";
  const mailto = `mailto:${coachEmail},eic@uemf.ma?subject=${encodeURIComponent(`Preuve a valider - ${startupName}`)}&body=${encodeURIComponent(`Bonjour ${coachName},

Nouvelle preuve a valider pour ${startupName}.

Checkpoint: ${parsed.data.checkpoint}
Titre: ${parsed.data.title}
Lien: ${parsed.data.docUrl}

Message fondateur:
${parsed.data.description}

Dashboard: https://eic-game.uemf.ma/startup/${parsed.data.slug}

Equipe EIC`)}`;

  revalidatePath(`/startup/${parsed.data.slug}`);
  revalidatePath("/coach");
  revalidatePath("/admin");
  return { ok: true, message: "Saved. Opening the email draft now.", mailto };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/");

  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=1");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

export async function saveOnboardingKyc(_prevState: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const parsed = kycSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    userId: formValue(formData, "userId"),
    phone: formValue(formData, "phone"),
    cinOrPassport: formValue(formData, "cinOrPassport"),
    schoolOrOrg: formValue(formData, "schoolOrOrg"),
    roleTitle: formValue(formData, "roleTitle"),
    logoUrl: formValue(formData, "logoUrl"),
    legalName: formValue(formData, "legalName"),
    projectHolderType: formValue(formData, "projectHolderType"),
    ideaOneLiner: formValue(formData, "ideaOneLiner"),
    problemStatement: formValue(formData, "problemStatement"),
    targetCustomer: formValue(formData, "targetCustomer"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid onboarding profile." };
  }

  const supabase = await createClient();
  if (supabase) {
    const founderPayload = {
      user_id: parsed.data.userId,
      phone: parsed.data.phone,
      cin_or_passport: parsed.data.cinOrPassport,
      school_or_org: parsed.data.schoolOrOrg,
      role_title: parsed.data.roleTitle,
      status: "complete",
    };
    const projectPayload = {
      project_id: parsed.data.projectId,
      logo_url: parsed.data.logoUrl,
      legal_name: parsed.data.legalName,
      project_holder_type: parsed.data.projectHolderType,
      idea_one_liner: parsed.data.ideaOneLiner,
      problem_statement: parsed.data.problemStatement,
      target_customer: parsed.data.targetCustomer,
      status: "complete",
    };
    const founderResult = await supabase.from("founder_kyc").upsert(founderPayload, { onConflict: "user_id" });
    if (founderResult.error) return { ok: false, message: founderResult.error.message };
    const projectResult = await supabase.from("project_holder_kyc").upsert(projectPayload, { onConflict: "project_id" });
    if (projectResult.error) return { ok: false, message: projectResult.error.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/journey");
  return { ok: true, message: "Pre-bootcamp profile saved. EIC can now verify and unlock bootcamp quests." };
}

export async function updateBootcampQuest(formData: FormData) {
  const parsed = questSchema.safeParse({
    questId: formValue(formData, "questId"),
    title: formValue(formData, "title"),
    objective: formValue(formData, "objective"),
    expectedOutput: formValue(formData, "expectedOutput"),
    xp: formValue(formData, "xp"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  if (supabase) {
    await supabase
      .from("bootcamp_deliverables")
      .update({
        title: parsed.data.title,
        objective: parsed.data.objective,
        expected_output: parsed.data.expectedOutput,
        xp: parsed.data.xp,
        is_active: parsed.data.isActive,
      })
      .eq("id", parsed.data.questId);
  }

  revalidatePath("/admin/game");
  revalidatePath("/startup/atlas-soil");
}

export async function claimBonusEvent(formData: FormData) {
  const parsed = bonusSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    slug: formValue(formData, "slug"),
    type: formValue(formData, "type"),
    title: formValue(formData, "title"),
    proofUrl: formValue(formData, "proofUrl"),
    quantity: formValue(formData, "quantity"),
    stage: formValue(formData, "stage"),
  });

  if (!parsed.success) {
    return;
  }

  const claimedXp = calculateBonusClaim(parsed.data.type as BonusType, parsed.data.quantity);
  const checkpoint = bonusRules[parsed.data.type as BonusType].checkpoint;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("bonus_events").insert({
      project_id: parsed.data.projectId,
      bonus_type: parsed.data.type,
      title: parsed.data.title,
      proof_url: parsed.data.proofUrl,
      quantity: parsed.data.quantity,
      claimed_xp: claimedXp,
      awarded_xp: 0,
      status: "submitted",
      checkpoint,
      stage: parsed.data.stage,
      submitted_by: user?.id,
      submitted_at: new Date().toISOString(),
    });

    if (error) return;
  }

  revalidatePath(`/startup/${parsed.data.slug}`);
  revalidatePath("/coach");
  revalidatePath("/admin");
}

export async function claimBonusEventFlow(_prevState: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const parsed = bonusSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    slug: formValue(formData, "slug"),
    type: formValue(formData, "type"),
    title: formValue(formData, "title"),
    proofUrl: formValue(formData, "proofUrl"),
    quantity: formValue(formData, "quantity"),
    stage: formValue(formData, "stage"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid bonus claim." };
  }

  const claimedXp = calculateBonusClaim(parsed.data.type as BonusType, parsed.data.quantity);
  const checkpoint = bonusRules[parsed.data.type as BonusType].checkpoint;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("bonus_events").insert({
      project_id: parsed.data.projectId,
      bonus_type: parsed.data.type,
      title: parsed.data.title,
      proof_url: parsed.data.proofUrl,
      quantity: parsed.data.quantity,
      claimed_xp: claimedXp,
      awarded_xp: 0,
      status: "submitted",
      checkpoint,
      stage: parsed.data.stage,
      submitted_by: user?.id,
      submitted_at: new Date().toISOString(),
    });

    if (error) return { ok: false, message: error.message };
  }

  const coachEmail = formValue(formData, "coachEmail") || "eic@uemf.ma";
  const coachName = formValue(formData, "coachName") || "Coach";
  const startupName = formValue(formData, "startupName") || "Startup";
  const mailto = `mailto:${coachEmail},eic@uemf.ma?subject=${encodeURIComponent(`Bonus XP a valider - ${startupName}`)}&body=${encodeURIComponent(`Bonjour ${coachName},

Nouvelle demande de bonus XP pour ${startupName}.

Type: ${bonusRules[parsed.data.type as BonusType].label}
Titre: ${parsed.data.title}
Quantite: ${parsed.data.quantity}
XP reclame: ${claimedXp}
Lien preuve: ${parsed.data.proofUrl}

Merci de valider ou demander des changements dans le dashboard.

Equipe EIC`)}`;

  revalidatePath(`/startup/${parsed.data.slug}`);
  revalidatePath("/coach");
  revalidatePath("/admin");
  return { ok: true, message: `${claimedXp} XP claimed. Opening the email draft now.`, mailto };
}

export async function reviewDeliverable(formData: FormData) {
  const id = formValue(formData, "id");
  const status = formValue(formData, "status");
  const notes = formValue(formData, "reviewNotes");
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("deliverables")
      .update({
        status,
        review_notes: notes,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        pending_xp: status === "accepted" ? 0 : 10,
      })
      .eq("id", id);
  }

  revalidatePath("/coach");
  revalidatePath("/admin");
}

export async function reviewBonusEvent(formData: FormData) {
  const id = formValue(formData, "id");
  const status = formValue(formData, "status");
  const awardedXp = Number(formValue(formData, "awardedXp"));
  const stageCapXp = Math.round(Number(formValue(formData, "stageTarget")) * 0.35);
  const countsTowardStage = Math.min(awardedXp, stageCapXp);
  const prestigeXp = Math.max(0, awardedXp - countsTowardStage);
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("bonus_events")
      .update({
        status,
        awarded_xp: status === "accepted" ? awardedXp : 0,
        counts_toward_stage: status === "accepted" ? countsTowardStage : 0,
        prestige_xp: status === "accepted" ? prestigeXp : 0,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  revalidatePath("/coach");
  revalidatePath("/admin");
}

export async function markMailtoOpened(formData: FormData) {
  const id = formValue(formData, "id");
  const table = formValue(formData, "table");
  const supabase = await createClient();
  if (supabase && ["deliverables", "bonus_events"].includes(table)) {
    await supabase.from(table).update({ mailto_opened_at: new Date().toISOString() }).eq("id", id);
  }
}

export async function createStartup(formData: FormData) {
  const supabase = await createClient();
  if (supabase) {
    await supabase.from("projects").insert({
      name: formValue(formData, "name"),
      slug: formValue(formData, "slug"),
      cohort: formValue(formData, "cohort") || "pilot-2026-S1",
      summary: formValue(formData, "summary"),
      sector: formValue(formData, "sector"),
      maturity_phase: formValue(formData, "maturityPhase") || "ideation",
      checkpoint_focus: formValue(formData, "checkpointFocus") || "make_it",
      stage: formValue(formData, "stage") || "L0_diagnostic",
      status: "active",
      health_status: "watch",
      next_action: formValue(formData, "nextAction"),
    });
  }
  revalidatePath("/admin/startups");
  revalidatePath("/admin");
}

export async function assignProjectMember(formData: FormData) {
  const supabase = await createClient();
  if (supabase) {
    await supabase.from("project_members").insert({
      project_id: formValue(formData, "projectId"),
      user_id: formValue(formData, "userId"),
      role_in_project: formValue(formData, "roleInProject"),
    });
  }
  revalidatePath("/admin/startups");
}

export async function assignCoach(formData: FormData) {
  const supabase = await createClient();
  if (supabase) {
    await supabase.from("coach_assignments").insert({
      project_id: formValue(formData, "projectId"),
      coach_id: formValue(formData, "coachId"),
    });
  }
  revalidatePath("/admin/startups");
}

export async function updateStartupStatus(formData: FormData) {
  const supabase = await createClient();
  if (supabase) {
    await supabase
      .from("projects")
      .update({
        stage: formValue(formData, "stage"),
        status: formValue(formData, "status"),
        maturity_phase: formValue(formData, "maturityPhase"),
        checkpoint_focus: formValue(formData, "checkpointFocus"),
        health_status: formValue(formData, "healthStatus"),
        next_action: formValue(formData, "nextAction"),
      })
      .eq("id", formValue(formData, "projectId"));
  }
  revalidatePath("/admin/startups");
  revalidatePath("/admin");
}
