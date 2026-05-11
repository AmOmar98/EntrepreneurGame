"use client";

import { clsx } from "clsx";

type DialProps = {
  /** Main label shown above the dial. */
  label: string;
  /** Optional secondary label (e.g. English translation). */
  sublabel?: string;
  /** Current value (clamped to [0, max]). */
  value: number;
  /** Maximum value (default 20). */
  max?: number;
  /** When provided, dial is interactive with −/+ buttons. */
  onChange?: (next: number) => void;
  /** Optional class on outer card wrapper. */
  className?: string;
  /** Optional step for −/+ buttons (default 1). */
  step?: number;
  /** Accessible name for the slider role. */
  ariaLabel?: string;
};

/**
 * Rotary dial — design v2 V3 variation for jury scoring.
 * Source: jury-screens.jsx (Dial component lines 309-360).
 *
 * Visual: SVG 120×120 with 270° arc from -135° to +135°.
 * Interaction: −/+ buttons below the dial when onChange is provided (safer
 * than drag-rotate for pilot reliability — design notes line 573 "Boutons
 * +/− toujours utiles").
 */
export function Dial({
  label,
  sublabel,
  value,
  max = 20,
  onChange,
  className,
  step = 1,
  ariaLabel,
}: DialProps) {
  const clamped = Math.min(max, Math.max(0, value));
  const ratio = max === 0 ? 0 : clamped / max;
  const startAngle = -135;
  const sweep = 270;
  const angle = startAngle + ratio * sweep;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const trackLength = (sweep / 360) * circumference;
  const progressLength = ratio * trackLength;
  const indicatorRad = (angle * Math.PI) / 180;
  const indicatorX = 60 + Math.cos(indicatorRad) * 28;
  const indicatorY = 60 + Math.sin(indicatorRad) * 28;
  const interactive = typeof onChange === "function";

  const decrement = () => {
    if (!onChange) return;
    onChange(Math.max(0, clamped - step));
  };
  const increment = () => {
    if (!onChange) return;
    onChange(Math.min(max, clamped + step));
  };

  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onChange) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      decrement();
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      increment();
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(max);
    }
  };

  return (
    <div
      className={clsx("wf-card wf-dial", className)}
      style={{
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textAlign: "center",
          color: "var(--wf-ink)",
        }}
      >
        {label}
      </div>
      {sublabel ? (
        <div
          style={{
            fontSize: 9,
            color: "var(--wf-ink-faint)",
            textAlign: "center",
            marginTop: -4,
          }}
        >
          {sublabel}
        </div>
      ) : null}
      <div
        role={interactive ? "slider" : undefined}
        aria-label={interactive ? ariaLabel ?? label : undefined}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? max : undefined}
        aria-valuenow={interactive ? clamped : undefined}
        tabIndex={interactive ? 0 : -1}
        onKeyDown={interactive ? handleKey : undefined}
        style={{ outline: "none" }}
      >
        <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden={!interactive}>
          {/* Outer ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--wf-paper-deep)"
            strokeWidth="2"
          />
          {/* Tick marks */}
          {Array.from({ length: 21 }).map((_, i) => {
            const a = ((-135 + i * 13.5) * Math.PI) / 180;
            const inner = i % 5 === 0 ? 44 : 48;
            const x1 = 60 + Math.cos(a) * 52;
            const y1 = 60 + Math.sin(a) * 52;
            const x2 = 60 + Math.cos(a) * inner;
            const y2 = 60 + Math.sin(a) * inner;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--wf-line-strong)"
                strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
              />
            );
          })}
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--wf-paper-deep)"
            strokeWidth="6"
            strokeDasharray={`${trackLength} ${circumference}`}
            transform="rotate(135 60 60)"
          />
          {/* Progress arc */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--wf-blue)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${circumference}`}
            transform="rotate(135 60 60)"
          />
          {/* Knob */}
          <circle cx="60" cy="60" r="32" fill="#fff" stroke="var(--wf-line)" strokeWidth="1" />
          <circle cx="60" cy="60" r="32" fill="url(#wf-dial-grad)" opacity="0.6" />
          <defs>
            <radialGradient id="wf-dial-grad" cx="0.4" cy="0.3">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#E9E2D0" />
            </radialGradient>
          </defs>
          {/* Indicator */}
          <line
            x1="60"
            y1="60"
            x2={indicatorX}
            y2={indicatorY}
            stroke="var(--wf-blue)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="60" cy="60" r="3" fill="var(--wf-blue)" />
          {/* Value text */}
          <text
            x="60"
            y="92"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fontFamily="var(--font-heading, Baskervville, serif)"
            fill="var(--wf-ink)"
          >
            {clamped}
          </text>
        </svg>
      </div>
      {interactive ? (
        <div className="wf-row" style={{ gap: 6 }}>
          <button
            type="button"
            className="wf-btn"
            style={{ padding: "3px 10px", fontSize: 12 }}
            onClick={decrement}
            aria-label={`Diminuer ${label}`}
            disabled={clamped <= 0}
          >
            −
          </button>
          <button
            type="button"
            className="wf-btn is-primary"
            style={{ padding: "3px 10px", fontSize: 12 }}
            onClick={increment}
            aria-label={`Augmenter ${label}`}
            disabled={clamped >= max}
          >
            +
          </button>
        </div>
      ) : (
        <div className="wf-row" style={{ gap: 4, fontSize: 10, color: "var(--wf-ink-faint)" }}>
          <span>0</span>
          <span>·</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
