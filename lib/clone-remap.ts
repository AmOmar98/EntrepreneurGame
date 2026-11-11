/**
 * lib/clone-remap.ts — Pure helper for cloneEventFlow soft_recommends_before remap.
 *
 * This module has no Next.js imports — safe to import in unit tests (Vitest/Node).
 *
 * ENGINE-03 (clone event): when cloning templates, soft_recommends_before UUIDs
 * must be remapped from old (source event) ids to new (cloned event) ids.
 * If the prerequisite template id is outside the clone set, the result is null
 * (never leaves a dangling reference to a source-event template — T-15-05).
 */

/**
 * Remap a soft_recommends_before template id via an old→new id map.
 *
 * @param softRecommendsBefore - The source template's soft_recommends_before value (may be null/empty).
 * @param idMap - Map from old template UUID to new cloned template UUID.
 * @returns The new template UUID if found in the map, or null otherwise.
 *          null means "no prerequisite" — safe default that never references a source row.
 */
export function remapSoftRecommends(
  softRecommendsBefore: string | null,
  idMap: Map<string, string>,
): string | null {
  if (!softRecommendsBefore) return null;
  return idMap.get(softRecommendsBefore) ?? null;
}
