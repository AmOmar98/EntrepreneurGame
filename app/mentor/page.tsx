import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MentorPlayersTable } from "@/components/mentor-players-table";
import { MentorPendingFilter } from "@/components/mentor-pending-filter";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getMentorPlayersOverview } from "@/lib/mentor";

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
      </main>
    </AppShell>
  );
}
