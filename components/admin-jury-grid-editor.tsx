"use client";
// Phase 16 / JURY-09 — GM editor for jury pitch criteria (delete-then-insert).
// Pattern: admin-deliverable-template-editor.tsx rubric builder rows.

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { saveJuryGridFlow, type WorkflowState } from "@/app/actions";
import { slugifyToKey } from "@/lib/schemas";
import { dictionaries } from "@/lib/i18n";
import type { PitchCriterion } from "@/lib/pitch-criteria";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type CriterionRow = {
  key: string;
  label: string;
  max: number;
};

type Props = {
  eventId: string;
  initialCriteria?: PitchCriterion[];
  demo: boolean;
};

export function AdminJuryGridEditor({
  eventId,
  initialCriteria,
  demo,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveJuryGridFlow,
    initialState,
  );

  const [criteria, setCriteria] = useState<CriterionRow[]>(
    initialCriteria && initialCriteria.length > 0
      ? initialCriteria.map((c) => ({ key: c.key, label: c.label, max: c.max }))
      : [{ key: "", label: "", max: 20 }],
  );

  function addCriterion() {
    setCriteria((prev) => [...prev, { key: "", label: "", max: 20 }]);
  }

  function removeCriterion(idx: number) {
    if (criteria.length <= 1) return;
    setCriteria((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCriterion(
    idx: number,
    field: "key" | "label" | "max",
    value: string | number,
  ) {
    setCriteria((prev) =>
      prev.map((c, i) =>
        i === idx
          ? { ...c, [field]: field === "max" ? Number(value) : value }
          : c,
      ),
    );
  }

  // Serialize to hidden input — derive key from label when blank
  const criteriaJson = JSON.stringify(
    criteria.map((c) => ({
      key: c.key && c.key.trim() ? c.key.trim() : slugifyToKey(c.label),
      label: c.label,
      max: c.max,
    })),
  );

  return (
    <div className="wf-card" style={{ padding: 24, marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
        {t.admin_jury_grid_title}
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--wf-muted)" }}>
        Definissez les criteres du jury (cle interne, libelle affiché, note max).
      </p>

      {demo && (
        <div
          className="wf-pill is-amber"
          style={{
            padding: "10px 14px",
            fontSize: 12,
            marginBottom: 16,
            display: "inline-flex",
          }}
        >
          {t.admin_settings_demo_disabled}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="criteriaJson" value={criteriaJson} />

        {/* Column headers */}
        <div
          className="admin-form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 3fr 80px 40px",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--wf-muted)" }}>
            Cle
          </span>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--wf-muted)" }}>
            Libelle
          </span>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--wf-muted)" }}>
            Max
          </span>
          <span />
        </div>

        {/* Criterion rows */}
        {criteria.map((criterion, idx) => (
          <div
            key={idx}
            className="admin-form-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 3fr 80px 40px",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <input
              className="input"
              value={criterion.key}
              onChange={(e) => updateCriterion(idx, "key", e.target.value)}
              placeholder="ex: innovation"
              aria-label={`Cle du critere ${idx + 1}`}
            />
            <input
              className="input"
              value={criterion.label}
              onChange={(e) => updateCriterion(idx, "label", e.target.value)}
              placeholder="Ex: Innovation"
              aria-label={`Libelle du critere ${idx + 1}`}
            />
            <input
              type="number"
              className="input"
              value={criterion.max}
              onChange={(e) => updateCriterion(idx, "max", e.target.value)}
              min={1}
              max={100}
              aria-label={`Note max du critere ${idx + 1}`}
            />
            <button
              type="button"
              className="button icon"
              aria-label={`Supprimer le critere ${idx + 1}`}
              onClick={() => removeCriterion(idx)}
              disabled={criteria.length <= 1}
              style={{ opacity: criteria.length <= 1 ? 0.4 : 1 }}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        ))}

        <div className="wf-row" style={{ gap: 12, marginTop: 12, alignItems: "center" }}>
          <button
            type="button"
            className="eic-button"
            onClick={addCriterion}
            disabled={criteria.length >= 10}
            aria-label="Ajouter un critere de jury"
          >
            {t.admin_jury_add_criterion}
          </button>

          <button
            type="submit"
            className="eic-button eic-button--primary"
            disabled={pending || demo}
            aria-label="Enregistrer la grille jury"
          >
            {pending ? "Enregistrement..." : t.admin_jury_save_grid}
          </button>
        </div>

        {state.message ? (
          <p
            className={state.ok ? "form-status" : "form-error"}
            role="status"
            style={{ marginTop: 10 }}
          >
            {state.ok ? t.admin_jury_grid_saved : state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
