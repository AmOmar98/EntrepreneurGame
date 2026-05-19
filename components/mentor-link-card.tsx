// Phase 8 / Plan 08 - Mentor link card (MNT-01).
// Server component: renders the submitted link as the central object of the
// evaluation page. Uses detectLinkType() to pick an icon + label + accent.
// The "Ouvrir" button is a plain anchor with target="_blank" — no JS needed.
import { detectLinkType } from "@/lib/link-type";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type MentorLinkCardProps = {
  /** URL submitted by the Player (https://...). */
  proofUrl: string | null;
  /** Optional free-text note attached to the submission. */
  proofText: string | null;
  /** Submission version - rendered in the card kicker (V1 / V2). */
  version: 1 | 2;
  /** ISO date string of the submission. */
  submittedAt: string;
  /** Pill label rendered in the kicker (e.g. "actuelle"). */
  statusLabel?: string;
  /**
   * quick-260519-l1l : 10-URL list variant for fiches-entretien-v1.
   * When provided, overrides the proof_url single-link rendering with a
   * structured list of 10 external links. proofText is ignored.
   */
  fichesUrls?: string[];
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

export function MentorLinkCard({
  proofUrl,
  proofText,
  version,
  submittedAt,
  statusLabel,
  fichesUrls,
}: MentorLinkCardProps) {
  // quick-260519-l1l : fiches-entretien-v1 = 10 URLs as a structured list.
  if (fichesUrls && fichesUrls.length > 0) {
    return (
      <article aria-label="Soumission" className="eic-mentor-link eic-mentor-link--fiches">
        <header className="eic-mentor-link__header">
          <span className="eic-mentor-link__kicker">
            SOUMISSION ACTUELLE · V{version}
            {statusLabel ? ` · ${statusLabel}` : ""}
          </span>
          <time className="eic-mentor-link__date" dateTime={submittedAt}>
            {formatDateFr(submittedAt)}
          </time>
        </header>
        <div className="eic-mentor-link__body">
          <div
            aria-hidden="true"
            className="eic-mentor-link__icon"
            style={{ background: "#1B3A5C" }}
          >
            10
          </div>
          <div className="eic-mentor-link__main">
            <p className="eic-mentor-link__type" style={{ color: "#1B3A5C" }}>
              {fichesUrls.length} fiches d&apos;entretien terrain
              <span className="eic-mentor-link__type-suffix"> · liens externes</span>
            </p>
            <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {fichesUrls.map((url, i) => (
                <li key={`${i}-${url}`}>
                  <a
                    className="eic-mentor-link__url"
                    href={url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Fiche {i + 1} · {url}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </article>
    );
  }

  // proof_text only (no link) - render a degraded variant.
  if (!proofUrl && proofText) {
    return (
      <article aria-label="Soumission" className="eic-mentor-link eic-mentor-link--text">
        <header className="eic-mentor-link__header">
          <span className="eic-mentor-link__kicker">SOUMISSION ACTUELLE · V{version}</span>
          <time className="eic-mentor-link__date" dateTime={submittedAt}>
            {formatDateFr(submittedAt)}
          </time>
        </header>
        <div className="eic-mentor-link__body">
          <div
            aria-hidden="true"
            className="eic-mentor-link__icon"
            style={{ background: "#1B3A5C" }}
          >
            ✏
          </div>
          <div className="eic-mentor-link__main">
            <p className="eic-mentor-link__type" style={{ color: "#1B3A5C" }}>
              Texte libre
            </p>
            <pre className="eic-mentor-link__text">{proofText}</pre>
          </div>
        </div>
      </article>
    );
  }

  if (!proofUrl) {
    return null;
  }

  const link = detectLinkType(proofUrl);

  return (
    <article aria-label="Soumission" className="eic-mentor-link">
      <header className="eic-mentor-link__header">
        <span className="eic-mentor-link__kicker">
          SOUMISSION ACTUELLE · V{version}
          {statusLabel ? ` · ${statusLabel}` : ""}
        </span>
        <time className="eic-mentor-link__date" dateTime={submittedAt}>
          {formatDateFr(submittedAt)}
        </time>
      </header>
      <div className="eic-mentor-link__body">
        <div
          aria-hidden="true"
          className="eic-mentor-link__icon"
          style={{ background: link.color }}
        >
          {link.icon}
        </div>
        <div className="eic-mentor-link__main">
          <p className="eic-mentor-link__type" style={{ color: link.color }}>
            {link.label}
            <span className="eic-mentor-link__type-suffix"> · lien externe</span>
          </p>
          <a
            className="eic-mentor-link__url"
            href={proofUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {proofUrl}
          </a>
          {proofText ? (
            <p className="eic-mentor-link__note">
              <span className="eic-mentor-link__note-kicker">Note jointe · </span>
              <em>{proofText}</em>
            </p>
          ) : null}
        </div>
        <a
          aria-label={`${t.mentor_link_card_open} - ${proofUrl}`}
          className="eic-mentor-link__open"
          href={proofUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t.mentor_link_card_open}
        </a>
      </div>
    </article>
  );
}
