import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResultsReplay } from "@/components/results-replay";
import type { ReplayStats } from "@/components/results-stats-strip";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { computeRanking } from "@/lib/results";
import { createClient } from "@/utils/supabase/server";
import { PublishButton } from "./publish-button";

const t = dictionaries.fr;

async function loadReplayStats(): Promise<ReplayStats> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      teams: 0,
      submissions: 0,
      totalScoreProject: 0,
      mentors: 0,
      jurors: 0,
    };
  }

  // Resolve current event.
  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const eventId = (eventRow as { id?: string } | null)?.id ?? null;

  // Teams (count of players in cohorts of this event).
  let teams = 0;
  let totalScoreProject = 0;
  if (eventId) {
    const { data: cohortRows } = await supabase
      .from("cohorts")
      .select("id")
      .eq("event_id", eventId);
    const cohortIds = ((cohortRows ?? []) as { id: string }[]).map((r) => r.id);
    if (cohortIds.length > 0) {
      const { data: playerRows } = await supabase
        .from("players")
        .select("id, score_project")
        .in("cohort_id", cohortIds);
      const players = (playerRows ?? []) as {
        id: string;
        score_project: number | string;
      }[];
      teams = players.length;
      totalScoreProject = players.reduce((acc, p) => {
        const sp = typeof p.score_project === "string" ? Number(p.score_project) : p.score_project;
        return acc + (Number.isFinite(sp) ? sp : 0);
      }, 0);
    }
  }

  // Submissions (count, all statuses).
  const { count: submissionsCount } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true });

  // Mentor + GM counts (via profiles).
  const { count: mentorsCount } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("app_role", "mentor");

  // Jurors = distinct juror_id in pitch_scores for this event.
  let jurors = 0;
  if (eventId) {
    const { data: jurorRows } = await supabase
      .from("pitch_scores")
      .select("juror_id")
      .eq("event_id", eventId);
    const set = new Set<string>();
    for (const r of (jurorRows ?? []) as { juror_id: string }[]) set.add(r.juror_id);
    jurors = set.size;
  }

  return {
    teams,
    submissions: submissionsCount ?? 0,
    totalScoreProject: Math.round(totalScoreProject),
    mentors: mentorsCount ?? 0,
    jurors,
  };
}

export default async function ResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();

  // Demo mode banner.
  if (!hasSupabaseEnv()) {
    return (
      <AppShell role={role ?? "game_master"} variant="staff">
        <main style={{ padding: 24, maxWidth: 1100 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
            {t.results_title}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.results_demo_disabled}</p>
        </main>
      </AppShell>
    );
  }

  const ranking = await computeRanking();
  const isPublished = ranking.publishedAt !== null;
  const isGm = role === "game_master";

  // Gate: non-GM users see "results coming" until publication.
  if (!isGm && !isPublished) {
    return (
      <AppShell role={role ?? "game_master"} variant="staff">
        <main style={{ padding: 24, maxWidth: 700 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
            {t.results_pending_title}
          </h1>
          <p style={{ color: "#475569", fontSize: 14, margin: "12px 0 0" }}>
            {t.results_pending_body}
          </p>
        </main>
      </AppShell>
    );
  }

  // Design v2 (polish/design-v2-match V6): after publication, the full
  // ranking stays internal to the EIC committee (GM-only). Non-GM users
  // (founders, jurors, mentors) see a thank-you announcement screen — the
  // top 3 will be revealed live during the closing ceremony via the GM
  // ceremony screen (V8).
  if (isPublished && !isGm) {
    return (
      <AppShell role={role ?? "player"} variant="staff">
        <main
          style={{
            padding: "64px 24px",
            maxWidth: 720,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-heading, Baskervville, serif)",
              fontSize: 36,
              fontWeight: 600,
              margin: "0 0 16px",
              color: "var(--wf-ink)",
              lineHeight: 1.15,
            }}
          >
            {t.results_announce_title}
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--wf-ink-soft)",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {t.results_announce_body}
          </p>
        </main>
      </AppShell>
    );
  }

  // Phase 9 / GMR-05 — once results are published, render the editorial
  // replay view (hero, podium, stats, ranking, timeline, exports).
  // GM-only branch (non-GM caught by the !isGm guard above).
  if (isPublished) {
    const stats = await loadReplayStats();
    return (
      <AppShell role={role ?? "game_master"} variant="staff">
        <main className="eic-results-replay-shell">
          {isGm ? (
            <div
              className="eic-results-replay-shell__gm-bar"
              style={{ display: "flex", gap: 12, alignItems: "center" }}
            >
              <PublishButton
                eventId={ranking.eventId}
                alreadyPublished={isPublished}
                dict={t}
              />
              {/* V8 — GM-only ceremony reveal screen launcher. */}
              <Link
                href="/results/ceremony"
                className="wf-btn is-success"
                style={{ padding: "10px 18px", fontSize: 13 }}
              >
                {t.results_ceremony_enter}
              </Link>
            </div>
          ) : null}
          <ResultsReplay
            isGameMaster={isGm}
            publishedAt={ranking.publishedAt}
            rows={ranking.rows}
            stats={stats}
          />
        </main>
      </AppShell>
    );
  }

  // GameMaster, results not yet published — keep the legacy preview table so
  // they can sanity-check the data before publication.
  return (
    <AppShell role={role ?? "game_master"} variant="staff">
      <main style={{ padding: 24, maxWidth: 1100 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
              {t.results_title}
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{t.results_subtitle}</p>
          </div>
          <PublishButton
            eventId={ranking.eventId}
            alreadyPublished={isPublished}
            dict={t}
          />
        </header>

        {ranking.rows.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.results_empty}</p>
        ) : (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>
                    {t.results_col_rank}
                  </th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>
                    {t.results_col_team}
                  </th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>
                    {t.results_col_pitch}
                  </th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>
                    {t.results_col_project}
                  </th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>
                    {t.results_col_combined}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.rows.map((row) => (
                  <tr
                    key={row.player.id}
                    style={{ borderTop: "1px solid #e2e8f0", color: "#0f172a" }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.rank}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 500 }}>{row.player.name}</div>
                      {row.player.idea ? (
                        <div style={{ color: "#64748b", fontSize: 12 }}>{row.player.idea}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {row.pitchAvg.toFixed(1)}
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        {" "}
                        ({row.pitchJurorCount})
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>{row.scoreProject.toFixed(1)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                      {row.combined.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AppShell>
  );
}
