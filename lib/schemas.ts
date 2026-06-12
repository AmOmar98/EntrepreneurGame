/**
 * lib/schemas.ts — Pure Zod schemas extracted from app/actions.ts.
 *
 * This module imports ONLY from "zod" — no Next.js imports, no "use server".
 * It is safe to import in unit tests (Vitest/Node) without Next.js runtime.
 *
 * app/actions.ts re-imports all schemas from here so validation semantics
 * remain identical (behavior-preserving extraction).
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// slugifyToKey — canonical implementation (WR-02)
// Single source of truth imported by both app/actions.ts (server) and
// components/admin-deliverable-template-editor.tsx (client).
// NFD normalize + diacritic strip ensures "Clarté" → "clarte" consistently.
// ---------------------------------------------------------------------------

export function slugifyToKey(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 64) || "criterion";
}

// ---------------------------------------------------------------------------
// Shared URL schema
// ---------------------------------------------------------------------------

export const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "URL doit commencer par https://");

// ---------------------------------------------------------------------------
// Onboarding KYC (ONBOARD-02, ONBOARD-03)
// ---------------------------------------------------------------------------

export const onboardingSchema = z.object({
  teamName: z.string().min(2).max(80),
  idea: z.string().min(10).max(500),
  q1: z.coerce.number().int().min(1).max(5),
  q2: z.coerce.number().int().min(1).max(5),
  q3: z.coerce.number().int().min(1).max(5),
  q4: z.coerce.number().int().min(1).max(5),
  q5: z.coerce.number().int().min(1).max(5),
});

// ---------------------------------------------------------------------------
// Submission (SUBMIT-01, SUBMIT-02, SUBMIT-04)
// ---------------------------------------------------------------------------

// quick-260519-l1l : 10-URL HTTPS array shape for fiches-entretien-v1.
// proof_text stores JSON.stringify({ fiches: [{ url: string }, ...] }) with
// exactly 10 entries, each a valid https:// URL.
export const fichesEntretienSchema = z.object({
  fiches: z
    .array(z.object({ url: httpsUrl }))
    .length(10, "10 fiches d'entretien requises (URL HTTPS chacune)"),
});

export const submissionSchema = z
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

// ---------------------------------------------------------------------------
// Engine: composer_kind + validation_rules (Phase 15 — ENGINE-05, VALID-01)
// ---------------------------------------------------------------------------

// Mirrors DB CHECK constraint composer_kind_valid_values and ComposerKind in lib/types.ts.
export const composerKindSchema = z.enum(["simple", "moscow", "multi_url"]);

// Mirrors DB CHECK validation_rules_severity_warn_only and ValidationRule in lib/types.ts.
// z.literal("warn") is the TS-side VALID-01 structural guarantee: severity:'error' is
// impossible at parse time, mirroring the DB CHECK constraint (defense in depth / R2).
export const validationRuleSchema = z.object({
  rule: z.string().min(1),
  severity: z.literal("warn"),
  message: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Rubric criterion schema (ENGINE-02 — rubric builder for saveDeliverableTemplateFlow)
// ---------------------------------------------------------------------------

// Individual rubric criterion. key is optional at input (slugified from label when absent).
const rubricCriterionSchemaBase = z.object({
  key: z.string().min(1).optional(),
  label: z.string().min(1),
  max: z.coerce.number().int().min(1).max(100),
});

// rubricSchema: the rubric array field — must have at least 1 criterion.
// Exported so it is unit-testable without Next.js runtime (no "use server").
export const rubricSchema = z.array(rubricCriterionSchemaBase).min(1);

// ---------------------------------------------------------------------------
// Phase 16 / JURY-09 — Jury grid criterion + grid save schema
// ---------------------------------------------------------------------------

export const juryGridCriterionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  max: z.coerce.number().int().min(1).max(100),
});

export const saveJuryGridSchema = z.object({
  eventId: z.string().uuid(),
  criteria: z.array(juryGridCriterionSchema).min(1).max(10),
});

// ---------------------------------------------------------------------------
// Phase 16 / SETTINGS-04 — Event settings save schema (7 fields + pitch weight)
// ---------------------------------------------------------------------------

export const saveEventSettingsSchema = z.object({
  eventId: z.string().uuid(),
  xpFirstSubmission: z.coerce.number().int().min(0).max(500),
  xpValidateV1: z.coerce.number().int().min(0).max(500),
  xpValidateV2: z.coerce.number().int().min(0).max(500),
  engSubmitted: z.coerce.number().int().min(0).max(500),
  engReviewed: z.coerce.number().int().min(0).max(500),
  engValidated: z.coerce.number().int().min(0).max(500),
  pitchWeight: z.coerce.number().min(0).max(1),
  bonusMultiplierCap: z.coerce.number().min(1).max(10),
});

// ---------------------------------------------------------------------------
// Evaluation (EVAL-02, EVAL-03, SCORE-01)
// ---------------------------------------------------------------------------

export const evaluationSchema = z
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
