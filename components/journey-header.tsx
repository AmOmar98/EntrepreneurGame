// Phase 2 / Plan 02 - Journey header card.
// Shows the connected Player's team name, current level label, and project score.
// Server component (no client interactivity).
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export function JourneyHeader({
  teamName,
  levelLabel,
  scoreProject,
}: {
  teamName: string;
  levelLabel: string;
  scoreProject: number;
}) {
  return (
    <section
      aria-label={t.journey_title}
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {t.journey_team}
      </p>
      <h1 style={{ margin: "4px 0 12px", fontSize: 24, fontWeight: 600, color: "#0f172a" }}>
        {teamName}
      </h1>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{t.journey_level}</p>
          <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 500, color: "#0f172a" }}>{levelLabel}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{t.journey_score_project}</p>
          <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 500, color: "#0f172a" }}>
            {Number(scoreProject).toFixed(0)}
          </p>
        </div>
      </div>
    </section>
  );
}
