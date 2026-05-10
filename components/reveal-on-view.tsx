"use client";
// Phase 11 / B3 — Reveal-on-view client wrapper.
//
// Wraps server-component children. Adds `is-revealed` class to the root
// element when it enters the viewport via IntersectionObserver. Reduced-motion
// users skip the observer and see the revealed state immediately.
//
// Used for staged reveals on /results (podium → stats → timeline).

import { useInView } from "@/hooks/use-in-view";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  threshold?: number;
};

export function RevealOnView({ children, className, threshold }: Props) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold });
  const cls = [
    "eic-reveal",
    isInView ? "is-revealed" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} ref={ref}>
      {children}
    </div>
  );
}
