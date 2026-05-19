// Phase 9 / GMR-05 — Results replay stats strip.
// Refreshed quick-260519-jpr W2 #5 : 4 KPIs alignés mockup 2 (équipes /
// livrables soumis / score moyen projet / jurys actifs). Compute moyenne
// = totalScoreProject / teams (rounded). Mentor stat removed from strip
// (still in ReplayStats type for future use).
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type ReplayStats = {
  teams: number;
  submissions: number;
  totalScoreProject: number;
  mentors: number;
  jurors: number;
};

type Props = {
  stats: ReplayStats;
};

export function ResultsStatsStrip({ stats }: Props) {
  const avgScoreProject =
    stats.teams > 0 ? Math.round(stats.totalScoreProject / stats.teams) : 0;

  const items: { label: string; value: string }[] = [
    { label: t.results_replay_stats_teams, value: String(stats.teams) },
    {
      label: t.results_replay_stats_submissions,
      value: String(stats.submissions),
    },
    {
      label: t.results_replay_stats_xp,
      value: avgScoreProject.toLocaleString("fr-FR", { maximumFractionDigits: 0 }),
    },
    { label: t.results_replay_stats_jurors, value: String(stats.jurors) },
  ];

  return (
    <section
      aria-label={t.results_replay_stats_title}
      className="eic-results-replay__stats"
    >
      <h2 className="eic-results-replay__stats-title">{t.results_replay_stats_title}</h2>
      <ul className="eic-results-replay__stats-row eic-results-replay__stats-row--4col">
        {items.map((it) => (
          <li className="eic-results-replay__stat" key={it.label}>
            <span className="eic-results-replay__stat-value">{it.value}</span>
            <span className="eic-results-replay__stat-label">{it.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
