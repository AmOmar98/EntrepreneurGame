import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { JuryPitchTheater } from "@/components/jury-pitch-theater";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getJuryOverview } from "@/lib/jury";
import { getCurrentPitchModeState } from "@/lib/pitch-mode";
import { isCurrentUserJuror } from "@/lib/jurors";
import { JuryForm } from "./jury-form";
import { JuryDialForm } from "./jury-dial-form";

const t = dictionaries.fr;

type SearchParams = {
  theater?: string;
  /** quick-260520-124 — "dial" toggles V3 molettes ; default = V1 sliders. */
  ui?: string;
};

export default async function JuryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "mentor" && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const { theater, ui } = await searchParams;
  const isTheater = theater === "1";
  // quick-260520-124 — V1 sliders default, V3 molettes via ?ui=dial.
  const variant: "slider" | "dial" = ui === "dial" ? "dial" : "slider";

  const { eventId, rows } = hasSupabaseEnv()
    ? await getJuryOverview()
    : { eventId: null, rows: [] };

  // quick-260519-jpr Wave 2 — pitch mode state + juror invitation gate.
  // GameMaster bypasses notInvited (always sees jury surface). Mentor invited
  // = juror = sees grid. Mentor non-invited = "not invited" full-screen.
  const { state: pitchModeState } = hasSupabaseEnv()
    ? await getCurrentPitchModeState()
    : { state: "off" as const };
  const isGameMaster = role === "game_master";
  const isJuror = hasSupabaseEnv()
    ? await isCurrentUserJuror(eventId)
    : false;
  const notInvited = hasSupabaseEnv() && !isGameMaster && !isJuror;

  // -----------------------------------------------------------------------
  // Not invited screen (quick-260519-jpr Wave 2) — mentor without juror row.
  // -----------------------------------------------------------------------
  if (notInvited) {
    return (
      <AppShell role={role ?? "mentor"} variant="staff">
        <main
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 16, color: "var(--wf-ink, #2a2a2a)", maxWidth: 420 }}>
            {t.jury_not_invited}
          </p>
          <Link className="eic-button eic-button--primary" href="/">
            Retour à l&apos;accueil
          </Link>
        </main>
      </AppShell>
    );
  }

  // -----------------------------------------------------------------------
  // Theater mode (GMR-04)
  // -----------------------------------------------------------------------
  if (isTheater) {
    return (
      <AppShell role={role ?? "mentor"} variant="staff">
        <main className="eic-jury-theater-shell">
          <header className="eic-jury-theater-shell__topbar">
            <h1 className="eic-jury-theater-shell__title">{t.jury_title}</h1>
            <Link className="eic-jury-theater-shell__toggle" href="/jury">
              {t.jury_pitch_theater_toggle_off}
            </Link>
          </header>
          {!hasSupabaseEnv() ? (
            <p className="eic-jury-theater-shell__demo">{t.jury_demo_disabled}</p>
          ) : !eventId || rows.length === 0 ? (
            <p className="eic-jury-theater-shell__empty">{t.jury_empty}</p>
          ) : (
            <JuryPitchTheater
              eventId={eventId}
              rows={rows}
              pitchModeState={pitchModeState}
            />
          )}
        </main>
      </AppShell>
    );
  }

  // -----------------------------------------------------------------------
  // Standard mode (Phase 5)
  // -----------------------------------------------------------------------
  return (
    <AppShell role={role ?? "mentor"} variant="staff">
      <main style={{ padding: 24, maxWidth: 1100 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
              {t.jury_title}
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 4px" }}>{t.jury_subtitle}</p>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>{t.jury_each_max_20}</p>
          </div>
          {/* JRY-04 a11y: was a plain <Link> styled as button without role/focus-ring.
              Now uses eic-button token class which includes focus-visible outline.
              quick-260520-124 — add discreet V1↔V3 UI toggle (eic-button standard,
              not --primary per advisor WARN_NOTES). */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              className="eic-button"
              href={`/jury?ui=${variant === "dial" ? "slider" : "dial"}`}
              aria-label={
                variant === "dial"
                  ? "Basculer en sliders"
                  : "Basculer en molettes"
              }
            >
              {variant === "dial" ? "Sliders" : "Molettes"}
            </Link>
            <Link
              className="eic-button eic-button--primary"
              href="/jury?theater=1"
            >
              {t.jury_pitch_theater_toggle_on}
            </Link>
          </div>
        </header>
        {!hasSupabaseEnv() ? (
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.jury_demo_disabled}</p>
        ) : rows.length === 0 || !eventId ? (
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.jury_empty}</p>
        ) : (
          <div className="eic-jury-grid">
            {rows.map((row) => (
              <article key={row.player.id} className="eic-jury-card">
                <header className="eic-jury-card__header">
                  <h2 className="eic-jury-card__name">{row.player.name}</h2>
                  {row.player.idea ? (
                    <p className="eic-jury-card__idea">{row.player.idea}</p>
                  ) : null}
                  {row.existing ? (
                    <p className="eic-jury-card__already-scored">{t.jury_already_scored}</p>
                  ) : null}
                </header>
                {variant === "dial" ? (
                  <JuryDialForm
                    aggregate={row.aggregate}
                    player={row.player}
                    existing={row.existing}
                    eventId={eventId}
                    dict={t}
                  />
                ) : (
                  <JuryForm
                    aggregate={row.aggregate}
                    player={row.player}
                    existing={row.existing}
                    eventId={eventId}
                    dict={t}
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
