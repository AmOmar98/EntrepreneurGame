import { Eye, EyeOff, Shuffle } from "lucide-react";
import { updateBootcampQuest } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { checkpointLabel } from "@/lib/data";
import { getBootcampByDay } from "@/lib/workflow-data";

export default async function AdminGamePage() {
  const { days, source } = await getBootcampByDay();

  return (
    <AppShell role="eic_admin">
      <PageHeader
        eyebrow="Game master"
        title="Control the bootcamp quests like a game board."
        description="Admins and coaches can activate, deactivate, or swap deliverables without changing the founder interface logic."
      />

      <section className="journey-board">
        {days.map((day) => (
          <div className="panel" key={day.day}>
            <div className="panel-header">
              <div>
                <h2>{day.label}</h2>
                <p className="muted">Bootcamp schedule converted from sessions and ateliers into playable quests.</p>
              </div>
              <Badge tone="blue">{day.items.filter((item) => item.isActive).length} active</Badge>
            </div>
            <div className="panel-body stack">
              {source === "demo" ? (
                <p className="muted">Demo quest data is active. Connect and seed Supabase to persist game-master changes.</p>
              ) : null}
              {day.items.map((quest) => (
                <article className="mission-card" key={quest.id}>
                  <form action={updateBootcampQuest} className="stack">
                    <input type="hidden" name="questId" value={quest.id} />
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <h3>{quest.start}-{quest.end} · {quest.title}</h3>
                        <p className="muted">{quest.gameMasterNote}</p>
                      </div>
                      <Badge tone={quest.isActive ? "green" : "red"}>{quest.isActive ? "active" : "inactive"}</Badge>
                    </div>
                    <div className="admin-form-grid">
                      <label className="form-row wide">
                        Quest title
                        <input className="input" name="title" defaultValue={quest.title} />
                      </label>
                      <label className="form-row wide">
                        Coach objective
                        <textarea className="textarea" name="objective" defaultValue={quest.objective} />
                      </label>
                      <label className="form-row wide">
                        Expected deliverable
                        <input className="input" name="expectedOutput" defaultValue={quest.expectedOutput} />
                      </label>
                      <label className="form-row">
                        XP
                        <input className="input" name="xp" type="number" min="0" max="500" defaultValue={quest.xp} />
                      </label>
                      <label className="form-row checkbox-row">
                        <input name="isActive" type="checkbox" defaultChecked={quest.isActive} />
                        Active for this cohort
                      </label>
                    </div>
                    <div className="mission-meta">
                      <Badge tone="blue">{checkpointLabel(quest.checkpoint)}</Badge>
                      <Badge tone="gold">{quest.stage.replace("_", " ")}</Badge>
                      <Badge tone={quest.isRequired ? "green" : "blue"}>{quest.isRequired ? "required" : "optional"}</Badge>
                    </div>
                    <div className="toolbar">
                      <button className="button primary" type="submit">
                        <Shuffle aria-hidden="true" size={17} />
                        Save / swap quest
                      </button>
                      <span className="button">
                        {quest.isActive ? <Eye aria-hidden="true" size={17} /> : <EyeOff aria-hidden="true" size={17} />}
                        {quest.isActive ? "Visible to founders" : "Hidden from founders"}
                      </span>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
