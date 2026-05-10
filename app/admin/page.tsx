import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLiveToggle } from "@/components/admin-live-toggle";
import { AdminLiveView } from "@/components/admin-live-view";
import { AdminStatusBanner } from "@/components/admin-status-banner";
import { AppShell } from "@/components/app-shell";
import {
  getAdminLiveSnapshot,
  type AdminLiveSnapshot,
} from "@/lib/admin-live";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { computeHackStatus } from "@/lib/hack-status";
import { dictionaries } from "@/lib/i18n";
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

  return (
    <AppShell role={role ?? "game_master"} variant="staff">
      <main style={{ padding: 24, maxWidth: 1200 }}>
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
              {t.admin_title}
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{t.admin_subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <AdminLiveToggle liveMode={liveMode} />
            <Link
              href="/admin/players/import"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "#0f172a",
                color: "#fff",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              {t.admin_action_import}
            </Link>
            <a
              href="/admin/export/players.csv"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              {t.admin_action_export}
            </a>
          </div>
        </header>

        <AdminStatusBanner result={hackStatus} />

        {liveMode ? (
          <AdminLiveView snapshot={snapshot} hackStatus={hackStatus} />
        ) : (
          <StandardView rows={rows} counters={counters} />
        )}
      </main>
    </AppShell>
  );
}

function StandardView({
  rows,
  counters,
}: {
  rows: CohortRow[];
  counters: { totalSubmissions: number; pendingReview: number; validated: number; totalDeliverableSlots: number };
}) {
  return (
    <>
      {!hasSupabaseEnv() && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            background: "#fef3c7",
            color: "#78350f",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {t.admin_demo_disabled}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <CounterCard
          label={t.admin_count_submitted}
          value={`${counters.totalSubmissions} ${t.admin_count_total_label} ${counters.totalDeliverableSlots}`}
        />
        <CounterCard label={t.admin_count_pending} value={String(counters.pendingReview)} />
        <CounterCard label={t.admin_count_validated} value={String(counters.validated)} />
      </section>

      {rows.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>{t.admin_empty_cohort}</p>
      ) : (
        <CohortTable rows={rows} />
      )}
    </>
  );
}

function CounterCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "12px 14px",
        background: "#fff",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function CohortTable({ rows }: { rows: CohortRow[] }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left" }}>
            <th style={th}>{t.admin_col_team}</th>
            <th style={th}>{t.admin_col_level}</th>
            <th style={th}>{t.admin_col_score}</th>
            <th style={th}>{t.admin_col_status}</th>
            <th style={th}>{t.admin_col_next}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.player.id} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td style={td}>
                <Link
                  href={`/admin/players/${row.player.id}`}
                  style={{ color: "#0f172a", fontWeight: 500 }}
                >
                  {row.player.name}
                </Link>
              </td>
              <td style={td}>{row.levelLabel}</td>
              <td style={td}>{Number(row.player.scoreProject).toFixed(1)}</td>
              <td style={td}>
                <StatusBadge status={row.status} />
              </td>
              <td style={td}>{row.nextDeliverableTitle ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: CohortRow["status"] }) {
  const map = {
    en_avance: { bg: "#dcfce7", fg: "#166534", label: t.admin_status_en_avance },
    a_l_heure: { bg: "#e0e7ff", fg: "#3730a3", label: t.admin_status_a_l_heure },
    retard: { bg: "#fee2e2", fg: "#991b1b", label: t.admin_status_retard },
  } as const;
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {s.label}
    </span>
  );
}

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontWeight: 600,
  color: "#475569",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  color: "#0f172a",
};
