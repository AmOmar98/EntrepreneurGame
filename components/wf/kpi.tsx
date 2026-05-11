import type { ReactNode } from "react";
import { clsx } from "clsx";

type KpiAccent = "blue" | "green" | "amber" | "red";

type KpiProps = {
  /** Small uppercase label (kicker). */
  label: string;
  /** Main numeric or text value. */
  value: ReactNode;
  /** Optional footnote under the value. */
  foot?: ReactNode;
  /** Color accent for the value (default blue). */
  accent?: KpiAccent;
  /** Optional extra class on outer wrapper. */
  className?: string;
};

const ACCENT_COLOR: Record<KpiAccent, string> = {
  blue: "var(--wf-blue)",
  green: "var(--wf-green)",
  amber: "var(--wf-amber)",
  red: "var(--wf-rose)",
};

/**
 * KPI card — design v2 admin/régie variation.
 * Source: admin-screens.jsx (KPI component lines 65-79).
 *
 * Renders a .wf-glass card with a kicker label and a large accented value.
 * Accent maps to --wf-* token colors.
 */
export function Kpi({ label, value, foot, accent = "blue", className }: KpiProps) {
  const fg = ACCENT_COLOR[accent];
  return (
    <div
      className={clsx("wf-glass wf-kpi", className)}
      style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div className="wf-kicker">{label}</div>
      <div className="wf-row" style={{ gap: 8, alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: "var(--font-body, Montserrat, system-ui), sans-serif",
            fontSize: 30,
            fontWeight: 800,
            color: fg,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {foot ? (
          <span style={{ fontSize: 11, color: "var(--wf-ink-soft)" }}>{foot}</span>
        ) : null}
      </div>
    </div>
  );
}
