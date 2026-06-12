"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { saveDeliverableTemplateFlow, type WorkflowState } from "@/app/actions";
import { slugifyToKey } from "@/lib/schemas";
import { dictionaries } from "@/lib/i18n";
import type { ComposerKind } from "@/lib/types";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type TemplateRef = { id: string; title: string; missionId: string };

type RubricRow = {
  label: string;
  max: number;
};

// ============================================================================
// Props
// ============================================================================

type Props = {
  missionId: string;
  eventId: string;
  // If provided, we are editing an existing template
  templateId?: string;
  // Initial values for existing templates
  initialSlug?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialComposerKind?: ComposerKind;
  initialTemplateUrl?: string | null;
  initialAutoValidate?: boolean;
  initialIsBonus?: boolean;
  initialMaxScore?: number;
  initialOrd?: number;
  initialIsActive?: boolean;
  initialSoftRecommendsBefore?: string | null;
  initialRubric?: RubricRow[];
  otherTemplates: TemplateRef[];
};

// ============================================================================
// Main editor component
// ============================================================================

export function AdminDeliverableTemplateEditor({
  missionId,
  eventId,
  templateId,
  initialSlug = "",
  initialTitle = "",
  initialDescription = "",
  initialComposerKind = "simple",
  initialTemplateUrl = null,
  initialAutoValidate = false,
  initialIsBonus = false,
  initialMaxScore = 100,
  initialOrd = 0,
  initialIsActive = true,
  initialSoftRecommendsBefore = null,
  initialRubric,
  otherTemplates,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveDeliverableTemplateFlow,
    initialState,
  );

  // Rubric local state — dynamic criterion rows
  const [criteria, setCriteria] = useState<RubricRow[]>(
    initialRubric && initialRubric.length > 0
      ? initialRubric
      : [{ label: "", max: 25 }],
  );

  // Title -> slug auto-generation
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialSlug);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(slugifyToKey(val));
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
  }

  // Criterion management
  function addCriterion() {
    setCriteria((prev) => [...prev, { label: "", max: 25 }]);
  }

  function removeCriterion(idx: number) {
    if (criteria.length <= 1) return; // min 1 criterion enforced
    setCriteria((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCriterion(idx: number, field: "label" | "max", value: string | number) {
    setCriteria((prev) =>
      prev.map((c, i) =>
        i === idx
          ? { ...c, [field]: field === "max" ? Number(value) : value }
          : c,
      ),
    );
  }

  // Serialize rubric as [{key, label, max}] for hidden input
  const rubricJson = JSON.stringify(
    criteria.map((c) => ({
      key: slugifyToKey(c.label),
      label: c.label,
      max: c.max,
    })),
  );

  // validationRules: empty array (no severity field exposed — R2 CARDINAL)
  const validationRulesJson = "[]";

  return (
    <form action={formAction}>
      {/* Hidden fields */}
      {templateId && <input type="hidden" name="templateId" value={templateId} />}
      <input type="hidden" name="missionId" value={missionId} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="rubric" value={rubricJson} />
      <input type="hidden" name="validationRules" value={validationRulesJson} />

      <div className="admin-form-grid" style={{ gap: 16 }}>
        {/* Titre (full width) */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor={`tpl-title-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Titre *
          </label>
          <input
            id={`tpl-title-${templateId ?? "new"}`}
            name="title"
            className="input wide"
            value={title}
            onChange={handleTitleChange}
            placeholder="Ex: Persona utilisateur"
            required
            style={{ width: "100%" }}
          />
        </div>

        {/* Description (full width) */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor={`tpl-desc-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Description
          </label>
          <textarea
            id={`tpl-desc-${templateId ?? "new"}`}
            name="description"
            className="textarea wide"
            defaultValue={initialDescription}
            placeholder="Description pedagogique du livrable…"
            rows={3}
            style={{ width: "100%" }}
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor={`tpl-slug-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Slug *
          </label>
          <input
            id={`tpl-slug-${templateId ?? "new"}`}
            name="slug"
            className="input"
            value={slug}
            onChange={handleSlugChange}
            placeholder="ex: persona-v1"
            required
          />
        </div>

        {/* Composer kind */}
        <div>
          <label htmlFor={`tpl-kind-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Type de compositeur
          </label>
          <select
            id={`tpl-kind-${templateId ?? "new"}`}
            name="composerKind"
            className="select"
            defaultValue={initialComposerKind}
          >
            <option value="simple">simple</option>
            <option value="moscow">moscow</option>
            <option value="multi_url">multi_url</option>
          </select>
        </div>

        {/* Template URL */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor={`tpl-url-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            URL du template (https://)
          </label>
          <input
            id={`tpl-url-${templateId ?? "new"}`}
            name="templateUrl"
            className="input wide"
            type="url"
            defaultValue={initialTemplateUrl ?? ""}
            placeholder="https://..."
            style={{ width: "100%" }}
          />
        </div>

        {/* max_score */}
        <div>
          <label htmlFor={`tpl-max-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Score max (1-200)
          </label>
          <input
            id={`tpl-max-${templateId ?? "new"}`}
            name="maxScore"
            type="number"
            className="input"
            defaultValue={initialMaxScore}
            min={1}
            max={200}
            required
          />
        </div>

        {/* ord */}
        <div>
          <label htmlFor={`tpl-ord-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Ordre
          </label>
          <input
            id={`tpl-ord-${templateId ?? "new"}`}
            name="ord"
            type="number"
            className="input"
            defaultValue={initialOrd}
            min={0}
            required
          />
        </div>

        {/* soft_recommends_before (advisory only — R3 CARDINAL: no disabled DOM) */}
        <div>
          <label htmlFor={`tpl-recommends-${templateId ?? "new"}`} style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Recommande apres (optionnel)
          </label>
          <select
            id={`tpl-recommends-${templateId ?? "new"}`}
            name="softRecommendsBefore"
            className="select"
            defaultValue={initialSoftRecommendsBefore ?? ""}
          >
            <option value="">Aucun</option>
            {otherTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.title}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11, color: "var(--wf-muted)", marginTop: 4 }}>
            Hint ambre affiché au Player (conseille uniquement — aucun blocage).
          </p>
        </div>

        {/* Checkboxes */}
        <div className="wf-stack" style={{ gap: 8 }}>
          <div className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id={`tpl-autovalidate-${templateId ?? "new"}`}
              name="autoValidate"
              type="checkbox"
              defaultChecked={initialAutoValidate}
              value="on"
            />
            <label htmlFor={`tpl-autovalidate-${templateId ?? "new"}`} style={{ fontSize: 14 }}>
              Auto-validate
            </label>
          </div>
          <div className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id={`tpl-bonus-${templateId ?? "new"}`}
              name="isBonus"
              type="checkbox"
              defaultChecked={initialIsBonus}
              value="on"
            />
            <label htmlFor={`tpl-bonus-${templateId ?? "new"}`} style={{ fontSize: 14 }}>
              Bonus
            </label>
          </div>
          <div className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id={`tpl-active-${templateId ?? "new"}`}
              name="isActive"
              type="checkbox"
              defaultChecked={initialIsActive}
              value="on"
            />
            <label htmlFor={`tpl-active-${templateId ?? "new"}`} style={{ fontSize: 14 }}>
              Active
            </label>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Rubric builder — CRITICAL: outputs [{key, label, max}]       */}
      {/* Mentor eval forms read these keys for evaluations.scores     */}
      {/* ============================================================ */}
      <div style={{ marginTop: 24 }}>
        <p
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--wf-muted)",
            marginBottom: 12,
          }}
        >
          Criteres d&apos;evaluation
        </p>

        {criteria.map((criterion, idx) => (
          <div
            key={idx}
            className="admin-form-grid"
            style={{ gap: 8, marginBottom: 8, minHeight: 40 }}
          >
            <div style={{ flex: 3 }}>
              <input
                className="input"
                value={criterion.label}
                onChange={(e) => updateCriterion(idx, "label", e.target.value)}
                placeholder="Ex: Clarte du probleme"
                style={{ width: "100%" }}
                aria-label={`Libelle du critere ${idx + 1}`}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                className="input"
                value={criterion.max}
                onChange={(e) => updateCriterion(idx, "max", e.target.value)}
                min={1}
                max={100}
                aria-label={`Max du critere ${idx + 1}`}
              />
            </div>
            <div>
              <button
                type="button"
                className="button icon"
                aria-label="Supprimer le critere"
                onClick={() => removeCriterion(idx)}
                disabled={criteria.length <= 1}
                style={{ opacity: criteria.length <= 1 ? 0.4 : 1 }}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="button"
          onClick={addCriterion}
          style={{ marginTop: 8 }}
        >
          {t.admin_engine_add_criterion}
        </button>
      </div>

      {/* ============================================================ */}
      {/* Validation rules — static warn-only note (R2 CARDINAL)       */}
      {/* NO severity input field exposed — severity is always "warn"  */}
      {/* ============================================================ */}
      <div
        style={{
          marginTop: 20,
          padding: "10px 14px",
          background: "var(--wf-amber-tint, #FFF8EC)",
          border: "1px solid #DCC394",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--wf-amber, #B47A14)",
        }}
        role="note"
      >
        {t.admin_engine_validation_warn_only_note}
      </div>

      {/* Submit */}
      <div style={{ marginTop: 20 }}>
        <button
          type="submit"
          className="eic-button eic-button--primary"
          disabled={pending}
        >
          {pending ? "Enregistrement en cours…" : t.admin_engine_save_template}
        </button>
      </div>

      {/* Status / error message */}
      {state.message ? (
        <p
          className={state.ok ? "form-status" : "form-error"}
          role="status"
          style={{ marginTop: 10 }}
        >
          {state.ok ? `${t.admin_engine_template_saved}` : state.message}
        </p>
      ) : null}
    </form>
  );
}
