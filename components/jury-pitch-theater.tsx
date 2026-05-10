"use client";
// Phase 9 / GMR-04 — Jury pitch theater wrapper. Owns the current-team index
// and orchestrates timer + queue + grid for the whole pitch session.
import { useMemo, useState } from "react";
import { JuryPassageQueue } from "@/components/jury-passage-queue";
import { JuryPitchGrid } from "@/components/jury-pitch-grid";
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
    <div className="eic-jury-theater">
      <header className="eic-jury-theater__topbar">
        <p className="eic-jury-theater__kicker">{t.jury_pitch_theater_intro}</p>
        <p className="eic-jury-theater__count">
          {Math.min(currentIndex + 1, rows.length)} / {rows.length}
        </p>
      </header>

      <div className="eic-jury-theater__layout">
        <section className="eic-jury-theater__stage">
          {!current ? (
            <p className="eic-jury-theater__empty">
              {t.jury_pitch_theater_no_team}
            </p>
          ) : (
            <>
              <div className="eic-jury-theater__hero">
                <h1 className="eic-jury-theater__team-name">{current.player.name}</h1>
                {current.player.idea ? (
                  <p className="eic-jury-theater__team-idea">
                    <span className="eic-jury-theater__idea-label">
                      {t.jury_pitch_theater_team_idea} ·{" "}
                    </span>
                    {current.player.idea}
                  </p>
                ) : null}
              </div>

              <div className="eic-jury-theater__meta">
                <JuryPitchTimer />
                <div className="eic-jury-theater__stepper">
                  <button
                    className="eic-button eic-button--ghost"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    type="button"
                  >
                    {t.jury_pitch_theater_select_prev}
                  </button>
                  <button
                    className="eic-button eic-button--primary"
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

              <JuryPitchGrid
                eventId={eventId}
                existing={current.existing}
                jurorVotedCount={current.existing ? 1 : 0}
                player={current.player}
              />
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
