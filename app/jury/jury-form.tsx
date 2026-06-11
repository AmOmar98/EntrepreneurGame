"use client";

// quick-260520-124 — V1 sliders horizontaux 0-20 par critère.
// 4 critères affichés (c1..c4), c5=0 envoyé en hidden pour compat Zod
// (jury_c5_label = "" depuis quick-260519-jpr, legacy retired).
// Score total double affichage : /100 (canonique DB) + /20 (moyenne pondérée).
// Tokens --wf-* via inline style, classes responsive dans globals.css.
//
// Phase 16 Plan 02: dynamic criteria via `criteria` prop (JURY-07).
// Falls back to legacy 4-criteria form when criteria absent/empty.
// Positional c1..c4 mapping for total_score GENERATED column compat.
// c5=0 ALWAYS to keep *1.25 legacy normalization consistent.

import { useActionState, useState } from "react";
import { savePitchScoreFlow, type WorkflowState } from "@/app/actions";
import type { dictionaries } from "@/lib/i18n";
import type { JuryAggregate, PitchScoreWithComments } from "@/lib/jury";
import type { Player, PitchModeState } from "@/lib/types";
import type { PitchCriterion } from "@/lib/pitch-criteria";

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
  /** Phase 16: dynamic criteria from pitch_criteria table. Falls back to legacy 4 when absent. */
  criteria?: PitchCriterion[];
};

function clampToMax(v: number, max: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > max) return max;
  return v;
}

function clampSmallint(v: number): number {
  if (v < 0) return 0;
  if (v > 32767) return 32767;
  return Math.round(v);
}

// 4 pills "Faible / Moyen / Bon / Excellent" qui s'allument selon la valeur.
// Mockup ligne 81-87 : Math.floor(value / 5.5) → 0/1/2/3.
const PILLS: ReadonlyArray<string> = ["Faible", "Moyen", "Bon", "Excellent"];

function activePillIndex(value: number, max: number): number {
  if (value <= 0) return -1;
  return Math.min(3, Math.floor((value / max) * 4));
}

export function JuryForm({
  player,
  existing,
  eventId,
  dict,
  aggregate,
  pitchModeState,
  criteria,
}: Props) {
  // Phase 16: derive activeCriteria from prop or fall back to 4 legacy criteria.
  // Legacy criteria use the same keys c1..c4 as the existing hidden inputs.
  const legacyCriteria: PitchCriterion[] = [
    { id: "c1", eventId, key: "c1", label: dict.jury_c1_label, max: 20, ord: 0 },
    { id: "c2", eventId, key: "c2", label: dict.jury_c2_label, max: 20, ord: 1 },
    { id: "c3", eventId, key: "c3", label: dict.jury_c3_label, max: 20, ord: 2 },
    { id: "c4", eventId, key: "c4", label: dict.jury_c4_label, max: 20, ord: 3 },
  ];
  const activeCriteria = criteria && criteria.length > 0 ? criteria : legacyCriteria;

  // Phase 16: single scores map replaces c1/c2/c3/c4 state vars.
  // Pre-fill from existing?.scores (dynamic path) or existing?.c1..c4 (legacy).
  const initialScores: Record<string, number> = Object.fromEntries(
    activeCriteria.map((c, i) => {
      if (existing?.scores && existing.scores[c.key] !== undefined) {
        return [c.key, existing.scores[c.key]];
      }
      // Legacy fallback: read c1..c4 positionally from existing PitchScore
      if (existing) {
        const legacyVal = [existing.c1, existing.c2, existing.c3, existing.c4][i];
        return [c.key, legacyVal ?? 0];
      }
      return [c.key, 0];
    }),
  );

  const [scores, setScores] = useState<Record<string, number>>(initialScores);

  // quick-260520-124 F3 — pick the banner string based on pitch mode state.
  const bannerLabel =
    pitchModeState === "closed"
      ? dict.jury_pitch_mode_closed_banner
      : dict.jury_pitch_mode_live_banner;
  const [state, formAction, pending] = useActionState(savePitchScoreFlow, initialState);

  // Dynamic total: sum of all scores values
  const totalRaw = activeCriteria.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0);
  const maxTotal = activeCriteria.reduce((sum, c) => sum + c.max, 0);

  // Display /100 normalized score (mirrors lib/results.ts normalizePitchScore dynamic path)
  const score100 = maxTotal > 0 ? Math.round((totalRaw / maxTotal) * 100) : 0;
  const score20 = activeCriteria.length > 0 ? (totalRaw / activeCriteria.length).toFixed(1) : "0.0";

  // Positional c1..c4 mapping (Phase 16 plan verbatim):
  // c1 = scores[activeCriteria[0]?.key] ?? 0
  // c2 = scores[activeCriteria[1]?.key] ?? 0
  // c3 = scores[activeCriteria[2]?.key] ?? 0
  // c4 = scores[activeCriteria[3]?.key] ?? 0
  // c5 = 0 ALWAYS — keeps *1.25 legacy normalization consistent for non-jsonb readers
  const c1Hidden = clampSmallint(scores[activeCriteria[0]?.key ?? ""] ?? 0);
  const c2Hidden = clampSmallint(scores[activeCriteria[1]?.key ?? ""] ?? 0);
  const c3Hidden = clampSmallint(scores[activeCriteria[2]?.key ?? ""] ?? 0);
  const c4Hidden = clampSmallint(scores[activeCriteria[3]?.key ?? ""] ?? 0);

  // scoresJson for the dynamic path (all criteria, not just first 4)
  const scoresJson = JSON.stringify(scores);

  return (
    <form action={formAction} className="eic-jury-form-v1">
      <input type="hidden" name="playerId" value={player.id} />
      <input type="hidden" name="eventId" value={eventId} />
      {/* Positional c1..c4 for total_score GENERATED column + legacy compat */}
      <input type="hidden" name="c1" value={c1Hidden} />
      <input type="hidden" name="c2" value={c2Hidden} />
      <input type="hidden" name="c3" value={c3Hidden} />
      <input type="hidden" name="c4" value={c4Hidden} />
      {/* c5 = 0 ALWAYS (legacy retired + keeps *1.25 normalization consistent) */}
      <input type="hidden" name="c5" value={0} />
      {/* Phase 16: scoresJson for dynamic authoritative path */}
      <input type="hidden" name="scoresJson" value={scoresJson} />

      <div className="eic-jury-form-v1__layout">
        {/* Left column: sliders */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {activeCriteria.map((criterion) => {
            const value = scores[criterion.key] ?? 0;
            const pillIdx = activePillIndex(value, criterion.max);
            return (
              <div
                key={criterion.key}
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
                    htmlFor={`${criterion.key}-${player.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--wf-ink, #0f172a)",
                    }}
                  >
                    {criterion.label}
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
                    {value}
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--wf-ink-faint, #94a3b8)",
                        marginLeft: 4,
                      }}
                    >
                      / {criterion.max}
                    </span>
                  </span>
                </div>

                <input
                  id={`${criterion.key}-${player.id}`}
                  type="range"
                  aria-label={criterion.label}
                  min={0}
                  max={criterion.max}
                  step={1}
                  value={value}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [criterion.key]: clampToMax(Number(e.target.value), criterion.max),
                    }))
                  }
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
              equivalent {score20}
              <span style={{ color: "var(--wf-ink-faint, #94a3b8)" }}> /{activeCriteria.length > 0 ? activeCriteria[0]!.max : 20}</span>
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
            {activeCriteria.map((criterion) => (
              <div
                key={criterion.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>{criterion.label}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                  {scores[criterion.key] ?? 0}/{criterion.max}
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

      {totalRaw === 0 && (
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
          &#9888; Verifie : tous les criteres sont a 0
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
