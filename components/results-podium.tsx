// Phase 9 / GMR-05 — Results replay podium (or / argent / bronze).
// Refreshed quick-260519-jpr W2 #5 : hauteurs 200/160/120, animation
// staggered via CSS animation-delay (0ms / 150ms / 300ms in render order),
// motion-safe respect via globals.css media query prefers-reduced-motion.
// Pure server component. R1 cardinal preserved: score only visible to GM
// + jurors (isGameMaster prop conveys "canSeeNumbers" from parent).
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type PodiumEntry = {
  rank: 1 | 2 | 3;
  teamName: string;
  combined: number;
};

type Props = {
  entries: PodiumEntry[];
  /** True for GM and jurors only — drives whether combined score is rendered. */
  isGameMaster: boolean;
};

// Render order keeps the silver/gold/bronze visual arrangement
// (2 - 1 - 3, items aligned to baseline).
const ORDER: (1 | 2 | 3)[] = [2, 1, 3];

const HEIGHTS: Record<1 | 2 | 3, number> = { 1: 200, 2: 160, 3: 120 };
const HEIGHT_CLASS: Record<1 | 2 | 3, string> = {
  1: "eic-podium-h-200",
  2: "eic-podium-h-160",
  3: "eic-podium-h-120",
};

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

export function ResultsPodium({ entries, isGameMaster }: Props) {
  if (entries.length === 0) return null;
  const byRank = new Map<1 | 2 | 3, PodiumEntry>();
  for (const e of entries.slice(0, 3)) byRank.set(e.rank, e);

  const filledOrder = ORDER.filter((rank) => byRank.has(rank));

  return (
    <section
      aria-label={t.results_replay_podium_title}
      className="eic-results-replay__podium"
    >
      <h2 className="eic-results-replay__podium-title">{t.results_replay_podium_title}</h2>
      <div
        className="eic-results-replay__podium-row"
        style={{ justifyContent: filledOrder.length < 3 ? "center" : undefined }}
      >
        {filledOrder.map((rank, idx) => {
          const entry = byRank.get(rank)!;
          // Stagger the entrance: 0ms / 150ms / 300ms in render order.
          const delayMs = idx * 150;
          return (
            <div
              className="eic-results-replay__podium-step eic-results-replay__podium-step--animated"
              key={rank}
              style={{ animationDelay: `${delayMs}ms` }}
            >
              <p className="eic-results-replay__podium-team">{entry.teamName}</p>
              {isGameMaster ? (
                <p className="eic-results-replay__podium-score">
                  {entry.combined.toFixed(1)}
                </p>
              ) : null}
              <div
                className={`eic-results-replay__podium-block ${HEIGHT_CLASS[rank]}`}
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
