"use client";

// HelpRequestComposer (quick-260512-24v)
// Modal client component for Player to send a help message to mentors.
// R3 guard: the only `disabled` here is on the submit button conditional on
// empty message or pending submission -- standard UX, not pedagogical blocking.
// No conditional on level, mission, status, or stuck-state.

import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createHelpRequestFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

// quick-260512-24v deferred #5: derive a short mission context from the
// pathname. Keeps the chip readable in the mentor inbox without leaking
// raw UUIDs.
function deriveMissionContext(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname.startsWith("/journey/deliverable/")) {
    const id = pathname.split("/")[3] ?? "";
    return id ? `Livrable ${id.slice(0, 8)}` : "Livrable";
  }
  if (pathname.startsWith("/journey/bonus/")) {
    const type = pathname.split("/")[3] ?? "";
    return type ? `Bonus ${type}` : "Bonus";
  }
  if (pathname.startsWith("/journey/pitch-prep")) return "Pitch prep";
  if (pathname.startsWith("/journey/help")) return "Coup de pouce";
  if (pathname.startsWith("/journey")) return "Parcours";
  if (pathname.startsWith("/onboarding")) return "Onboarding";
  return null;
}

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };
const MAX_LEN = 500;

export function HelpRequestComposer({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(
    createHelpRequestFlow,
    initialState,
  );
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const missionContext = deriveMissionContext(pathname);

  // Close on success after 1.5s so user sees feedback.
  useEffect(() => {
    if (state.ok) {
      const handle = setTimeout(onClose, 1500);
      return () => clearTimeout(handle);
    }
  }, [state.ok, onClose]);

  // ESC to close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const remaining = MAX_LEN - message.length;

  return (
    <div
      className="eic-help-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      ref={dialogRef}
    >
      <div
        className="eic-help-modal__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="eic-help-modal__panel">
        <h2 id="help-modal-title" className="eic-help-modal__title">
          {t.help_composer_title}
        </h2>
        <p className="eic-help-modal__subtitle">{t.help_composer_subtitle}</p>
        <form action={formAction} className="eic-help-modal__form">
          {missionContext ? (
            <input type="hidden" name="mission_context" value={missionContext} />
          ) : null}
          {missionContext ? (
            <p className="eic-help-modal__mission-chip" aria-live="polite">
              <span aria-hidden="true">📍</span> {missionContext}
            </p>
          ) : null}
          <label className="eic-help-modal__label">
            <textarea
              name="message"
              className="eic-help-modal__textarea"
              placeholder={t.help_composer_placeholder}
              maxLength={MAX_LEN}
              minLength={1}
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={state.ok || pending}
              aria-describedby="help-char-count"
            />
            <span
              id="help-char-count"
              className="eic-help-modal__counter"
              aria-live="polite"
            >
              {remaining} {t.help_composer_char_remaining}
            </span>
          </label>
          {state.message ? (
            <p
              className={
                state.ok
                  ? "eic-help-modal__success"
                  : "eic-help-modal__error"
              }
              role="status"
            >
              {state.message}
            </p>
          ) : null}
          {state.ok && state.mailto ? (
            <a
              className="eic-help-modal__mailto"
              href={state.mailto}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.help_composer_mailto}
            </a>
          ) : null}
          <div className="eic-help-modal__actions">
            <button
              type="button"
              className="eic-help-modal__cancel"
              onClick={onClose}
              disabled={pending}
            >
              {t.help_composer_cancel}
            </button>
            <button
              type="submit"
              className="eic-help-modal__submit"
              disabled={pending || state.ok || message.length === 0}
            >
              {pending ? t.help_composer_submitting : t.help_composer_submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
