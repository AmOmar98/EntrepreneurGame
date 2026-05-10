// Phase 7 / Plan 07-01 - Single node on the JourneyTrack vertical bar.
// Visual states (done/current/locked) mirror the wireframe in
// .planning/design-v2/project/player-screens.jsx (ChargingBar nodes).
// Style ownership: classes live in app/globals.css under .eic-track__node.
//
// Quick 260510-j2j (T3-B2): locked nodes render an amber warn-only tooltip
// (R2 — never red/danger) and stay focus-able / keyboard-discoverable
// (R3 — no hardcoded blocking; `disabled` removed from the DOM element).
// The no-op locked-click is enforced by the parent (journey-track.tsx)
// via `onClick={() => state !== "locked" && onLevelClick?.(id)}`.
import type { CSSProperties } from "react";
import { dictionaries } from "@/lib/i18n";
import type { LevelState } from "@/lib/journey-progression";

const t = dictionaries.fr;

export type JourneyLevelNodeProps = {
  levelId: string;
  number: string;
  state: LevelState;
  topPct: number;
  ariaLabel: string;
  // Phase 11 / A3 — first-paint stagger. Milliseconds, applied as
  // CSS custom prop --node-delay on the button. Kept in motion-layer only
  // (animation-delay, not opacity transition-delay) so AT focus order
  // is unaffected. Caller computes delay from node position to match the
  // bottom-up "charging" metaphor.
  nodeDelayMs?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function JourneyLevelNode({
  levelId,
  number,
  state,
  topPct,
  ariaLabel,
  nodeDelayMs,
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
  const style: CSSProperties & { ["--node-delay"]?: string } = {
    top: `${topPct}%`,
    ...(typeof nodeDelayMs === "number" ? { ["--node-delay"]: `${nodeDelayMs}ms` } : {}),
  };
  const label = state === "done" ? "✓" : number;
  const isLocked = state === "locked";
  const tooltipId = `eic-track-tooltip-${levelId}`;
  return (
    <button
      aria-current={state === "current" ? "step" : undefined}
      aria-describedby={isLocked ? tooltipId : undefined}
      aria-disabled={isLocked ? "true" : undefined}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      type="button"
    >
      {label}
      {state === "current" ? <span aria-hidden="true" className="eic-track__node-pulse" /> : null}
      {isLocked ? (
        <span
          aria-hidden="false"
          className="eic-track__node-tooltip"
          id={tooltipId}
          role="tooltip"
        >
          {t.journey_v2_locked_hint_amber}
        </span>
      ) : null}
    </button>
  );
}
