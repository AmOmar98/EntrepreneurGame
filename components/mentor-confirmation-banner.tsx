// Phase 8 / Plan 08 - Mentor evaluation confirmation banner (MNT-05).
// Pure presentational client component (kept client-side only because the
// surrounding evaluation form runs in the browser). Renders the success toast
// payload returned by evaluateSubmission once the action resolves with ok=true.
//
// Payload contract (set in app/actions.ts):
//   { kind: 'mentor_evaluation_sent', xp: number, team: string|null, verdict }
//
// The form upstream of this banner disables itself when ok=true so the user
// can't double-submit. This component is purely visual.
"use client";

import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type MentorEvaluationToastPayload = {
  kind: "mentor_evaluation_sent";
  xp: number;
  team: string | null;
  verdict: "validate_v1" | "request_v2" | "validate_v2" | "reject";
};

export type MentorConfirmationBannerProps = {
  payload: MentorEvaluationToastPayload;
};

export function MentorConfirmationBanner({ payload }: MentorConfirmationBannerProps) {
  const teamFragment =
    payload.team && payload.team.trim().length > 0
      ? ` ${t.mentor_evaluation_sent_team_prefix} ${payload.team}`
      : "";

  const xpFragment =
    payload.xp > 0
      ? ` · ${t.mentor_evaluation_sent_xp.replace("{xp}", String(payload.xp))}${teamFragment}`
      : "";

  return (
    <div
      aria-live="polite"
      className="eic-mentor-confirmation"
      role="status"
    >
      <span aria-hidden="true" className="eic-mentor-confirmation__icon">
        ✓
      </span>
      <p className="eic-mentor-confirmation__body">
        <strong className="eic-mentor-confirmation__strong">
          {t.mentor_evaluation_sent_toast}
        </strong>
        {xpFragment} · {t.mentor_evaluation_sent_player_notified}
      </p>
    </div>
  );
}

/** Helper: parse the JSON payload server actions return on success. */
export function parseEvaluationToastPayload(
  raw: string,
): MentorEvaluationToastPayload | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Partial<MentorEvaluationToastPayload>;
    if (
      obj &&
      obj.kind === "mentor_evaluation_sent" &&
      typeof obj.xp === "number" &&
      typeof obj.verdict === "string"
    ) {
      return {
        kind: "mentor_evaluation_sent",
        xp: obj.xp,
        team: typeof obj.team === "string" ? obj.team : null,
        verdict: obj.verdict,
      };
    }
  } catch {
    return null;
  }
  return null;
}
