// Phase 2 / Plan 02 - Today's missions timeline.
// Renders the list of missions for the current day with a status badge
// (a_venir / en_cours / passe). Server component.
import { dictionaries } from "@/lib/i18n";
import type { JourneyMission, MissionStatus } from "@/lib/journey";

const t = dictionaries.fr;

const STATUS_LABEL: Record<MissionStatus, string> = {
  a_venir: t.journey_mission_a_venir,
  en_cours: t.journey_mission_en_cours,
  passe: t.journey_mission_passe,
};

const STATUS_STYLE: Record<MissionStatus, { bg: string; fg: string }> = {
  a_venir: { bg: "#e2e8f0", fg: "#475569" },
  en_cours: { bg: "#dcfce7", fg: "#15803d" },
  passe: { bg: "#cbd5e1", fg: "#334155" },
};

function formatTime(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function JourneyTimeline({ missions }: { missions: JourneyMission[] }) {
  return (
    <section style={{ marginBottom: 32 }} aria-label={t.journey_today_missions}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px", color: "#0f172a" }}>
        {t.journey_today_missions}
      </h2>
      {missions.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{t.journey_no_missions}</p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {missions.map(({ mission, status }) => {
            const palette = STATUS_STYLE[status];
            return (
              <li
                key={mission.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "#475569",
                    minWidth: 48,
                  }}
                >
                  {formatTime(mission.scheduledAt)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: palette.bg,
                    color: palette.fg,
                    letterSpacing: 0.4,
                  }}
                >
                  {STATUS_LABEL[status]}
                </span>
                <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>{mission.title}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
