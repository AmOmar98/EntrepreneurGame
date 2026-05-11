// Phase 2 / Plan 02 - Player journey page (refactored Phase 7 / Plan 07-01).
// Server component. Resolves the connected user, gates by role, fetches data,
// computes hero + level states, then delegates to <JourneyClient> for the
// interactive (drawer + hover) parts.
//
// PLR-01..PLR-04 + PLR-08: barre verticale + hero unique + drawer + en-revue.
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CohortPulse } from "@/components/cohort-pulse";
import { JourneyClient } from "@/components/journey-client";
import { PlayerAnnouncementStrip } from "@/components/player-announcement-strip";
import { getAnnouncementsForPlayer } from "@/lib/announcements";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { getCohortPulse } from "@/lib/cohort-pulse";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getJourneyData } from "@/lib/journey";
import { WELCOME_GUIDE_URL } from "@/lib/template-links";
import {
  getLevelStates,
  getNextStep,
  getTotalEarnedXp,
  type LevelState,
} from "@/lib/journey-progression";
import type { LevelId } from "@/lib/types";

const t = dictionaries.fr;

export default async function JourneyPage() {
  // Phase 11 / C2 — Dual-mode demo guard fix. Auth gating is delegated to
  // middleware.ts in Supabase mode ; in demo mode (no Supabase env), we
  // skip getCurrentUser entirely and let the seed fallback render.
  // Ref: CLAUDE.md Pre-edit guards #3 + memory feedback_dual_mode_demo_guard.md.
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (hasSupabaseEnv() && !user) {
    redirect("/login");
  }

  const role = hasSupabaseEnv() ? await getCurrentRole() : null;
  if (role && role !== "player") {
    redirect(pathForRole(role));
  }

  // In demo mode user is null ; getJourneyData short-circuits to EMPTY when
  // createClient() returns null, so the userId arg is never read in that path.
  const data = await getJourneyData(user?.id ?? "");

  // Quick 260510-k1f / B1 - cohort pulse (anonymised, R1).
  // Computed even when data.empty so a non-onboarded Player still sees the
  // collective dynamic (motivation pre-onboarding). Helper returns safe
  // entries (count=0/total=0) on any error or unresolved cohort.
  // Phase 11 / C2 — getCohortPulse short-circuits to demo seed when supabase
  // unavailable, so empty userId in demo mode is safe.
  const cohortPulse = await getCohortPulse(user?.id ?? "");

  if (data.empty || !data.player) {
    return (
      <AppShell role="player" variant="player">
        <main className="eic-journey">
          <div aria-hidden="true" className="eic-journey__bg" />
          <div className="eic-journey__main">
            <CohortPulse entries={cohortPulse} />
            <div style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
              <h1 className="eic-hero__title">{t.journey_title}</h1>
              <p className="eic-hero__subtitle">{t.journey_empty_account}</p>
              <WelcomeGuideStrip />
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
        subtitle: next.template.description?.split("\n\n")[0] || t.journey_v2_hero_subtitle_default,
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
  // C2: only fetch when authenticated (user defined). Demo mode skips this.
  const announcements =
    hasSupabaseEnv() && user
      ? await getAnnouncementsForPlayer(user.id, 5)
      : [];

  // T3X-EXPANSION wave 3 / plan 12-10 — Bonus rail entry types (D-02 / D-03).
  // Static list of optional bonus claim routes. R3 : optionnel, pas de blocage.
  const bonusEntries: { type: "bonus_verbatims_terrain" | "bonus_dev_plan" | "bonus_prototype_draft"; label: string }[] = [
    { type: "bonus_verbatims_terrain", label: t.bonus_card_verbatims_terrain },
    { type: "bonus_dev_plan", label: t.bonus_card_dev_plan },
    { type: "bonus_prototype_draft", label: t.bonus_card_prototype_draft },
  ];

  return (
    <AppShell role="player" variant="player">
      <PlayerAnnouncementStrip announcements={announcements} />
      <WelcomeGuideStrip />
      <CohortPulse entries={cohortPulse} />
      <JourneyClient
        currentLevel={data.player.currentLevel}
        hero={hero}
        levelStateEntries={levelStateEntries}
        missions={data.missions}
        objectivesByLevel={{}}
        totalEarnedXp={totalEarnedXp}
      />
      {/* T3X-EXPANSION wave 3 / plan 12-10 — Bonus rail (D-02 / D-03). R3 : optionnel. */}
      <section className="eic-bonus-rail">
        <h2 className="eic-bonus-rail__title">
          {t.bonus_section_title}
          <span className="eic-bonus-rail__kicker">BONUS</span>
        </h2>
        <p className="eic-bonus-rail__subtitle">
          {t.bonus_section_subtitle}
        </p>
        <ul className="eic-bonus-rail__list">
          {bonusEntries.map((entry) => (
            <li key={entry.type}>
              <a
                href={`/journey/bonus/${entry.type}`}
                className="eic-bonus-card"
              >
                {entry.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

// Bandeau discret pointant vers le Welcome Guide AgreenTech sur OneDrive UEMF.
// Visible une fois en haut du parcours porteur (branche non-empty) et juste
// sous le titre de bienvenue (branche empty). Lien externe nouvel onglet.
function WelcomeGuideStrip() {
  return (
    <div
      style={{
        maxWidth: 960,
        margin: "12px auto 0",
        padding: "10px 16px",
        background: "#f1f5f9",
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        color: "#0f172a",
      }}
    >
      <span>
        <strong>Welcome Guide AgreenTech</strong> &mdash; brief porteur, regles du
        bootcamp, checklist 13-14 mai.
      </span>
      <a
        href={WELCOME_GUIDE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          background: "#1B3A5C",
          color: "#ffffff",
          textDecoration: "none",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        Ouvrir le guide
      </a>
    </div>
  );
}
