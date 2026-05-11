import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { AdminLiveToggle } from "@/components/admin-live-toggle";
import { AdminLiveView } from "@/components/admin-live-view";
import { AdminStatusBanner } from "@/components/admin-status-banner";
import { AppShell } from "@/components/app-shell";
import { Kpi } from "@/components/wf/kpi";
import { TeamBar } from "@/components/wf/team-bar";
import {
  getAdminLiveSnapshot,
  type AdminLiveSnapshot,
} from "@/lib/admin-live";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { computeHackStatus } from "@/lib/hack-status";
import { dictionaries } from "@/lib/i18n";
import { levelOrd } from "@/lib/journey";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getCohortOverview, getGlobalCounters, type CohortRow } from "@/lib/admin";

const t = dictionaries.fr;

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ live?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const params = (await searchParams) ?? {};
  const liveMode = params.live === "1";

  const emptySnapshot: AdminLiveSnapshot = {
    teams: [],
    gameFlow: [],
    recentValidatedEvents: [],
  };

  const [rows, counters, snapshot] = hasSupabaseEnv()
    ? await Promise.all([
        getCohortOverview(),
        getGlobalCounters(),
        getAdminLiveSnapshot(),
      ])
    : [
        [] as CohortRow[],
        { totalSubmissions: 0, pendingReview: 0, validated: 0, totalDeliverableSlots: 0 },
        emptySnapshot,
      ];

  const hackStatus = computeHackStatus(
    snapshot.teams.map((team) => ({ state: team.state })),
    snapshot.recentValidatedEvents,
  );

  // Design v2 (polish/design-v2-match V5): pre-pitch leaderboard sorted by
  // scoreProject desc. GM-only surface — score visibility OK here.
  const leaderboard = [...rows].sort((a, b) => {
    const sa = Number(a.player.scoreProject) || 0;
    const sb = Number(b.player.scoreProject) || 0;
    return sb - sa;
  });

  return (
    <AppShell role={role ?? "game_master"} variant="staff">
      <main
        style={{
          padding: "0 0 24px",
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
          minHeight: "100%",
        }}
      >
        {/* Topbar */}
        <header
          className="wf-row"
          style={{
            padding: "18px 28px",
            gap: 14,
            borderBottom: "1px solid var(--wf-line)",
            background: "var(--wf-paper)",
          }}
        >
          <div className="wf-brand">
            <div className="wf-brand-mark">E</div>
            <div className="wf-stack" style={{ gap: 2 }}>
              <div className="wf-brand-name">{t.admin_title}</div>
              <div className="wf-brand-sub">EIC · UEMF · Régie AgreenTech</div>
            </div>
          </div>
          <span className="wf-grow" />
          <div className="wf-row" style={{ gap: 8, flexWrap: "wrap" }}>
            <span className="wf-pill is-blue" style={{ fontSize: 11 }}>
              ● {rows.length} équipes
            </span>
            <span className="wf-pill is-green" style={{ fontSize: 11 }}>
              ● {counters.validated} livrables validés
            </span>
            <AdminLiveToggle liveMode={liveMode} />
            <Link className="wf-btn" href="/admin/players/import">
              {t.admin_action_import}
            </Link>
            <a className="wf-btn is-primary" href="/admin/export/players.csv">
              <Download size={14} aria-hidden />
              {t.admin_action_export}
            </a>
          </div>
        </header>

        <div style={{ padding: "20px 28px" }}>
          <AdminStatusBanner result={hackStatus} />

          {liveMode ? (
            <AdminLiveView snapshot={snapshot} hackStatus={hackStatus} />
          ) : (
            <StandardView rows={rows} counters={counters} leaderboard={leaderboard} />
          )}
        </div>
      </main>
    </AppShell>
  );
}

function StandardView({
  rows,
  counters,
  leaderboard,
}: {
  rows: CohortRow[];
  counters: { totalSubmissions: number; pendingReview: number; validated: number; totalDeliverableSlots: number };
  leaderboard: CohortRow[];
}) {
  return (
    <>
      {!hasSupabaseEnv() && (
        <div
          className="wf-pill is-amber"
          style={{
            padding: "10px 14px",
            fontSize: 12,
            marginBottom: 16,
            width: "auto",
            display: "inline-flex",
          }}
        >
          {t.admin_demo_disabled}
        </div>
      )}

      {/* KPI grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Kpi
          label={t.admin_count_submitted}
          value={counters.totalSubmissions}
          foot={`/ ${counters.totalDeliverableSlots}`}
          accent="blue"
        />
        <Kpi
          label={t.admin_count_pending}
          value={counters.pendingReview}
          accent={counters.pendingReview > 0 ? "amber" : "blue"}
        />
        <Kpi
          label={t.admin_count_validated}
          value={counters.validated}
          accent="green"
        />
        <Kpi label="Équipes en jeu" value={rows.length} accent="blue" />
      </section>

      {/* Pre-pitch leaderboard */}
      {leaderboard.length === 0 ? (
        <p style={{ color: "var(--wf-ink-soft)", fontSize: 14 }}>{t.admin_empty_cohort}</p>
      ) : (
        <section className="wf-card" style={{ overflow: "hidden" }}>
          <header
            className="wf-row"
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--wf-line)",
              gap: 10,
              background: "var(--wf-paper-deep)",
            }}
          >
            <div className="wf-stack" style={{ gap: 2 }}>
              <div className="wf-kicker">Classement pré-pitch · interne EIC</div>
              <div className="wf-faint" style={{ fontSize: 11 }}>
                Trié par score projet décroissant — visible Régie / Admin seulement
              </div>
            </div>
          </header>
          <LeaderboardTable rows={leaderboard} />
        </section>
      )}
    </>
  );
}

function LeaderboardTable({ rows }: { rows: CohortRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--wf-paper)" }}>
            <th style={th}>#</th>
            <th style={th}>{t.admin_col_team}</th>
            <th style={{ ...th, width: 220 }}>Progression</th>
            <th style={th}>{t.admin_col_score}</th>
            <th style={th}>{t.admin_col_engagement}</th>
            <th style={th}>{t.admin_col_status}</th>
            <th style={th}>{t.admin_col_next}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const ord = levelOrd(row.player.currentLevel);
            return (
              <tr
                key={row.player.id}
                style={{ borderTop: "1px solid var(--wf-line)" }}
              >
                <td style={{ ...td, color: "var(--wf-ink-faint)", fontWeight: 600 }}>
                  {i + 1}
                </td>
                <td style={td}>
                  <Link
                    href={`/admin/players/${row.player.id}`}
                    style={{ color: "var(--wf-ink)", fontWeight: 500, textDecoration: "none" }}
                  >
                    {row.player.name}
                  </Link>
                  <div className="wf-faint" style={{ fontSize: 10, marginTop: 2 }}>
                    {row.levelLabel}
                  </div>
                </td>
                <td style={td}>
                  <TeamBar level={ord} levelDone={0} totalLevels={8} />
                </td>
                <td style={{ ...td, fontWeight: 600, color: "var(--wf-blue)" }}>
                  {Number(row.player.scoreProject).toFixed(1)}
                </td>
                {/* GM-only surface — engagement numeric OK (cf. R1 gate upstream) */}
                <td style={td}>{Number(row.player.scoreEngagement).toFixed(0)}</td>
                <td style={td}>
                  <StatusBadge status={row.status} />
                </td>
                <td style={{ ...td, color: "var(--wf-ink-soft)", fontSize: 12 }}>
                  {row.nextDeliverableTitle ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: CohortRow["status"] }) {
  const map = {
    en_avance: { cls: "wf-pill is-green", label: t.admin_status_en_avance },
    a_l_heure: { cls: "wf-pill is-blue", label: t.admin_status_a_l_heure },
    retard: { cls: "wf-pill is-rose", label: t.admin_status_retard },
  } as const;
  const s = map[status];
  return (
    <span className={s.cls} style={{ fontSize: 10 }}>
      {s.label}
    </span>
  );
}

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontWeight: 600,
  color: "var(--wf-ink-soft)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "12px 12px",
  color: "var(--wf-ink)",
  verticalAlign: "middle",
};
