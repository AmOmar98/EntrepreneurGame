// Phase 10 / Section 13 — Loading state with Pixel mascot.
// Server-renderable (no client hooks). Pixel uses mood "loading" (var(--mood-loading-*)).

import { PixelAvatar } from "@/components/pixel-mascot";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Step = {
  key: string;
  label: string;
  active?: boolean;
};

type Props = {
  steps?: Step[];
  // Optional override for tests / custom states.
  title?: string;
  lead?: string;
};

const DEFAULT_STEPS: Step[] = [
  { key: "profile", label: t.system_loading_step_profile },
  { key: "team", label: t.system_loading_step_team, active: true },
  { key: "missions", label: t.system_loading_step_missions },
  { key: "comments", label: t.system_loading_step_comments },
  { key: "mascot", label: t.system_loading_step_mascot },
];

export function SysLoading({
  steps = DEFAULT_STEPS,
  title = t.system_loading_title,
  lead = t.system_loading_lead,
}: Props) {
  return (
    <section className="eic-sys eic-sys--loading" aria-busy="true" aria-live="polite">
      <div className="eic-sys__avatar">
        <PixelAvatar mood="loading" size={96} />
      </div>
      <h2 className="eic-sys__title">{title}</h2>
      <p className="eic-sys__lead">{lead}</p>
      <ul className="eic-sys__steps" aria-label={title}>
        {steps.map((s) => (
          <li
            key={s.key}
            className={
              "eic-sys__step" + (s.active ? " eic-sys__step--active" : "")
            }
          >
            <span className="eic-sys__step-dot" aria-hidden="true" />
            <span className="eic-sys__step-label">{s.label}</span>
          </li>
        ))}
      </ul>
      <p className="eic-sys__quote">« {t.pixel_mascot_loading_quote} »</p>
    </section>
  );
}
