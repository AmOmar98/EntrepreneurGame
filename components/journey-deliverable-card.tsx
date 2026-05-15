// Phase 7 / Plan 07-01 - Single deliverable card surfaced inside the drawer.
// Displays mission code (Mx.y), title, status pill, hint, reward XP +
// contextual action button mapped to the deliverable status.
//
// PLR-04: code mission + titre FR + status pill + reward XP + action button
// PLR-08: "En revue . X min . Mentor" hint for submitted_v1 status
//
// TODO v0.3: replace mocked mentor name "Mentor assigne" with the real
// mentor assignment. Phase 8 ships evaluation_comments but does NOT add a
// mentor_assignments table — assignment derived from latest evaluations.evaluator_id
// is possible but only AFTER first eval; pre-eval state has no signal.
// v0.3 should add a dedicated mentor_assignments table or surface evaluator_id
// as soon as a player+template has any evaluation row.
import Link from "next/link";
import { Pill, type PillProps } from "@/components/ui";
import type { JourneyDeliverable, JourneyMission } from "@/lib/journey";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Status = JourneyDeliverable["status"];

type StatusMeta = {
  label: string;
  tone: NonNullable<PillProps["tone"]>;
  actionLabel: string;
  actionVariant: "primary" | "ghost" | "amber";
  showAction: boolean;
};

const STATUS_META: Record<Status, StatusMeta> = {
  a_rendre: {
    label: t.journey_status_a_rendre,
    tone: "amber",
    actionLabel: t.journey_v2_action_submit,
    actionVariant: "primary",
    showAction: true,
  },
  draft: {
    label: t.journey_status_draft,
    tone: "default",
    actionLabel: t.journey_v2_action_submit,
    actionVariant: "primary",
    showAction: true,
  },
  submitted_v1: {
    label: t.journey_status_submitted_v1,
    tone: "blue",
    actionLabel: t.journey_v2_action_follow,
    actionVariant: "ghost",
    showAction: true,
  },
  feedback_received: {
    label: t.journey_status_feedback_received,
    tone: "amber",
    actionLabel: t.journey_v2_action_complete_v2,
    actionVariant: "amber",
    showAction: true,
  },
  submitted_v2: {
    label: t.journey_status_submitted_v2,
    tone: "blue",
    actionLabel: t.journey_v2_action_follow,
    actionVariant: "ghost",
    showAction: true,
  },
  validated: {
    label: t.journey_status_validated,
    tone: "green",
    actionLabel: t.journey_v2_action_view,
    actionVariant: "ghost",
    showAction: true,
  },
  rejected: {
    label: t.journey_status_rejected,
    tone: "rose",
    actionLabel: t.journey_v2_action_view,
    actionVariant: "ghost",
    showAction: true,
  },
};

export type JourneyDeliverableCardProps = {
  deliverable: JourneyDeliverable;
  mission: JourneyMission["mission"];
  // Mission code (Mx.y) - synthesized from level + ord. Provided by caller.
  missionCode: string;
};

function formatRewardXp(maxScore: number): string {
  return `+${maxScore} XP`;
}

// PLR-08 hint for in-review state. "Mentor assigne" is a Phase 7 placeholder.
function getHint(status: Status): string | null {
  if (status === "submitted_v1" || status === "submitted_v2") {
    return t.journey_v2_hint_in_review;
  }
  if (status === "feedback_received") {
    return t.journey_v2_hint_mentor_waiting_v2;
  }
  return null;
}

export function JourneyDeliverableCard({
  deliverable,
  missionCode,
}: JourneyDeliverableCardProps) {
  const { template, status, latestSubmissionId } = deliverable;
  const meta = STATUS_META[status];
  const cardClass = "eic-deliverable-card";
  const hint = getHint(status);

  // Action target: deliverable details page if we have a latest submission id
  // (review/follow), otherwise the submission page (a_rendre flow).
  const href =
    latestSubmissionId !== null
      ? `/journey/deliverable/${template.id}`
      : `/journey/deliverable/${template.id}`;

  const actionClassMap: Record<StatusMeta["actionVariant"], string> = {
    primary: "eic-deliverable-card__action is-primary",
    amber: "eic-deliverable-card__action is-amber",
    ghost: "eic-deliverable-card__action",
  };

  return (
    <article className={cardClass}>
      <header className="eic-deliverable-card__head">
        <span className="eic-deliverable-card__code">{missionCode}</span>
        <span className="eic-deliverable-card__grow" />
        <Pill tone={meta.tone}>{meta.label}</Pill>
      </header>
      <h3 className="eic-deliverable-card__title">
        {template.title}
        {template.isBonus ? (
          <>
            {" "}
            <Pill tone="amber">{t.deliverable_bonus_badge}</Pill>
          </>
        ) : null}
      </h3>
      {hint ? <p className="eic-deliverable-card__hint">{hint}</p> : null}
      <div className="eic-deliverable-card__meta">
        <span>{formatRewardXp(template.maxScore)}</span>
      </div>
      {meta.showAction ? (
        <div className="eic-deliverable-card__action-row">
          <Link
            aria-label={`${meta.actionLabel} - ${template.title}`}
            className={actionClassMap[meta.actionVariant]}
            href={href}
          >
            {meta.actionLabel}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
