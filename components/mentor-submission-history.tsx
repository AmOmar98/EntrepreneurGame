// Phase 8 / Plan 08 - Mentor submission history (MNT-02).
// MNT-05: each older entry now shows verdict badge + expected_action inline.
// Server component: anti-chronological list of submission versions for the
// current deliverable + player. Used below the central <MentorLinkCard /> on
// /mentor/submission/[id]. The most recent submission is highlighted; older
// versions are rendered faded with a "remplacé" pill.
//
// Data shape is flat — no threading, no tabs, no JS. Just an <ol> of links
// to the underlying submission detail pages.
import Link from "next/link";
import { detectLinkType } from "@/lib/link-type";
import { dictionaries } from "@/lib/i18n";

const VERDICT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  validate_v1: { bg: "#dcfce7", color: "#166534", label: "V1 validee" },
  validate_v2: { bg: "#dcfce7", color: "#166534", label: "V2 validee" },
  request_v2:  { bg: "#fef3c7", color: "#92400e", label: "V2 demandee" },
  reject:      { bg: "#fee2e2", color: "#991b1b", label: "Rejete" },
};

const t = dictionaries.fr;

export type MentorSubmissionHistoryEntry = {
  id: string;
  version: number;
  submittedAt: string;
  proofUrl: string | null;
  proofText: string | null;
  /** When true, this entry is rendered as the active row (no faded look). */
  isCurrent: boolean;
  /** MNT-05: verdict from the mentor's own evaluation on this version. */
  evalVerdict?: string | null;
  /** MNT-05: expected_action from the mentor's evaluation. */
  evalExpectedAction?: string | null;
};

export type MentorSubmissionHistoryProps = {
  /** All submissions for the (player, deliverable) pair, antichrono. */
  entries: MentorSubmissionHistoryEntry[];
};

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MentorSubmissionHistory({ entries }: MentorSubmissionHistoryProps) {
  // Filter out the current entry — the central <MentorLinkCard /> already
  // displays it at the top of the page. Keep the title visible in all cases
  // for visual rhythm.
  const olderEntries = entries.filter((e) => !e.isCurrent);

  return (
    <section aria-labelledby="mentor-history-title" className="eic-mentor-history">
      <h2 className="eic-mentor-history__title" id="mentor-history-title">
        {t.mentor_history_title}
      </h2>
      {olderEntries.length === 0 ? (
        <p className="eic-mentor-history__empty">{t.mentor_history_empty}</p>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {olderEntries.map((entry) => {
            const link = entry.proofUrl ? detectLinkType(entry.proofUrl) : null;
            const display = entry.proofUrl ?? (entry.proofText ? "(texte libre)" : "");
            const verdictStyle = entry.evalVerdict ? VERDICT_STYLES[entry.evalVerdict] : null;
            return (
              <li key={entry.id}>
                <Link
                  className="eic-mentor-history__item eic-mentor-history__item--replaced"
                  href={`/mentor/submission/${entry.id}`}
                >
                  <span className="eic-mentor-history__version">V{entry.version}</span>
                  {link ? (
                    <span className="eic-mentor-history__type" style={{ color: link.color }}>
                      {link.label}
                    </span>
                  ) : (
                    <span className="eic-mentor-history__type">Texte libre</span>
                  )}
                  <span className="eic-mentor-history__url">{display}</span>
                  <time className="eic-mentor-history__date" dateTime={entry.submittedAt}>
                    {formatDateFr(entry.submittedAt)}
                  </time>
                  {/* MNT-05: verdict badge */}
                  {verdictStyle ? (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "1px 7px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: verdictStyle.bg,
                        color: verdictStyle.color,
                      }}
                    >
                      {verdictStyle.label}
                    </span>
                  ) : (
                    <span className="eic-mentor-history__status">
                      {t.mentor_history_status_replaced}
                    </span>
                  )}
                </Link>
                {/* MNT-05: expected_action inline */}
                {entry.evalExpectedAction ? (
                  <p
                    style={{
                      margin: "2px 0 0",
                      paddingLeft: 8,
                      fontSize: 11,
                      color: "#78350f",
                      fontStyle: "italic",
                    }}
                  >
                    Action attendue : {entry.evalExpectedAction}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
