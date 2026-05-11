"use client";
// Design v2 (polish/design-v2-match V4) — Jury V3 Dials variant of the pitch
// theater scoring grid. Replaces the /5 radio grid with 4 rotary <Dial>
// components mapped 1-to-1 to the /20 DB schema. c5 is forced to 0 (legacy
// criterion retired; lib/results.ts normalises pitchAvg back to /100).
//
// Reuses savePitchScoreFlow under the hood — no DB schema change.
import { useActionState, useEffect, useState } from "react";
import { Dial } from "@/components/wf/dial";
import { savePitchScoreFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { PitchScore, Player } from "@/lib/types";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type CriterionKey = "c1" | "c2" | "c3" | "c4";

type Props = {
  player: Player;
  eventId: string;
  existing: PitchScore | null;
  jurorVotedCount: number;
};

type CriterionDef = { key: CriterionKey; label: string; help: string };

const CRITERIA: CriterionDef[] = [
  { key: "c1", label: t.jury_c1_label, help: t.jury_c1_help },
  { key: "c2", label: t.jury_c2_label, help: t.jury_c2_help },
  { key: "c3", label: t.jury_c3_label, help: t.jury_c3_help },
  { key: "c4", label: t.jury_c4_label, help: t.jury_c4_help },
];

function clamp20(v: number | null | undefined): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(20, Math.round(v)));
}

export function JuryPitchDials({ player, eventId, existing, jurorVotedCount }: Props) {
  const [state, formAction, pending] = useActionState(savePitchScoreFlow, initialState);
  const [scores, setScores] = useState<Record<CriterionKey, number>>({
    c1: clamp20(existing?.c1),
    c2: clamp20(existing?.c2),
    c3: clamp20(existing?.c3),
    c4: clamp20(existing?.c4),
  });
  const [comment, setComment] = useState<string>("");

  // Reset scores when player changes (theater prev/next).
  useEffect(() => {
    setScores({
      c1: clamp20(existing?.c1),
      c2: clamp20(existing?.c2),
      c3: clamp20(existing?.c3),
      c4: clamp20(existing?.c4),
    });
    setComment("");
  }, [player.id, existing]);

  const setScore = (key: CriterionKey, value: number) =>
    setScores((prev) => ({ ...prev, [key]: clamp20(value) }));

  const total = scores.c1 + scores.c2 + scores.c3 + scores.c4;
  const weighted = total / 4;

  return (
    <form action={formAction} className="wf-card eic-jury-dials">
      <div
        className="wf-row"
        style={{ padding: "12px 16px", borderBottom: "1px solid var(--wf-line)", gap: 12 }}
      >
        <div className="wf-stack" style={{ gap: 2 }}>
          <div className="wf-kicker">{t.jury_pitch_grid_title}</div>
          <div className="wf-faint" style={{ fontSize: 11 }}>
            {t.jury_each_max_20}
          </div>
        </div>
        <span className="wf-grow" />
        <span
          className="wf-pill is-blue"
          aria-live="polite"
          style={{ fontSize: 11 }}
        >
          {t.jury_pitch_jurors_voted.replace(
            "{n}",
            String(Math.max(0, Math.min(5, jurorVotedCount))),
          )}
        </span>
      </div>

      <input name="playerId" type="hidden" value={player.id} />
      <input name="eventId" type="hidden" value={eventId} />
      {CRITERIA.map((c) => (
        <input
          key={`${c.key}-hidden`}
          name={c.key}
          type="hidden"
          value={scores[c.key]}
        />
      ))}
      {/* c5 retired in design v2 — always submit 0. */}
      <input name="c5" type="hidden" value={0} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          padding: 16,
        }}
      >
        {CRITERIA.map((c) => (
          <div key={c.key} className="wf-stack" style={{ gap: 6 }}>
            <Dial
              label={c.label}
              value={scores[c.key]}
              max={20}
              onChange={(v) => setScore(c.key, v)}
              ariaLabel={`${c.label} — ${c.help}`}
            />
            {c.help ? (
              <p
                style={{
                  fontSize: 10,
                  color: "var(--wf-ink-soft)",
                  textAlign: "center",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {c.help}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div
        className="wf-row"
        style={{
          padding: "12px 16px",
          gap: 14,
          borderTop: "1px solid var(--wf-line)",
          background: "var(--wf-paper-deep)",
        }}
      >
        <div className="wf-stack" style={{ gap: 2 }}>
          <div className="wf-kicker">{t.jury_total_label}</div>
          <div
            style={{
              fontFamily: "var(--font-heading, Baskervville, serif)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--wf-blue)",
              lineHeight: 1,
            }}
          >
            {weighted.toFixed(1)}
            <span
              style={{ fontSize: 14, color: "var(--wf-ink-faint)", fontWeight: 500 }}
            >
              {" "}
              / 20
            </span>
          </div>
        </div>
        <span className="wf-grow" />
        <span className="wf-faint" style={{ fontSize: 11 }}>
          {t.jury_pitch_score_anonymous}
        </span>
        <button
          className="wf-btn is-success"
          disabled={pending}
          type="submit"
          style={{ padding: "10px 18px", fontSize: 13 }}
        >
          {pending ? t.jury_saving : t.jury_save}
        </button>
      </div>

      <div style={{ padding: "0 16px 14px" }}>
        <label className="wf-stack" style={{ gap: 6 }}>
          <span className="wf-kicker">{t.jury_pitch_grid_comment_label}</span>
          <textarea
            maxLength={1000}
            name="comment"
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.jury_pitch_grid_comment_placeholder}
            rows={2}
            value={comment}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--wf-line)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "inherit",
              background: "var(--wf-paper)",
              resize: "vertical",
            }}
          />
        </label>
        {state.message ? (
          <p
            role="status"
            style={{
              marginTop: 8,
              fontSize: 12,
              color: state.ok ? "var(--wf-green)" : "var(--wf-rose)",
            }}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
