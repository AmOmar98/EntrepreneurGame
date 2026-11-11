import { describe, expect, it } from "vitest";
import { buildDraftStorageKey } from "@/hooks/use-auto-save";
import { pickActivePlayerIdFromMemberships } from "@/lib/player-membership";

describe("UX-01 — buildDraftStorageKey", () => {
  it("scopes draft keys by playerId, deliverableTemplateId, and version", () => {
    const keyV1 = buildDraftStorageKey({
      playerId: "player-alpha",
      deliverableTemplateId: "tpl-persona",
      version: 1,
    });
    const keyV2 = buildDraftStorageKey({
      playerId: "player-alpha",
      deliverableTemplateId: "tpl-persona",
      version: 2,
    });
    const otherPlayerKey = buildDraftStorageKey({
      playerId: "player-beta",
      deliverableTemplateId: "tpl-persona",
      version: 1,
    });

    expect(keyV1).toBe("eg_draft_player-alpha_tpl-persona_v1");
    expect(keyV2).toBe("eg_draft_player-alpha_tpl-persona_v2");
    expect(otherPlayerKey).toBe("eg_draft_player-beta_tpl-persona_v1");
    expect(keyV1).not.toBe(keyV2);
    expect(keyV1).not.toBe(otherPlayerKey);
  });

  it("falls back to 'anon' when playerId is missing or blank", () => {
    expect(
      buildDraftStorageKey({
        deliverableTemplateId: "tpl-bmc",
      }),
    ).toBe("eg_draft_anon_tpl-bmc_v1");

    expect(
      buildDraftStorageKey({
        playerId: "   ",
        deliverableTemplateId: "tpl-bmc",
        version: 2,
      }),
    ).toBe("eg_draft_anon_tpl-bmc_v2");
  });
});

describe("EVT-01 — pickActivePlayerIdFromMemberships", () => {
  it("returns null when memberships array is empty", () => {
    expect(pickActivePlayerIdFromMemberships([], [], [])).toBeNull();
  });

  it("returns the single player_id immediately when only 1 membership exists", () => {
    expect(
      pickActivePlayerIdFromMemberships(
        [{ player_id: "p-digi" }],
        [],
        [],
      ),
    ).toBe("p-digi");
  });

  it("prioritizes the membership attached to the active event cohort when user has multiple memberships", () => {
    const memberships = [
      { player_id: "p-old-digi", joined_at: "2026-05-19T10:00:00Z" },
      { player_id: "p-ideawave", joined_at: "2026-11-11T10:00:00Z" },
    ];
    const players = [
      { id: "p-old-digi", cohort_id: "cohort-digi" },
      { id: "p-ideawave", cohort_id: "cohort-ideawave" },
    ];
    const activeEventCohortIds = ["cohort-ideawave"];

    expect(
      pickActivePlayerIdFromMemberships(memberships, players, activeEventCohortIds),
    ).toBe("p-ideawave");
  });

  it("falls back to the first (newest) membership if no membership matches an active event cohort", () => {
    const memberships = [
      { player_id: "p-newest", joined_at: "2026-11-11T10:00:00Z" },
      { player_id: "p-older", joined_at: "2026-05-19T10:00:00Z" },
    ];
    const players = [
      { id: "p-newest", cohort_id: "cohort-a" },
      { id: "p-older", cohort_id: "cohort-b" },
    ];

    expect(pickActivePlayerIdFromMemberships(memberships, players, ["cohort-other"])).toBe(
      "p-newest",
    );
  });
});
