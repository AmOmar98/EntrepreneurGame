"use client";
// Phase 7 / Plan 07-01 - Client wrapper for the /journey page.
// Owns the drawer + hover state and renders the 3-column layout
// (hero | track | tip). Receives serializable props from the server
// component (app/journey/page.tsx) and never fetches data itself.
import { useCallback, useState } from "react";
import { JourneyDrawer } from "@/components/journey-drawer";
import { JourneyHeroNextStep } from "@/components/journey-hero-next-step";
import { JourneyTrack } from "@/components/journey-track";
import { PixelMascotPlayer } from "@/components/pixel-mascot-player";
import { Button } from "@/components/ui";
import {
  useStagnationTrigger,
  useVerbatimCountTrigger,
} from "@/hooks/use-pixel-trigger";
import { dictionaries } from "@/lib/i18n";
import {
  getShortLevelLabel,
  type LevelState,
} from "@/lib/journey-progression";
import type { JourneyMission } from "@/lib/journey";
import type { LevelId } from "@/lib/types";

const t = dictionaries.fr;

export type JourneyClientProps = {
  currentLevel: LevelId;
  // Serialized as Array<[LevelId, LevelState]> for the boundary, then
  // rebuilt into a Map client-side. (Map is not serializable across
  // server -> client component boundary.)
  levelStateEntries: [LevelId, LevelState][];
  missions: JourneyMission[];
  // Pre-computed hero CTA content (server-rendered to keep the first
  // paint useful even before hydration).
  hero: {
    levelId: LevelId;
    title: string;
    titleEm: string;
    subtitle: string;
    ctaHref: string;
    ctaLabel: string;
    meta?: { code?: string; xp?: number; due?: string };
  } | null;
  // Total earned XP, surfaced in the bottom progress label.
  totalEarnedXp: number;
  // Optional objective text per level (mapped on the server).
  objectivesByLevel: Partial<Record<LevelId, string>>;
};

export function JourneyClient({
  currentLevel,
  levelStateEntries,
  missions,
  hero,
  totalEarnedXp,
  objectivesByLevel,
}: JourneyClientProps) {
  const [openLevel, setOpenLevel] = useState<LevelId | null>(null);
  const [hovered, setHovered] = useState<LevelId | null>(null);

  // T3-A5 (b) — Stagnation >15min sur /journey (mood inquiet).
  const stagnation = useStagnationTrigger();
  // T3-A5 (c) — Verbatim n°2 saisi (mood concentré). Câblage prêt, DORMANT
  // tant que M2.2 cartes_repetables n'existe pas (T3-IMPROVEMENTS section F).
  const verbatim = useVerbatimCountTrigger();

  const levelStates = new Map<LevelId, LevelState>(levelStateEntries);

  const handleLevelClick = useCallback((id: LevelId) => {
    setOpenLevel(id);
  }, []);

  const handleClose = useCallback(() => setOpenLevel(null), []);

  const hoveredState: LevelState | null = hovered
    ? levelStates.get(hovered) ?? null
    : null;
  const openState: LevelState | null = openLevel
    ? levelStates.get(openLevel) ?? null
    : null;

  return (
    <div className="eic-journey">
      <div aria-hidden="true" className="eic-journey__bg" />
      <div className="eic-journey__main">
        <div className="eic-journey__grid">
          <div className="eic-journey__hero-col">
            {hero ? (
              <JourneyHeroNextStep
                ctaHref={hero.ctaHref}
                ctaLabel={hero.ctaLabel}
                levelId={hero.levelId}
                meta={hero.meta}
                subtitle={hero.subtitle}
                title={hero.title}
              />
            ) : (
              <NoNextStep />
            )}
          </div>

          <div className="eic-journey__track-col">
            <JourneyTrack
              currentLevel={currentLevel}
              levelStates={levelStates}
              onLevelClick={handleLevelClick}
              onLevelHover={setHovered}
            />
          </div>

          <div className="eic-journey__tip-col">
            {hovered ? (
              <HoveredHint
                label={getShortLevelLabel(hovered)}
                state={hoveredState ?? "locked"}
              />
            ) : (
              <DefaultTip />
            )}
          </div>

          <div className="eic-journey__progress-label">
            {`${t.journey_v2_progress_label} . ${totalEarnedXp} XP`}
          </div>
        </div>
      </div>

      {openLevel && openState ? (
        <JourneyDrawer
          levelId={openLevel}
          missions={missions}
          objective={objectivesByLevel[openLevel] ?? null}
          onClose={handleClose}
          state={openState}
        />
      ) : null}
      {stagnation.triggered ? (
        <PixelMascotPlayer
          mood="inquiet"
          message={t.pixel_player_stagnation_quote}
          onDismiss={stagnation.dismiss}
        />
      ) : verbatim.triggered ? (
        <PixelMascotPlayer
          mood="concentre"
          message={t.pixel_player_verbatim_count_quote}
          onDismiss={verbatim.dismiss}
        />
      ) : null}
    </div>
  );
}

function DefaultTip() {
  return (
    <div className="eic-journey__tip">
      <p className="eic-journey__kicker">{t.journey_v2_tip_kicker}</p>
      <p className="eic-journey__tip-body">{t.journey_v2_tip_body}</p>
    </div>
  );
}

function HoveredHint({ label, state }: { label: string; state: LevelState }) {
  // Quick 260510-j2j (T3-B2): locked => warn-only amber copy (R2),
  // not the hard-stop t.journey_v2_drawer_locked text.
  const stateText =
    state === "current"
      ? t.journey_status_a_rendre
      : state === "done"
        ? t.journey_status_validated
        : t.journey_v2_locked_hint_amber;
  return (
    <div className="eic-journey__tip" style={{ opacity: 1 }}>
      <p className="eic-journey__kicker">{label}</p>
      <p
        className={
          state === "locked"
            ? "eic-journey__tip-body eic-locked-hint--amber"
            : "eic-journey__tip-body"
        }
      >
        {stateText}
      </p>
    </div>
  );
}

function NoNextStep() {
  return (
    <section className="eic-hero" aria-label={t.journey_v2_hero_aria}>
      <p className="eic-journey__kicker">{t.journey_v2_kicker_next}</p>
      <div>
        <h1 className="eic-hero__title">{t.journey_v2_no_next_step}</h1>
        <p className="eic-hero__subtitle">{t.journey_v2_no_next_step_subtitle}</p>
      </div>
      <Button variant="ghost">{t.journey_v2_no_next_step_cta}</Button>
    </section>
  );
}
