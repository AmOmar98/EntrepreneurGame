"use client";
// quick-260519-jpr Wave 3 - GameMaster pitch mode toggle (off | live | closed).
// Segmented 3-button selector wired to setPitchModeStateFlow. Confirms transitions
// to live / closed via window.confirm. Disables live button when jurorCount === 0
// (server action already enforces this — defense in depth at UI level).
// State machine and visibility rules: see lib/pitch-mode.ts header.

import { useActionState, useRef } from "react";
import { setPitchModeStateFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { PitchModeState } from "@/lib/types";

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };

type Props = {
  eventId: string;
  currentState: PitchModeState;
  jurorCount: number;
};

type Option = {
  value: PitchModeState;
  label: string;
  help: string;
  accent: "blue" | "amber" | "green";
};

const OPTIONS: Option[] = [
  {
    value: "off",
    label: t.admin_pitch_mode_off_label,
    help: t.admin_pitch_mode_off_help,
    accent: "blue",
  },
  {
    value: "live",
    label: t.admin_pitch_mode_live_label,
    help: t.admin_pitch_mode_live_help,
    accent: "amber",
  },
  {
    value: "closed",
    label: t.admin_pitch_mode_closed_label,
    help: t.admin_pitch_mode_closed_help,
    accent: "green",
  },
];

const ACCENT_COLOR: Record<Option["accent"], string> = {
  blue: "var(--wf-blue)",
  amber: "var(--wf-amber, #d97706)",
  green: "var(--wf-green, #047857)",
};

export function AdminPitchModeToggle({ eventId, currentState, jurorCount }: Props) {
  const [state, formAction, pending] = useActionState(setPitchModeStateFlow, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);

  const handleClick = (next: PitchModeState) => {
    if (next === currentState) return;
    if (next === "live") {
      if (jurorCount === 0) return;
      if (!window.confirm(t.admin_pitch_mode_toggle_confirm_live)) return;
    } else if (next === "closed") {
      if (!window.confirm(t.admin_pitch_mode_toggle_confirm_closed)) return;
    }
    if (nextRef.current && formRef.current) {
      nextRef.current.value = next;
      formRef.current.requestSubmit();
    }
  };

  const active = OPTIONS.find((o) => o.value === currentState) ?? OPTIONS[0];

  return (
    <section className="wf-card" style={{ marginBottom: 20, overflow: "hidden" }}>
      <header
        className="wf-row"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--wf-line)",
          gap: 10,
          background: "var(--wf-paper-deep)",
        }}
      >
        <div className="wf-stack" style={{ gap: 2 }}>
          <div className="wf-kicker">{t.admin_pitch_mode_section_title}</div>
          <div className="wf-faint" style={{ fontSize: 11 }}>
            {active.help}
          </div>
        </div>
      </header>

      <form ref={formRef} action={formAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input ref={nextRef} type="hidden" name="next" defaultValue={currentState} />

        <div
          role="group"
          aria-label={t.admin_pitch_mode_section_title}
          className="wf-row"
          style={{
            padding: 16,
            gap: 0,
          }}
        >
          {OPTIONS.map((opt) => {
            const isActive = opt.value === currentState;
            const isDisabled =
              pending || (opt.value === "live" && jurorCount === 0 && !isActive);
            const title =
              opt.value === "live" && jurorCount === 0 && !isActive
                ? t.admin_jurors_empty
                : opt.help;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleClick(opt.value)}
                disabled={isDisabled}
                aria-pressed={isActive}
                title={title}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  border: "1px solid var(--wf-line)",
                  borderRight: opt.value === "closed" ? "1px solid var(--wf-line)" : "none",
                  borderTopLeftRadius: opt.value === "off" ? 8 : 0,
                  borderBottomLeftRadius: opt.value === "off" ? 8 : 0,
                  borderTopRightRadius: opt.value === "closed" ? 8 : 0,
                  borderBottomRightRadius: opt.value === "closed" ? 8 : 0,
                  background: isActive ? ACCENT_COLOR[opt.accent] : "var(--wf-paper)",
                  color: isActive ? "white" : "var(--wf-ink)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled && !isActive ? 0.5 : 1,
                  transition: "background 0.15s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {state.message ? (
          <div
            role="status"
            style={{
              padding: "8px 16px 14px",
              fontSize: 12,
              color: state.ok ? "var(--wf-green)" : "var(--wf-rose)",
            }}
          >
            {state.message}
          </div>
        ) : null}
      </form>
    </section>
  );
}
