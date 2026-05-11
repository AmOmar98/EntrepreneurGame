"use client";
// Design v2 (polish/design-v2-match V4) — Jury pitch theater refactored with
// V3 Dials variant. The grid /5 component is swapped for <JuryPitchDials>
// (4 × /20 rotary dials), and the topbar/hero get the .wf-* design v2 look.
//
// Original behaviour preserved:
// - currentIndex state + prev/next stepper
// - queue panel (clic libre sur n'importe quelle équipe)
// - timer
// - scoredPlayerIds derivation
//
// Phase 9 / GMR-04 lineage retained.
import { useMemo, useState } from "react";
import { JuryPassageQueue } from "@/components/jury-passage-queue";
import { JuryPitchDials } from "@/components/jury-pitch-dials";
import { JuryPitchTimer } from "@/components/jury-pitch-timer";
import { dictionaries } from "@/lib/i18n";
import type { JuryPlayerRow } from "@/lib/jury";

const t = dictionaries.fr;

type Props = {
  rows: JuryPlayerRow[];
  eventId: string;
};

export function JuryPitchTheater({ rows, eventId }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const scoredPlayerIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.existing) set.add(r.player.id);
    }
    return set;
  }, [rows]);

  const current = rows[currentIndex];

  return (
    <div className="eic-jury-theater eic-jury-theater--v3">
      <header
        className="wf-row eic-jury-theater__topbar"
        style={{
          padding: "12px 20px",
          gap: 14,
          background: "var(--wf-paper)",
          borderBottom: "1px solid var(--wf-line)",
        }}
      >
        <div className="wf-brand">
          <div className="wf-brand-mark">E</div>
          <div className="wf-stack" style={{ gap: 2 }}>
            <div className="wf-brand-name">{t.jury_pitch_theater_intro}</div>
            <div className="wf-brand-sub">
              EIC · UEMF · Hack-Days · {Math.min(currentIndex + 1, rows.length)} /{" "}
              {rows.length}
            </div>
          </div>
        </div>
        <span className="wf-grow" />
        <JuryPitchTimer />
      </header>

      <div className="eic-jury-theater__layout">
        <section className="eic-jury-theater__stage">
          {!current ? (
            <p className="eic-jury-theater__empty">
              {t.jury_pitch_theater_no_team}
            </p>
          ) : (
            <>
              <div
                className="wf-row eic-jury-theater__hero"
                style={{
                  padding: "16px 20px",
                  gap: 14,
                  borderBottom: "1px solid var(--wf-line)",
                  background: "var(--wf-paper)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "var(--wf-blue-tint)",
                    color: "var(--wf-blue)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-heading, Baskervville, serif)",
                    fontSize: 26,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {current.player.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="wf-stack wf-grow" style={{ gap: 4, minWidth: 0 }}>
                  <div className="wf-kicker">
                    {t.jury_pitch_theater_intro} ·{" "}
                    {Math.min(currentIndex + 1, rows.length)} / {rows.length}
                  </div>
                  <h1
                    className="eic-jury-theater__team-name"
                    style={{
                      fontFamily: "var(--font-heading, Baskervville, serif)",
                      fontSize: 22,
                      fontWeight: 600,
                      margin: 0,
                      color: "var(--wf-ink)",
                      lineHeight: 1.2,
                    }}
                  >
                    {current.player.name}
                  </h1>
                  {current.player.idea ? (
                    <p
                      className="eic-jury-theater__team-idea"
                      style={{
                        fontSize: 13,
                        color: "var(--wf-ink-soft)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span className="wf-faint">
                        {t.jury_pitch_theater_team_idea} ·{" "}
                      </span>
                      {current.player.idea}
                    </p>
                  ) : null}
                </div>
                <div className="wf-row" style={{ gap: 6, flexShrink: 0 }}>
                  <button
                    className="wf-btn"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    type="button"
                  >
                    {t.jury_pitch_theater_select_prev}
                  </button>
                  <button
                    className="wf-btn is-primary"
                    disabled={currentIndex >= rows.length - 1}
                    onClick={() =>
                      setCurrentIndex((i) => Math.min(rows.length - 1, i + 1))
                    }
                    type="button"
                  >
                    {t.jury_pitch_theater_select_next}
                  </button>
                </div>
              </div>

              <div style={{ padding: "16px 20px" }}>
                <JuryPitchDials
                  eventId={eventId}
                  existing={current.existing}
                  jurorVotedCount={current.existing ? 1 : 0}
                  player={current.player}
                />
              </div>
            </>
          )}
        </section>

        <JuryPassageQueue
          currentIndex={currentIndex}
          onSelect={setCurrentIndex}
          players={rows.map((r) => r.player)}
          scoredPlayerIds={scoredPlayerIds}
        />
      </div>
    </div>
  );
}
