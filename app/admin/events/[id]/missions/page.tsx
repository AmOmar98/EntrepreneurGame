import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminMissionsEditor } from "@/components/admin-missions-editor";
import { getEventMissions } from "@/lib/admin-missions";
import { getLevels } from "@/lib/levels";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";

const t = dictionaries.fr;

type EventRow = { id: string; name: string; slug: string };
type TemplateRef = { id: string; title: string; missionId: string };

export default async function AdminMissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const missions = hasSupabaseEnv() ? await getEventMissions(eventId) : [];
  const levels = hasSupabaseEnv() ? await getLevels() : [];

  // Fetch event name for breadcrumb + all templates in this event for soft_recommends_before select
  let eventName = eventId;
  const allTemplates: TemplateRef[] = [];

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    if (supabase) {
      const { data: eventRow } = await supabase
        .from("events")
        .select("id, name, slug")
        .eq("id", eventId)
        .maybeSingle();
      if (eventRow) {
        eventName = (eventRow as EventRow).name;
      }

      // Collect all templates across all missions in this event for the
      // soft_recommends_before select (advisory only)
      if (missions.length > 0) {
        for (const m of missions) {
          for (const tpl of m.templates) {
            allTemplates.push({ id: tpl.id, title: tpl.title, missionId: m.id });
          }
        }
      }
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
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--wf-muted)",
                margin: 0,
              }}
            >
              Admin &rsaquo; Events &rsaquo; {eventName}
            </p>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>
              Missions
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "var(--wf-muted)" }}>
              Creer, editer, reordonner les missions et leurs livrables.
            </p>
          </div>
          <span className="wf-grow" />
          <Link href="/admin/events" className="eic-button">
            ← Retour aux events
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

        <AdminMissionsEditor
          eventId={eventId}
          missions={missions}
          levels={levels}
          allTemplates={allTemplates}
          demo={!hasSupabaseEnv()}
        />
      </main>
    </AppShell>
  );
}
