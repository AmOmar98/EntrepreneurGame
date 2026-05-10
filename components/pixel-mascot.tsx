"use client";
// Phase 9 / GMR-07 — Pixel mascot SVG (4 moods reflecting GMR-08 hack status).
// Floating bottom-right widget visible only in admin live mode. Click to
// collapse to a discrete pill; click pill to expand the card again.
//
// Phase 10 / 1.1 + 1.3 — palette refactored to consume var(--mood-*) tokens
// from app/eic-tokens.css; PixelAvatar widened to accept "loading" | "error"
// moods (consumed by Section 13 system states — SysLoading/SysError).

import Link from "next/link";
import { useState } from "react";
import type { HackStatus, HackStatusResult } from "@/lib/hack-status";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

// Phase 10 / 1.3 : widen mood beyond HackStatus for system states.
export type PixelMood = HackStatus | "loading" | "error";

type Props = {
  result: HackStatusResult;
  // Optional override (e.g. design QA / Storybook).
  forceMood?: HackStatus;
};

type MoodPalette = { fill: string; ring: string; halo: string; bg: string };

const MOOD_TO_PALETTE: Record<PixelMood, MoodPalette> = {
  serein: {
    fill: "var(--mood-serein-fill)",
    ring: "var(--mood-serein-ring)",
    halo: "var(--mood-serein-halo)",
    bg: "var(--mood-serein-bg)",
  },
  concentre: {
    fill: "var(--mood-concentre-fill)",
    ring: "var(--mood-concentre-ring)",
    halo: "var(--mood-concentre-halo)",
    bg: "var(--mood-concentre-bg)",
  },
  inquiet: {
    fill: "var(--mood-inquiet-fill)",
    ring: "var(--mood-inquiet-ring)",
    halo: "var(--mood-inquiet-halo)",
    bg: "var(--mood-inquiet-bg)",
  },
  euphorique: {
    fill: "var(--mood-euphorique-fill)",
    ring: "var(--mood-euphorique-ring)",
    halo: "var(--mood-euphorique-halo)",
    bg: "var(--mood-euphorique-bg)",
  },
  loading: {
    fill: "var(--mood-loading-fill)",
    ring: "var(--mood-loading-ring)",
    halo: "var(--mood-loading-halo)",
    bg: "var(--mood-loading-bg)",
  },
  error: {
    fill: "var(--mood-error-fill)",
    ring: "var(--mood-error-ring)",
    halo: "var(--mood-error-halo)",
    bg: "var(--mood-error-bg)",
  },
};

const MOOD_TO_LABEL: Record<HackStatus, string> = {
  serein: t.pixel_mascot_serein_label,
  concentre: t.pixel_mascot_concentre_label,
  inquiet: t.pixel_mascot_inquiet_label,
  euphorique: t.pixel_mascot_euphorique_label,
};

function formatQuote(status: HackStatus, counts: { stale: number }): string {
  switch (status) {
    case "serein":
      return t.pixel_mascot_serein_quote;
    case "concentre":
      return t.pixel_mascot_concentre_quote;
    case "inquiet":
      return t.pixel_mascot_inquiet_quote.replace(
        "{n}",
        String(counts.stale),
      );
    case "euphorique":
      return t.pixel_mascot_euphorique_quote;
  }
}

export function PixelMascot({ result, forceMood }: Props) {
  const mood: HackStatus = forceMood ?? result.status;
  const [expanded, setExpanded] = useState(true);
  const palette = MOOD_TO_PALETTE[mood];
  const quote = formatQuote(mood, { stale: result.staleCount });
  const label = MOOD_TO_LABEL[mood];

  if (!expanded) {
    return (
      <div
        className="eic-pixel-mascot"
        role="region"
        aria-label={t.pixel_mascot_aria}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="eic-pixel-mascot__pill"
          aria-label={t.pixel_mascot_expand}
        >
          <PixelAvatar mood={mood} size={32} />
          <span className="eic-pixel-mascot__pill-text">
            <span
              className="eic-pixel-mascot__pill-kicker"
              style={{ color: palette.ring }}
            >
              Pixel
            </span>
            <span>{shortStatus(mood, result)}</span>
          </span>
          <span
            className="eic-pixel-mascot__pill-dot"
            style={{
              background: palette.ring,
              boxShadow: `0 0 0 3px ${palette.ring}25`,
            }}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  }

  return (
    <div
      className="eic-pixel-mascot"
      role="region"
      aria-label={t.pixel_mascot_aria}
    >
      <div className={`eic-pixel-mascot__card eic-pixel-mascot__card--${mood}`}>
        <div className="eic-pixel-mascot__header">
          <span>≡ Vie de Pixel</span>
          <span className="eic-pixel-mascot__header-spacer" />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="eic-pixel-mascot__collapse"
            aria-label={t.pixel_mascot_collapse}
            title={t.pixel_mascot_collapse}
          >
            −
          </button>
        </div>
        <div className="eic-pixel-mascot__body">
          <div className="eic-pixel-mascot__row">
            <PixelAvatar mood={mood} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="eic-pixel-mascot__label"
                style={{ color: palette.ring }}
              >
                {label}
              </div>
              <p className="eic-pixel-mascot__quote">« {quote} »</p>
            </div>
          </div>

          {result.microAction ? (
            result.microAction.href ? (
              <Link
                href={result.microAction.href}
                className={`eic-pixel-mascot__action eic-pixel-mascot__action--${mood}`}
              >
                {result.microAction.label} →
              </Link>
            ) : (
              <span
                className={`eic-pixel-mascot__action eic-pixel-mascot__action--${mood}`}
                aria-disabled="true"
              >
                {result.microAction.label}
              </span>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function shortStatus(mood: HackStatus, result: HackStatusResult): string {
  switch (mood) {
    case "serein":
      return "tout va bien";
    case "concentre":
      return "phase dense";
    case "inquiet":
      return `${result.staleCount} silences`;
    case "euphorique":
      return "pic d'énergie";
  }
}

// ---- SVG mascot (ported from .planning/design-v2/project/pixel-mascot.jsx) ---

export function PixelAvatar({
  mood,
  size,
}: {
  mood: PixelMood;
  size: number;
}) {
  const palette = MOOD_TO_PALETTE[mood];
  const eyeShape: "dot" | "arc" | "tilted" | "sparkle" | "loading" | "error" =
    mood === "concentre"
      ? "dot"
      : mood === "serein"
        ? "arc"
        : mood === "inquiet"
          ? "tilted"
          : mood === "euphorique"
            ? "sparkle"
            : mood === "loading"
              ? "loading"
              : "error";
  const mouth: "smile" | "flat" | "wave" | "open" | "ellipsis" =
    mood === "serein"
      ? "smile"
      : mood === "concentre"
        ? "flat"
        : mood === "inquiet"
          ? "wave"
          : mood === "euphorique"
            ? "open"
            : mood === "loading"
              ? "ellipsis"
              : "wave";

  return (
    <span
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-block",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -6,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.halo} 0%, transparent 70%)`,
        }}
      />
      <svg
        viewBox="0 0 80 80"
        width={size}
        height={size}
        style={{ position: "relative", display: "block" }}
        aria-hidden="true"
      >
        {/* Ears */}
        <path
          d="M22 22 Q18 8 28 14 Q30 18 28 24 Z"
          fill={palette.fill}
          stroke={palette.ring}
          strokeWidth="1.5"
        />
        <path
          d="M58 22 Q62 8 52 14 Q50 18 52 24 Z"
          fill={palette.fill}
          stroke={palette.ring}
          strokeWidth="1.5"
        />
        {/* Body */}
        <path
          d="M16 44 Q16 22 40 22 Q64 22 64 44 Q64 64 40 64 Q16 64 16 44 Z"
          fill={palette.fill}
          stroke={palette.ring}
          strokeWidth="1.8"
        />
        {/* Eyes */}
        {eyeShape === "dot" && (
          <>
            <circle cx="32" cy="42" r="3" fill={palette.ring} />
            <circle cx="48" cy="42" r="3" fill={palette.ring} />
          </>
        )}
        {eyeShape === "arc" && (
          <>
            <path
              d="M28 44 Q32 40 36 44"
              stroke={palette.ring}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M44 44 Q48 40 52 44"
              stroke={palette.ring}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
        {eyeShape === "tilted" && (
          <>
            <path
              d="M28 40 L36 44"
              stroke={palette.ring}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M52 40 L44 44"
              stroke={palette.ring}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </>
        )}
        {eyeShape === "sparkle" && (
          <g
            stroke={palette.ring}
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <line x1="32" y1="38" x2="32" y2="46" />
            <line x1="28" y1="42" x2="36" y2="42" />
            <line x1="48" y1="38" x2="48" y2="46" />
            <line x1="44" y1="42" x2="52" y2="42" />
          </g>
        )}
        {eyeShape === "loading" && (
          <>
            {/* Closed-ish eyes : breathing */}
            <path
              d="M28 42 Q32 44 36 42"
              stroke={palette.ring}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M44 42 Q48 44 52 42"
              stroke={palette.ring}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
        {eyeShape === "error" && (
          <>
            {/* Sad eyes : down arcs */}
            <path
              d="M28 44 Q32 48 36 44"
              stroke={palette.ring}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M44 44 Q48 48 52 44"
              stroke={palette.ring}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
        {/* Mouth */}
        {mouth === "smile" && (
          <path
            d="M34 52 Q40 56 46 52"
            stroke={palette.ring}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {mouth === "flat" && (
          <line
            x1="36"
            y1="54"
            x2="44"
            y2="54"
            stroke={palette.ring}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        {mouth === "wave" && (
          <path
            d="M34 54 Q37 51 40 54 Q43 57 46 54"
            stroke={palette.ring}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {mouth === "open" && (
          <ellipse cx="40" cy="54" rx="4" ry="3" fill={palette.ring} />
        )}
        {mouth === "ellipsis" && (
          <g fill={palette.ring}>
            <circle cx="36" cy="54" r="1.4" />
            <circle cx="40" cy="54" r="1.4" />
            <circle cx="44" cy="54" r="1.4" />
          </g>
        )}
        {/* Nose */}
        <circle cx="40" cy="48" r="1.6" fill={palette.ring} opacity="0.6" />
      </svg>
    </span>
  );
}
