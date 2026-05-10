// Phase 10 / Section 12 — Profil joueur (long-terme).
// Pure helper. Demo mode reads lib/seed/profile.ts ; Supabase mode would
// aggregate from players + submissions + evaluations + (future) hacks
// table. Pilot AgreenTech 2026 = single hack so Supabase aggregation
// remains simple ("1 hack · pilote en cours").
//
// R1 contract : helper returns null when ranking not yet published —
// caller must render SysEmpty unavailable. Stats long-terme (post-hack)
// are OK per advisor reading EIC-MANAGER-ANSWERS-AGREENTECH.md:116.

import { demoPlayerProfiles } from "@/lib/seed/profile";

export type PlayerSkillKey =
  | "discovery"
  | "collaboration"
  | "resilience"
  | "storytelling";

export type PlayerSkill = {
  key: PlayerSkillKey;
  // 0..100 ratio.
  ratio: number;
};

export type PlayerBadge = {
  id: string;
  label: string;
  // ISO date of unlock, null if locked.
  unlockedAt: string | null;
};

export type PlayerHack = {
  // ISO date.
  startedAt: string;
  // ISO date or null if ongoing.
  endedAt: string | null;
  eventName: string;
  // "winner" | "finalist" | "participant"
  outcome: "winner" | "finalist" | "participant";
};

export type PlayerProfile = {
  slug: string;
  name: string;
  currentLevel: string;
  // Number of hack-days participated.
  hackCount: number;
  winCount: number;
  mentorCount: number;
  submissionCount: number;
  xpTotal: number;
  skills: PlayerSkill[];
  badges: PlayerBadge[];
  hacks: PlayerHack[];
  mentors: string[];
};

/**
 * Returns the player profile if visible (i.e. ranking published OR caller
 * is the player themselves OR caller is staff). Returns null otherwise.
 *
 * For T-3 / pilot, we only support demo mode + ranking-published gate.
 * Real Supabase wiring (RLS-aware aggregation) is a follow-up.
 */
export function getPlayerProfile(
  slug: string,
  opts?: { rankingPublished?: boolean },
): PlayerProfile | null {
  const rankingPublished = opts?.rankingPublished ?? false;
  const profile = demoPlayerProfiles.find((p) => p.slug === slug) ?? null;
  if (!profile) return null;
  if (!rankingPublished) return null;
  return profile;
}
