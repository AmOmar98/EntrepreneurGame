// Phase 2 / Plan 02 - Player journey page (refactored Phase 7 / Plan 07-01).
// Server component. Resolves the connected user, gates by role, fetches data,
// computes hero + level states, then delegates to <JourneyClient> for the
// interactive (drawer + hover) parts.
//
// PLR-01..PLR-04 + PLR-08: barre verticale + hero unique + drawer + en-revue.
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { JourneyClient } from "@/components/journey-client";
import { PlayerAnnouncementStrip } from "@/components/player-announcement-strip";
import { getAnnouncementsForPlayer } from "@/lib/announcements";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getJourneyData } from "@/lib/journey";
import {
  getLevelStates,
  getNextStep,
  getTotalEarnedXp,
  type LevelState,
} from "@/lib/journey-progression";
import type { LevelId } from "@/lib/types";

const t = dictionaries.fr;

export default async function JourneyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentRole();
  if (role && role !== "player") {
    redirect(pathForRole(role));
  }

  const data = await getJourneyData(user.id);

  if (data.empty || !data.player) {
    return (
      <AppShell role="player" variant="player">
        <main className="eic-journey">
          <div aria-hidden="true" className="eic-journey__bg" />
          <div className="eic-journey__main">
            <div style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
              <h1 className="eic-hero__title">{t.journey_title}</h1>
              <p className="eic-hero__subtitle">{t.journey_empty_account}</p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  // Compute level states from currentLevel (single source of truth: Player row).
  const levelStatesMap = getLevelStates(data.player.currentLevel);
  const levelStateEntries: [LevelId, LevelState][] = Array.from(
    levelStatesMap.entries(),
  );

  // Hero CTA: priority = a_rendre > feedback_received > submitted_v2.
  const next = getNextStep(data.missions);

  // Compose hero copy. Variants:
  //   - feedback_received -> "Voir le feedback"
  //   - a_rendre / draft / submitted_v2 -> "Reprendre la mission"
  //   - none -> null (NoNextStep state)
  const hero = next
    ? {
        levelId: next.mission.levelId,
        title:
          next.status === "feedback_received"
            ? t.journey_v2_hero_title_default
            : t.journey_v2_hero_title_default,
        titleEm: t.journey_v2_hero_title_em,
        subtitle: next.template.description || t.journey_v2_hero_subtitle_default,
        ctaHref: `/journey/deliverable/${next.template.id}`,
        ctaLabel:
          next.status === "feedback_received"
            ? t.journey_v2_hero_cta_view_feedback
            : t.journey_v2_hero_cta_resume,
        meta: {
          code: undefined as string | undefined,
          xp: next.template.maxScore,
          due: undefined as string | undefined,
        },
      }
    : null;

  const totalEarnedXp = getTotalEarnedXp(data.missions);

  // Phase 9 / GMR-09 — surface live GM announcements for this Player.
  const announcements = hasSupabaseEnv()
    ? await getAnnouncementsForPlayer(user.id, 5)
    : [];

  return (
    <AppShell role="player" variant="player">
      <PlayerAnnouncementStrip announcements={announcements} />
      <JourneyClient
        currentLevel={data.player.currentLevel}
        hero={hero}
        levelStateEntries={levelStateEntries}
        missions={data.missions}
        objectivesByLevel={{}}
        totalEarnedXp={totalEarnedXp}
      />
    </AppShell>
  );
}
