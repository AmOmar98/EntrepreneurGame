"use client";
// T3-A5 (quick 260510-jm8) — Wrapper Player de la mascotte Pixel.
// Reuses PixelAvatar from pixel-mascot.tsx (admin) but exposes a minimal
// shape: {mood, message, onDismiss}. Auto-hide ~6s, dismiss-on-click, ESC,
// reduced-motion safe (animation comes from existing .eic-pixel-mascot CSS
// which already has @media (prefers-reduced-motion: reduce) guards).
//
// R1 (score invisible Player) : aucune donnée score/rang/percentile manipulée.
// R2 (warn-only) : mood "inquiet" utilise palette ambre/warn existante (#C44536).
// R3 (no progression block) : composant purement UI, aucun import progression.

import { useEffect } from "react";
import { PixelAvatar } from "@/components/pixel-mascot";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const AUTO_HIDE_MS = 6000;

const MOOD_LABEL: Record<"euphorique" | "inquiet" | "concentre", string> = {
  euphorique: t.pixel_mascot_euphorique_label,
  inquiet: t.pixel_mascot_inquiet_label,
  concentre: t.pixel_mascot_concentre_label,
};

const MOOD_RING: Record<"euphorique" | "inquiet" | "concentre", string> = {
  euphorique: "#D97706",
  inquiet: "#C44536",
  concentre: "#1B3A5C",
};

type Props = {
  mood: "euphorique" | "inquiet" | "concentre";
  message: string;
  onDismiss: () => void;
};

export function PixelMascotPlayer({ mood, message, onDismiss }: Props) {
  // Auto-hide après ~6s
  useEffect(() => {
    const id = window.setTimeout(onDismiss, AUTO_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [onDismiss]);

  // ESC pour dismisser
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className="eic-pixel-mascot"
      role="status"
      aria-live="polite"
      aria-label={t.pixel_mascot_aria}
      style={{ zIndex: 40 }}
    >
      <button
        type="button"
        onClick={onDismiss}
        className={`eic-pixel-mascot__card eic-pixel-mascot__card--${mood}`}
        style={{ cursor: "pointer", border: "none", textAlign: "left" }}
        aria-label={t.pixel_mascot_collapse}
      >
        <div className="eic-pixel-mascot__body">
          <div className="eic-pixel-mascot__row">
            <PixelAvatar mood={mood} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="eic-pixel-mascot__label"
                style={{ color: MOOD_RING[mood] }}
              >
                {MOOD_LABEL[mood]}
              </div>
              <p className="eic-pixel-mascot__quote">« {message} »</p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
