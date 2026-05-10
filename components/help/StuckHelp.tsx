// Phase 10 / Section 11 — Coup de pouce (Player bloque).
// Hero empathique + timeline 5 dernieres actions + 3 portes (indice/mentor/pause).
// R1/R2/R3 OK : aucun XP/score, aucun blocage, copy validee par advisor (verdict B
// reformule "sans penalite", pas de "-0 XP").

import Link from "next/link";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type StuckTimelineItem = {
  // ISO date string.
  at: string;
  label: string;
};

type Props = {
  timeline?: StuckTimelineItem[];
  // Optional mailto URL preset by server (mentor email).
  mentorMailto?: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StuckHelp({ timeline = [], mentorMailto }: Props) {
  return (
    <article className="eic-stuck">
      <header className="eic-stuck__header">
        <p className="eic-stuck__kicker">
          <span>{t.help_stuck_kicker}</span>
          <span className="eic-stuck__subkicker">— {t.help_stuck_subkicker}</span>
        </p>
        <h1 className="eic-stuck__title">{t.help_stuck_title}</h1>
        <p className="eic-stuck__lead">{t.help_stuck_lead}</p>
      </header>

      <section className="eic-stuck__timeline" aria-labelledby="stuck-timeline">
        <h2 id="stuck-timeline" className="eic-stuck__section-title">
          {t.help_stuck_timeline_title}
        </h2>
        {timeline.length === 0 ? (
          <p className="eic-stuck__timeline-empty">{t.help_stuck_timeline_empty}</p>
        ) : (
          <ol className="eic-stuck__timeline-list">
            {timeline.slice(0, 5).map((it, i) => (
              <li key={i} className="eic-stuck__timeline-item">
                <span className="eic-stuck__timeline-dot" aria-hidden="true" />
                <span className="eic-stuck__timeline-date">{formatDate(it.at)}</span>
                <span className="eic-stuck__timeline-label">{it.label}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="eic-stuck__doors" aria-labelledby="stuck-doors">
        <h2 id="stuck-doors" className="eic-stuck__section-title">
          {t.help_stuck_doors_title}
        </h2>
        <div className="eic-stuck__doors-grid">
          <article className="eic-stuck__door eic-stuck__door--hint">
            <h3>{t.help_stuck_door_hint_label}</h3>
            <p>{t.help_stuck_door_hint_desc}</p>
          </article>
          <article className="eic-stuck__door eic-stuck__door--mentor">
            <h3>{t.help_stuck_door_mentor_label}</h3>
            <p>{t.help_stuck_door_mentor_desc}</p>
            {mentorMailto ? (
              <a className="eic-button eic-button--primary" href={mentorMailto}>
                {t.help_stuck_door_mentor_label} →
              </a>
            ) : null}
          </article>
          <article className="eic-stuck__door eic-stuck__door--pause">
            <h3>{t.help_stuck_door_pause_label}</h3>
            <p>{t.help_stuck_door_pause_desc}</p>
          </article>
        </div>
      </section>

      <p className="eic-stuck__social">{t.help_stuck_social}</p>
      <Link className="eic-button eic-button--ghost" href="/journey">
        ← {t.help_stuck_back}
      </Link>
    </article>
  );
}
