"use client";

import { useActionState } from "react";
import { publishResultsFlow, type WorkflowState } from "@/app/actions";
import type { dictionaries } from "@/lib/i18n";

const initialState: WorkflowState = { ok: false, message: "" };

type Dict = (typeof dictionaries)["fr"];

type Props = {
  eventId: string | null;
  alreadyPublished: boolean;
  dict: Dict;
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const buttonDisabledStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#94a3b8",
  cursor: "not-allowed",
};

export function PublishButton({ eventId, alreadyPublished, dict }: Props) {
  const [state, formAction, pending] = useActionState(publishResultsFlow, initialState);
  const disabled = !eventId;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (!window.confirm(dict.results_publish_confirm)) {
      e.preventDefault();
    }
  }

  const label = alreadyPublished
    ? dict.results_already_published
    : pending
      ? dict.results_publishing
      : dict.results_publish_button;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}
    >
      <input type="hidden" name="eventId" value={eventId ?? ""} />
      <button
        type="submit"
        disabled={disabled || pending}
        style={disabled || pending ? buttonDisabledStyle : buttonStyle}
      >
        {label}
      </button>
      {state.message ? (
        <p
          role="status"
          style={{
            fontSize: 12,
            margin: 0,
            color: state.ok ? "#15803d" : "#b91c1c",
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
