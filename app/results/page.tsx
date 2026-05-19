import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResultsReplay } from "@/components/results-replay";
import type { ReplayStats } from "@/components/results-stats-strip";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { computeRanking } from "@/lib/results";
import { getCurrentPitchModeState } from "@/lib/pitch-mode";
import { isCurrentUserJuror } from "@/lib/jurors";
import { createClient } from "@/utils/supabase/server";
import { PublishButton } from "./publish-button";

const t = dictionaries.fr;

// ============================================================================
// loadReplayStats — KPI rollup for the editorial hero + stats strip.
// ============================================================================
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

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const eventId = (eventRow as { id?: string } | null)?.id ?? null;

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

  const { count: submissionsCount } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true });

  const { count: mentorsCount } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("app_role", "mentor");

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

// ============================================================================
// Page — branch matrix (quick-260519-jpr W2 spec §3 + §5.5)
//   A. Demo (no Supabase env)                  → demo banner
//   B. Non-GM + non-juror + non-published      → editorial "thank you" hero
//   C. Non-GM + juror + state==='closed'        → juror sees aggregated ranking
//   D. Non-GM + juror + published               → juror sees full ranking
//   E. GM + non-published                       → preview table + missing votes
//   F. GM + published                           → ResultsReplay (full narrative)
// R1 cardinal preserved: branches B (non-GM non-juror, both pre and post
// publication) NEVER expose any number to Player/Mentor non-juror.
// ============================================================================
export default async function ResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  const isGm = role === "game_master";

  // --- A. Demo mode ----------------------------------------------------------
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

  // Wave 1 pitch-mode + juror context (Agent #3 lib).
  const pitchMode = await getCurrentPitchModeState();
  const isJuror = await isCurrentUserJuror(pitchMode.eventId);
  const isPublished = pitchMode.publishedAt !== null;

  // computeRanking extended signature (Agent #3 wave 2). Falls back to legacy
  // single-arg signature if Agent #3 drift not yet landed.
  const ranking = await computeRanking({
    requesterRole: role,
    isJuror,
  } as Parameters<typeof computeRanking>[0]);

  // --- B. Non-GM + non-juror + non-published → editorial "thank you" ---------
  if (!isGm && !isJuror && !isPublished) {
    return <ThankYouScreen role={role} />;
  }

  // --- B'. Non-GM + non-juror + published → still no numbers (R1 cardinal) ---
  // Player/Mentor non-juror never see ranking — top 3 revealed live by GM
  // ceremony screen.
  if (!isGm && !isJuror && isPublished) {
    return <ThankYouScreen role={role} />;
  }

  // --- C. Non-GM + juror + state==='closed' (not yet published) --------------
  if (!isGm && isJuror && !isPublished && pitchMode.state === "closed") {
    const stats = await loadReplayStats();
    return (
      <AppShell role={role ?? "player"} variant="staff">
        <main className="eic-results-replay-shell">
          <ResultsReplay
            isGameMaster={false}
            isJuror={true}
            publishedAt={null}
            rows={ranking.rows}
            stats={stats}
            jurorIntroKey="closed"
          />
        </main>
      </AppShell>
    );
  }

  // --- C'. Non-GM + juror + state !== closed + not published → waiting -------
  if (!isGm && isJuror && !isPublished) {
    return (
      <AppShell role={role ?? "player"} variant="staff">
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

  // --- D. Non-GM + juror + published → full ranking (juror view) -------------
  if (!isGm && isJuror && isPublished) {
    const stats = await loadReplayStats();
    return (
      <AppShell role={role ?? "player"} variant="staff">
        <main className="eic-results-replay-shell">
          <ResultsReplay
            isGameMaster={false}
            isJuror={true}
            publishedAt={pitchMode.publishedAt}
            rows={ranking.rows}
            stats={stats}
            jurorIntroKey="published"
          />
        </main>
      </AppShell>
    );
  }

  // --- F. GM + published → ResultsReplay full narrative ----------------------
  if (isGm && isPublished) {
    const stats = await loadReplayStats();
    return (
      <AppShell role={role ?? "game_master"} variant="staff">
        <main className="eic-results-replay-shell">
          <div
            className="eic-results-replay-shell__gm-bar"
            style={{ display: "flex", gap: 12, alignItems: "center" }}
          >
            <PublishButton
              eventId={ranking.eventId}
              alreadyPublished={isPublished}
              dict={t}
            />
            <Link
              href="/results/ceremony"
              className="wf-btn is-success"
              style={{ padding: "10px 18px", fontSize: 13 }}
            >
              {t.results_ceremony_enter}
            </Link>
          </div>
          <ResultsReplay
            isGameMaster={true}
            isJuror={isJuror}
            publishedAt={pitchMode.publishedAt}
            rows={ranking.rows}
            stats={stats}
          />
        </main>
      </AppShell>
    );
  }

  // --- E. GM + not published → preview table + missing-vote banner ----------
  const missingPitchPlayers = ranking.rows
    .filter((r) => r.pitchJurorCount === 0)
    .map((r) => r.player.name);
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

        {missingPitchPlayers.length > 0 ? (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ display: "block", marginBottom: 4 }}>
              {missingPitchPlayers.length} porteur
              {missingPitchPlayers.length > 1 ? "s" : ""} sans note jury
            </strong>
            <span>
              {missingPitchPlayers.slice(0, 6).join(", ")}
              {missingPitchPlayers.length > 6 ? "…" : ""}. Verifiez que les
              jures ont vote avant de publier — la publication sera bloquee
              sinon.
            </span>
          </div>
        ) : null}

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

// ============================================================================
// ThankYouScreen — editorial hero shown to Player/Mentor non-juror.
// R1 cardinal: ZERO numbers (no score, no rank, no count). Sparkle animation
// via CSS class on the hero kicker (defined in globals.css).
// ============================================================================
function ThankYouScreen({ role }: { role: ReturnType<typeof getCurrentRole> extends Promise<infer R> ? R : never }) {
  return (
    <AppShell role={role ?? "player"} variant="staff">
      <main className="eic-results-thanks">
        <div className="eic-results-thanks__inner">
          <p className="eic-results-thanks__sparkle" aria-hidden="true">✦</p>
          <h1 className="eic-results-thanks__title">
            {t.results_announce_title}
          </h1>
          <p className="eic-results-thanks__body">
            {t.results_announce_body}
          </p>
        </div>
      </main>
    </AppShell>
  );
}
