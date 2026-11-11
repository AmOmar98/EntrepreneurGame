import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  AdminAnnounceComposer,
  type ComposerLevel,
  type ComposerPlayer,
} from "@/components/admin-announce-composer";
import { AdminAnnouncementsList } from "@/components/admin-announcements-list";
import { getRecentAnnouncements } from "@/lib/announcements";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";
import { getLevels } from "@/lib/levels";

const t = dictionaries.fr;

async function loadComposerData(): Promise<{
  players: ComposerPlayer[];
  levels: ComposerLevel[];
  hasEvent: boolean;
}> {
  const levelsData = await getLevels();
  const levels: ComposerLevel[] = levelsData.map((l) => ({
    id: l.id,
    label: l.label,
  }));

  const supabase = await createClient();
  if (!supabase) return { players: [], levels, hasEvent: false };

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!eventRow) return { players: [], levels, hasEvent: false };
  const eventId = (eventRow as { id: string }).id;

  const { data: cohortRows } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  const cohortIds = ((cohortRows ?? []) as { id: string }[]).map((r) => r.id);
  if (cohortIds.length === 0) return { players: [], levels, hasEvent: true };

  const { data: playerRows } = await supabase
    .from("players")
    .select("id, name")
    .in("cohort_id", cohortIds)
    .order("name", { ascending: true });
  const players: ComposerPlayer[] = ((playerRows ?? []) as { id: string; name: string }[]).map(
    (p) => ({ id: p.id, name: p.name }),
  );

  return { players, levels, hasEvent: true };
}

export default async function AdminAnnouncePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const supaOk = hasSupabaseEnv();
  const composer = await loadComposerData();
  const announcements = supaOk ? await getRecentAnnouncements(20) : [];

  return (
    <AppShell role="game_master" variant="staff">
      <main className="eic-admin-announce">
        <header className="eic-admin-announce__header">
          <div>
            <p className="eic-admin-announce__kicker">RÉGIE</p>
            <h1 className="eic-admin-announce__title-h1">{t.admin_announce_title}</h1>
            <p className="eic-admin-announce__subtitle">{t.admin_announce_subtitle}</p>
          </div>
          <Link className="eic-admin-announce__back" href="/admin">
            ← {t.admin_announce_back}
          </Link>
        </header>

        {!supaOk ? (
          <p className="eic-admin-announce__demo-banner">
            {t.admin_announce_demo_disabled}
          </p>
        ) : !composer.hasEvent ? (
          <p className="eic-admin-announce__demo-banner">{t.admin_announce_no_event}</p>
        ) : (
          <section className="eic-admin-announce__layout">
            <AdminAnnounceComposer
              levels={composer.levels}
              players={composer.players}
            />
            <aside className="eic-admin-announce__history-aside">
              <h2 className="eic-admin-announce__history-h2">
                {t.admin_announce_history_title}
              </h2>
              <AdminAnnouncementsList announcements={announcements} />
            </aside>
          </section>
        )}
      </main>
    </AppShell>
  );
}
