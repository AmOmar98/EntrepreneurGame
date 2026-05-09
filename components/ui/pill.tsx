import { type ReactNode } from "react";

export type PillProps = {
  tone?: "default" | "blue" | "green" | "amber" | "rose";
  size?: "default" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Pill({
  tone = "default",
  size = "default",
  icon,
  children,
  className,
}: PillProps) {
  const classes = [
    "eic-pill",
    tone !== "default" ? `eic-pill--${tone}` : null,
    size === "lg" ? "eic-pill--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes}>
      {icon ? (
        <span aria-hidden="true" className="eic-pill__icon">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
