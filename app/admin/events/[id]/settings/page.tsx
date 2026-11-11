// Phase 16 / JURY-09 + SETTINGS-04 — GM-gated event settings page.
// Mirrors app/admin/events/[id]/missions/page.tsx guard pattern exactly.
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminJuryGridEditor } from "@/components/admin-jury-grid-editor";
import { AdminEventSettingsEditor } from "@/components/admin-event-settings-editor";
import { getPitchCriteria } from "@/lib/pitch-criteria";
import { getEventSettings, DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";
import { DEMO_PITCH_CRITERIA } from "@/lib/pitch-criteria";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";

type EventRow = { id: string; name: string; slug: string };

export default async function AdminEventSettingsPage({
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

  const isDemo = !hasSupabaseEnv();

  const initialCriteria = isDemo
    ? DEMO_PITCH_CRITERIA
    : await getPitchCriteria(eventId);

  const settings = isDemo
    ? DEFAULT_EVENT_SETTINGS
    : await getEventSettings(eventId);

  // Fetch event name for breadcrumb
  let eventName = eventId;
  if (!isDemo) {
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
              Admin &rsaquo; Events &rsaquo; {eventName} &rsaquo; Reglages
            </p>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>
              Reglages de l&apos;event
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "var(--wf-muted)" }}>
              Grille jury et parametres de scoring pour cet event.
            </p>
          </div>
          <span className="wf-grow" />
          <Link href="/admin/events" className="eic-button">
            ← Retour aux events
          </Link>
        </header>

        {isDemo && (
          <div
            className="wf-pill is-amber"
            style={{
              padding: "10px 14px",
              fontSize: 12,
              marginBottom: 16,
              display: "inline-flex",
            }}
          >
            Editeur desactive en mode demo - connectez Supabase pour modifier les reglages.
          </div>
        )}

        <AdminJuryGridEditor
          eventId={eventId}
          initialCriteria={initialCriteria}
          demo={isDemo}
        />

        <AdminEventSettingsEditor
          eventId={eventId}
          settings={settings}
          demo={isDemo}
        />
      </main>
    </AppShell>
  );
}
