// Phase 9 / GMR-02 — Game flow ticker (textual events feed for live mode).
// design-v3 Mockup 1 (2026-05-12) — restyled as a horizontal swipeable
// "LIVE · FIL DU JEU" band at the bottom of the cockpit.
// Server component — re-rendered on every page load (no Realtime).

import type { GameFlowEntry } from "@/lib/admin-live";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  entries: GameFlowEntry[];
};

export function AdminGameFlow({ entries }: Props) {
  return (
    <section
      className="eic-admin-game-flow eic-admin-game-flow--horizontal"
      aria-label={t.admin_game_flow_title}
    >
      <header className="eic-admin-game-flow__band-head">
        <span className="eic-admin-game-flow__band-pulse" aria-hidden="true" />
        <span className="eic-admin-game-flow__band-kicker">LIVE · FIL DU JEU</span>
        <span className="eic-admin-game-flow__band-hint">swipe →</span>
      </header>
      {entries.length === 0 ? (
        <p className="eic-admin-game-flow__empty">{t.admin_game_flow_empty}</p>
      ) : (
        <ol
          className="eic-admin-game-flow__strip"
          aria-label={t.admin_game_flow_title}
        >
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`eic-admin-game-flow__chip eic-admin-game-flow__chip--${entry.tone}`}
            >
              <span
                className={`eic-admin-game-flow__chip-icon eic-admin-game-flow__chip-icon--${entry.tone}`}
                aria-hidden="true"
              >
                {chipGlyph(entry)}
              </span>
              <span className="eic-admin-game-flow__chip-body">
                <span className="eic-admin-game-flow__chip-time wf-mono">
                  {formatHourMinute(entry.at)}
                </span>
                <span className="eic-admin-game-flow__chip-team">{entry.team}</span>
                <span className="eic-admin-game-flow__chip-label">{entry.label}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function chipGlyph(entry: GameFlowEntry): string {
  switch (entry.kind) {
    case "submission_v1":
    case "submission_v2":
      return "▸";
    case "validated":
      return "✓";
    case "evaluation":
      return entry.tone === "red" ? "✕" : "▴";
    case "comment":
      return "💬";
    default:
      return "•";
  }
}

function formatHourMinute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
