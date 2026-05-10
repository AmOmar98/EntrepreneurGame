"use client";
// A4 — Field completion counter (T3-IMPROVEMENTS.md A4)
// Displays "Y/N champs remplis" in the header of <SubmissionForm>,
// where Y = filled required-visible fields, N = total required-visible fields.
//
// Wording validated by eic-pedagogical-advisor (ADVISOR-VERDICT.md):
//   - "Y/N champs remplis" — counts form fields, not XP/score (R1 PASS)
//   - No blocking logic — button Soumettre stays independent (R2 PASS)
//   - No mission-progression logic (R3 PASS)
//   - aria-live="polite" for a11y
//
// Animation: when a field transitions from empty to filled, a ✓ icon pops
// via a CSS keyframe. The <span key={pulseKey}> technique (React remount)
// guarantees animation replay on every vide→rempli transition.
// Animation is suppressed when prefers-reduced-motion: reduce is active.
//
// Field counting rules:
//   - Counts: input (not hidden, not radio, not checkbox), textarea, select
//   - Filter: element must be visible (offsetParent !== null) AND required
//     (native `required` attribute OR `data-required="true"`)
//   - Radio buttons (`kind` field) are excluded — they always have a value
//   - Returns null when total === 0 (defensive: form with no required fields)

import { useEffect, useRef, useState, type RefObject } from "react";

/** Returns true if the element is visible in the DOM (not display:none / hidden). */
function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute("hidden")) return false;
  // offsetParent === null means display:none or the element is detached.
  return el.offsetParent !== null || el === document.activeElement;
}

/** Returns true if the element is marked as required (native or data-required). */
function isRequired(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): boolean {
  return el.required || el.dataset.required === "true";
}

/** Recompute filled / total counts from the form's current DOM state. */
function computeCounts(form: HTMLFormElement): { filled: number; total: number } {
  const fields = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea,select",
    ),
  ).filter((el) => isVisible(el) && isRequired(el));

  const total = fields.length;
  const filled = fields.filter((el) => el.value.trim().length > 0).length;
  return { filled, total };
}

export function FieldCompletionCounter({
  formRef,
}: {
  formRef: RefObject<HTMLFormElement | null>;
}) {
  const [counts, setCounts] = useState({ filled: 0, total: 0 });
  // pulseKey increments on every vide→rempli transition to trigger animation replay.
  const [pulseKey, setPulseKey] = useState(0);
  // Track previous filled count to detect vide→rempli direction.
  const prevFilledRef = useRef(0);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const recompute = () => {
      const next = computeCounts(form);
      setCounts((prev) => {
        // Only update state when something actually changed (avoids spurious renders).
        if (prev.filled === next.filled && prev.total === next.total) return prev;
        // Trigger pulse animation only on positive transition (vide → rempli).
        if (next.filled > prevFilledRef.current) {
          setPulseKey((k) => k + 1);
        }
        prevFilledRef.current = next.filled;
        return next;
      });
    };

    // Initial count on mount.
    recompute();

    // MutationObserver watches for DOM changes (e.g. radio kind switch shows/hides fields).
    const obs = new MutationObserver(recompute);
    obs.observe(form, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "required", "data-required"],
    });

    // input event covers typing, paste, select-change, etc.
    form.addEventListener("input", recompute);

    return () => {
      obs.disconnect();
      form.removeEventListener("input", recompute);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // NOTE: formRef intentionally excluded — stable ref, .current read at effect time.

  const { filled, total } = counts;

  // Do not render if no required-visible fields are found (defensive).
  if (total === 0) return null;

  return (
    <p aria-live="polite" className="eic-field-counter">
      {/* ✓ icon pops via CSS keyframe on vide→rempli (key triggers React remount = animation replay). */}
      {filled > 0 && (
        <span key={pulseKey} aria-hidden="true" className="eic-field-counter__check">
          {"✓ "}
        </span>
      )}
      {filled}/{total} champs remplis
    </p>
  );
}
