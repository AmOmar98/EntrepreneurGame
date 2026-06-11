// Unit tests for the pure clone remap helper (Phase 15 — ENGINE-03).
// Tests run in Node environment (Vitest), no Next.js runtime required.
// The remapSoftRecommends function is a pure mapping step: given an
// old template id and an old->new UUID map, it returns the new id or null.
// It must never return an id that belongs to the source event (T-15-05 mitigated).
import { describe, it, expect } from "vitest";
import { remapSoftRecommends } from "@/lib/clone-remap";

describe("remapSoftRecommends (ENGINE-03 clone remap)", () => {
  const OLD_A = "aaaaaaaa-0000-0000-0000-000000000001";
  const OLD_B = "bbbbbbbb-0000-0000-0000-000000000002";
  const NEW_A = "cccccccc-0000-0000-0000-000000000003";
  const NEW_B = "dddddddd-0000-0000-0000-000000000004";
  const OUTSIDE = "eeeeeeee-0000-0000-0000-000000000005";

  const idMap = new Map<string, string>([
    [OLD_A, NEW_A],
    [OLD_B, NEW_B],
  ]);

  it("maps old id to new id when present in the map", () => {
    const result = remapSoftRecommends(OLD_A, idMap);
    expect(result).toBe(NEW_A);
  });

  it("maps second old id to its corresponding new id", () => {
    const result = remapSoftRecommends(OLD_B, idMap);
    expect(result).toBe(NEW_B);
  });

  it("returns null when softRecommendsBefore is null (no prerequisite)", () => {
    const result = remapSoftRecommends(null, idMap);
    expect(result).toBe(null);
  });

  it("returns null when softRecommendsBefore points outside the clone map (T-15-05 — never references source row)", () => {
    // If the prerequisite template was not part of the cloned event,
    // it should NOT be remapped (would reference a source-event template).
    const result = remapSoftRecommends(OUTSIDE, idMap);
    expect(result).toBe(null);
  });

  it("returns null for empty string (treated as no prerequisite)", () => {
    const result = remapSoftRecommends("", idMap);
    expect(result).toBe(null);
  });

  it("does not return a source-event id (clone isolation guarantee)", () => {
    // For any mapped key, the result must not be one of the old source ids.
    for (const [oldId] of idMap.entries()) {
      const result = remapSoftRecommends(oldId, idMap);
      expect(result).not.toBe(oldId);
    }
  });
});
