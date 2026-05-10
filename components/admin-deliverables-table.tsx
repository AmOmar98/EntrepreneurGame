"use client";
// Phase 9 / GMR-06 — Admin deliverable templates table with is_active toggle.
import { useActionState, useEffect, useRef, useState } from "react";
import { toggleDeliverableActiveFlow, type WorkflowState } from "@/app/actions";
import type { AdminDeliverableRow } from "@/lib/admin-deliverables";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type Props = {
  rows: AdminDeliverableRow[];
};

export function AdminDeliverablesTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="eic-admin-deliverables__empty">{t.admin_deliverables_empty}</p>
    );
  }
  return (
    <div className="eic-admin-deliverables__table-wrap">
      <table className="eic-admin-deliverables__table">
        <thead>
          <tr>
            <th scope="col">{t.admin_deliverables_col_level}</th>
            <th scope="col">{t.admin_deliverables_col_code}</th>
            <th scope="col">{t.admin_deliverables_col_title}</th>
            <th scope="col">{t.admin_deliverables_col_max}</th>
            <th scope="col">{t.admin_deliverables_col_active}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <DeliverableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeliverableRow({ row }: { row: AdminDeliverableRow }) {
  const [state, formAction, pending] = useActionState(
    toggleDeliverableActiveFlow,
    initialState,
  );
  // Optimistic local state so the UI reacts before the server round-trips.
  const [optimistic, setOptimistic] = useState<boolean>(row.isActive);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Sync to server-confirmed state when revalidatePath redraws the row.
  useEffect(() => {
    setOptimistic(row.isActive);
  }, [row.isActive]);

  const next = !optimistic;
  const rowClass = optimistic
    ? "eic-admin-deliverables__row"
    : "eic-admin-deliverables__row eic-admin-deliverables__row--inactive";

  return (
    <tr className={rowClass}>
      <td>
        <span className="eic-admin-deliverables__level">{row.levelLabel}</span>
      </td>
      <td>
        <code className="eic-admin-deliverables__code">{row.slug}</code>
      </td>
      <td>
        <div className="eic-admin-deliverables__title">{row.title}</div>
        {row.missionTitle ? (
          <div className="eic-admin-deliverables__mission">{row.missionTitle}</div>
        ) : null}
      </td>
      <td>{row.maxScore}</td>
      <td>
        <form
          action={formAction}
          ref={formRef}
          className="eic-admin-deliverables__toggle-form"
        >
          <input name="templateId" type="hidden" value={row.id} />
          <input name="nextActive" type="hidden" value={next ? "true" : "false"} />
          <button
            aria-label={
              next ? t.admin_deliverable_toggle_on : t.admin_deliverable_toggle_off
            }
            aria-pressed={optimistic}
            className={
              optimistic
                ? "eic-toggle-switch eic-toggle-switch--on"
                : "eic-toggle-switch"
            }
            disabled={pending}
            onClick={() => setOptimistic(next)}
            type="submit"
          >
            <span className="eic-toggle-switch__track" aria-hidden="true">
              <span className="eic-toggle-switch__thumb" />
            </span>
            <span className="eic-toggle-switch__label">
              {optimistic ? t.admin_deliverable_active : t.admin_deliverable_inactive}
            </span>
          </button>
        </form>
        {state.message ? (
          <p
            className={
              state.ok
                ? "eic-admin-deliverables__toggle-msg eic-admin-deliverables__toggle-msg--ok"
                : "eic-admin-deliverables__toggle-msg eic-admin-deliverables__toggle-msg--err"
            }
            role="status"
          >
            {state.message}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
