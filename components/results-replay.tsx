// Phase 9 / GMR-05 — Results replay editorial wrapper.
// Refreshed quick-260519-jpr W2 #5 : narrative sections matching mockup 2
// (hero éditorial / podium animé / stats 4 KPIs / classement collapsible /
// timeline zigzag / exports CTA). Now accepts isJuror + jurorIntroKey so
// the juror-only branches (C/D) share the same shell as the GM full view.
import { PartnerBanner } from "@/components/partner-banner";
import { ResultsPodium, type PodiumEntry } from "@/components/results-podium";
import {
  ResultsStatsStrip,
  type ReplayStats,
} from "@/components/results-stats-strip";
import { ResultsTimelineMoments } from "@/components/results-timeline-moments";
import { RevealOnView } from "@/components/reveal-on-view";
import { ResultsRankingCollapsible } from "@/components/results-ranking-collapsible";
import { dictionaries } from "@/lib/i18n";
import type { RankingRow } from "@/lib/results";
import type { CSSProperties } from "react";

const t = dictionaries.fr;

type Props = {
  rows: RankingRow[];
  stats: ReplayStats;
  publishedAt: string | null;
  isGameMaster: boolean;
  isJuror?: boolean;
  /** When set on juror-only views, drives the intro paragraph copy. */
  jurorIntroKey?: "closed" | "published";
};

function formatPublishedAt(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatStatsLine(stats: ReplayStats): string {
  return t.results_replay_hero_stats_template
    .replace("{teams}", String(stats.teams))
    .replace("{submissions}", String(stats.submissions))
    .replace("{jurors}", String(stats.jurors));
}

export function ResultsReplay({
  rows,
  stats,
  publishedAt,
  isGameMaster,
  isJuror = false,
  jurorIntroKey,
}: Props) {
  const podium: PodiumEntry[] = rows
    .filter((r) => r.rank <= 3)
    .map((r) => ({
      rank: r.rank as 1 | 2 | 3,
      teamName: r.player.name,
      combined: r.combined,
    }));

  const canSeeNumbers = isGameMaster || isJuror;
  const jurorIntro =
    jurorIntroKey === "closed"
      ? t.results_replay_juror_closed_intro
      : jurorIntroKey === "published"
        ? t.results_replay_juror_published_intro
        : null;

  return (
    <div className="eic-results-replay">
      {/* Hero éditorial — Baskervville, gros titre, sub stats dynamique */}
      <header className="eic-results-replay__hero">
        <PartnerBanner />
        <p className="eic-results-replay__hero-kicker">
          {t.results_replay_hero_kicker}
        </p>
        <h1 className="eic-results-replay__hero-title eic-results-replay__hero-title--editorial">
          {t.results_replay_hero_editorial_title}
        </h1>
        <p className="eic-results-replay__hero-dates">
          {t.results_replay_hero_editorial_dates}
        </p>
        {canSeeNumbers ? (
          <p className="eic-results-replay__hero-stats">{formatStatsLine(stats)}</p>
        ) : null}
        {publishedAt ? (
          <p className="eic-results-replay__hero-meta">
            {t.results_published_at_label} {formatPublishedAt(publishedAt)}
          </p>
        ) : null}
        {jurorIntro ? (
          <p className="eic-results-replay__juror-intro">{jurorIntro}</p>
        ) : null}
      </header>

      {/* Podium top 3 — animation staggered via CSS --reveal-delay */}
      {podium.length > 0 ? (
        <RevealOnView style={{ "--reveal-delay": "0ms" } as CSSProperties}>
          <ResultsPodium entries={podium} isGameMaster={canSeeNumbers} />
        </RevealOnView>
      ) : null}

      {/* Stats strip — 4 KPIs horizontaux (équipes / livrables / score moyen / jurys) */}
      <RevealOnView style={{ "--reveal-delay": "150ms" } as CSSProperties}>
        <ResultsStatsStrip stats={stats} />
      </RevealOnView>

      {/* Classement complet collapsible — visible GM + jurors */}
      {canSeeNumbers ? (
        <ResultsRankingCollapsible rows={rows} />
      ) : (
        <section
          aria-label={t.results_replay_ranking_announcement_title}
          className="eic-results-replay__ranking"
        >
          <h2 className="eic-results-replay__ranking-title">
            {t.results_replay_ranking_announcement_title}
          </h2>
          <p className="eic-results-replay__ranking-empty">
            {t.results_replay_ranking_hidden_player}
          </p>
        </section>
      )}

      {/* Timeline moments — zigzag gauche/droite */}
      <RevealOnView>
        <ResultsTimelineMoments />
      </RevealOnView>

      {/* Exports band — GM only (2 CTAs : CSV + Cérémonie) */}
      {isGameMaster ? (
        <footer className="eic-results-replay__exports">
          <h2 className="eic-results-replay__exports-title">
            {t.results_replay_exports_label}
          </h2>
          <div className="eic-results-replay__exports-row">
            <a
              className="eic-button eic-button--primary"
              href="/admin/export/players.csv"
            >
              {t.results_export_csv_label}
            </a>
            <a
              className="eic-button eic-button--ghost"
              href="/results/ceremony"
            >
              {t.results_ceremony_enter}
            </a>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
