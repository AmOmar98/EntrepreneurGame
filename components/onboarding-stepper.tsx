"use client";
// Phase 7 / Plan 07-02 - Onboarding stepper (3 editorial steps + KYC).
// Owns local step state (1 -> 2 -> 3) and the form lifecycle for the
// final step. The KYC form renders inline inside step 3; submitting it
// drives the existing `saveOnboarding` server action and redirects to
// /journey on success.
//
// Wireframe: .planning/design-v2/project/player-flows.jsx (OnboardA/B/C)
// PLR-05: 3 editorial steps with Suivant / Precedent navigation.
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboarding, type WorkflowState } from "@/app/actions";
import { OnboardingStep1 } from "@/components/onboarding-step-1";
import {
  OnboardingStep2,
  type OnboardingStep2Member,
} from "@/components/onboarding-step-2";
import { OnboardingStep3 } from "@/components/onboarding-step-3";
import { Button } from "@/components/ui";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

const LIKERT_QUESTIONS: { id: "q1" | "q2" | "q3" | "q4" | "q5"; label: string }[] = [
  { id: "q1", label: t.onboarding_q1 },
  { id: "q2", label: t.onboarding_q2 },
  { id: "q3", label: t.onboarding_q3 },
  { id: "q4", label: t.onboarding_q4 },
  { id: "q5", label: t.onboarding_q5 },
];
const LIKERT_SCALE = [1, 2, 3, 4, 5];

export type OnboardingStepperMember = {
  userId: string;
  fullName: string | null;
  email: string | null;
};

export type OnboardingStepperProps = {
  // Pre-filled team data (resolved server-side from `players`).
  initialName: string;
  initialIdea: string;
  // Current player first name (best-effort), used in step 1 greeting.
  firstName: string | null;
  // Mentor display block, resolved from cohort assignment when available.
  mentor: { initials: string; name: string } | null;
  // Members rendered as chips on step 2 + checkboxes inside the KYC form.
  members: OnboardingStepperMember[];
};

const TOTAL_STEPS = 3;

function getInitials(name: string | null, fallback: string): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function OnboardingStepper({
  initialName,
  initialIdea,
  firstName,
  mentor,
  members,
}: OnboardingStepperProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idea, setIdea] = useState(initialIdea);
  const [state, formAction, pending] = useActionState(saveOnboarding, initialState);

  useEffect(() => {
    if (state.ok) {
      router.push("/journey");
    }
  }, [state.ok, router]);

  const teamInitials = getInitials(initialName, "EQ");
  const step2Members: OnboardingStep2Member[] = members.map((m, idx) => ({
    initials: getInitials(m.fullName, m.email ? m.email.slice(0, 2).toUpperCase() : `M${idx + 1}`),
    name: m.fullName ?? m.email ?? t.onboarding_member_unnamed,
    role: idx === 0 ? t.onboarding_v2_step2_role_self_label : t.onboarding_v2_step2_role_member_label,
    self: idx === 0,
  }));

  const onPrev = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2)));
  const onNext = () => setStep((s) => (s === 3 ? 3 : ((s + 1) as 2 | 3)));

  const primaryLabel =
    step === 1
      ? t.onboarding_v2_step1_primary
      : step === 2
        ? t.onboarding_v2_step2_primary
        : pending
          ? t.onboarding_submitting
          : t.onboarding_v2_step3_primary;

  return (
    <div className="eic-onboarding">
      <div aria-hidden="true" className="eic-aurora" />
      <div className="eic-onboarding__topbar">
        <span className="eic-onboarding__brand">{t.brand_name}</span>
        <div aria-hidden="true" className="eic-onboarding__dots">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              className={`eic-onboarding__dot${i + 1 === step ? " is-current" : ""}${i + 1 < step ? " is-done" : ""}`}
              key={i}
            />
          ))}
        </div>
        <span className="eic-onboarding__step-counter" aria-hidden="true">
          {t.onboarding_v2_step_label} {step} / {TOTAL_STEPS}
        </span>
        <span className="sr-only">
          {t.onboarding_v2_step_label} {step} / {TOTAL_STEPS}
        </span>
      </div>

      <form action={formAction} className="eic-onboarding__form">
        <div className="eic-onboarding__body">
          {step === 1 ? (
            <OnboardingStep1 firstName={firstName} mentor={mentor} />
          ) : null}
          {step === 2 ? (
            <OnboardingStep2
              idea={initialIdea}
              initials={teamInitials}
              members={step2Members}
              mentorName={mentor?.name ?? null}
              teamName={initialName || t.onboarding_v2_step2_team_fallback}
            />
          ) : null}
          {step === 3 ? (
            <OnboardingStep3
              formChildren={
                <KycFields
                  idea={idea}
                  initialName={initialName}
                  members={members}
                  onIdeaChange={setIdea}
                />
              }
            />
          ) : null}
        </div>

        {/* Hidden inputs from earlier steps: the KYC form below already wires
            teamName + idea, but we keep them rendered when on steps 1/2 so a
            user pressing browser-Enter never blanks the data. */}
        {step !== 3 ? (
          <>
            <input name="teamName" type="hidden" value={initialName} />
            <input name="idea" type="hidden" value={idea} />
          </>
        ) : null}

        <div className="eic-onboarding__nav">
          {step > 1 ? (
            <Button onClick={onPrev} type="button" variant="ghost">
              {t.onboarding_v2_back}
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="eic-onboarding__nav-grow" />
          {state.message && !state.ok ? (
            <span className="eic-onboarding__error" role="alert">
              {state.message}
            </span>
          ) : null}
          {step < 3 ? (
            <Button onClick={onNext} type="button" variant="primary">
              {primaryLabel}
            </Button>
          ) : (
            <Button disabled={pending} type="submit" variant="primary">
              {primaryLabel}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function KycFields({
  initialName,
  idea,
  onIdeaChange,
  members,
}: {
  initialName: string;
  idea: string;
  onIdeaChange: (value: string) => void;
  members: OnboardingStepperMember[];
}) {
  return (
    <div className="eic-onboarding-kyc">
      <label className="eic-onboarding-kyc__field" htmlFor="onboarding-team-name">
        <span className="eic-onboarding-kyc__label">{t.onboarding_team_name}</span>
        <input
          className="eic-onboarding-kyc__input"
          defaultValue={initialName}
          id="onboarding-team-name"
          maxLength={80}
          minLength={2}
          name="teamName"
          required
          type="text"
        />
      </label>

      <label className="eic-onboarding-kyc__field" htmlFor="onboarding-idea">
        <span className="eic-onboarding-kyc__label">{t.onboarding_idea}</span>
        <textarea
          className="eic-onboarding-kyc__textarea"
          id="onboarding-idea"
          maxLength={500}
          minLength={10}
          name="idea"
          onChange={(e) => onIdeaChange(e.target.value)}
          required
          rows={4}
          value={idea}
        />
        <small aria-live="polite" className="eic-onboarding-kyc__counter">
          {idea.length} / 500 {t.onboarding_idea_counter}
        </small>
      </label>

      <fieldset className="eic-onboarding-kyc__fieldset">
        <legend className="eic-onboarding-kyc__legend">
          {t.onboarding_diagnostic_legend}
        </legend>
        {LIKERT_QUESTIONS.map((q) => (
          <div className="eic-onboarding-kyc__likert" key={q.id}>
            <span className="eic-onboarding-kyc__likert-label">{q.label}</span>
            <div
              aria-label={q.label}
              className="eic-onboarding-kyc__likert-row"
              role="radiogroup"
            >
              {LIKERT_SCALE.map((v) => (
                <label className="eic-onboarding-kyc__likert-choice" key={v}>
                  <input name={q.id} required type="radio" value={v} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      {members.length > 0 ? (
        <fieldset className="eic-onboarding-kyc__fieldset">
          <legend className="eic-onboarding-kyc__legend">{t.onboarding_members}</legend>
          {members.map((m) => (
            <label className="eic-onboarding-kyc__member" key={m.userId}>
              <input
                defaultChecked
                name="membersConfirmed"
                type="checkbox"
                value={m.userId}
              />
              <span>
                {m.fullName ?? t.onboarding_member_unnamed}
                {m.email ? ` - ${m.email}` : ""}
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
    </div>
  );
}
