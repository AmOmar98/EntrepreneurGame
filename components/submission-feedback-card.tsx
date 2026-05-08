// Phase 3 / Plan 03 - Submission feedback card (server component).
// Displays the latest Mentor evaluation (verdict, total score, per-criterion
// scores, feedback) when a V1 submission has status='feedback_received'.
import { dictionaries } from "@/lib/i18n";
import type { RubricCriterion, Verdict } from "@/lib/types";

const t = dictionaries.fr;

type Evaluation = {
  scores: Record<string, number>;
  totalScore: number;
  feedback: string;
  verdict: Verdict;
};

type Props = {
  evaluation: Evaluation;
  rubric: RubricCriterion[];
};

const VERDICT_COLORS: Record<Verdict, { border: string; bg: string; fg: string }> = {
  request_v2: { border: "#a855f7", bg: "#fae8ff", fg: "#86198f" },
  validate_v1: { border: "#16a34a", bg: "#dcfce7", fg: "#166534" },
  validate_v2: { border: "#16a34a", bg: "#dcfce7", fg: "#166534" },
  reject: { border: "#dc2626", bg: "#fee2e2", fg: "#991b1b" },
};

const VERDICT_LABELS: Record<Verdict, string> = {
  request_v2: t.feedback_verdict_request_v2,
  validate_v1: t.feedback_verdict_validate_v1,
  validate_v2: t.feedback_verdict_validate_v2,
  reject: t.feedback_verdict_reject,
};

export function SubmissionFeedbackCard({ evaluation, rubric }: Props) {
  const colors = VERDICT_COLORS[evaluation.verdict];

  return (
    <section
      style={{
        marginTop: 16,
        padding: "16px 18px",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: 8,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
          {t.feedback_card_title}
        </h2>
        <span
          style={{
            padding: "4px 10px",
            background: colors.bg,
            color: colors.fg,
            border: `1px solid ${colors.border}`,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
          aria-label={`${t.feedback_card_verdict}: ${VERDICT_LABELS[evaluation.verdict]}`}
        >
          {VERDICT_LABELS[evaluation.verdict]}
        </span>
      </header>

      <p style={{ margin: "0 0 12px", fontSize: 14, color: "#0f172a" }}>
        <strong>{t.feedback_card_total} :</strong> {evaluation.totalScore.toFixed(1)}
      </p>

      {rubric.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
            }}
          >
            {t.feedback_card_scores}
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              color: "#0f172a",
              listStyle: "disc",
            }}
          >
            {rubric.map((c) => {
              const value = evaluation.scores[c.key];
              const display =
                typeof value === "number" && !Number.isNaN(value) ? value : 0;
              return (
                <li key={c.key} style={{ marginBottom: 4 }}>
                  <strong>{c.label}</strong> : {display} / {c.max}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: 13,
            fontWeight: 600,
            color: "#475569",
          }}
        >
          {t.feedback_card_message}
        </h3>
        {evaluation.feedback && evaluation.feedback.trim().length > 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#0f172a",
              whiteSpace: "pre-wrap",
            }}
          >
            {evaluation.feedback}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>
            {t.feedback_card_no_feedback}
          </p>
        )}
      </div>
    </section>
  );
}
