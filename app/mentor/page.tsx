import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MentorPlayersTable } from "@/components/mentor-players-table";
import { MentorPendingFilter } from "@/components/mentor-pending-filter";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getMentorPlayersOverview } from "@/lib/mentor";
import { getPendingBonusEventsForMentor } from "@/lib/bonus";

const t = dictionaries.fr;

export default async function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "mentor" && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const { pending } = await searchParams;
  const onlyPending = pending === "1";

  const rows = hasSupabaseEnv() ? await getMentorPlayersOverview({ onlyPending }) : [];
  const pendingBonuses = hasSupabaseEnv() ? await getPendingBonusEventsForMentor() : [];

  return (
    <AppShell role={role ?? "mentor"} variant="staff">
      <main style={{ padding: 24, maxWidth: 1100 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
          {t.mentor_title}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>{t.mentor_subtitle}</p>
        <MentorPendingFilter active={onlyPending} />
        {!hasSupabaseEnv() ? (
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.mentor_demo_disabled}</p>
        ) : (
          <MentorPlayersTable rows={rows} />
        )}
        {hasSupabaseEnv() && pendingBonuses.length > 0 ? (
          <section style={{ marginTop: 32 }} aria-labelledby="mentor-pending-bonus-heading">
            <h2
              id="mentor-pending-bonus-heading"
              style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}
            >
              Bonus en attente de validation ({pendingBonuses.length})
            </h2>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 12px" }}>
              Claims des Players en attente de revue Mentor.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {pendingBonuses.map((b) => (
                <li
                  key={b.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <strong style={{ fontSize: 14, color: "#0f172a" }}>{b.title}</strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {b.playerName ?? b.playerSlug ?? b.projectId} · {b.type}
                    </span>
                  </div>
                  <Link
                    href={`/mentor/bonus/${b.id}`}
                    style={{
                      fontSize: 13,
                      color: "#1e40af",
                      textDecoration: "underline",
                    }}
                  >
                    Reviewer
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
