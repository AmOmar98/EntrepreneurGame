import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getJuryOverview } from "@/lib/jury";
import { JuryForm } from "./jury-form";

const t = dictionaries.fr;

export default async function JuryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "mentor" && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const { eventId, rows } = hasSupabaseEnv()
    ? await getJuryOverview()
    : { eventId: null, rows: [] };

  return (
    <AppShell role={role ?? "mentor"} variant="staff">
      <main style={{ padding: 24, maxWidth: 1100 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
          {t.jury_title}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>{t.jury_subtitle}</p>
        <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 16px" }}>{t.jury_each_max_20}</p>
        {!hasSupabaseEnv() ? (
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.jury_demo_disabled}</p>
        ) : rows.length === 0 || !eventId ? (
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.jury_empty}</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {rows.map((row) => (
              <article
                key={row.player.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <header style={{ marginBottom: 12 }}>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      margin: "0 0 4px",
                      color: "#0f172a",
                    }}
                  >
                    {row.player.name}
                  </h2>
                  {row.player.idea ? (
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{row.player.idea}</p>
                  ) : null}
                  {row.existing ? (
                    <p style={{ color: "#0ea5e9", fontSize: 12, margin: "4px 0 0" }}>
                      {t.jury_already_scored}
                    </p>
                  ) : null}
                </header>
                <JuryForm
                  player={row.player}
                  existing={row.existing}
                  eventId={eventId}
                  dict={t}
                />
              </article>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
