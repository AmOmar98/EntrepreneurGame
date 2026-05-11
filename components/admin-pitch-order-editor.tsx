"use client";
// Design v2 (polish/design-v2-match V10) — GameMaster editor for the pitch
// passage order. Up/down arrows reorder a local list; "Enregistrer" submits
// the JSON-stringified ordered IDs to setPitchOrderFlow which persists to
// events.pitch_order_json. Jury queue + /journey/pitch-prep then read from
// it on next render.
import { useActionState, useState } from "react";
import { setPitchOrderFlow, type WorkflowState } from "@/app/actions";

type PlayerLite = {
  id: string;
  name: string;
  idea: string | null;
};

type Props = {
  eventId: string;
  players: PlayerLite[];
  initialOrder: Record<string, number> | null;
};

const initialState: WorkflowState = { ok: false, message: "" };

function applyInitialOrder(
  players: PlayerLite[],
  initialOrder: Record<string, number> | null,
): PlayerLite[] {
  if (!initialOrder) return [...players].sort((a, b) => a.name.localeCompare(b.name));
  return [...players].sort((a, b) => {
    const sa = initialOrder[a.id];
    const sb = initialOrder[b.id];
    if (typeof sa === "number" && typeof sb === "number") return sa - sb;
    if (typeof sa === "number") return -1;
    if (typeof sb === "number") return 1;
    return a.name.localeCompare(b.name);
  });
}

export function AdminPitchOrderEditor({ eventId, players, initialOrder }: Props) {
  const [ordered, setOrdered] = useState<PlayerLite[]>(() =>
    applyInitialOrder(players, initialOrder),
  );
  const [state, formAction, pending] = useActionState(setPitchOrderFlow, initialState);

  const move = (index: number, delta: -1 | 1) => {
    setOrdered((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const reset = () =>
    setOrdered(applyInitialOrder(players, initialOrder));

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
          <div className="wf-kicker">Ordre de passage · Jury Day 2</div>
          <div className="wf-faint" style={{ fontSize: 11 }}>
            Réordonnez les équipes pour le pitch. L'ordre est partagé avec les jurés et les Players (via /journey/pitch-prep).
          </div>
        </div>
        <span className="wf-grow" />
        <button
          type="button"
          className="wf-btn"
          onClick={reset}
          style={{ fontSize: 12 }}
        >
          Réinitialiser
        </button>
      </header>

      <form action={formAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input
          type="hidden"
          name="orderedPlayerIds"
          value={JSON.stringify(ordered.map((p) => p.id))}
        />
        <input type="hidden" name="publish" value="true" />

        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {ordered.map((p, i) => (
            <li
              key={p.id}
              className="wf-row"
              style={{
                padding: "10px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--wf-line)",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-heading, Baskervville, serif)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--wf-blue)",
                  width: 28,
                  textAlign: "center",
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </span>
              <div className="wf-stack wf-grow" style={{ gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--wf-ink)" }}>
                  {p.name}
                </span>
                {p.idea ? (
                  <span
                    className="wf-faint"
                    style={{
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.idea}
                  </span>
                ) : null}
              </div>
              <div className="wf-row" style={{ gap: 4 }}>
                <button
                  type="button"
                  className="wf-btn"
                  style={{ padding: "4px 10px", fontSize: 14 }}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Monter ${p.name}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="wf-btn"
                  style={{ padding: "4px 10px", fontSize: 14 }}
                  onClick={() => move(i, 1)}
                  disabled={i === ordered.length - 1}
                  aria-label={`Descendre ${p.name}`}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div
          className="wf-row"
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--wf-line)",
            gap: 10,
            background: "var(--wf-paper)",
          }}
        >
          {state.message ? (
            <span
              role="status"
              style={{
                fontSize: 12,
                color: state.ok ? "var(--wf-green)" : "var(--wf-rose)",
              }}
            >
              {state.message}
            </span>
          ) : (
            <span className="wf-faint" style={{ fontSize: 11 }}>
              {ordered.length} équipes
            </span>
          )}
          <span className="wf-grow" />
          <button
            type="submit"
            className="wf-btn is-success"
            disabled={pending}
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            {pending ? "Enregistrement…" : "Enregistrer l'ordre"}
          </button>
        </div>
      </form>
    </section>
  );
}
