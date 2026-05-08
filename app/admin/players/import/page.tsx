import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CsvImportForm } from "@/components/csv-import-form";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";

const t = dictionaries.fr;
const DEFAULT_COHORT_SLUG = "hack-days-mai-2026";

export default async function AdminPlayersImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  return (
    <AppShell role={role ?? "game_master"}>
      <main style={{ padding: 24, maxWidth: 900 }}>
        <header style={{ marginBottom: 16 }}>
          <Link
            href="/admin"
            style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}
          >
            {"<- "}
            {t.import_back}
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "8px 0 4px", color: "#0f172a" }}>
            {t.import_title}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{t.import_subtitle}</p>
        </header>

        {!hasSupabaseEnv() ? (
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
            {t.import_demo_disabled}
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 6,
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {t.import_csv_header_help}
              <br />
              <code style={{ display: "inline-block", marginTop: 6, fontSize: 12 }}>
                team_name,project_name,project_pitch,leader_email,member_emails
              </code>
            </div>
            <CsvImportForm cohortSlug={DEFAULT_COHORT_SLUG} />
          </>
        )}
      </main>
    </AppShell>
  );
}
