"use client";
// Phase 7 / Plan 07-01 - Vertical charging bar L0->L7.
// Responsive direction:
//   - Desktop (>=1100px): descendant (L7 top -> L0 bottom)
//   - Mobile  (<1100px) : ascendant  (L0 bottom -> L7 top)
// Source of truth: .planning/design-v2/project/player-screens.jsx ChargingBar.
// CSS contract: .eic-track / .eic-track__rail / .eic-track__fill / .eic-track__node.
//
// PLR-01: barre verticale responsive
// PLR-02: pulse on current, dashed on locked, solid green on done
import { useEffect, useState, type CSSProperties } from "react";
import { JourneyLevelNode } from "@/components/journey-level-node";
import {
  LEVEL_IDS,
  getLevelNumber,
  getShortLevelLabel,
  type LevelState,
} from "@/lib/journey-progression";
import type { LevelId } from "@/lib/types";

const DESKTOP_BREAKPOINT = 1100;
const HEIGHT_DESKTOP = 640;
const HEIGHT_MOBILE = 520;
const TRACK_PADDING = 18;
const TRACK_WIDTH = 16;

export type JourneyTrackProps = {
  levelStates: Map<LevelId, LevelState>;
  currentLevel: LevelId;
  onLevelClick?: (id: LevelId) => void;
  onLevelHover?: (id: LevelId | null) => void;
};

// Descendant order on desktop: L7 top -> L0 bottom (matches wireframe).
// Ascendant order on mobile: L0 bottom -> L7 top (visually = L7 top -> L0 bottom
// when iterating top-to-bottom; same array, different fill direction).
function orderedForDesktop(): LevelId[] {
  return [...LEVEL_IDS].reverse();
}
function orderedForMobile(): LevelId[] {
  // Mobile = ascendant. Iterating top-to-bottom we want L7 at top, L0 at bottom
  // because user's eye reads top-down but charge fills upward (bottom -> top).
  return [...LEVEL_IDS].reverse();
}

export function JourneyTrack({
  levelStates,
  currentLevel,
  onLevelClick,
  onLevelHover,
}: JourneyTrackProps) {
  // Track desktop vs mobile via window size (client-side only). SSR renders
  // desktop default; hydration adjusts.
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const ordered = isDesktop ? orderedForDesktop() : orderedForMobile();
  const N = ordered.length;
  const currentIdx = ordered.findIndex((id) => id === currentLevel);
  const height = isDesktop ? HEIGHT_DESKTOP : HEIGHT_MOBILE;

  // progressPct = portion of the rail filled, measured from the bottom.
  // currentIdx is the index in `ordered` (top-down). The current node lives at
  // top = (currentIdx / (N-1)) * (rail-height), so the filled length from the
  // bottom equals the distance from the bottom up to that node.
  const progressPct =
    currentIdx >= 0 ? ((N - 1 - currentIdx) / (N - 1)) * 100 : 0;

  const trackStyle: CSSProperties = {
    height,
    width: TRACK_WIDTH + 12,
  };

  const railStyle: CSSProperties = {
    width: TRACK_WIDTH,
  };

  // Charge fill anchored at the bottom for both desktop+mobile (visual
  // metaphor: "charge accumulates from the start of the journey").
  const fillStyle: CSSProperties = {
    bottom: TRACK_PADDING,
    width: TRACK_WIDTH,
    height: `calc((100% - ${TRACK_PADDING * 2}px) * ${progressPct / 100})`,
  };

  return (
    <div className="eic-track" style={trackStyle}>
      <div aria-hidden="true" className="eic-track__rail" style={railStyle} />
      <div aria-hidden="true" className="eic-track__fill" style={fillStyle} />

      {ordered.map((id, i) => {
        const state = levelStates.get(id) ?? "locked";
        const topPct = (i / (N - 1)) * 100;
        const number = getLevelNumber(id);
        const label = getShortLevelLabel(id);
        const aria =
          state === "current"
            ? `Niveau ${number} - ${label} (en cours)`
            : state === "done"
              ? `Niveau ${number} - ${label} (valide)`
              : `Niveau ${number} - ${label} (verrouille)`;
        return (
          <JourneyLevelNode
            ariaLabel={aria}
            key={id}
            levelId={id}
            number={number}
            onClick={() => state !== "locked" && onLevelClick?.(id)}
            onMouseEnter={() => onLevelHover?.(id)}
            onMouseLeave={() => onLevelHover?.(null)}
            state={state}
            topPct={topPct}
          />
        );
      })}

      <span aria-hidden="true" className="eic-track__crown eic-track__crown--top">
        {"▲"} PITCH
      </span>
      <span aria-hidden="true" className="eic-track__crown eic-track__crown--bottom">
        DEPART
      </span>
    </div>
  );
}
