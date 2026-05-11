// Player-facing score block — surfaces the mentor evaluation (total + rubric
// breakdown) ONLY on the deliverable detail page `app/journey/deliverable/[id]/`.
// R1 (revised 2026-05-11): score visible UNIQUEMENT on this surface for the
// Player; rank/classement remain invisible everywhere on Player UI.
// Do NOT import this from `/journey` index, `/results`, badges, mascot, navbar.
import { dictionaries } from "@/lib/i18n";
import type { RubricCriterion } from "@/lib/types";

const t = dictionaries.fr;

export type DeliverableScoreBlockProps = {
  totalScore: number;
  maxScore: number;
  scores: Record<string, number>;
  rubric: RubricCriterion[];
};

export function DeliverableScoreBlock({
  totalScore,
  maxScore,
  scores,
  rubric,
}: DeliverableScoreBlockProps) {
  return (
    <section
      aria-labelledby="deliverable-score-title"
      className="eic-glass eic-mentor-eval"
      style={{ padding: 16, marginTop: 16 }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <h2
          className="eic-mentor-eval__title"
          id="deliverable-score-title"
          style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}
        >
          {t.deliverable_score_title}
        </h2>
        <p
          aria-live="polite"
          className="eic-mentor-eval__total"
          style={{ margin: 0, fontSize: 18, color: "#0f172a" }}
        >
          <strong style={{ fontSize: 22 }}>{totalScore}</strong>
          <span style={{ color: "#64748b" }}> / {maxScore}</span>
        </p>
      </header>
      {rubric.length > 0 ? (
        <ul
          className="eic-mentor-eval__rubric"
          style={{ listStyle: "none", margin: 0, padding: 0 }}
        >
          {rubric.map((c) => {
            const value = scores[c.key] ?? 0;
            return (
              <li
                className="eic-mentor-eval__rubric-row"
                key={c.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "6px 0",
                  borderTop: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#0f172a",
                }}
              >
                <span className="eic-mentor-eval__rubric-label">{c.label}</span>
                <span
                  className="eic-mentor-eval__rubric-max"
                  style={{ color: "#475569", fontVariantNumeric: "tabular-nums" }}
                >
                  {value} / {c.max}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
