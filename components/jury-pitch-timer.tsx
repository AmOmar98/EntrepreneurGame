"use client";
// Phase 9 / GMR-04 — Jury pitch theater 5-minute countdown timer.
import { useCallback, useEffect, useRef, useState } from "react";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const DEFAULT_DURATION_S = 5 * 60;

type Props = {
  durationSeconds?: number;
  className?: string;
};

function fmt(total: number): string {
  const m = Math.max(0, Math.floor(total / 60));
  const s = Math.max(0, total % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function JuryPitchTimer({
  durationSeconds = DEFAULT_DURATION_S,
  className,
}: Props) {
  const [remaining, setRemaining] = useState<number>(durationSeconds);
  const [running, setRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (!running) {
      stop();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // Stop on next tick.
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return stop;
  }, [running, stop]);

  const pct = Math.max(0, Math.min(1, remaining / durationSeconds));
  // quick-260519-jpr Wave 2 — bump danger threshold to <1min (spec mockup 1).
  const danger = remaining <= 60;

  return (
    <div
      className={
        className
          ? `eic-jury-timer ${className}`
          : "eic-jury-timer"
      }
    >
      <p className="eic-jury-timer__label">{t.jury_pitch_timer_label}</p>
      <p
        aria-live="polite"
        className={
          danger
            ? "eic-jury-timer__value eic-jury-timer__value--danger"
            : "eic-jury-timer__value"
        }
      >
        {remaining === 0 ? t.jury_pitch_timer_done : fmt(remaining)}
      </p>
      <div
        aria-hidden="true"
        className={
          danger
            ? "eic-jury-timer__bar eic-jury-timer__bar--danger"
            : "eic-jury-timer__bar"
        }
      >
        <span
          className="eic-jury-timer__bar-fill"
          style={{ width: `${(pct * 100).toFixed(1)}%` }}
        />
      </div>
      <div className="eic-jury-timer__controls">
        {!running ? (
          <button
            className="eic-button eic-button--primary"
            onClick={() => {
              if (remaining === 0) setRemaining(durationSeconds);
              setRunning(true);
            }}
            type="button"
          >
            {remaining < durationSeconds && remaining > 0
              ? "▸"
              : t.jury_pitch_timer_start}
          </button>
        ) : (
          <button
            className="eic-button eic-button--ghost"
            onClick={() => setRunning(false)}
            type="button"
          >
            ❚❚ {t.jury_pitch_timer_pause}
          </button>
        )}
        <button
          className="eic-button eic-button--ghost"
          onClick={() => {
            setRunning(false);
            setRemaining(durationSeconds);
          }}
          type="button"
        >
          {t.jury_pitch_timer_reset}
        </button>
      </div>
    </div>
  );
}
