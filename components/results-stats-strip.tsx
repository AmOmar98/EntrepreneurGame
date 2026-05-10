// Phase 9 / GMR-05 — Results replay 5-stats strip.
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
  const items: { label: string; value: string }[] = [
    { label: t.results_replay_stats_teams, value: String(stats.teams) },
    {
      label: t.results_replay_stats_submissions,
      value: String(stats.submissions),
    },
    {
      label: t.results_replay_stats_xp,
      value: stats.totalScoreProject.toLocaleString("fr-FR", {
        maximumFractionDigits: 0,
      }),
    },
    { label: t.results_replay_stats_mentors, value: String(stats.mentors) },
    { label: t.results_replay_stats_jurors, value: String(stats.jurors) },
  ];

  return (
    <section
      aria-label={t.results_replay_stats_title}
      className="eic-results-replay__stats"
    >
      <h2 className="eic-results-replay__stats-title">{t.results_replay_stats_title}</h2>
      <ul className="eic-results-replay__stats-row">
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
