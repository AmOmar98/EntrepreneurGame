// Unit tests for pure Zod schemas extracted to lib/schemas.ts.
// These tests run in Node environment (Vitest), no Next.js runtime required.
// Schemas are imported from lib/schemas.ts — never from app/actions.ts.
// Demo-mode note: no Supabase env vars set, hasSupabaseEnv() returns false.
import { describe, it, expect } from "vitest";
import { submissionSchema, evaluationSchema, validationRuleSchema, composerKindSchema } from "@/lib/schemas";

// Use all-zeros UUID — accepted by Zod v4 uuid validator
// (Zod v4 accepts RFC 4122 nil UUID and standard v4 UUIDs)
const VALID_UUID = "00000000-0000-0000-0000-000000000000";

describe("submissionSchema", () => {
  it("rejects http:// URLs for proof_url kind", () => {
    const result = submissionSchema.safeParse({
      deliverableTemplateId: VALID_UUID,
      kind: "proof_url",
      proofUrl: "http://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts https:// URL for proof_url kind with valid uuid", () => {
    const result = submissionSchema.safeParse({
      deliverableTemplateId: VALID_UUID,
      kind: "proof_url",
      proofUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects proof_text shorter than 10 chars", () => {
    const result = submissionSchema.safeParse({
      deliverableTemplateId: VALID_UUID,
      kind: "proof_text",
      proofText: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts proof_text with 10 or more chars", () => {
    const result = submissionSchema.safeParse({
      deliverableTemplateId: VALID_UUID,
      kind: "proof_text",
      proofText: "a".repeat(10),
    });
    expect(result.success).toBe(true);
  });
});

describe("validationRuleSchema", () => {
  it("accepts severity 'warn' with valid rule and message", () => {
    const result = validationRuleSchema.safeParse({
      rule: "non-empty",
      severity: "warn",
      message: "This field is required",
    });
    expect(result.success).toBe(true);
  });

  it("rejects severity 'error' (R2 / VALID-01 structural guarantee)", () => {
    const result = validationRuleSchema.safeParse({
      rule: "non-empty",
      severity: "error",
      message: "This field is required",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty rule string", () => {
    const result = validationRuleSchema.safeParse({
      rule: "",
      severity: "warn",
      message: "This field is required",
    });
    expect(result.success).toBe(false);
  });
});

describe("composerKindSchema", () => {
  it("accepts 'simple'", () => {
    expect(composerKindSchema.safeParse("simple").success).toBe(true);
  });

  it("accepts 'moscow'", () => {
    expect(composerKindSchema.safeParse("moscow").success).toBe(true);
  });

  it("accepts 'multi_url'", () => {
    expect(composerKindSchema.safeParse("multi_url").success).toBe(true);
  });

  it("rejects unknown kind 'other'", () => {
    expect(composerKindSchema.safeParse("other").success).toBe(false);
  });
});

describe("evaluationSchema", () => {
  it("requires expectedAction when verdict=request_v2 with empty expectedAction", () => {
    const result = evaluationSchema.safeParse({
      submissionId: VALID_UUID,
      feedback: "",
      verdict: "request_v2",
      expectedAction: "",
      scores: { c1: 10, c2: 15 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("expectedAction");
    }
  });

  it("accepts empty expectedAction for verdict=validate_v1 with valid scores", () => {
    const result = evaluationSchema.safeParse({
      submissionId: VALID_UUID,
      feedback: "Good work",
      verdict: "validate_v1",
      expectedAction: "",
      scores: { c1: 10, c2: 15 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects score value above max 25", () => {
    const result = evaluationSchema.safeParse({
      submissionId: VALID_UUID,
      feedback: "",
      verdict: "validate_v1",
      scores: { c1: 26 },
    });
    expect(result.success).toBe(false);
  });
});
