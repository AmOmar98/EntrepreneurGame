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
