"use client";

import { useActionState, useState } from "react";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import {
  createLevelFlow,
  updateLevelFlow,
  reorderLevelFlow,
  deleteLevelFlow,
  type WorkflowState,
} from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { Level } from "@/lib/types";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

// ---------------------------------------------------------------------------
// Individual level row with inline edit, up/down reorder, and delete confirm
// ---------------------------------------------------------------------------

function LevelRow({
  level,
  isFirst,
  isLast,
  allLevels,
}: {
  level: Level;
  isFirst: boolean;
  isLast: boolean;
  allLevels: Level[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateLevelFlow, initialState);
  const [, reorderAction, reorderPending] = useActionState(reorderLevelFlow, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteLevelFlow, initialState);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleMoveUp = () => {
    const idx = allLevels.findIndex((l) => l.id === level.id);
    if (idx <= 0) return;
    const prev = allLevels[idx - 1];
    const items = [
      { id: level.id, ord: prev.ord },
      { id: prev.id, ord: level.ord },
    ];
    const fd = new FormData();
    fd.append("items", JSON.stringify(items));
    reorderAction(fd);
  };

  const handleMoveDown = () => {
    const idx = allLevels.findIndex((l) => l.id === level.id);
    if (idx >= allLevels.length - 1) return;
    const next = allLevels[idx + 1];
    const items = [
      { id: level.id, ord: next.ord },
      { id: next.id, ord: level.ord },
    ];
    const fd = new FormData();
    fd.append("items", JSON.stringify(items));
    reorderAction(fd);
  };

  return (
    <div
      className="wf-row"
      style={{
        padding: "12px 16px",
        border: "1px solid var(--wf-line)",
        borderRadius: 8,
        background: "#ffffff",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      {/* Reorder buttons */}
      <div className="wf-stack" style={{ gap: 2 }}>
        <button
          type="button"
          className="button icon"
          aria-label="Monter le niveau"
          disabled={isFirst || reorderPending}
          onClick={handleMoveUp}
          style={{ opacity: isFirst ? 0.4 : 1 }}
        >
          <ChevronUp size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="button icon"
          aria-label="Descendre le niveau"
          disabled={isLast || reorderPending}
          onClick={handleMoveDown}
          style={{ opacity: isLast ? 0.4 : 1 }}
        >
          <ChevronDown size={16} aria-hidden />
        </button>
      </div>

      {/* Inline edit form */}
      <form action={updateAction} style={{ flex: 1 }}>
        <input type="hidden" name="id" value={level.id} />
        <div className="wf-stack" style={{ gap: 6 }}>
          <div className="wf-row" style={{ gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--wf-muted)",
                minWidth: 80,
                alignSelf: "center",
              }}
            >
              {level.id}
            </span>
            <input
              name="label"
              defaultValue={level.label}
              className="input"
              style={{ flex: 1, fontSize: 14 }}
              placeholder="Libelle du niveau"
              required
            />
            <button
              type="submit"
              className="button primary"
              disabled={updatePending}
              style={{ whiteSpace: "nowrap", fontSize: 13 }}
            >
              {updatePending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
          {updateState.message ? (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: updateState.ok ? "var(--eic-green)" : "var(--wf-rose)",
              }}
              role="status"
            >
              {updateState.message}
            </p>
          ) : null}
        </div>
      </form>

      {/* Delete */}
      <div>
        {confirmDelete ? (
          <div className="toolbar" style={{ gap: 6, display: "flex" }}>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={level.id} />
              <button
                type="submit"
                className="button"
                disabled={deletePending}
                style={{ fontSize: 12, color: "var(--wf-rose)" }}
              >
                {deletePending ? "Suppression..." : "Oui, supprimer"}
              </button>
            </form>
            <button
              type="button"
              className="button"
              onClick={() => setConfirmDelete(false)}
              style={{ fontSize: 12 }}
            >
              Annuler
            </button>
            {deleteState.message && !deleteState.ok ? (
              <p style={{ margin: 0, fontSize: 12, color: "var(--wf-rose)", alignSelf: "center" }} role="status">
                {deleteState.message}
              </p>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="button icon"
            aria-label={`Supprimer le niveau ${level.id}`}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add level form
// ---------------------------------------------------------------------------

function AddLevelForm() {
  const [state, formAction, pending] = useActionState(createLevelFlow, initialState);

  return (
    <form action={formAction}>
      <div className="wf-stack" style={{ gap: 8, padding: "16px", border: "1px dashed var(--wf-line)", borderRadius: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          Ajouter un niveau
        </p>
        <div className="wf-row" style={{ gap: 8, flexWrap: "wrap" }}>
          <input
            name="id"
            className="input"
            placeholder="ID (ex: L6_alumni)"
            required
            style={{ width: 160 }}
          />
          <input
            name="label"
            className="input"
            placeholder="Libelle (ex: L6 - Alumni)"
            required
            style={{ flex: 1, minWidth: 200 }}
          />
          <input
            name="ord"
            type="number"
            min={0}
            className="input"
            placeholder="Ordre (0...)"
            required
            style={{ width: 80 }}
          />
          <button
            type="submit"
            className="button primary"
            disabled={pending}
          >
            {pending ? "Ajout..." : t.admin_engine_create_level}
          </button>
        </div>
        {state.message ? (
          <p
            style={{ margin: 0, fontSize: 12, color: state.ok ? "var(--eic-green)" : "var(--wf-rose)" }}
            role="status"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main editor component
// ---------------------------------------------------------------------------

export function AdminLevelsEditor({ levels }: { levels: Level[] }) {
  if (levels.length === 0) {
    return (
      <div className="wf-stack" style={{ gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--wf-muted)" }}>
          {t.admin_engine_levels_empty}
        </p>
        <AddLevelForm />
      </div>
    );
  }

  return (
    <div className="wf-stack" style={{ gap: 16 }}>
      <div className="wf-stack" style={{ gap: 8 }}>
        {levels.map((level, idx) => (
          <LevelRow
            key={level.id}
            level={level}
            isFirst={idx === 0}
            isLast={idx === levels.length - 1}
            allLevels={levels}
          />
        ))}
      </div>
      <AddLevelForm />
    </div>
  );
}
