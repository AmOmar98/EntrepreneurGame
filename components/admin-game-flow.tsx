// Phase 9 / GMR-02 — Game flow ticker (textual events feed for live mode).
// Server component — re-rendered on every page load (no Realtime).

import type { GameFlowEntry } from "@/lib/admin-live";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  entries: GameFlowEntry[];
};

export function AdminGameFlow({ entries }: Props) {
  return (
    <aside className="eic-admin-game-flow">
      <h2 className="eic-admin-game-flow__title">{t.admin_game_flow_title}</h2>
      {entries.length === 0 ? (
        <p className="eic-admin-game-flow__empty">{t.admin_game_flow_empty}</p>
      ) : (
        <ol className="eic-admin-game-flow__list">
          {entries.map((entry) => (
            <li key={entry.id} className="eic-admin-game-flow__item">
              <span className="eic-admin-game-flow__time">
                {formatHourMinute(entry.at)}
              </span>
              <span className="eic-admin-game-flow__body">
                <span
                  className={`eic-admin-game-flow__dot eic-admin-game-flow__dot--${entry.tone}`}
                  aria-hidden="true"
                />
                <span className="eic-admin-game-flow__team">{entry.team}</span>{" "}
                {entry.label}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function formatHourMinute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
