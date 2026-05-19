// Phase 9 / GMR-05 — Results replay timeline of key moments.
// Refreshed quick-260519-jpr W2 #5 : zigzag verticale (alternance gauche /
// droite tous les autres item), data driving inchangée. Hardcoded pour
// le pilote Digi-Hackathon 2026 ; v0.3 déplacera dans event_milestones.
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const MOMENTS: { time: string; label: string; body: string }[] = [
  {
    time: "Jour 1 · 09:00",
    label: "Coup d'envoi",
    body: "Ouverture officielle par les partenaires (Tamwilcom, BoA Academy, Innov Invest, Bluespace). Les équipes découvrent leur mentor.",
  },
  {
    time: "Jour 1 · 11:30",
    label: "L1 · Problème",
    body: "Premières interviews terrain et restitution des cartes d'empathie. La cohorte explore son problème client.",
  },
  {
    time: "Jour 1 · 13:00",
    label: "Pause déjeuner",
    body: "Networking entre équipes et mentors autour des sandwichs EIC.",
  },
  {
    time: "Jour 1 · 17:00",
    label: "L3 · Marché",
    body: "Mid-sprint : la majorité des équipes franchit L3 avec un marché cadré et des segments priorisés.",
  },
  {
    time: "Jour 2 · 09:30",
    label: "L4 · Modèle économique",
    body: "Atelier business model en parallèle des sessions mentor. Premières maquettes financières et premiers pitchs blancs.",
  },
  {
    time: "Jour 2 · 14:00",
    label: "L5 · Mode pitch",
    body: "Pitch jury en mode théâtre (5 min × équipe), notation /5 sur 5 critères par 5 jurés partenaires.",
  },
  {
    time: "Jour 2 · 17:30",
    label: "Verdict & cérémonie",
    body: "Publication des résultats, podium et remise des distinctions. La cohorte clôture le Digi-Hackathon 2026.",
  },
];

export function ResultsTimelineMoments() {
  return (
    <section
      aria-label={t.results_replay_timeline_title}
      className="eic-results-replay__timeline eic-results-replay__timeline--zigzag"
    >
      <h2 className="eic-results-replay__timeline-title">
        {t.results_replay_timeline_title}
      </h2>
      <ol className="eic-results-replay__timeline-list eic-results-replay__timeline-list--zigzag">
        {MOMENTS.map((m, idx) => {
          const side = idx % 2 === 0 ? "left" : "right";
          return (
            <li
              className={`eic-results-replay__timeline-item eic-results-replay__timeline-item--${side}`}
              key={m.time}
            >
              <div className="eic-results-replay__timeline-content">
                <p className="eic-results-replay__timeline-time">{m.time}</p>
                <p className="eic-results-replay__timeline-label">{m.label}</p>
                <p className="eic-results-replay__timeline-body">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
