"use client";
// T3-A5 (quick 260510-jm8) — 3 triggers événementiels Player pour la mascotte Pixel.
// Tous les triggers sont DÉTERMINISTES (jamais random) et conformes R1 (aucune
// donnée score/rang/percentile manipulée), R2 (warn-only sur le mood inquiet —
// la copie reste encourageante), R3 (aucun blocage de mission).

import { useCallback, useEffect, useRef, useState } from "react";

const FIRST_DELIVERY_KEY = "eg_pixel_a_first_delivery";
const STAGNATION_THRESHOLD_MS = 15 * 60 * 1000; // 15 min

export type PixelTriggerState = {
  /** When true, the player wrapper should render the mascot. */
  triggered: boolean;
  /** Programmatically dismiss the mascot (also called on auto-hide timer). */
  dismiss: () => void;
};

/**
 * Trigger (a) — fires once per browser the first time `submissionOk` flips true.
 * Persistence: localStorage flag (acceptable trade-off for pilot — magic-link
 * sessions are 1 user per browser in practice). After dismiss, will not fire
 * again on this browser.
 */
export function useFirstDeliveryTrigger(submissionOk: boolean): PixelTriggerState {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!submissionOk) return;
    if (typeof window === "undefined") return;
    try {
      const already = window.localStorage.getItem(FIRST_DELIVERY_KEY);
      if (already === "1") return; // déjà tiré sur ce navigateur
      window.localStorage.setItem(FIRST_DELIVERY_KEY, "1");
      setTriggered(true);
    } catch {
      // private browsing / quota → skip silently (acceptable, R3 — pas de blocage)
    }
  }, [submissionOk]);

  const dismiss = useCallback(() => setTriggered(false), []);
  return { triggered, dismiss };
}

/**
 * Trigger (b) — fires after >15min of no interaction (pointermove + keydown +
 * scroll). Pauses when document.visibilityState === "hidden" so background
 * tabs don't fire false positives. Resets on any interaction. Can re-trigger
 * after dismiss + new stagnation period (no persistence — session-scoped).
 */
export function useStagnationTrigger(): PixelTriggerState {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timeoutId: number | null = null;
    let paused = false;

    const arm = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (paused) return;
      timeoutId = window.setTimeout(() => {
        setTriggered(true);
      }, STAGNATION_THRESHOLD_MS);
    };

    const onActivity = () => {
      // Toute activité → reset (laisse l'utilisateur dismiss s'il a déjà ouvert)
      arm();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        paused = true;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      } else {
        paused = false;
        arm();
      }
    };

    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    arm();

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const dismiss = useCallback(() => setTriggered(false), []);
  return { triggered, dismiss };
}

/**
 * Trigger (c) — fires when a form publishes a CustomEvent 'pixel:verbatim-count'
 * on window with detail.count transitioning 1 → 2. Câblage prêt, DORMANT
 * aujourd'hui (M2.2 cartes_repetables n'existe pas encore — voir T3-IMPROVEMENTS
 * section F). Aucun form actuel ne dispatch cet event ; lorsque le futur
 * verbatim-cards-form sera livré (plan séparé), il devra simplement faire :
 *
 *   window.dispatchEvent(new CustomEvent("pixel:verbatim-count", { detail: { count } }));
 *
 * à chaque ajout/validation de carte.
 */
export function useVerbatimCountTrigger(): PixelTriggerState {
  const [triggered, setTriggered] = useState(false);
  const lastCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ count?: number }>;
      const next = typeof ce.detail?.count === "number" ? ce.detail.count : 0;
      // Trigger uniquement au passage 1 → 2 (déterministe, jamais random)
      if (lastCountRef.current === 1 && next === 2) {
        setTriggered(true);
      }
      lastCountRef.current = next;
    };
    window.addEventListener("pixel:verbatim-count", handler as EventListener);
    return () => {
      window.removeEventListener("pixel:verbatim-count", handler as EventListener);
      // Reset ref on unmount so re-mount starts fresh
      lastCountRef.current = 0;
    };
  }, []);

  const dismiss = useCallback(() => setTriggered(false), []);
  return { triggered, dismiss };
}
