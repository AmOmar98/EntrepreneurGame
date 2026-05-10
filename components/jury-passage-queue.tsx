"use client";
// Phase 9 / GMR-04 — Jury pitch theater passage queue (right-rail).
import { dictionaries } from "@/lib/i18n";
import type { Player } from "@/lib/types";

const t = dictionaries.fr;

type Props = {
  players: Player[];
  currentIndex: number;
  scoredPlayerIds: Set<string>;
  onSelect: (index: number) => void;
};

export function JuryPassageQueue({
  players,
  currentIndex,
  scoredPlayerIds,
  onSelect,
}: Props) {
  return (
    <aside className="eic-jury-queue" aria-label={t.jury_passage_queue_title}>
      <h2 className="eic-jury-queue__title">{t.jury_passage_queue_title}</h2>
      <ol className="eic-jury-queue__list">
        {players.map((p, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex || scoredPlayerIds.has(p.id);
          const status = isCurrent
            ? "current"
            : isPast
              ? "done"
              : "upcoming";
          const cls = `eic-jury-queue__item eic-jury-queue__item--${status}`;
          return (
            <li className={cls} key={p.id}>
              <button
                aria-current={isCurrent ? "true" : undefined}
                className="eic-jury-queue__btn"
                onClick={() => onSelect(i)}
                type="button"
              >
                <span className="eic-jury-queue__rank">{i + 1}</span>
                <span className="eic-jury-queue__name">
                  <span className="eic-jury-queue__team">{p.name}</span>
                  {p.idea ? (
                    <span className="eic-jury-queue__idea">{p.idea}</span>
                  ) : null}
                </span>
                <span className="eic-jury-queue__status">
                  {isCurrent
                    ? t.jury_passage_status_current
                    : isPast
                      ? t.jury_passage_status_done
                      : t.jury_passage_status_upcoming}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
