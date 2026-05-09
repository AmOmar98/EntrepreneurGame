export type ProgressBarProps = {
  value: number;
  tone?: "blue" | "green";
  size?: "default" | "lg";
  ariaLabel?: string;
  className?: string;
};

export function ProgressBar({
  value,
  tone = "green",
  size = "default",
  ariaLabel,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const pct = Math.round(clamped * 100);
  const classes = [
    "eic-progress",
    tone === "blue" ? "eic-progress--blue" : null,
    size === "lg" ? "eic-progress--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={pct}
      className={classes}
      role="progressbar"
    >
      <div className="eic-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
