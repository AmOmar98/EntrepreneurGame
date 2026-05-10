// Phase 9 / GMR-09 — Admin announcements list (anti-chrono).
// Server component (no interactivity).
import { dictionaries } from "@/lib/i18n";
import type { Announcement } from "@/lib/announcements";

const t = dictionaries.fr;

type Props = {
  announcements: Announcement[];
};

const KIND_LABELS: Record<Announcement["kind"], string> = {
  info: t.admin_announce_kind_info,
  urgence: t.admin_announce_kind_urgence,
  celebration: t.admin_announce_kind_celebration,
  appel: t.admin_announce_kind_appel,
};

const KIND_TONES: Record<Announcement["kind"], string> = {
  info: "blue",
  urgence: "rose",
  celebration: "green",
  appel: "amber",
};

const TARGET_LABELS: Record<Announcement["targetKind"], string> = {
  all: t.admin_announce_target_all,
  level: t.admin_announce_target_level,
  teams: t.admin_announce_target_teams,
  mentors: t.admin_announce_target_mentors,
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminAnnouncementsList({ announcements }: Props) {
  if (announcements.length === 0) {
    return (
      <p className="eic-admin-announce__history-empty">
        {t.admin_announce_history_empty}
      </p>
    );
  }
  return (
    <ul className="eic-admin-announce__history" aria-label={t.admin_announce_history_title}>
      {announcements.map((a) => (
        <li className="eic-admin-announce__history-item" key={a.id}>
          <div className="eic-admin-announce__history-meta">
            <time dateTime={a.createdAt} className="eic-admin-announce__history-time">
              {formatTime(a.createdAt)}
            </time>
            <span
              className={`eic-admin-announce__history-kind eic-admin-announce__history-kind--${KIND_TONES[a.kind]}`}
            >
              {KIND_LABELS[a.kind]}
            </span>
            <span className="eic-admin-announce__history-target">
              {TARGET_LABELS[a.targetKind]}
            </span>
            {a.createdByName ? (
              <span className="eic-admin-announce__history-author">{a.createdByName}</span>
            ) : null}
          </div>
          {a.title ? (
            <h3 className="eic-admin-announce__history-title">{a.title}</h3>
          ) : null}
          <p className="eic-admin-announce__history-body">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}
