// Phase 14 / W3 — Player-facing engagement milestones badges.
// Renders 3 qualitative status pills (Soumis ✓ / Lu par le mentor ✓ / Validé ✓)
// for 1 deliverable_template. STRICT R1 : NEVER renders a number, total,
// percentage, or comparison to other Players. The visual only ever shows
// the 3 booleans as icon + label.
//
// Audit (R1) :
//   grep -nE "100|25|50|175|toFixed|pts|points|score|rank|/[0-9]+"
//     components/engagement-milestones-badges.tsx
//     -> only inside this header guard comment.
//
// Consumed by app/journey/deliverable/[id]/page.tsx, placed above the
// proof / submission ticket / revision panel surfaces.
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type EngagementMilestonesBadgesProps = {
  milestones: {
    submitted: boolean;
    reviewed: boolean;
    validated: boolean;
  };
};

type BadgeKind = "submitted" | "reviewed" | "validated";

const ICON_DONE = "✓"; // ✓ - palier atteint
const ICON_PENDING = "•"; // • - palier en attente

function badgeClass(reached: boolean, kind: BadgeKind): string {
  const modifier = reached
    ? `eic-engagement-badge--${kind}-reached`
    : `eic-engagement-badge--${kind}-pending`;
  return `eic-engagement-badge eic-engagement-badge--${kind} ${modifier}`;
}

export function EngagementMilestonesBadges({
  milestones,
}: EngagementMilestonesBadgesProps) {
  const items: { kind: BadgeKind; reached: boolean; label: string }[] = [
    {
      kind: "submitted",
      reached: milestones.submitted,
      label: t.engagement_milestone_submitted,
    },
    {
      kind: "reviewed",
      reached: milestones.reviewed,
      label: t.engagement_milestone_reviewed,
    },
    {
      kind: "validated",
      reached: milestones.validated,
      label: t.engagement_milestone_validated,
    },
  ];

  return (
    <section
      aria-label={t.engagement_milestones_aria}
      className="eic-engagement-milestones"
    >
      <span className="eic-engagement-milestones__kicker">
        {t.engagement_milestones_kicker}
      </span>
      <ul className="eic-engagement-milestones__list" role="list">
        {items.map((item) => (
          <li className={badgeClass(item.reached, item.kind)} key={item.kind}>
            <span
              aria-hidden="true"
              className="eic-engagement-badge__icon"
            >
              {item.reached ? ICON_DONE : ICON_PENDING}
            </span>
            <span className="eic-engagement-badge__label">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
