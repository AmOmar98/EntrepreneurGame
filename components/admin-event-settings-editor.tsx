"use client";
// Phase 16 / SETTINGS-04 — GM editor for per-event XP rules + engagement
// thresholds + pitch weight.
// Pattern: admin-missions-editor.tsx numeric form section.

import { useActionState } from "react";
import { saveEventSettingsFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { EventSettings } from "@/lib/event-settings";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type Props = {
  eventId: string;
  settings: EventSettings;
  demo: boolean;
};

export function AdminEventSettingsEditor({ eventId, settings, demo }: Props) {
  const [state, formAction, pending] = useActionState(
    saveEventSettingsFlow,
    initialState,
  );

  return (
    <div className="wf-card" style={{ padding: 24, marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
        {t.admin_settings_title}
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--wf-muted)" }}>
        Regles XP, paliers engagement et ponderation pitch pour cet event.
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

        {/* XP rules */}
        <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px" }}>
          <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Regles XP
          </legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <div>
              <label
                htmlFor="xpFirstSubmission"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                {t.admin_settings_xp_first} (defaut {settings.xpFirstSubmission})
              </label>
              <input
                id="xpFirstSubmission"
                name="xpFirstSubmission"
                type="number"
                className="input"
                defaultValue={settings.xpFirstSubmission}
                min={0}
                max={500}
                required
                aria-label={t.admin_settings_xp_first}
              />
            </div>
            <div>
              <label
                htmlFor="xpValidateV1"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                {t.admin_settings_xp_v1} (defaut {settings.xpValidateV1})
              </label>
              <input
                id="xpValidateV1"
                name="xpValidateV1"
                type="number"
                className="input"
                defaultValue={settings.xpValidateV1}
                min={0}
                max={500}
                required
                aria-label={t.admin_settings_xp_v1}
              />
            </div>
            <div>
              <label
                htmlFor="xpValidateV2"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                {t.admin_settings_xp_v2} (defaut {settings.xpValidateV2})
              </label>
              <input
                id="xpValidateV2"
                name="xpValidateV2"
                type="number"
                className="input"
                defaultValue={settings.xpValidateV2}
                min={0}
                max={500}
                required
                aria-label={t.admin_settings_xp_v2}
              />
            </div>
          </div>
        </fieldset>

        {/* Engagement thresholds */}
        <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px" }}>
          <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Paliers engagement
          </legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <div>
              <label
                htmlFor="engSubmitted"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                {t.admin_settings_eng_submitted} (defaut {settings.engSubmitted})
              </label>
              <input
                id="engSubmitted"
                name="engSubmitted"
                type="number"
                className="input"
                defaultValue={settings.engSubmitted}
                min={0}
                max={500}
                required
                aria-label={t.admin_settings_eng_submitted}
              />
            </div>
            <div>
              <label
                htmlFor="engReviewed"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                {t.admin_settings_eng_reviewed} (defaut {settings.engReviewed})
              </label>
              <input
                id="engReviewed"
                name="engReviewed"
                type="number"
                className="input"
                defaultValue={settings.engReviewed}
                min={0}
                max={500}
                required
                aria-label={t.admin_settings_eng_reviewed}
              />
            </div>
            <div>
              <label
                htmlFor="engValidated"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                {t.admin_settings_eng_validated} (defaut {settings.engValidated})
              </label>
              <input
                id="engValidated"
                name="engValidated"
                type="number"
                className="input"
                defaultValue={settings.engValidated}
                min={0}
                max={500}
                required
                aria-label={t.admin_settings_eng_validated}
              />
            </div>
          </div>
        </fieldset>

        {/* Pitch weight */}
        <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px" }}>
          <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Ponderation pitch
          </legend>
          <div style={{ maxWidth: 200 }}>
            <label
              htmlFor="pitchWeight"
              style={{ fontSize: 12, display: "block", marginBottom: 4 }}
            >
              {t.admin_settings_pitch_weight} (defaut {settings.pitchWeight})
            </label>
            <input
              id="pitchWeight"
              name="pitchWeight"
              type="number"
              className="input"
              defaultValue={settings.pitchWeight}
              min={0}
              max={1}
              step={0.05}
              required
              aria-label={t.admin_settings_pitch_weight}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          className="eic-button eic-button--primary"
          disabled={pending || demo}
          aria-label="Enregistrer les reglages de l'event"
        >
          {pending ? "Enregistrement..." : t.admin_settings_save}
        </button>

        {state.message ? (
          <p
            className={state.ok ? "form-status" : "form-error"}
            role="status"
            style={{ marginTop: 10 }}
          >
            {state.ok ? t.admin_settings_saved : state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
