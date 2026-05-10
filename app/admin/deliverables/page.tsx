import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminDeliverablesTable } from "@/components/admin-deliverables-table";
import { getAdminDeliverables } from "@/lib/admin-deliverables";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";

const t = dictionaries.fr;

export default async function AdminDeliverablesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const rows = hasSupabaseEnv() ? await getAdminDeliverables() : [];

  return (
    <AppShell role="game_master" variant="staff">
      <main className="eic-admin-deliverables">
        <header className="eic-admin-deliverables__header">
          <div>
            <p className="eic-admin-deliverables__kicker">GAMEMASTER</p>
            <h1 className="eic-admin-deliverables__title-h1">
              {t.admin_deliverables_title}
            </h1>
            <p className="eic-admin-deliverables__subtitle">
              {t.admin_deliverables_subtitle}
            </p>
          </div>
          <Link
            className="eic-admin-deliverables__back"
            href="/admin"
          >
            ← {t.admin_deliverables_back}
          </Link>
        </header>

        {!hasSupabaseEnv() ? (
          <p className="eic-admin-deliverables__demo-banner">
            {t.admin_deliverables_demo_disabled}
          </p>
        ) : (
          <AdminDeliverablesTable rows={rows} />
        )}
      </main>
    </AppShell>
  );
}
