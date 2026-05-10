// Phase 9 / GMR-09 — Player-side strip showing recent announcements
// targeted at this Player. Server component (no interactivity); the Player
// reloads /journey to refresh.
import { dictionaries } from "@/lib/i18n";
import type { Announcement } from "@/lib/announcements";

const t = dictionaries.fr;

const KIND_LABELS: Record<Announcement["kind"], string> = {
  info: "Info",
  urgence: "Urgence",
  celebration: "Bravo",
  appel: "À faire",
};

const KIND_TONES: Record<Announcement["kind"], string> = {
  info: "blue",
  urgence: "rose",
  celebration: "green",
  appel: "amber",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type Props = {
  announcements: Announcement[];
};

export function PlayerAnnouncementStrip({ announcements }: Props) {
  if (announcements.length === 0) return null;
  return (
    <aside
      aria-label={t.player_announce_strip_aria}
      className="eic-player-announce-strip"
    >
      {announcements.map((a) => (
        <article
          className={`eic-player-announce eic-player-announce--${KIND_TONES[a.kind]}`}
          key={a.id}
        >
          <header className="eic-player-announce__header">
            <span className={`eic-player-announce__kind eic-player-announce__kind--${KIND_TONES[a.kind]}`}>
              {KIND_LABELS[a.kind]}
            </span>
            <span className="eic-player-announce__kicker">
              {t.player_announce_strip_kicker}
            </span>
            <span className="eic-player-announce__time">{formatTime(a.createdAt)}</span>
          </header>
          {a.title ? (
            <h3 className="eic-player-announce__title">{a.title}</h3>
          ) : null}
          <p className="eic-player-announce__body">{a.body}</p>
        </article>
      ))}
    </aside>
  );
}
