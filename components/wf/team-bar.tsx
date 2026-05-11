import { clsx } from "clsx";

type TeamBarProps = {
  /** Current level index (0..totalLevels-1). */
  level: number;
  /** Missions completed within the current level (≥ 1 adds partial fill). */
  levelDone: number;
  /** Total levels in the journey (default 8 → L0..L7). */
  totalLevels?: number;
  /** Optional class on outer wrapper. */
  className?: string;
};

/**
 * Horizontal charging bar — design v2 admin/régie variation.
 * Source: admin-screens.jsx (TeamBar component lines 81-104).
 *
 * Shows L0→L(totalLevels-1) progression with gradient green→blue fill
 * and per-level tick marks. Partial fill (40%) when current level has at
 * least 1 mission validated.
 */
export function TeamBar({ level, levelDone, totalLevels = 8, className }: TeamBarProps) {
  const n = Math.max(2, totalLevels);
  const clampedLevel = Math.min(n - 1, Math.max(0, level));
  const partial = levelDone > 0 ? 0.4 : 0;
  const pct = ((clampedLevel + partial) / (n - 1)) * 100;

  return (
    <div
      className={clsx("wf-team-bar", className)}
      style={{
        position: "relative",
        height: 8,
        background: "rgba(154,145,127,0.22)",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid rgba(154,145,127,0.25)",
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={n - 1}
      aria-valuenow={Math.round((clampedLevel + partial) * 10) / 10}
      aria-label={`Niveau ${clampedLevel} sur ${n - 1}`}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--wf-green) 0%, var(--wf-blue) 80%)",
          borderRadius: 8,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      />
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(i / (n - 1)) * 100}%`,
            top: "50%",
            width: 2,
            height: 4,
            marginLeft: -1,
            transform: "translateY(-50%)",
            background:
              i <= clampedLevel ? "rgba(255,255,255,0.5)" : "rgba(154,145,127,0.5)",
          }}
        />
      ))}
    </div>
  );
}
