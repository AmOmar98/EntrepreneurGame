import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminEventsTable } from "@/components/admin-events-table";
import { getAdminEvents } from "@/lib/admin-events";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";

const t = dictionaries.fr;

type OrgRow = { id: string; name: string };

export default async function AdminEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const rows = hasSupabaseEnv() ? await getAdminEvents() : [];

  // Fetch orgs for the create form select. Empty in demo mode.
  let orgs: OrgRow[] = [];
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name", { ascending: true });
      orgs = (data ?? []) as OrgRow[];
    }
  }

  return (
    <AppShell role="game_master" variant="staff">
      <main style={{ padding: "28px", maxWidth: 1280, margin: "0 auto" }}>
        <header
          className="wf-row"
          style={{
            padding: "18px 0",
            gap: 14,
            borderBottom: "1px solid var(--wf-line)",
            marginBottom: 24,
          }}
        >
          <div className="wf-stack" style={{ gap: 2 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--wf-muted)", margin: 0 }}>
              GAMEMASTER
            </p>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>
              Events du programme
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "var(--wf-muted)" }}>
              Creer, activer et cloner les events de votre organisation.
            </p>
          </div>
          <span className="wf-grow" />
          <Link href="/admin" className="eic-button">
            ← Retour au pilotage
          </Link>
        </header>

        {!hasSupabaseEnv() && (
          <div
            className="wf-pill is-amber"
            style={{
              padding: "10px 14px",
              fontSize: 12,
              marginBottom: 16,
              display: "inline-flex",
            }}
          >
            {t.admin_engine_demo_disabled}
          </div>
        )}

        <AdminEventsTable
          rows={rows}
          orgs={orgs}
          demo={!hasSupabaseEnv()}
        />
      </main>
    </AppShell>
  );
}
