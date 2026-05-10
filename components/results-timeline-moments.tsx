// Phase 9 / GMR-05 — Results replay timeline of key moments.
// Hardcoded for the pilot edition (2026-05-13/14). A future v0.3 will
// move this to an `event_milestones` table seeded by the GameMaster.
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const MOMENTS: { time: string; label: string; body: string }[] = [
  {
    time: "Jour 1 · 09:00",
    label: "Coup d'envoi",
    body: "Ouverture officielle des Hack-Days par les partenaires (Tamwilcom, BoA Academy, Innov Invest, Bluespace). Les équipes découvrent leur mentor.",
  },
  {
    time: "Jour 1 · 11:30",
    label: "L1 · Problème",
    body: "Premières interviews terrain et restitution des cartes d'empathie. La cohorte explore son problème client.",
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
    label: "L5 · Pitch",
    body: "Pitch jury en mode théâtre (5 min × équipe), notation /5 sur 5 critères par 5 jurés partenaires.",
  },
  {
    time: "Jour 2 · 17:30",
    label: "Cérémonie",
    body: "Publication des résultats, podium et remise des distinctions. La cohorte clôture les Hack-Days 2026.",
  },
];

export function ResultsTimelineMoments() {
  return (
    <section
      aria-label={t.results_replay_timeline_title}
      className="eic-results-replay__timeline"
    >
      <h2 className="eic-results-replay__timeline-title">
        {t.results_replay_timeline_title}
      </h2>
      <ol className="eic-results-replay__timeline-list">
        {MOMENTS.map((m) => (
          <li className="eic-results-replay__timeline-item" key={m.time}>
            <p className="eic-results-replay__timeline-time">{m.time}</p>
            <p className="eic-results-replay__timeline-label">{m.label}</p>
            <p className="eic-results-replay__timeline-body">{m.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
