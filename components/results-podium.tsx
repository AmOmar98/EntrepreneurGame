// Phase 9 / GMR-05 — Results replay 3-step podium (or / argent / bronze).
// Pure server component. SVG markup tokenized via EIC variables.
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type PodiumEntry = {
  rank: 1 | 2 | 3;
  teamName: string;
  combined: number;
};

type Props = {
  entries: PodiumEntry[];
};

const ORDER: (1 | 2 | 3)[] = [2, 1, 3];

const HEIGHTS: Record<1 | 2 | 3, number> = { 1: 220, 2: 170, 3: 140 };

const COLOR: Record<1 | 2 | 3, string> = {
  1: "#C9A227", // EIC gold
  2: "#9CA3AF",
  3: "#B97A2A",
};

const LABEL: Record<1 | 2 | 3, string> = {
  1: t.results_replay_podium_gold,
  2: t.results_replay_podium_silver,
  3: t.results_replay_podium_bronze,
};

export function ResultsPodium({ entries }: Props) {
  if (entries.length === 0) return null;
  const byRank = new Map<1 | 2 | 3, PodiumEntry>();
  for (const e of entries.slice(0, 3)) byRank.set(e.rank, e);

  return (
    <section
      aria-label={t.results_replay_podium_title}
      className="eic-results-replay__podium"
    >
      <h2 className="eic-results-replay__podium-title">{t.results_replay_podium_title}</h2>
      <div className="eic-results-replay__podium-row">
        {ORDER.map((rank) => {
          const entry = byRank.get(rank);
          if (!entry) {
            return (
              <div className="eic-results-replay__podium-step" key={rank}>
                <div
                  className="eic-results-replay__podium-block eic-results-replay__podium-block--empty"
                  style={{ height: HEIGHTS[rank], background: COLOR[rank] }}
                  aria-hidden="true"
                >
                  <span className="eic-results-replay__podium-rank">{rank}</span>
                </div>
                <p className="eic-results-replay__podium-label">{LABEL[rank]}</p>
              </div>
            );
          }
          return (
            <div className="eic-results-replay__podium-step" key={rank}>
              <p className="eic-results-replay__podium-team">{entry.teamName}</p>
              <p className="eic-results-replay__podium-score">
                {entry.combined.toFixed(1)}
              </p>
              <div
                className="eic-results-replay__podium-block"
                style={{ height: HEIGHTS[rank], background: COLOR[rank] }}
              >
                <span className="eic-results-replay__podium-rank">{rank}</span>
              </div>
              <p className="eic-results-replay__podium-label">{LABEL[rank]}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
