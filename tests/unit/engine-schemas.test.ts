// Unit tests for editor Zod schemas (Phase 15 — ENGINE-05, VALID-01, R2).
// Tests run in Node environment (Vitest), no Next.js runtime required.
// Schemas are imported from lib/schemas.ts — never from app/actions.ts.
// Demo-mode note: no Supabase env vars set, hasSupabaseEnv() returns false.
import { describe, it, expect } from "vitest";
import {
  validationRuleSchema,
  composerKindSchema,
  rubricSchema,
} from "@/lib/schemas";

describe("validationRuleSchema (VALID-01 / R2)", () => {
  it("accepts severity 'warn' with valid rule and message", () => {
    const result = validationRuleSchema.safeParse({
      rule: "non-empty",
      severity: "warn",
      message: "Ce champ est requis",
    });
    expect(result.success).toBe(true);
  });

  it("rejects severity 'error' (R2 / VALID-01 structural guarantee)", () => {
    const result = validationRuleSchema.safeParse({
      rule: "non-empty",
      severity: "error",
      message: "Ce champ est requis",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty rule string", () => {
    const result = validationRuleSchema.safeParse({
      rule: "",
      severity: "warn",
      message: "Ce champ est requis",
    });
    expect(result.success).toBe(false);
  });
});

describe("composerKindSchema (ENGINE-05)", () => {
  it("accepts 'simple'", () => {
    expect(composerKindSchema.safeParse("simple").success).toBe(true);
  });

  it("accepts 'moscow'", () => {
    expect(composerKindSchema.safeParse("moscow").success).toBe(true);
  });

  it("accepts 'multi_url'", () => {
    expect(composerKindSchema.safeParse("multi_url").success).toBe(true);
  });

  it("rejects unknown kind 'hard_block' (R3 / no configurable blocking)", () => {
    expect(composerKindSchema.safeParse("hard_block").success).toBe(false);
  });

  it("rejects unknown kind 'other'", () => {
    expect(composerKindSchema.safeParse("other").success).toBe(false);
  });
});

describe("rubricSchema (ENGINE-02 rubric builder)", () => {
  it("accepts a valid single-criterion rubric with label and max", () => {
    const result = rubricSchema.safeParse([{ label: "Pertinence", max: 25 }]);
    expect(result.success).toBe(true);
  });

  it("accepts rubric with explicit key field", () => {
    const result = rubricSchema.safeParse([
      { key: "pertinence", label: "Pertinence", max: 25 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects empty rubric array (rubric must have at least 1 criterion)", () => {
    const result = rubricSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it("rejects criterion with max > 100", () => {
    const result = rubricSchema.safeParse([{ label: "Critere", max: 101 }]);
    expect(result.success).toBe(false);
  });

  it("rejects criterion with max = 0 (must be >= 1)", () => {
    const result = rubricSchema.safeParse([{ label: "Critere", max: 0 }]);
    expect(result.success).toBe(false);
  });

  it("rejects criterion with empty label", () => {
    const result = rubricSchema.safeParse([{ label: "", max: 25 }]);
    expect(result.success).toBe(false);
  });

  it("accepts multi-criterion rubric", () => {
    const result = rubricSchema.safeParse([
      { label: "Pertinence", max: 25 },
      { label: "Innovation", max: 25 },
      { label: "Faisabilite", max: 50 },
    ]);
    expect(result.success).toBe(true);
  });
});
