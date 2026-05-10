"use client";
// A1 — Auto-save hook (T3-IMPROVEMENTS.md A1)
// Reads form values every `intervalMs` ms (default 8000) via FormData,
// writes to localStorage when the serialized value changes (shallow compare),
// hydrates form fields from localStorage on mount (anti-FOUC), and exposes
// `lastSavedAt` for the <AutoSaveBadge> display + a `clear` function called
// on successful submit to purge the draft.
//
// Safety invariants:
// - Never calls a server action — client-side localStorage only (R2 preserved).
// - SSR-safe: all localStorage access guarded by typeof window check.
// - Privacy-mode safe: try/catch around every localStorage call.
// - Does not block form submission in any way (R2 strict).

import { useEffect, useRef, useState, type RefObject } from "react";

export type AutoSaveOptions = {
  /** Polling interval in milliseconds. Default: 8000. */
  intervalMs?: number;
  /** localStorage key for this draft, e.g. `eg_draft_<deliverableTemplateId>`. */
  key: string;
};

export type AutoSaveResult = {
  /** Timestamp of the last successful localStorage write, or null if never saved. */
  lastSavedAt: Date | null;
  /**
   * Removes the draft from localStorage and resets internal state.
   * Call this on successful form submission (state.ok === true).
   */
  clear: () => void;
};

export function useAutoSave(
  formRef: RefObject<HTMLFormElement | null>,
  { intervalMs = 8000, key }: AutoSaveOptions,
): AutoSaveResult {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // Tracks the last serialized form state to avoid unnecessary writes.
  const lastSerializedRef = useRef<string | null>(null);

  // Hydrate form fields from localStorage on mount.
  // Must run before first paint to avoid FOUC on text restoration.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const form = formRef.current;
    if (!form) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, string>;
      for (const [name, value] of Object.entries(stored)) {
        const el = form.elements.namedItem(name) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement
          | null;
        if (el && "value" in el) {
          el.value = value;
        }
      }
      // Mark as "previously saved" so the badge shows a sensible initial state.
      lastSerializedRef.current = raw;
      setLastSavedAt(new Date());
    } catch {
      // Corrupted JSON or storage unavailable — ignore silently.
    }
  }, [key]);
  // NOTE: formRef intentionally excluded from deps — the ref object is stable,
  // its .current is what matters and is read at effect time (not captured).
  // (eslint-plugin-react-hooks not registered in eslint.config.mjs; no
  // exhaustive-deps disable directive needed at the moment.)

  // Polling tick: read form, compare, write if changed.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
      const form = formRef.current;
      if (!form) return;

      // Serialize current form state (string values only, skip files).
      const data = new FormData(form);
      const obj: Record<string, string> = {};
      for (const [name, value] of data.entries()) {
        if (typeof value === "string") {
          obj[name] = value;
        }
      }
      const next = JSON.stringify(obj);

      // Skip write if nothing changed.
      if (next === lastSerializedRef.current) return;

      try {
        window.localStorage.setItem(key, next);
        lastSerializedRef.current = next;
        setLastSavedAt(new Date());
      } catch {
        // Quota exceeded or private browsing denial — fail silently.
        // The badge will keep showing "Pas encore sauvegarde" or the last
        // successful timestamp, which is acceptable UX at pilot scale.
      }
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, key]);
  // NOTE: formRef intentionally excluded from deps — stable ref, read at tick time.
  // (See note above re: eslint-plugin-react-hooks not registered.)

  const clear = (): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
      lastSerializedRef.current = null;
    } catch {
      // Storage unavailable — noop.
    }
  };

  return { lastSavedAt, clear };
}
