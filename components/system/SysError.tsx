"use client";
// Phase 10 / Section 13 — Error state (App Router error boundary global).
// Pixel mood "error" + 503 code mono + retry compte a rebours.
// Client-side because retry uses useState/useEffect.

import { useEffect, useState } from "react";
import { PixelAvatar } from "@/components/pixel-mascot";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  error?: Error & { digest?: string };
  reset?: () => void;
  // Default 5 seconds countdown before automatic retry suggestion.
  countdownSeconds?: number;
};

export function SysError({ reset, countdownSeconds = 5 }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const formatted = String(secondsLeft).padStart(2, "0");

  return (
    <section className="eic-sys eic-sys--error" role="alert">
      <div className="eic-sys__avatar">
        <PixelAvatar mood="error" size={96} />
      </div>
      <code className="eic-sys__code">{t.system_error_code}</code>
      <h2 className="eic-sys__title">{t.system_error_title}</h2>
      <p className="eic-sys__lead">
        {t.system_error_lead} <strong>00:{formatted}</strong>
      </p>
      <p className="eic-sys__quote">« {t.pixel_mascot_error_quote} »</p>
      {reset ? (
        <button
          type="button"
          onClick={reset}
          className="eic-button eic-button--primary"
        >
          {t.system_error_retry}
        </button>
      ) : null}
    </section>
  );
}
