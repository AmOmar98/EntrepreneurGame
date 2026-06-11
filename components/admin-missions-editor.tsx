"use client";

import { useActionState, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  createMissionFlow,
  reorderMissionFlow,
  updateMissionFlow,
  type WorkflowState,
} from "@/app/actions";
import { AdminDeliverableTemplateEditor } from "@/components/admin-deliverable-template-editor";
import { dictionaries } from "@/lib/i18n";
import type { AdminMissionRow, AdminTemplateRow } from "@/lib/admin-missions";
import type { Level } from "@/lib/types";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type TemplateRef = { id: string; title: string; missionId: string };

type Props = {
  eventId: string;
  missions: AdminMissionRow[];
  levels: Level[];
  allTemplates: TemplateRef[];
  demo: boolean;
};

// ============================================================================
// Mission row (view + reorder + edit toggle + livrables toggle)
// ============================================================================

function MissionCard({
  mission,
  isFirst,
  isLast,
  eventId,
  levels,
  allTemplates,
}: {
  mission: AdminMissionRow;
  isFirst: boolean;
  isLast: boolean;
  eventId: string;
  levels: Level[];
  allTemplates: TemplateRef[];
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [reorderState, reorderAction, reorderPending] = useActionState(
    reorderMissionFlow,
    initialState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateMissionFlow,
    initialState,
  );

  // Build items array for a single-step reorder (move up = swap with prev, move down = swap with next)
  function buildReorderItems(direction: "up" | "down"): string {
    // We only pass this mission's own ord change; the page will revalidate and show fresh data.
    // For a simple implementation, we decrement or increment ord by 1.
    const newOrd = direction === "up" ? mission.ord - 1 : mission.ord + 1;
    return JSON.stringify([{ id: mission.id, ord: newOrd }]);
  }

  const otherTemplates = allTemplates.filter((t) => t.missionId !== mission.id);

  return (
    <div
      className="mission-card"
      style={{
        border: "1px solid var(--wf-line)",
        borderRadius: 8,
        padding: "16px",
        background: "var(--wf-paper)",
        marginBottom: 8,
      }}
    >
      {/* Mission header row */}
      <div className="wf-row" style={{ gap: 12, flexWrap: "wrap" }}>
        {/* Reorder buttons */}
        <div className="wf-stack" style={{ gap: 4 }}>
          <form action={reorderAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="items" value={buildReorderItems("up")} />
            <button
              type="submit"
              className="button icon"
              aria-label="Monter la mission"
              disabled={isFirst || reorderPending}
              style={{ opacity: isFirst ? 0.4 : 1 }}
            >
              <ChevronUp size={16} aria-hidden />
            </button>
          </form>
          <form action={reorderAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="items" value={buildReorderItems("down")} />
            <button
              type="submit"
              className="button icon"
              aria-label="Descendre la mission"
              disabled={isLast || reorderPending}
              style={{ opacity: isLast ? 0.4 : 1 }}
            >
              <ChevronDown size={16} aria-hidden />
            </button>
          </form>
        </div>

        {/* Mission info */}
        <div className="wf-stack" style={{ gap: 4, flex: 1, minWidth: 200 }}>
          <div className="wf-row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <strong style={{ fontSize: 15 }}>{mission.title}</strong>
            <span className="eic-level-badge">{mission.levelLabel}</span>
            <span className="eic-pill eic-pill--blue" style={{ fontSize: 11 }}>
              {mission.kind}
            </span>
            {!mission.isActive && (
              <span className="eic-pill eic-pill--rose" style={{ fontSize: 11 }}>
                Masque
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--wf-muted)" }}>
            ord: {mission.ord}
            {mission.scheduledAt
              ? ` · ${new Date(mission.scheduledAt).toLocaleDateString("fr-FR")}`
              : ""}
            {" · "}
            {mission.templates.length} livrable(s)
          </p>
        </div>

        {/* Actions */}
        <div className="wf-row" style={{ gap: 8 }}>
          <button
            type="button"
            className="button"
            onClick={() => { setShowEdit(!showEdit); setShowTemplates(false); }}
          >
            {showEdit ? "Fermer" : "Editer"}
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => { setShowTemplates(!showTemplates); setShowEdit(false); }}
          >
            {showTemplates ? "Fermer livrables" : `Livrables (${mission.templates.length})`}
          </button>
        </div>
      </div>

      {/* Reorder status */}
      {reorderState.message ? (
        <p
          className={reorderState.ok ? "form-status" : "form-error"}
          role="status"
          style={{ marginTop: 8, fontSize: 12 }}
        >
          {reorderState.message}
        </p>
      ) : null}

      {/* Edit form */}
      {showEdit && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--wf-line)" }}>
          <form action={updateAction}>
            <input type="hidden" name="missionId" value={mission.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <div className="admin-form-grid" style={{ gap: 12 }}>
              <div>
                <label htmlFor={`edit-title-${mission.id}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  Titre
                </label>
                <input
                  id={`edit-title-${mission.id}`}
                  name="title"
                  className="input"
                  defaultValue={mission.title}
                  required
                />
              </div>
              <div>
                <label htmlFor={`edit-level-${mission.id}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  Niveau
                </label>
                <select
                  id={`edit-level-${mission.id}`}
                  name="levelId"
                  className="select"
                  defaultValue={mission.levelId}
                >
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`edit-kind-${mission.id}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  Type
                </label>
                <select
                  id={`edit-kind-${mission.id}`}
                  name="kind"
                  className="select"
                  defaultValue={mission.kind}
                >
                  <option value="atelier">atelier</option>
                  <option value="session">session</option>
                  <option value="presentation">presentation</option>
                  <option value="pitch">pitch</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div>
                <label htmlFor={`edit-date-${mission.id}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  Date programmee
                </label>
                <input
                  id={`edit-date-${mission.id}`}
                  name="scheduledAt"
                  type="datetime-local"
                  className="input"
                  defaultValue={mission.scheduledAt ? mission.scheduledAt.substring(0, 16) : ""}
                />
              </div>
              <div>
                <label htmlFor={`edit-ord-${mission.id}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  Ordre
                </label>
                <input
                  id={`edit-ord-${mission.id}`}
                  name="ord"
                  type="number"
                  className="input"
                  defaultValue={mission.ord}
                  min={0}
                  required
                />
              </div>
              <div className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id={`edit-active-${mission.id}`}
                  name="isActive"
                  type="checkbox"
                  defaultChecked={mission.isActive}
                  value="on"
                />
                <label htmlFor={`edit-active-${mission.id}`} style={{ fontSize: 14 }}>
                  Active
                </label>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="submit"
                className="eic-button eic-button--primary"
                disabled={updatePending}
              >
                {updatePending ? "Enregistrement en cours…" : "Enregistrer la mission"}
              </button>
            </div>
            {updateState.message ? (
              <p
                className={updateState.ok ? "form-status" : "form-error"}
                role="status"
                style={{ marginTop: 8 }}
              >
                {updateState.message}
              </p>
            ) : null}
          </form>
        </div>
      )}

      {/* Deliverable templates section */}
      {showTemplates && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--wf-line)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Livrables de cette mission
          </p>
          {mission.templates.map((tpl) => (
            <TemplateSummaryRow
              key={tpl.id}
              template={tpl}
              missionId={mission.id}
              eventId={eventId}
              otherTemplates={otherTemplates}
            />
          ))}
          {/* Add new template */}
          <div style={{ marginTop: 16 }}>
            <AddTemplatePanel
              missionId={mission.id}
              eventId={eventId}
              otherTemplates={otherTemplates}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Template summary row (shows title + edit inline)
// ============================================================================

function TemplateSummaryRow({
  template,
  missionId,
  eventId,
  otherTemplates,
}: {
  template: AdminTemplateRow;
  missionId: string;
  eventId: string;
  otherTemplates: TemplateRef[];
}) {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--wf-line)",
        borderRadius: 6,
        padding: "10px 14px",
        marginBottom: 8,
        background: "var(--home-surface)",
      }}
    >
      <div className="wf-row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>{template.title}</span>
        <span className="eic-pill eic-pill--blue" style={{ fontSize: 11 }}>{template.composerKind}</span>
        {template.isBonus && (
          <span className="eic-pill eic-pill--amber" style={{ fontSize: 11 }}>Bonus</span>
        )}
        {!template.isActive && (
          <span className="eic-pill eic-pill--rose" style={{ fontSize: 11 }}>Masque</span>
        )}
        <span style={{ fontSize: 11, color: "var(--wf-muted)" }}>ord: {template.ord}</span>
        <span className="wf-grow" />
        <button
          type="button"
          className="button"
          onClick={() => setShowEditor(!showEditor)}
        >
          {showEditor ? "Fermer" : "Editer"}
        </button>
      </div>
      {showEditor && (
        <div style={{ marginTop: 12 }}>
          <AdminDeliverableTemplateEditor
            missionId={missionId}
            eventId={eventId}
            templateId={template.id}
            initialSlug={template.slug}
            initialTitle={template.title}
            initialComposerKind={template.composerKind}
            initialIsBonus={template.isBonus}
            initialIsActive={template.isActive}
            initialOrd={template.ord}
            otherTemplates={otherTemplates}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Add template panel (new template form)
// ============================================================================

function AddTemplatePanel({
  missionId,
  eventId,
  otherTemplates,
}: {
  missionId: string;
  eventId: string;
  otherTemplates: TemplateRef[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {!showForm ? (
        <button
          type="button"
          className="eic-button eic-button--primary"
          onClick={() => setShowForm(true)}
        >
          + Ajouter un livrable
        </button>
      ) : (
        <div
          style={{
            border: "1px dashed var(--wf-line)",
            borderRadius: 8,
            padding: 16,
            background: "var(--wf-paper)",
          }}
        >
          <div className="wf-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <strong style={{ fontSize: 14 }}>Nouveau livrable</strong>
            <button type="button" className="button" onClick={() => setShowForm(false)}>
              Annuler
            </button>
          </div>
          <AdminDeliverableTemplateEditor
            missionId={missionId}
            eventId={eventId}
            otherTemplates={otherTemplates}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Create mission form
// ============================================================================

function CreateMissionForm({
  eventId,
  levels,
  nextOrd,
}: {
  eventId: string;
  levels: Level[];
  nextOrd: number;
}) {
  const [state, formAction, pending] = useActionState(createMissionFlow, initialState);

  return (
    <form action={formAction} style={{ marginTop: 16 }}>
      <input type="hidden" name="eventId" value={eventId} />
      <div className="admin-form-grid" style={{ gap: 12 }}>
        <div>
          <label htmlFor="new-title" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Titre *
          </label>
          <input
            id="new-title"
            name="title"
            className="input"
            placeholder="Ex: Mission 1 - Persona"
            required
          />
        </div>
        <div>
          <label htmlFor="new-level" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Niveau *
          </label>
          <select id="new-level" name="levelId" className="select" required>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="new-kind" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Type *
          </label>
          <select id="new-kind" name="kind" className="select" defaultValue="atelier">
            <option value="atelier">atelier</option>
            <option value="session">session</option>
            <option value="presentation">presentation</option>
            <option value="pitch">pitch</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div>
          <label htmlFor="new-date" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Date programmee
          </label>
          <input
            id="new-date"
            name="scheduledAt"
            type="datetime-local"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="new-ord" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Ordre
          </label>
          <input
            id="new-ord"
            name="ord"
            type="number"
            className="input"
            defaultValue={nextOrd}
            min={0}
            required
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button
          type="submit"
          className="eic-button eic-button--primary"
          disabled={pending}
        >
          {pending ? "Enregistrement en cours…" : t.admin_engine_create_mission}
        </button>
      </div>
      {state.message ? (
        <p
          className={state.ok ? "form-status" : "form-error"}
          role="status"
          style={{ marginTop: 8 }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

// ============================================================================
// Main editor component
// ============================================================================

export function AdminMissionsEditor({
  eventId,
  missions,
  levels,
  allTemplates,
  demo,
}: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div>
      {/* Demo notice */}
      {demo && (
        <div
          className="wf-pill is-amber"
          style={{ padding: "10px 14px", fontSize: 12, marginBottom: 16, display: "inline-flex" }}
        >
          {t.admin_engine_demo_disabled}
        </div>
      )}

      {/* Mission list */}
      {missions.length === 0 ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--wf-muted)",
            border: "1px dashed var(--wf-line)",
            borderRadius: 8,
          }}
        >
          {t.admin_engine_missions_empty}
        </div>
      ) : (
        <div>
          {missions.map((mission, idx) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isFirst={idx === 0}
              isLast={idx === missions.length - 1}
              eventId={eventId}
              levels={levels}
              allTemplates={allTemplates}
            />
          ))}
        </div>
      )}

      {/* Create mission section */}
      <div style={{ marginTop: 24 }}>
        {!showCreateForm ? (
          <button
            type="button"
            className="eic-button eic-button--primary"
            onClick={() => setShowCreateForm(true)}
          >
            {t.admin_engine_create_mission}
          </button>
        ) : (
          <div
            style={{
              border: "1px solid var(--wf-line)",
              borderRadius: 8,
              padding: 20,
              background: "var(--wf-paper)",
            }}
          >
            <div className="wf-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <strong style={{ fontSize: 16 }}>Nouvelle mission</strong>
              <button type="button" className="button" onClick={() => setShowCreateForm(false)}>
                Annuler
              </button>
            </div>
            <CreateMissionForm
              eventId={eventId}
              levels={levels}
              nextOrd={missions.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
