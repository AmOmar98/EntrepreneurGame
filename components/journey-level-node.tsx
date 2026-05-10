// Phase 7 / Plan 07-01 - Single node on the JourneyTrack vertical bar.
// Visual states (done/current/locked) mirror the wireframe in
// .planning/design-v2/project/player-screens.jsx (ChargingBar nodes).
// Style ownership: classes live in app/globals.css under .eic-track__node.
import type { CSSProperties } from "react";
import type { LevelState } from "@/lib/journey-progression";

export type JourneyLevelNodeProps = {
  levelId: string;
  number: string;
  state: LevelState;
  topPct: number;
  ariaLabel: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function JourneyLevelNode({
  number,
  state,
  topPct,
  ariaLabel,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: JourneyLevelNodeProps) {
  const stateClass =
    state === "done"
      ? "is-done"
      : state === "current"
        ? "is-current"
        : "is-locked";
  const className = `eic-track__node ${stateClass}`;
  const style: CSSProperties = { top: `${topPct}%` };
  const label = state === "done" ? "✓" : number;
  return (
    <button
      aria-current={state === "current" ? "step" : undefined}
      aria-label={ariaLabel}
      className={className}
      disabled={state === "locked"}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      type="button"
    >
      {label}
      {state === "current" ? <span aria-hidden="true" className="eic-track__node-pulse" /> : null}
    </button>
  );
}
