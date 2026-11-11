// Unit tests for Phase 16 / Plan 03 jury grid + event settings Zod schemas.
// Imported from lib/schemas.ts (no Next.js runtime required).
import { describe, it, expect } from "vitest";
import { saveJuryGridSchema, saveEventSettingsSchema } from "@/lib/schemas";

const VALID_UUID = "00000000-0000-0000-0000-000000000000";

const validCriterion = { key: "innovation", label: "Innovation", max: 20 };

// ============================================================================
// saveJuryGridSchema
// ============================================================================

describe("saveJuryGridSchema", () => {
  it("accepts 1 valid criterion", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [validCriterion],
    });
    expect(result.success).toBe(true);
  });

  it("accepts 10 valid criteria", () => {
    const criteria = Array.from({ length: 10 }, (_, i) => ({
      key: `key-${i}`,
      label: `Label ${i}`,
      max: i + 1,
    }));
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria,
    });
    expect(result.success).toBe(true);
  });

  it("rejects 0 criteria (min 1)", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects 11 criteria (max 10)", () => {
    const criteria = Array.from({ length: 11 }, (_, i) => ({
      key: `key-${i}`,
      label: `Label ${i}`,
      max: 20,
    }));
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria,
    });
    expect(result.success).toBe(false);
  });

  it("rejects criterion with max=0 (min 1)", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [{ key: "x", label: "X", max: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects criterion with max=101 (max 100)", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [{ key: "x", label: "X", max: 101 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts criterion with max=100 (boundary)", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [{ key: "x", label: "X", max: 100 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects criterion with empty key", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [{ key: "", label: "X", max: 20 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects criterion with empty label", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [{ key: "x", label: "", max: 20 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid eventId (non-UUID)", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: "not-a-uuid",
      criteria: [validCriterion],
    });
    expect(result.success).toBe(false);
  });

  it("coerces max from string", () => {
    const result = saveJuryGridSchema.safeParse({
      eventId: VALID_UUID,
      criteria: [{ key: "x", label: "X", max: "25" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.criteria[0].max).toBe(25);
    }
  });
});

// ============================================================================
// saveEventSettingsSchema
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
  it("accepts valid default settings", () => {
    const result = saveEventSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("accepts pitchWeight=0 (boundary)", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      pitchWeight: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts pitchWeight=1 (boundary)", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      pitchWeight: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects pitchWeight >1", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      pitchWeight: 1.01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects pitchWeight <0", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      pitchWeight: -0.01,
    });
    expect(result.success).toBe(false);
  });

  it("accepts XP int at boundary 0", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      xpFirstSubmission: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts XP int at boundary 500", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      xpFirstSubmission: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects XP int > 500", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      xpFirstSubmission: 501,
    });
    expect(result.success).toBe(false);
  });

  it("rejects XP int < 0", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      engReviewed: -1,
    });
    expect(result.success).toBe(false);
  });

  it("coerces XP from string", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      xpFirstSubmission: "150",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.xpFirstSubmission).toBe(150);
    }
  });

  it("coerces pitchWeight from string", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      pitchWeight: "0.75",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pitchWeight).toBe(0.75);
    }
  });

  it("rejects invalid eventId (non-UUID)", () => {
    const result = saveEventSettingsSchema.safeParse({
      ...validSettings,
      eventId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
