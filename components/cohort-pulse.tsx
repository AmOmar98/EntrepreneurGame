// Quick 260510-k1f / B1 - Cohort Pulse Bar (anonymised, R1).
// Server component - no useState/useEffect. Pure render of {levelId, count, total}[].
// Designed by intent : never receives nor renders Player names, scores, ranks
// or any per-team identifier. The only inputs are aggregate counts.
//
// Audit (R1):
//   grep -nE "name|slug|score|rank|percentile" components/cohort-pulse.tsx
//     -> only inside this header guard.
//   grep -nE "Player|player\\." components/cohort-pulse.tsx
//     -> only inside this header guard (no Player prop, no player.* render).
import { dictionaries } from "@/lib/i18n";
import { getShortLevelLabel } from "@/lib/journey-progression";
import type { CohortPulseEntry } from "@/lib/cohort-pulse";

const t = dictionaries.fr;

export type CohortPulseProps = {
  entries: CohortPulseEntry[];
};

export function CohortPulse({ entries }: CohortPulseProps) {
  // Anti-leak guard: empty cohort or no submission anywhere -> show the
  // "empty" copy instead of bars at 0% (less anxiety-inducing for the
  // first Player to land on /journey at 8h30 J1).
  const total = entries[0]?.total ?? 0;
  const anyCount = entries.some((e) => e.count > 0);

  if (total === 0 || !anyCount) {
    return (
      <section className="eic-cohort-pulse" aria-label={t.cohort_pulse_aria}>
        <p className="eic-cohort-pulse__kicker">{t.cohort_pulse_kicker}</p>
        <p className="eic-cohort-pulse__empty">{t.cohort_pulse_empty}</p>
      </section>
    );
  }

  return (
    <section className="eic-cohort-pulse" aria-label={t.cohort_pulse_aria}>
      <p className="eic-cohort-pulse__kicker">{t.cohort_pulse_kicker}</p>
      <ul className="eic-cohort-pulse__list" role="list">
        {entries.map((e) => {
          const ratio = e.total > 0 ? Math.round((e.count / e.total) * 100) : 0;
          const shortLabel = getShortLevelLabel(e.levelId);
          return (
            <li key={e.levelId} className="eic-cohort-pulse__row">
              <span className="eic-cohort-pulse__label">
                {`${t.cohort_pulse_label_template} ${shortLabel}`}
              </span>
              <div
                className="eic-cohort-pulse__bar"
                role="progressbar"
                aria-valuenow={e.count}
                aria-valuemin={0}
                aria-valuemax={e.total}
                aria-label={`${shortLabel} : ${e.count} / ${e.total}`}
              >
                <div
                  className="eic-cohort-pulse__bar-fill"
                  style={{ width: `${ratio}%` }}
                />
              </div>
              <span className="eic-cohort-pulse__count">
                {e.count}/{e.total}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
