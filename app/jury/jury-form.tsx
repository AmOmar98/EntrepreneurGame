"use client";

// quick-260520-124 — V1 sliders horizontaux 0-20 par critère.
// 4 critères affichés (c1..c4), c5=0 envoyé en hidden pour compat Zod
// (jury_c5_label = "" depuis quick-260519-jpr, legacy retired).
// Score total double affichage : /100 (canonique DB) + /20 (moyenne pondérée).
// Tokens --wf-* via inline style, classes responsive dans globals.css.

import { useActionState, useState } from "react";
import { savePitchScoreFlow, type WorkflowState } from "@/app/actions";
import type { dictionaries } from "@/lib/i18n";
import type { JuryAggregate, PitchScoreWithComments } from "@/lib/jury";
import type { Player, PitchModeState } from "@/lib/types";

const initialState: WorkflowState = { ok: false, message: "" };

type Dict = (typeof dictionaries)["fr"];

type Props = {
  player: Player;
  // quick-260520-124 ext — PitchScoreWithComments to read isDraft for badge.
  existing: PitchScoreWithComments | null;
  eventId: string;
  dict: Dict;
  /** Cross-juror aggregate, populated only when pitch_mode_state === 'closed'. */
  aggregate?: JuryAggregate | null;
  /** quick-260520-124 F3 — banner state mapping (live vs closed). */
  pitchModeState?: PitchModeState;
};

function clamp(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 20) return 20;
  return v;
}

// 4 pills "Faible / Moyen / Bon / Excellent" qui s'allument selon la valeur.
// Mockup ligne 81-87 : Math.floor(value / 5.5) → 0/1/2/3.
const PILLS: ReadonlyArray<string> = ["Faible", "Moyen", "Bon", "Excellent"];

function activePillIndex(value: number): number {
  if (value <= 0) return -1;
  return Math.min(3, Math.floor(value / 5.5));
}

export function JuryForm({
  player,
  existing,
  eventId,
  dict,
  aggregate,
  pitchModeState,
}: Props) {
  // quick-260520-124 F3 — pick the banner string based on pitch mode state.
  const bannerLabel =
    pitchModeState === "closed"
      ? dict.jury_pitch_mode_closed_banner
      : dict.jury_pitch_mode_live_banner;
  const [state, formAction, pending] = useActionState(savePitchScoreFlow, initialState);
  const [c1, setC1] = useState<number>(existing?.c1 ?? 0);
  const [c2, setC2] = useState<number>(existing?.c2 ?? 0);
  const [c3, setC3] = useState<number>(existing?.c3 ?? 0);
  const [c4, setC4] = useState<number>(existing?.c4 ?? 0);
  // c5 = 0 envoyé en hidden (legacy retired). Pas de UI, pas de setter.

  const total = clamp(c1) + clamp(c2) + clamp(c3) + clamp(c4);
  // total max = 80 (4×20). UI affiche :
  // - score100 = total * 1.25 (normalisé /100, cohérent avec lib/results.ts
  //   pitchAvg qui fait sum*5/4 quand c5=0).
  // - score20  = total / 4 (moyenne pondérée /20, cosmétique mockup).
  const score100 = Math.round(total * 1.25);
  const score20 = (total / 4).toFixed(1);

  const fields: ReadonlyArray<{
    key: "c1" | "c2" | "c3" | "c4";
    label: string;
    help: string;
    value: number;
    setter: (n: number) => void;
  }> = [
    { key: "c1", label: dict.jury_c1_label, help: dict.jury_c1_help, value: c1, setter: setC1 },
    { key: "c2", label: dict.jury_c2_label, help: dict.jury_c2_help, value: c2, setter: setC2 },
    { key: "c3", label: dict.jury_c3_label, help: dict.jury_c3_help, value: c3, setter: setC3 },
    { key: "c4", label: dict.jury_c4_label, help: dict.jury_c4_help, value: c4, setter: setC4 },
  ];

  return (
    <form action={formAction} className="eic-jury-form-v1">
      <input type="hidden" name="playerId" value={player.id} />
      <input type="hidden" name="eventId" value={eventId} />
      {/* c5 hidden = 0, legacy retired (jury_c5_label = "" intentionnel). */}
      <input type="hidden" name="c5" value={0} />

      <div className="eic-jury-form-v1__layout">
        {/* Left column: sliders */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {fields.map((f) => {
            const pillIdx = activePillIndex(f.value);
            return (
              <div
                key={f.key}
                style={{
                  background: "var(--wf-paper, #fff)",
                  border: "1px solid var(--wf-line, #e2e8f0)",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor={`${f.key}-${player.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--wf-ink, #0f172a)",
                    }}
                  >
                    {f.label}
                  </label>
                  <span
                    style={{
                      fontFamily: '"Baskervville", Georgia, serif',
                      fontSize: 22,
                      color: "var(--wf-blue, #1d4ed8)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                    aria-live="polite"
                  >
                    {f.value}
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--wf-ink-faint, #94a3b8)",
                        marginLeft: 4,
                      }}
                    >
                      / 20
                    </span>
                  </span>
                </div>

                <input
                  id={`${f.key}-${player.id}`}
                  type="range"
                  name={f.key}
                  min={0}
                  max={20}
                  step={1}
                  value={f.value}
                  onChange={(e) => f.setter(clamp(Number(e.target.value)))}
                  aria-describedby={`${f.key}-${player.id}-help`}
                  style={{
                    width: "100%",
                    accentColor: "var(--wf-blue, #1d4ed8)",
                    cursor: "pointer",
                  }}
                />

                {/* Pills indicator */}
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    marginTop: 6,
                    flexWrap: "wrap",
                  }}
                  aria-hidden="true"
                >
                  {PILLS.map((label, idx) => (
                    <span
                      key={label}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background:
                          idx === pillIdx
                            ? "var(--wf-blue-tint, #dbeafe)"
                            : "var(--wf-paper-deep, #f1f5f9)",
                        color:
                          idx === pillIdx
                            ? "var(--wf-blue, #1d4ed8)"
                            : "var(--wf-ink-soft, #475569)",
                        border:
                          idx === pillIdx
                            ? "1px solid var(--wf-blue, #1d4ed8)"
                            : "1px solid var(--wf-line, #e2e8f0)",
                        fontWeight: idx === pillIdx ? 600 : 400,
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {f.help ? (
                  <p
                    id={`${f.key}-${player.id}-help`}
                    style={{
                      fontSize: 11,
                      color: "var(--wf-ink-faint, #64748b)",
                      lineHeight: 1.4,
                      margin: "6px 0 0",
                    }}
                  >
                    {f.help}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Right column: récap */}
        <aside
          style={{
            background: "var(--wf-paper-deep, #f8fafc)",
            border: "1px solid var(--wf-line, #e2e8f0)",
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignSelf: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "var(--wf-ink-soft, #475569)",
                margin: 0,
              }}
            >
              {dict.jury_total_label}
            </p>
            <p
              style={{
                fontFamily: '"Baskervville", Georgia, serif',
                fontSize: 40,
                lineHeight: 1.1,
                color: "var(--wf-blue, #1d4ed8)",
                margin: "4px 0 0",
                fontVariantNumeric: "tabular-nums",
              }}
              aria-live="polite"
            >
              {score100}
              <span style={{ fontSize: 18, color: "var(--wf-ink-faint, #94a3b8)" }}>
                /100
              </span>
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--wf-ink-soft, #475569)",
                margin: "2px 0 0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              équivalent {score20}
              <span style={{ color: "var(--wf-ink-faint, #94a3b8)" }}> /20</span>
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
              color: "var(--wf-ink-soft, #475569)",
              borderTop: "1px solid var(--wf-line, #e2e8f0)",
              paddingTop: 8,
            }}
          >
            {fields.map((f) => (
              <div
                key={f.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>{f.label}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                  {f.value}/20
                </span>
              </div>
            ))}
          </div>

          {aggregate ? (
            <div
              style={{
                background: "var(--wf-blue-tint, #dbeafe)",
                border: "1px solid var(--wf-blue, #1d4ed8)",
                borderRadius: 6,
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
              aria-label={dict.jury_pitch_aggregate_label}
            >
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "var(--wf-blue, #1d4ed8)",
                  fontWeight: 600,
                }}
              >
                {dict.jury_pitch_aggregate_label}
              </span>
              <span
                style={{
                  fontFamily: '"Baskervville", Georgia, serif',
                  fontSize: 22,
                  color: "var(--wf-blue, #1d4ed8)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {aggregate.avg100.toFixed(1)}
                <span style={{ fontSize: 12, color: "var(--wf-ink-soft, #475569)" }}>
                  /100
                </span>
              </span>
              <span style={{ fontSize: 10, color: "var(--wf-ink-soft, #475569)" }}>
                {dict.jury_pitch_aggregate_juror_count.replace(
                  "{n}",
                  String(aggregate.jurorCount),
                )}
              </span>
            </div>
          ) : null}

          {/* quick-260520-124 ext (Task 6) — Brouillon / Valider dual submit. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              type="submit"
              name="isDraft"
              value="true"
              disabled={pending}
              className="eic-button"
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: 13,
                cursor: pending ? "not-allowed" : "pointer",
                opacity: pending ? 0.6 : 1,
              }}
            >
              {dict.jury_save_draft}
            </button>
            <button
              type="submit"
              name="isDraft"
              value="false"
              disabled={pending}
              className="eic-button eic-button--primary"
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: 14,
                cursor: pending ? "not-allowed" : "pointer",
                opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? dict.jury_saving : dict.jury_save}
            </button>
          </div>

          {/* Status badge if existing row (draft vs validated) */}
          {existing ? (
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                margin: 0,
                padding: "4px 8px",
                borderRadius: 4,
                background:
                  existing.isDraft === false
                    ? "#dcfce7"
                    : "#fef3c7",
                color:
                  existing.isDraft === false
                    ? "#15803d"
                    : "#92400e",
                border:
                  existing.isDraft === false
                    ? "1px solid #86efac"
                    : "1px solid #fde68a",
                textAlign: "center",
              }}
            >
              {existing.isDraft === false
                ? dict.jury_status_validated
                : dict.jury_status_draft}
            </p>
          ) : null}

          <p
            style={{
              fontSize: 10,
              color: "var(--wf-ink-faint, #94a3b8)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {bannerLabel}
          </p>
        </aside>
      </div>

      {total === 0 && (
        <p
          className="eic-jury-form__warn"
          role="status"
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#92400e",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: 6,
            padding: "6px 10px",
          }}
        >
          &#9888; Vérifie : tous les critères sont à 0
        </p>
      )}
      {state.message ? (
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: state.ok ? "#16a34a" : "#dc2626",
          }}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
