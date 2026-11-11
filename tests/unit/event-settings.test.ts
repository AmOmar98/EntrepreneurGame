// Unit tests for lib/event-settings.ts and lib/pitch-criteria.ts.
// These modules have dual-mode behavior: demo fallback when Supabase env is absent.
// We test the demo/fallback path entirely (no Supabase calls in unit tests).
// Supabase-backed path is covered by E2E / integration tests.
import { describe, it, expect } from "vitest";

// ============================================================================
// lib/event-settings.ts tests
// ============================================================================

describe("DEFAULT_EVENT_SETTINGS", () => {
  it("exports DEFAULT_EVENT_SETTINGS with the correct current hardcoded values", async () => {
    const { DEFAULT_EVENT_SETTINGS } = await import("@/lib/event-settings");

    // XP rules — lib/journey.ts:347-353
    expect(DEFAULT_EVENT_SETTINGS.xpFirstSubmission).toBe(100);
    expect(DEFAULT_EVENT_SETTINGS.xpValidateV1).toBe(50);
    expect(DEFAULT_EVENT_SETTINGS.xpValidateV2).toBe(100);

    // Engagement thresholds — lib/score.ts:72-74
    expect(DEFAULT_EVENT_SETTINGS.engSubmitted).toBe(100);
    expect(DEFAULT_EVENT_SETTINGS.engReviewed).toBe(25);
    expect(DEFAULT_EVENT_SETTINGS.engValidated).toBe(50);

    // Pitch weight — lib/results.ts:33
    expect(DEFAULT_EVENT_SETTINGS.pitchWeight).toBe(0.8);

    // Bonus multiplier cap — lib/types.ts BONUS_MULTIPLIER_CAP
    expect(DEFAULT_EVENT_SETTINGS.bonusMultiplierCap).toBe(3.0);
  });

  it("DEFAULT_EVENT_SETTINGS has all 8 expected keys", async () => {
    const { DEFAULT_EVENT_SETTINGS } = await import("@/lib/event-settings");
    const keys = Object.keys(DEFAULT_EVENT_SETTINGS);
    expect(keys).toContain("xpFirstSubmission");
    expect(keys).toContain("xpValidateV1");
    expect(keys).toContain("xpValidateV2");
    expect(keys).toContain("engSubmitted");
    expect(keys).toContain("engReviewed");
    expect(keys).toContain("engValidated");
    expect(keys).toContain("pitchWeight");
    expect(keys).toContain("bonusMultiplierCap");
  });
});

describe("getEventSettings (demo/fallback mode)", () => {
  it("returns DEFAULT_EVENT_SETTINGS when eventId is null", async () => {
    const { getEventSettings, DEFAULT_EVENT_SETTINGS } = await import("@/lib/event-settings");
    const result = await getEventSettings(null);
    expect(result).toEqual(DEFAULT_EVENT_SETTINGS);
  });

  it("returns DEFAULT_EVENT_SETTINGS when eventId is provided but no Supabase env", async () => {
    // In test env, NEXT_PUBLIC_SUPABASE_URL is not set -> demo mode -> defaults returned
    const { getEventSettings, DEFAULT_EVENT_SETTINGS } = await import("@/lib/event-settings");
    const result = await getEventSettings("00000000-0000-0000-0000-000000000001");
    expect(result).toEqual(DEFAULT_EVENT_SETTINGS);
  });

  it("returned object has pitchWeight as a number in [0,1]", async () => {
    const { getEventSettings } = await import("@/lib/event-settings");
    const result = await getEventSettings(null);
    expect(typeof result.pitchWeight).toBe("number");
    expect(result.pitchWeight).toBeGreaterThanOrEqual(0);
    expect(result.pitchWeight).toBeLessThanOrEqual(1);
  });

  it("returned object has bonusMultiplierCap >= 1.0", async () => {
    const { getEventSettings } = await import("@/lib/event-settings");
    const result = await getEventSettings(null);
    expect(typeof result.bonusMultiplierCap).toBe("number");
    expect(result.bonusMultiplierCap).toBeGreaterThanOrEqual(1.0);
  });

  it("never throws — returns defaults on error path", async () => {
    const { getEventSettings } = await import("@/lib/event-settings");
    // Null eventId should never throw
    await expect(getEventSettings(null)).resolves.toBeDefined();
    await expect(getEventSettings("not-a-uuid")).resolves.toBeDefined();
  });
});

// ============================================================================
// lib/pitch-criteria.ts tests
// ============================================================================

describe("DEMO_PITCH_CRITERIA", () => {
  it("exports DEMO_PITCH_CRITERIA with 4 criteria", async () => {
    const { DEMO_PITCH_CRITERIA } = await import("@/lib/pitch-criteria");
    expect(DEMO_PITCH_CRITERIA).toHaveLength(4);
  });

  it("each demo criterion has max=20", async () => {
    const { DEMO_PITCH_CRITERIA } = await import("@/lib/pitch-criteria");
    for (const c of DEMO_PITCH_CRITERIA) {
      expect(c.max).toBe(20);
    }
  });

  it("demo criteria keys match the 4 legacy criteria", async () => {
    const { DEMO_PITCH_CRITERIA } = await import("@/lib/pitch-criteria");
    const keys = DEMO_PITCH_CRITERIA.map((c) => c.key);
    expect(keys).toContain("innovation");
    expect(keys).toContain("faisabilite");
    expect(keys).toContain("modele");
    expect(keys).toContain("equipe");
  });

  it("demo criteria are ordered by ord field (0,1,2,3)", async () => {
    const { DEMO_PITCH_CRITERIA } = await import("@/lib/pitch-criteria");
    const ords = DEMO_PITCH_CRITERIA.map((c) => c.ord);
    expect(ords).toEqual([0, 1, 2, 3]);
  });
});

describe("getPitchCriteria (demo/fallback mode)", () => {
  it("returns DEMO_PITCH_CRITERIA when no Supabase env", async () => {
    const { getPitchCriteria, DEMO_PITCH_CRITERIA } = await import("@/lib/pitch-criteria");
    const result = await getPitchCriteria("00000000-0000-0000-0000-000000000001");
    expect(result).toEqual(DEMO_PITCH_CRITERIA);
  });

  it("never throws — returns DEMO_PITCH_CRITERIA on any input", async () => {
    const { getPitchCriteria, DEMO_PITCH_CRITERIA } = await import("@/lib/pitch-criteria");
    await expect(getPitchCriteria("some-event-id")).resolves.toEqual(DEMO_PITCH_CRITERIA);
  });

  it("returned criteria have the correct shape (id, eventId, key, label, max, ord)", async () => {
    const { getPitchCriteria } = await import("@/lib/pitch-criteria");
    const result = await getPitchCriteria("00000000-0000-0000-0000-000000000001");
    for (const c of result) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.eventId).toBe("string");
      expect(typeof c.key).toBe("string");
      expect(typeof c.label).toBe("string");
      expect(typeof c.max).toBe("number");
      expect(typeof c.ord).toBe("number");
    }
  });
});
