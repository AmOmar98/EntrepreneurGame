"use client";
// quick-260519-jpr W2 #5 — Collapsible full ranking table for /results.
// Default collapsed (« Voir le classement complet ↓ ») to keep the narrative
// hero/podium/stats above the fold ; expanded reveals the full sortable table.
// Client component for the toggle state. R1 cardinal: ce composant n'est jamais
// rendu pour Player/Mentor non-juror (gating fait dans results-replay.tsx).
import { useState } from "react";
import { dictionaries } from "@/lib/i18n";
import type { RankingRow } from "@/lib/results";

const t = dictionaries.fr;

type Props = {
  rows: RankingRow[];
};

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function ResultsRankingCollapsible({ rows }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label={t.results_replay_ranking_title}
      className="eic-results-replay__ranking"
    >
      <header className="eic-results-replay__ranking-header">
        <h2 className="eic-results-replay__ranking-title">
          {t.results_replay_ranking_title}
        </h2>
        <p className="eic-results-replay__ranking-weighting">
          {t.results_replay_weighting_caption}
        </p>
        <button
          type="button"
          className="eic-results-replay__ranking-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="eic-results-ranking-table"
        >
          {open
            ? t.results_replay_ranking_collapsible_close
            : t.results_replay_ranking_collapsible_open}
        </button>
      </header>

      {open ? (
        rows.length === 0 ? (
          <p className="eic-results-replay__ranking-empty">{t.results_empty}</p>
        ) : (
          <div className="eic-results-replay__ranking-tablewrap" id="eic-results-ranking-table">
            <table className="eic-results-replay__ranking-table">
              <thead>
                <tr>
                  <th scope="col">{t.results_col_rank}</th>
                  <th scope="col">{t.results_col_team}</th>
                  <th scope="col">{t.results_col_pitch}</th>
                  <th scope="col">{t.results_col_project}</th>
                  <th scope="col">{t.results_col_combined}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isPodium = row.rank <= 3;
                  return (
                    <tr
                      className={
                        isPodium
                          ? "eic-results-replay__ranking-row eic-results-replay__ranking-row--podium"
                          : "eic-results-replay__ranking-row"
                      }
                      key={row.player.id}
                    >
                      <td className="eic-results-replay__ranking-rank">{row.rank}</td>
                      <td>
                        <span className="eic-results-replay__ranking-team">
                          {row.player.name}
                        </span>
                        {row.player.idea ? (
                          <span className="eic-results-replay__ranking-idea">
                            {row.player.idea}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        {formatNumber(row.pitchAvg)}
                        <span className="eic-results-replay__ranking-jurors">
                          {" "}
                          ({row.pitchJurorCount})
                        </span>
                      </td>
                      <td>{formatNumber(row.scoreProject)}</td>
                      <td className="eic-results-replay__ranking-combined">
                        {formatNumber(row.combined)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
}
