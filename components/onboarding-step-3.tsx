// Phase 7 / Plan 07-02 - Onboarding step 3 (LES REGLES + KYC).
// Server-renderable presentational layer for the editorial 3 rules. The
// child <OnboardingKycFields> stays a separate sub-tree owned by the
// stepper (which provides the form action & state).
//
// Wireframe: .planning/design-v2/project/player-flows.jsx (OnboardC)
// PLR-05: editorial 3 rules with big numbered tiles in 3 colours.
import { type ReactNode } from "react";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const RULES: { n: string; t: string; d: string; tone: "blue" | "amber" | "green" }[] = [
  {
    n: "01",
    t: t.onboarding_v2_step3_rule1_title,
    d: t.onboarding_v2_step3_rule1_body,
    tone: "blue",
  },
  {
    n: "02",
    t: t.onboarding_v2_step3_rule2_title,
    d: t.onboarding_v2_step3_rule2_body,
    tone: "amber",
  },
  {
    n: "03",
    t: t.onboarding_v2_step3_rule3_title,
    d: t.onboarding_v2_step3_rule3_body,
    tone: "green",
  },
];

export type OnboardingStep3Props = {
  // The KYC form (or its inline fields). Rendered below the editorial rules.
  formChildren: ReactNode;
};

export function OnboardingStep3({ formChildren }: OnboardingStep3Props) {
  return (
    <section aria-labelledby="onboarding-step3-title" className="eic-onboarding-step">
      <p className="eic-onboarding-kicker eic-onboarding-kicker--amber">
        {t.onboarding_v2_step3_kicker}
      </p>
      <h1 className="eic-onboarding-title" id="onboarding-step3-title">
        {t.onboarding_v2_step3_title_prefix}{" "}
        <em className="eic-onboarding-title__em is-green">
          {t.onboarding_v2_step3_title_em}
        </em>
      </h1>

      <ol aria-label={t.onboarding_v2_step3_rules_aria} className="eic-onboarding-rules">
        {RULES.map((r) => (
          <li className="eic-glass eic-onboarding-rule" key={r.n}>
            <span
              aria-hidden="true"
              className={`eic-onboarding-rule__num is-${r.tone}`}
            >
              {r.n}
            </span>
            <div className="eic-onboarding-rule__body">
              <h3 className="eic-onboarding-rule__title">{r.t}</h3>
              <p className="eic-onboarding-rule__desc">{r.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="eic-onboarding-form-wrap">
        <p className="eic-onboarding-kicker">{t.onboarding_v2_step3_form_kicker}</p>
        {formChildren}
      </div>
    </section>
  );
}
