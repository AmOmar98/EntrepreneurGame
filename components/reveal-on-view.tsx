"use client";
// Phase 11 / B3 — Reveal-on-view client wrapper.
//
// Wraps server-component children. Adds `is-revealed` class to the root
// element when it enters the viewport via IntersectionObserver. Reduced-motion
// users skip the observer and see the revealed state immediately.
//
// Used for staged reveals on /results (podium → stats → timeline).

import { useInView } from "@/hooks/use-in-view";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  threshold?: number;
  // RES-06 a11y: stagger delay via CSS custom property --reveal-delay.
  // Pass e.g. style={{ "--reveal-delay": "200ms" } as CSSProperties}.
  style?: CSSProperties;
};

export function RevealOnView({ children, className, threshold, style }: Props) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold });
  const cls = [
    "eic-reveal",
    isInView ? "is-revealed" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} ref={ref} style={style}>
      {children}
    </div>
  );
}
