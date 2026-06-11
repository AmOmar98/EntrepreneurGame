import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminLevelsEditor, SimulateDatePanel } from "@/components/admin-levels-editor";
import { getAdminLevels } from "@/lib/admin-levels";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { getSimulateDateDisplay } from "@/lib/get-simulated-now";
import { hasSupabaseEnv } from "@/lib/supabase-status";

const t = dictionaries.fr;

export default async function AdminLevelsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const levels = hasSupabaseEnv() ? await getAdminLevels() : [];
  const simulateDate = await getSimulateDateDisplay();

  return (
    <AppShell role="game_master" variant="staff">
      <main style={{ padding: 28, maxWidth: 1280, margin: "0 auto" }}>
        <header
          className="wf-row"
          style={{
            padding: "18px 0",
            gap: 14,
            borderBottom: "1px solid var(--wf-line)",
            marginBottom: 24,
          }}
        >
          <div className="wf-stack" style={{ gap: 4 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--wf-muted)" }}>
              GAMEMASTER
            </p>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "#0f172a" }}>
              Niveaux du programme
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--wf-muted)" }}>
              Definissez et ordonnez les niveaux du programme (L0, L1, L2...).
            </p>
          </div>
          <span className="wf-grow" />
          <Link
            href="/admin"
            style={{ fontSize: 13, color: "#1d4ed8", textDecoration: "none", alignSelf: "center" }}
          >
            ← Retour au pilotage
          </Link>
        </header>

        {simulateDate ? (
          <div
            className="wf-pill is-amber"
            style={{ padding: "10px 14px", fontSize: 12, marginBottom: 16, display: "inline-flex" }}
          >
            {t.admin_engine_simulate_date_active.replace("[date]", simulateDate)}
          </div>
        ) : null}

        {hasSupabaseEnv() ? (
          <SimulateDatePanel currentDate={simulateDate} />
        ) : null}

        {!hasSupabaseEnv() ? (
          <div
            className="wf-pill is-amber"
            style={{ padding: "10px 14px", fontSize: 12, marginBottom: 16, width: "auto", display: "inline-flex" }}
          >
            {t.admin_engine_demo_disabled}
          </div>
        ) : (
          <AdminLevelsEditor levels={levels} />
        )}
      </main>
    </AppShell>
  );
}
