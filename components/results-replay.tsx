// Phase 9 / GMR-05 — Results replay editorial wrapper. Composes hero +
// podium + 5-stats strip + full ranking + timeline + exports band.
// Server component (RevealOnView is a client wrapper around children).
//
// Phase 11 / B3 — wraps podium / stats / timeline with RevealOnView so the
// three sections fade-in via IntersectionObserver. The R1 gate on
// `combined.toFixed(1)` (results-podium.tsx:65-67) is preserved INSIDE the
// reveal wrapper — wrapping does not change conditional rendering.
import { ResultsPodium, type PodiumEntry } from "@/components/results-podium";
import {
  ResultsStatsStrip,
  type ReplayStats,
} from "@/components/results-stats-strip";
import { ResultsTimelineMoments } from "@/components/results-timeline-moments";
import { RevealOnView } from "@/components/reveal-on-view";
import { dictionaries } from "@/lib/i18n";
import type { RankingRow } from "@/lib/results";

const t = dictionaries.fr;

type Props = {
  rows: RankingRow[];
  stats: ReplayStats;
  publishedAt: string | null;
  isGameMaster: boolean;
};

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatPublishedAt(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ResultsReplay({ rows, stats, publishedAt, isGameMaster }: Props) {
  const winner = rows.find((r) => r.rank === 1) ?? null;
  const podium: PodiumEntry[] = rows
    .filter((r) => r.rank <= 3)
    .map((r) => ({
      rank: r.rank as 1 | 2 | 3,
      teamName: r.player.name,
      combined: r.combined,
    }));

  return (
    <div className="eic-results-replay">
      <header className="eic-results-replay__hero">
        <p className="eic-results-replay__hero-kicker">
          {t.results_replay_hero_kicker}
        </p>
        {winner ? (
          <h1 className="eic-results-replay__hero-title">
            {t.results_replay_hero_winner_prefix}{" "}
            <em>{winner.player.name}</em>{" "}
            {t.results_replay_hero_winner_suffix}
          </h1>
        ) : (
          <h1 className="eic-results-replay__hero-title">
            {t.results_replay_hero_no_winner}
          </h1>
        )}
        {publishedAt ? (
          <p className="eic-results-replay__hero-meta">
            {t.results_published_at_label} {formatPublishedAt(publishedAt)}
          </p>
        ) : null}
      </header>

      {podium.length > 0 ? (
        <RevealOnView>
          <ResultsPodium entries={podium} isGameMaster={isGameMaster} />
        </RevealOnView>
      ) : null}

      <RevealOnView>
        <ResultsStatsStrip stats={stats} />
      </RevealOnView>

      {isGameMaster ? (
        <section
          aria-label={t.results_replay_ranking_title}
          className="eic-results-replay__ranking"
        >
          <h2 className="eic-results-replay__ranking-title">
            {t.results_replay_ranking_title}
          </h2>
          <p className="eic-results-replay__ranking-weighting">
            {t.results_replay_weighting_caption}
          </p>
          {rows.length === 0 ? (
            <p className="eic-results-replay__ranking-empty">{t.results_empty}</p>
          ) : (
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
          )}
        </section>
      ) : (
        <section
          aria-label={t.results_replay_ranking_announcement_title}
          className="eic-results-replay__ranking"
        >
          <h2 className="eic-results-replay__ranking-title">
            {t.results_replay_ranking_announcement_title}
          </h2>
          <p className="eic-results-replay__ranking-empty">
            {t.results_replay_ranking_hidden_player}
          </p>
        </section>
      )}

      <RevealOnView>
        <ResultsTimelineMoments />
      </RevealOnView>

      {isGameMaster ? (
        <footer className="eic-results-replay__exports">
          <h2 className="eic-results-replay__exports-title">
            {t.results_replay_exports_label}
          </h2>
          <div className="eic-results-replay__exports-row">
            <a
              className="eic-button eic-button--primary"
              href="/admin/export/players.csv"
            >
              {t.results_replay_export_players}
            </a>
            {/* TODO Agent 9B / v0.3: dedicated /api/export/ranking.csv route. */}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
