export type EICLogoProps = {
  variant?: "default" | "white";
  className?: string;
};

export function EICLogo({ variant = "default", className }: EICLogoProps) {
  const isWhite = variant === "white";
  const markBg = isWhite ? "transparent" : "var(--eic-blue)";
  const markStroke = isWhite ? "rgba(255,255,255,0.9)" : "transparent";
  const markText = "#FFFFFF";
  const wordColor = isWhite ? "#FFFFFF" : "var(--eic-blue)";
  const kickerColor = isWhite ? "rgba(255,255,255,0.85)" : "var(--eic-green)";
  const dotColor = "var(--eic-green)";
  const dotRing = isWhite ? "rgba(27,58,92,0.0)" : "var(--home-surface)";
  const classes = [
    "eic-logo",
    isWhite ? "eic-logo--white" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} role="img" aria-label="EIC - Euromed Innovation Center">
      <svg
        aria-hidden="true"
        focusable="false"
        height="28"
        viewBox="0 0 28 28"
        width="28"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          fill={markBg}
          height="28"
          rx="6"
          ry="6"
          stroke={markStroke}
          strokeWidth={isWhite ? 1.5 : 0}
          width="28"
          x="0"
          y="0"
        />
        <text
          dominantBaseline="central"
          fill={markText}
          fontFamily="var(--font-heading), Baskervville, Georgia, serif"
          fontSize="16"
          fontWeight="700"
          textAnchor="middle"
          x="14"
          y="15"
        >
          E
        </text>
        <circle
          cx="24"
          cy="24"
          fill={dotColor}
          r="5"
          stroke={dotRing}
          strokeWidth="2"
        />
      </svg>
      <span className="eic-logo__word" aria-hidden="true">
        <span className="eic-logo__name" style={{ color: wordColor }}>
          EIC
        </span>
        <span className="eic-logo__kicker" style={{ color: kickerColor }}>
          INNOVATION CENTER
        </span>
      </span>
    </span>
  );
}
