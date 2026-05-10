// Phase 7 / Plan 07-02 - Onboarding step 1 (BIENVENUE).
// Server-renderable presentational component (no client hooks). Receives
// dynamic data from the parent <OnboardingStepper> server-side hydration.
//
// Wireframe: .planning/design-v2/project/player-flows.jsx (OnboardA)
// PLR-05: editorial welcome with kicker, italic title, 3 stats (7/24/1),
//         mentor encart.
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type OnboardingStep1Props = {
  // First name extracted from full_name. Falls back to a neutral pronoun.
  firstName: string | null;
  // Mentor display block, or null when no mentor is assigned yet.
  mentor: { initials: string; name: string } | null;
};

const STATS: { n: string; l: string; d: string }[] = [
  { n: "7", l: t.onboarding_v2_stat_levels_label, d: t.onboarding_v2_stat_levels_detail },
  {
    n: "24",
    l: t.onboarding_v2_stat_deliverables_label,
    d: t.onboarding_v2_stat_deliverables_detail,
  },
  { n: "1", l: t.onboarding_v2_stat_pitch_label, d: t.onboarding_v2_stat_pitch_detail },
];

export function OnboardingStep1({ firstName, mentor }: OnboardingStep1Props) {
  const greeting = firstName
    ? t.onboarding_v2_step1_greeting.replace("{name}", firstName)
    : t.onboarding_v2_step1_greeting_anon;
  return (
    <section aria-labelledby="onboarding-step1-title" className="eic-onboarding-step">
      <p className="eic-onboarding-kicker eic-onboarding-kicker--amber">
        {t.onboarding_v2_step1_kicker}
      </p>
      <h1 className="eic-onboarding-title" id="onboarding-step1-title">
        {greeting}{" "}
        <em className="eic-onboarding-title__em is-rose">
          {t.onboarding_v2_step1_title_em}
        </em>
      </h1>
      <p className="eic-onboarding-lead">{t.onboarding_v2_step1_lead}</p>

      <div className="eic-onboarding-stats">
        {STATS.map((s) => (
          <div className="eic-glass eic-onboarding-stat" key={s.l}>
            <div className="eic-onboarding-stat__n">{s.n}</div>
            <div className="eic-onboarding-stat__l">{s.l}</div>
            <div className="eic-onboarding-stat__d">{s.d}</div>
          </div>
        ))}
      </div>

      {mentor ? (
        <div className="eic-glass-tint eic-onboarding-mentor">
          <span aria-hidden="true" className="eic-onboarding-mentor__avatar">
            {mentor.initials}
          </span>
          <p className="eic-onboarding-mentor__text">
            <strong>{mentor.name}</strong> {t.onboarding_v2_step1_mentor_intro}
          </p>
        </div>
      ) : null}
    </section>
  );
}
