// Unit tests for Phase 16 / Plan 04 jury grid + event settings schema bounds.
// Imported from lib/schemas.ts (no Next.js runtime required).
// Covers: saveJuryGridSchema (criteria bounds), juryGridCriterionSchema (max bounds),
// saveEventSettingsSchema (pitchWeight + xpFirstSubmission bounds).
import { describe, it, expect } from "vitest";
import { saveJuryGridSchema, juryGridCriterionSchema, saveEventSettingsSchema } from "@/lib/schemas";

const VALID_UUID = "00000000-0000-0000-0000-000000000000";

// ============================================================================
// juryGridCriterionSchema — max bounds
// ============================================================================

describe("juryGridCriterionSchema", () => {
  it("accepts max=20 (typical value)", () => {
    const result = juryGridCriterionSchema.safeParse({ key: "innovation", label: "Innovation", max: 20 });
    expect(result.success).toBe(true);
  });

  it("rejects max=0 (below min 1)", () => {
    const result = juryGridCriterionSchema.safeParse({ key: "x", label: "X", max: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects max=101 (above max 100)", () => {
    const result = juryGridCriterionSchema.safeParse({ key: "x", label: "X", max: 101 });
    expect(result.success).toBe(false);
  });

  it("accepts max=100 (upper boundary)", () => {
    const result = juryGridCriterionSchema.safeParse({ key: "x", label: "X", max: 100 });
    expect(result.success).toBe(true);
  });

  it("accepts max=1 (lower boundary)", () => {
    const result = juryGridCriterionSchema.safeParse({ key: "x", label: "X", max: 1 });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// saveJuryGridSchema — criteria array bounds
// ============================================================================

describe("saveJuryGridSchema", () => {
  it("accepts a 3-item valid criteria array", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [
        { key: "innovation", label: "Innovation", max: 20 },
        { key: "faisabilite", label: "Faisabilite", max: 20 },
        { key: "modele", label: "Modele economique", max: 20 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects criteria=[] (empty array, min 1)", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects 11-item criteria array (max 10)", () => {
    const criteria = Array.from({ length: 11 }, (_, i) => ({
      key: `key-${i}`,
      label: `Label ${i}`,
      max: 20,
    }));
    const result = saveJuryGridSchema.safeParse({ eventId: VALID_UUID, criteria });
    expect(result.success).toBe(false);
  });

  it("accepts 10-item criteria array (upper boundary)", () => {
    const criteria = Array.from({ length: 10 }, (_, i) => ({
      key: `key-${i}`,
      label: `Label ${i}`,
      max: 20,
    }));
    const result = saveJuryGridSchema.safeParse({ eventId: VALID_UUID, criteria });
    expect(result.success).toBe(true);
  });

  it("accepts 1-item criteria array (lower boundary)", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [{ key: "x", label: "X", max: 20 }],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// saveEventSettingsSchema — pitchWeight + xp bounds
// ============================================================================

const validSettings = {
  eventId: VALID_UUID,
  xpFirstSubmission: 100,
  xpValidateV1: 50,
  xpValidateV2: 100,
  engSubmitted: 100,
  engReviewed: 25,
  engValidated: 50,
  pitchWeight: 0.8,
};

describe("saveEventSettingsSchema", () => {
  it("accepts pitchWeight=0.8 (default value)", () => {
    const result = saveEventSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("rejects pitchWeight=1.5 (above max 1)", () => {
    const result = saveEventSettingsSchema.safeParse({ ...validSettings, pitchWeight: 1.5 });
    expect(result.success).toBe(false);
  });

  it("rejects pitchWeight=-0.1 (below min 0)", () => {
    const result = saveEventSettingsSchema.safeParse({ ...validSettings, pitchWeight: -0.1 });
    expect(result.success).toBe(false);
  });

  it("accepts pitchWeight=0 (lower boundary)", () => {
    const result = saveEventSettingsSchema.safeParse({ ...validSettings, pitchWeight: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts pitchWeight=1 (upper boundary)", () => {
    const result = saveEventSettingsSchema.safeParse({ ...validSettings, pitchWeight: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects xpFirstSubmission=600 (above max 500)", () => {
    const result = saveEventSettingsSchema.safeParse({ ...validSettings, xpFirstSubmission: 600 });
    expect(result.success).toBe(false);
  });

  it("accepts xpFirstSubmission=500 (upper boundary)", () => {
    const result = saveEventSettingsSchema.safeParse({ ...validSettings, xpFirstSubmission: 500 });
    expect(result.success).toBe(true);
  });

  it("accepts xpFirstSubmission=0 (lower boundary)", () => {
    const result = saveEventSettingsSchema.safeParse({ ...validSettings, xpFirstSubmission: 0 });
    expect(result.success).toBe(true);
  });
});
