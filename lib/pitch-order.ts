// Pitch order randomization (Phase 10 / 0.10 — C3 T3-IMPROVEMENTS).
//
// R1 contract : ce module est GameMaster-only. Aucune fuite cote Player du
// concept "ancre" ni du seuil de preselection. Les slots assignes sont des
// ordinaux purs (1..N), revelables au Player UNIQUEMENT apres
// events.pitch_order_published_at IS NOT NULL (gate cote app).
//
// Spec : equipes "ancres" (top preselection) placees en milieu (slots 4-8),
// jamais slot 1 ni slot N (bords), pour stabiliser le jury.

export type PitchOrder = Record<string, number>;

export type RandomizePitchOrderInput = {
  playerIds: string[];
  anchorIds: string[];
  seed?: string;
};

// Deterministic xorshift PRNG (testable, audit-friendly via seed).
// Seed JAMAIS derive de preselection_score — sinon ordre devient deductible.
function makeRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Pool decomposition :
//   - middle pool = slots [floor(N*0.3)+1 .. ceil(N*0.7)]  (typique 4-8 sur 11)
//   - edge pool   = slots restants (jamais 1 ni N reservés aux non-anchors)
// Si plus d'ancres que de slots middle, overflow vers edges hors 1/N.
export function randomizePitchOrder({
  playerIds,
  anchorIds,
  seed,
}: RandomizePitchOrderInput): PitchOrder {
  const N = playerIds.length;
  if (N === 0) return {};
  if (N === 1) return { [playerIds[0]]: 1 };

  const rng = makeRng(seed ?? `pitch-order-${Date.now()}`);
  const anchorSet = new Set(anchorIds.filter((id) => playerIds.includes(id)));

  const middleStart = Math.floor(N * 0.3) + 1;
  const middleEnd = Math.ceil(N * 0.7);
  const middleSlots: number[] = [];
  for (let s = middleStart; s <= middleEnd; s++) middleSlots.push(s);

  const edgeSlots: number[] = [];
  for (let s = 2; s < middleStart; s++) edgeSlots.push(s);
  for (let s = middleEnd + 1; s < N; s++) edgeSlots.push(s);
  // Slots 1 and N reserved for last-resort non-anchor placement.
  const reservedExtremes = N >= 3 ? [1, N] : [1];

  const anchors = playerIds.filter((id) => anchorSet.has(id));
  const nonAnchors = playerIds.filter((id) => !anchorSet.has(id));

  const shuffledAnchors = shuffle(anchors, rng);
  const shuffledNonAnchors = shuffle(nonAnchors, rng);
  const shuffledMiddle = shuffle(middleSlots, rng);
  const shuffledEdges = shuffle(edgeSlots, rng);
  const shuffledReserved = shuffle(reservedExtremes, rng);

  const order: PitchOrder = {};

  // 1) Place anchors in middle slots first.
  for (const id of shuffledAnchors) {
    if (shuffledMiddle.length > 0) {
      order[id] = shuffledMiddle.shift()!;
    } else if (shuffledEdges.length > 0) {
      order[id] = shuffledEdges.shift()!;
    } else {
      order[id] = shuffledReserved.shift()!;
    }
  }

  // 2) Non-anchors fill remaining edges then extremes then leftover middle.
  for (const id of shuffledNonAnchors) {
    if (shuffledEdges.length > 0) {
      order[id] = shuffledEdges.shift()!;
    } else if (shuffledReserved.length > 0) {
      order[id] = shuffledReserved.shift()!;
    } else if (shuffledMiddle.length > 0) {
      order[id] = shuffledMiddle.shift()!;
    }
  }

  return order;
}

export function getPlayerSlot(order: PitchOrder | null | undefined, playerId: string): number | null {
  if (!order) return null;
  const v = order[playerId];
  return typeof v === "number" ? v : null;
}

export function isPitchOrderPublished(publishedAt: string | Date | null | undefined): boolean {
  return Boolean(publishedAt);
}
