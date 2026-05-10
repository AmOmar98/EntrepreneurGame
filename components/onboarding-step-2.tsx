// Phase 7 / Plan 07-02 - Onboarding step 2 (TON EQUIPE).
// Server-renderable. Renders editorial team card + member chips + 2 glass
// cards (what we share / your role). Accepts pre-computed members list.
//
// Wireframe: .planning/design-v2/project/player-flows.jsx (OnboardB)
// PLR-05: editorial team display.
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type OnboardingStep2Member = {
  initials: string;
  name: string;
  role: string;
  self: boolean;
};

export type OnboardingStep2Props = {
  teamName: string;
  initials: string;
  idea: string | null;
  mentorName: string | null;
  members: OnboardingStep2Member[];
};

export function OnboardingStep2({
  teamName,
  initials,
  idea,
  mentorName,
  members,
}: OnboardingStep2Props) {
  const teamMeta = [
    `${members.length} ${members.length > 1 ? t.onboarding_v2_step2_entrepreneurs : t.onboarding_v2_step2_entrepreneur}`,
    idea ? `${t.onboarding_v2_step2_idea_prefix} ${idea}` : null,
    mentorName ? `${t.onboarding_v2_step2_mentor_prefix} ${mentorName}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section aria-labelledby="onboarding-step2-title" className="eic-onboarding-step">
      <p className="eic-onboarding-kicker eic-onboarding-kicker--amber">
        {t.onboarding_v2_step2_kicker}
      </p>
      <h1 className="eic-onboarding-title" id="onboarding-step2-title">
        {t.onboarding_v2_step2_title_prefix}{" "}
        <em className="eic-onboarding-title__em is-blue">{teamName}.</em>
      </h1>

      <div className="eic-glass eic-onboarding-team">
        <div aria-hidden="true" className="eic-onboarding-team__avatar">
          {initials}
        </div>
        <div className="eic-onboarding-team__body">
          <h2 className="eic-onboarding-team__name">
            {t.onboarding_v2_step2_team_label} {teamName}
          </h2>
          <p className="eic-onboarding-team__meta">{teamMeta}</p>
          {members.length > 0 ? (
            <ul aria-label={t.onboarding_v2_step2_members_aria} className="eic-onboarding-chips">
              {members.map((m) => (
                <li
                  className={`eic-onboarding-chip${m.self ? " is-self" : ""}`}
                  key={m.initials + m.name}
                >
                  <span aria-hidden="true" className="eic-onboarding-chip__avatar">
                    {m.initials}
                  </span>
                  <span className="eic-onboarding-chip__text">
                    <strong>{m.name}</strong>
                    <span className="eic-onboarding-chip__role"> · {m.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="eic-onboarding-grid">
        <div className="eic-glass eic-onboarding-tile">
          <p className="eic-onboarding-kicker">{t.onboarding_v2_step2_share_kicker}</p>
          <ul className="eic-onboarding-list">
            <li>{t.onboarding_v2_step2_share_1}</li>
            <li>{t.onboarding_v2_step2_share_2}</li>
            <li>{t.onboarding_v2_step2_share_3}</li>
          </ul>
        </div>
        <div className="eic-glass eic-onboarding-tile">
          <p className="eic-onboarding-kicker">{t.onboarding_v2_step2_role_kicker}</p>
          <p className="eic-onboarding-tile__title">{t.onboarding_v2_step2_role_title}</p>
          <p className="eic-onboarding-tile__sub">{t.onboarding_v2_step2_role_sub}</p>
        </div>
      </div>
    </section>
  );
}
