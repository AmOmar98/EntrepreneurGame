"use client";
// design-v3 Mockup 1 — Stack de toasts top-right.
// Dérive jusqu'à 3 toasts des derniers events gameFlow ou submissions en revue
// (premier amber = nouvelle soumission, vert = validation, rose = équipe en
// alerte/idle).

import type { AdminLiveTeam, GameFlowEntry, PendingReviewEntry } from "@/lib/admin-live";

type ToastKind = "submission" | "validated" | "alert";

type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  body: string;
  age: string;
};

type Props = {
  flow: GameFlowEntry[];
  pending: PendingReviewEntry[];
  teams: AdminLiveTeam[];
};

const MAX_TOASTS = 3;

export function AdminToastStack({ flow, pending, teams }: Props) {
  const toasts = buildToasts({ flow, pending, teams }).slice(0, MAX_TOASTS);
  if (toasts.length === 0) return null;
  return (
    <div className="eic-live-toasts" aria-live="polite" aria-label="Notifications live">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`eic-live-toast eic-live-toast--${toast.kind}`}
        >
          <span className="eic-live-toast__icon" aria-hidden="true">
            {toastIcon(toast.kind)}
          </span>
          <div className="eic-live-toast__body">
            <div className="eic-live-toast__head">
              <span className="eic-live-toast__title">{toast.title}</span>
              <span className="eic-live-toast__age">{toast.age}</span>
            </div>
            <div className="eic-live-toast__text">{toast.body}</div>
          </div>
        </article>
      ))}
    </div>
  );
}

function buildToasts({
  flow,
  pending,
  teams,
}: {
  flow: GameFlowEntry[];
  pending: PendingReviewEntry[];
  teams: AdminLiveTeam[];
}): ToastItem[] {
  const out: ToastItem[] = [];

  // 1) Soumission la plus récente en attente de revue
  const head = pending[0];
  if (head) {
    out.push({
      id: `pending-${head.submissionId}`,
      kind: "submission",
      title: `${head.playerName} a soumis`,
      body: `${head.missionCode ?? "Livrable"} · ${head.missionTitle ?? "à examiner"}`,
      age: head.minutesAgo < 1 ? "À l'instant" : `${head.minutesAgo} min`,
    });
  }

  // 2) Dernière validation
  const lastValidated = flow.find((e) => e.kind === "validated");
  if (lastValidated) {
    out.push({
      id: `validated-${lastValidated.id}`,
      kind: "validated",
      title: `${lastValidated.team} validé`,
      body: lastValidated.label,
      age: formatAgeFromIso(lastValidated.at),
    });
  }

  // 3) Première équipe stale/idle = alerte "coup d'œil"
  const alertTeam = teams.find((t) => t.state === "stale" || t.state === "idle");
  if (alertTeam) {
    const since = alertTeam.minutesSinceActivity;
    out.push({
      id: `alert-${alertTeam.id}`,
      kind: "alert",
      title: `${alertTeam.name} · alerte`,
      body:
        since !== null
          ? `Aucune activité depuis ${since} min — un coup d'œil ?`
          : "Pas encore démarrée — pense à la motiver.",
      age: since !== null ? `${since} min` : "—",
    });
  }

  return out;
}

function toastIcon(kind: ToastKind): string {
  switch (kind) {
    case "submission":
      return "▸";
    case "validated":
      return "✓";
    case "alert":
      return "!";
  }
}

function formatAgeFromIso(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  return `${h}h`;
}
