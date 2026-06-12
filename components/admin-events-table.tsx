"use client";
// Phase 15 / ENGINE-03 + ENGINE-04 — GM event list + create + activate + clone.
import { useActionState, useState } from "react";
import {
  createEventFlow,
  activateEventFlow,
  cloneEventFlow,
  type WorkflowState,
} from "@/app/actions";
import type { AdminEventRow } from "@/lib/admin-events";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type OrgOption = { id: string; name: string };

type Props = {
  rows: AdminEventRow[];
  orgs: OrgOption[];
  demo: boolean;
};

export function AdminEventsTable({ rows, orgs, demo }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div>
      {/* Topbar: event count + create CTA */}
      <div
        className="wf-row"
        style={{ marginBottom: 16, gap: 12, alignItems: "center" }}
      >
        <span style={{ fontSize: 14, color: "var(--wf-muted)" }}>
          {rows.length} event{rows.length !== 1 ? "s" : ""}
        </span>
        <span className="wf-grow" />
        <button
          type="button"
          className="eic-button eic-button--primary"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          {t.admin_engine_create_event}
        </button>
      </div>

      {/* Create form panel */}
      {showCreateForm && (
        <CreateEventForm
          orgs={orgs}
          demo={demo}
          onCreated={() => setShowCreateForm(false)}
        />
      )}

      {/* Events table */}
      {rows.length === 0 ? (
        <div className="wf-card" style={{ padding: 24, textAlign: "center", color: "var(--wf-muted)" }}>
          {t.admin_engine_events_empty}
        </div>
      ) : (
        <div className="wf-card" style={{ overflow: "auto" }}>
          <table className="table-wrap" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Nom
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Slug
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Dates
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Statut
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Organisation
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Missions
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <EventRow key={row.id} row={row} demo={demo} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Single event row -------------------------------------------------------

function EventRow({ row, demo }: { row: AdminEventRow; demo: boolean }) {
  const [activateState, activateAction, activatePending] = useActionState(
    activateEventFlow,
    initialState,
  );
  const [cloneState, cloneAction, clonePending] = useActionState(
    cloneEventFlow,
    initialState,
  );

  const startDate = row.startsAt ? new Date(row.startsAt).toLocaleDateString("fr-FR") : "—";
  const endDate = row.endsAt ? new Date(row.endsAt).toLocaleDateString("fr-FR") : "—";

  // Extract new event id from clone success message (embedded as last path segment).
  const cloneLink =
    cloneState.ok && cloneState.message.includes("/admin/events/")
      ? cloneState.message.split(" ").pop()
      : null;

  return (
    <tr style={{ borderTop: "1px solid var(--wf-line)" }}>
      {/* Nom */}
      <td style={{ padding: "12px", fontSize: 14, fontWeight: 500 }}>
        {row.name}
      </td>
      {/* Slug */}
      <td style={{ padding: "12px" }}>
        <code style={{ fontSize: 12, background: "var(--wf-paper-deep)", padding: "2px 6px", borderRadius: 4 }}>
          {row.slug}
        </code>
      </td>
      {/* Dates */}
      <td style={{ padding: "12px", fontSize: 13, color: "var(--wf-muted)" }}>
        {startDate} → {endDate}
      </td>
      {/* Statut */}
      <td style={{ padding: "12px" }}>
        <span className={row.isActive ? "eic-pill eic-pill--green" : "eic-pill eic-pill--rose"}>
          {row.isActive ? "Actif" : "Inactif"}
        </span>
      </td>
      {/* Organisation */}
      <td style={{ padding: "12px", fontSize: 13, color: "var(--wf-muted)" }}>
        {row.organizationName ?? "—"}
      </td>
      {/* Mission count */}
      <td style={{ padding: "12px", fontSize: 13 }}>
        {row.missionCount}
      </td>
      {/* Actions */}
      <td style={{ padding: "12px" }}>
        <div className="wf-row" style={{ gap: 8, flexWrap: "wrap" }}>
          {/* Link to missions editor */}
          <a
            href={`/admin/events/${row.id}/missions`}
            className="eic-button"
            style={{ fontSize: 13 }}
          >
            Voir missions
          </a>

          {/* Link to event settings (jury grid + scoring) */}
          <a
            href={`/admin/events/${row.id}/settings`}
            className="eic-button"
            style={{ fontSize: 13 }}
            aria-label={`Reglages de l'event ${row.name}`}
          >
            Reglages
          </a>

          {/* Activate toggle */}
          {!row.isActive && (
            <form action={activateAction}>
              <input type="hidden" name="eventId" value={row.id} />
              <button
                type="submit"
                aria-label={`Activer l'event ${row.name}`}
                className={row.isActive ? "eic-toggle-switch eic-toggle-switch--on" : "eic-toggle-switch"}
                disabled={activatePending}
                title={t.admin_engine_deactivate_confirm}
              >
                <span className="eic-toggle-switch__track" aria-hidden="true">
                  <span className="eic-toggle-switch__thumb" />
                </span>
                <span className="eic-toggle-switch__label">
                  {row.isActive ? "Actif" : "Activer"}
                </span>
              </button>
            </form>
          )}
          {row.isActive && (
            <span
              className="eic-toggle-switch eic-toggle-switch--on"
              aria-label={`Event ${row.name} est actif`}
              style={{ cursor: "default" }}
            >
              <span className="eic-toggle-switch__track" aria-hidden="true">
                <span className="eic-toggle-switch__thumb" />
              </span>
              <span className="eic-toggle-switch__label">Actif</span>
            </span>
          )}

          {/* Clone button */}
          <form action={cloneAction}>
            <input type="hidden" name="eventId" value={row.id} />
            <button
              type="submit"
              aria-label={`Cloner l'event ${row.name}`}
              className="eic-button"
              disabled={clonePending}
              style={{ fontSize: 13 }}
            >
              {clonePending ? "Clonage en cours..." : t.admin_engine_clone_event}
            </button>
          </form>
        </div>

        {/* Activate state message */}
        {activateState.message ? (
          <p
            className={activateState.ok ? "form-status" : "form-status form-error"}
            role="status"
            style={{ marginTop: 6, fontSize: 12 }}
          >
            {activateState.message}
          </p>
        ) : null}

        {/* Clone state message */}
        {cloneState.message && !clonePending ? (
          <p
            className={cloneState.ok ? "form-status" : "form-status form-error"}
            role="status"
            style={{ marginTop: 6, fontSize: 12 }}
          >
            {cloneState.ok
              ? t.admin_engine_clone_success
              : cloneState.message}
            {cloneLink ? (
              <a
                href={cloneLink}
                style={{ marginLeft: 8, color: "var(--eic-blue)", textDecoration: "underline" }}
              >
                Voir le clone →
              </a>
            ) : null}
          </p>
        ) : null}

        {demo && (
          <p style={{ fontSize: 11, color: "var(--wf-amber)", marginTop: 4 }}>
            {t.admin_engine_demo_disabled}
          </p>
        )}
      </td>
    </tr>
  );
}

// ---- Inline create form -----------------------------------------------------

function CreateEventForm({
  orgs,
  demo,
  onCreated,
}: {
  orgs: OrgOption[];
  demo: boolean;
  onCreated: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createEventFlow,
    initialState,
  );

  // Close panel on success.
  if (state.ok) {
    onCreated();
  }

  return (
    <div
      className="wf-card"
      style={{ padding: 24, marginBottom: 24, background: "var(--wf-paper)" }}
    >
      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
        Nouvel event
      </h2>

      {demo && (
        <div
          className="wf-pill is-amber"
          style={{ padding: "8px 12px", fontSize: 12, marginBottom: 12, display: "inline-flex" }}
        >
          {t.admin_engine_demo_disabled}
        </div>
      )}

      <form action={formAction}>
        <div
          className="admin-form-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}
        >
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Nom *
            </label>
            <input
              name="name"
              type="text"
              required
              className="input"
              placeholder="Ex: Digi-Hackathon Fes 2027"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Slug * (minuscules, chiffres, tirets)
            </label>
            <input
              name="slug"
              type="text"
              required
              pattern="[a-z0-9-]+"
              className="input"
              placeholder="Ex: digi-hackathon-fes-2027"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Date debut *
            </label>
            <input
              name="startsAt"
              type="datetime-local"
              required
              className="input"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Date fin *
            </label>
            <input
              name="endsAt"
              type="datetime-local"
              required
              className="input"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Nom de la cohorte *
            </label>
            <input
              name="cohortName"
              type="text"
              required
              className="input"
              placeholder="Ex: Cohorte Fes 2027"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Organisation
            </label>
            <select
              name="organizationId"
              className="select"
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <option value="">— Aucune —</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="wf-row" style={{ gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            className="eic-button eic-button--primary"
            disabled={pending}
          >
            {pending ? "Creation en cours..." : t.admin_engine_create_event}
          </button>
          <button
            type="button"
            className="eic-button"
            onClick={onCreated}
          >
            Annuler
          </button>
        </div>

        {state.message && !state.ok ? (
          <p
            className="form-status form-error"
            role="status"
            style={{ marginTop: 12, fontSize: 13 }}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
