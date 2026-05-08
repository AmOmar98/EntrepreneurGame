import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { computeRanking } from "@/lib/results";
import { PublishButton } from "./publish-button";

const t = dictionaries.fr;

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

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export default async function ResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();

  // Demo mode banner.
  if (!hasSupabaseEnv()) {
    return (
      <AppShell role={role ?? "player"}>
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
      <AppShell role={role ?? "player"}>
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

  return (
    <AppShell role={role ?? "player"}>
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
            {isPublished ? (
              <p style={{ color: "#15803d", fontSize: 13, margin: "8px 0 0" }}>
                {t.results_published_at_label} {formatPublishedAt(ranking.publishedAt)}
              </p>
            ) : null}
          </div>
          {isGm ? (
            <PublishButton
              eventId={ranking.eventId}
              alreadyPublished={isPublished}
              dict={t}
            />
          ) : null}
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
                      {formatNumber(row.pitchAvg)}
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        {" "}
                        ({row.pitchJurorCount})
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>{formatNumber(row.scoreProject)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                      {formatNumber(row.combined)}
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
