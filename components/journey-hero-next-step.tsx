// Phase 7 / Plan 07-01 - Hero "Prochaine etape" (PLR-03).
// ONE primary CTA visible (no secondary). Variant `compact` for mobile.
//
// Source: .planning/design-v2/project/player-screens.jsx HeroCTA.
// Style ownership: app/globals.css .eic-hero / .eic-hero__cta etc.
import Link from "next/link";
import { Pill } from "@/components/ui";
import { dictionaries } from "@/lib/i18n";
import { getLevelNumber, getShortLevelLabel } from "@/lib/journey-progression";
import type { LevelId } from "@/lib/types";

const t = dictionaries.fr;

export type JourneyHeroNextStepProps = {
  // Target level the CTA points at (drives kicker and CTA button).
  levelId: LevelId;
  // CTA destination (deliverable detail page or onClick handler).
  ctaHref: string;
  ctaLabel: string;
  // Title shown in Baskervville italic. Subtitle below in body sans.
  title: string;
  subtitle: string;
  // Optional meta line under the CTA: M-code, +XP, due time.
  meta?: {
    code?: string;
    xp?: number;
    due?: string;
  };
  // Compact variant for mobile (smaller paddings + sizes).
  compact?: boolean;
};

export function JourneyHeroNextStep({
  levelId,
  ctaHref,
  ctaLabel,
  title,
  subtitle,
  meta,
  compact = false,
}: JourneyHeroNextStepProps) {
  const number = getLevelNumber(levelId);
  const label = getShortLevelLabel(levelId);
  const kicker = `${t.journey_v2_kicker_prefix} ${number} - ${label.toUpperCase()}`;
  const className = compact ? "eic-hero eic-hero--compact" : "eic-hero";

  return (
    <section aria-label={t.journey_v2_hero_aria} className={className}>
      <Pill tone="blue">{kicker}</Pill>
      <div>
        <h1 className="eic-hero__title">{title}</h1>
        <p className="eic-hero__subtitle">{subtitle}</p>
      </div>
      <Link
        aria-label={ctaLabel}
        className="eic-hero__cta"
        href={ctaHref}
      >
        {ctaLabel}
        <span aria-hidden="true" className="eic-hero__arrow">
          {"→"}
        </span>
      </Link>
      {meta ? (
        <div aria-label={t.journey_v2_meta_aria} className="eic-hero__meta">
          {meta.code ? <span>{`◇ ${meta.code}`}</span> : null}
          {meta.code && (meta.xp !== undefined || meta.due) ? <span>·</span> : null}
          {meta.xp !== undefined ? <span>{`+${meta.xp} XP`}</span> : null}
          {meta.xp !== undefined && meta.due ? <span>·</span> : null}
          {meta.due ? <span>{`${t.journey_v2_due} ${meta.due}`}</span> : null}
        </div>
      ) : null}
      <Link className="eic-hero__help" href="/journey/help">
        {t.help_stuck_trigger}
      </Link>
    </section>
  );
}
