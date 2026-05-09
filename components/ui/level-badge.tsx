export type LevelBadgeProps = {
  state: "done" | "current" | "locked";
  level: "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
  size?: "default" | "lg";
  className?: string;
};

export function LevelBadge({
  state,
  level,
  size = "default",
  className,
}: LevelBadgeProps) {
  const classes = [
    "eic-level-badge",
    `eic-level-badge--${state}`,
    size === "lg" ? "eic-level-badge--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const ariaLabel =
    state === "current"
      ? `Niveau ${level} (en cours)`
      : state === "done"
        ? `Niveau ${level} (validé)`
        : `Niveau ${level} (verrouillé)`;
  return (
    <span aria-label={ariaLabel} className={classes} role="img">
      {level}
    </span>
  );
}
