"use client";
// quick-260519-jpr Wave 3 - GameMaster jurors manager.
// Renders the current jurors list with a per-row "Retirer" button (confirm)
// and an "Ajouter" form (email input). Both flows wired to addJurorFlow /
// removeJurorFlow server actions. Empty state shows an amber warn (no juror
// = no one can vote on /jury).
//
// The jurors prop is intentionally minimal — Wave 3 chose userId+invitedAt
// only (no auth.users join via service-role for the list) to keep the page
// load cheap. The displayName/email may be null and we fallback to a
// truncated userId, which is acceptable for a 4-person GM-only surface.

import { useActionState, useRef } from "react";
import { addJurorFlow, removeJurorFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };

type JurorView = {
  userId: string;
  email: string | null;
  displayName: string | null;
  invitedAt: string;
};

type Props = {
  eventId: string;
  jurors: JurorView[];
};

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export function AdminJurorsManager({ eventId, jurors }: Props) {
  const [addState, addAction, addPending] = useActionState(addJurorFlow, initialState);
  const [removeState, removeAction, removePending] = useActionState(
    removeJurorFlow,
    initialState,
  );
  const emailRef = useRef<HTMLInputElement>(null);

  const handleRemove =
    (juror: JurorView) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      const label = juror.email ?? juror.displayName ?? shortId(juror.userId);
      if (!window.confirm(`Retirer ${label} du jury ?`)) {
        e.preventDefault();
      }
    };

  return (
    <section className="wf-card" style={{ marginBottom: 20, overflow: "hidden" }}>
      <header
        className="wf-row"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--wf-line)",
          gap: 10,
          background: "var(--wf-paper-deep)",
        }}
      >
        <div className="wf-stack" style={{ gap: 2 }}>
          <div className="wf-kicker">{t.admin_jurors_section_title}</div>
          <div className="wf-faint" style={{ fontSize: 11 }}>
            {t.admin_jurors_help}
          </div>
        </div>
        <span className="wf-grow" />
        <span className="wf-pill is-blue" style={{ fontSize: 11 }}>
          {jurors.length} {jurors.length === 1 ? "juror" : "jurors"}
        </span>
      </header>

      {/* List */}
      {jurors.length === 0 ? (
        <div
          className="wf-pill is-amber"
          style={{
            margin: 16,
            padding: "10px 14px",
            fontSize: 12,
            width: "auto",
            display: "inline-flex",
          }}
        >
          {t.admin_jurors_empty}
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {jurors.map((juror, i) => {
            const label = juror.displayName ?? juror.email ?? shortId(juror.userId);
            const sub = juror.email && juror.displayName ? juror.email : null;
            return (
              <li
                key={juror.userId}
                className="wf-row"
                style={{
                  padding: "10px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--wf-line)",
                  gap: 12,
                }}
              >
                <div className="wf-stack wf-grow" style={{ gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--wf-ink)" }}>
                    {label}
                  </span>
                  {sub ? (
                    <span className="wf-faint" style={{ fontSize: 11 }}>
                      {sub}
                    </span>
                  ) : null}
                </div>
                <form action={removeAction} onSubmit={handleRemove(juror)}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="userId" value={juror.userId} />
                  <button
                    type="submit"
                    className="wf-btn"
                    disabled={removePending}
                    style={{
                      fontSize: 12,
                      color: "var(--wf-rose, #b91c1c)",
                      borderColor: "var(--wf-rose, #b91c1c)",
                    }}
                  >
                    {t.admin_jurors_remove_label}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add form */}
      <form
        action={addAction}
        className="wf-row"
        style={{
          padding: "12px 16px",
          gap: 10,
          borderTop: "1px solid var(--wf-line)",
          background: "var(--wf-paper)",
          flexWrap: "wrap",
        }}
      >
        <input type="hidden" name="eventId" value={eventId} />
        <label className="wf-stack wf-grow" style={{ gap: 4, minWidth: 220 }}>
          <span className="wf-kicker" style={{ fontSize: 10 }}>
            {t.admin_jurors_add_label}
          </span>
          <input
            ref={emailRef}
            type="email"
            name="email"
            required
            placeholder="prenom.nom@example.com"
            style={{
              padding: "8px 10px",
              border: "1px solid var(--wf-line)",
              borderRadius: 6,
              fontSize: 13,
            }}
          />
        </label>
        <button
          type="submit"
          className="wf-btn is-primary"
          disabled={addPending}
          style={{ padding: "8px 16px", fontSize: 13, alignSelf: "flex-end" }}
        >
          {addPending ? "Ajout…" : "Ajouter"}
        </button>
      </form>

      {addState.message ? (
        <div
          role="status"
          style={{
            padding: "8px 16px 14px",
            fontSize: 12,
            color: addState.ok ? "var(--wf-green)" : "var(--wf-rose)",
          }}
        >
          {addState.message}
        </div>
      ) : null}
      {removeState.message ? (
        <div
          role="status"
          style={{
            padding: "0 16px 14px",
            fontSize: 12,
            color: removeState.ok ? "var(--wf-green)" : "var(--wf-rose)",
          }}
        >
          {removeState.message}
        </div>
      ) : null}
    </section>
  );
}
