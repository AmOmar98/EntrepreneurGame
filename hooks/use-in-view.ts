"use client";
// Phase 11 / B3 — IntersectionObserver-based reveal hook.
//
// Returns a (ref, isInView) tuple. The element gains `is-revealed` once it
// enters the viewport at the given threshold (default 0.15 = 15% visible).
//
// Reduced-motion behaviour: when `prefers-reduced-motion: reduce` is set,
// the observer is NOT attached and isInView is set to true immediately.
// AT users see the final (post-reveal) state on first paint.
//
// One-shot: once revealed, the observer disconnects (no toggle on scroll-up).

import { useEffect, useRef, useState } from "react";

export type UseInViewOptions = {
  threshold?: number;
  rootMargin?: string;
};

export function useInView<T extends HTMLElement = HTMLElement>(
  options: UseInViewOptions = {},
): { ref: React.RefObject<T | null>; isInView: boolean } {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Reduced-motion: skip observer, reveal immediately.
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsInView(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    // Fallback for old browsers without IntersectionObserver: reveal immediately.
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: options.threshold ?? 0.15,
        rootMargin: options.rootMargin ?? "0px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, isInView };
}
