"use client";
// design-v3 Mockup 1 — File de revue card (col droite cockpit live).
// Globale — affichée pour tous mentors + GM/admin sans filtre d'assignment
// (cf. user spec 2026-05-12).

import Link from "next/link";
import type { PendingReviewEntry } from "@/lib/admin-live";

type Props = {
  pending: PendingReviewEntry[];
};

export function AdminReviewQueue({ pending }: Props) {
  return (
    <aside className="eic-live-queue wf-card">
      <header className="eic-live-queue__head">
        <h2 className="eic-live-queue__title">File de revue</h2>
        {pending.length > 0 ? (
          <span className="wf-pill is-amber" style={{ fontSize: 11 }}>
            {pending.length} en attente
          </span>
        ) : null}
      </header>

      {pending.length === 0 ? (
        <p className="eic-live-queue__empty">Aucune soumission en attente.</p>
      ) : (
        <ol className="eic-live-queue__list">
          {pending.map((entry) => (
            <li key={entry.submissionId} className="eic-live-queue__item">
              <div className="eic-live-queue__item-head">
                <span className="eic-live-queue__code wf-mono">
                  {entry.missionCode ?? (entry.isV2 ? "V2" : "V1")}
                </span>
                <span className="eic-live-queue__time">
                  {formatAgo(entry.minutesAgo)}
                </span>
              </div>
              <div className="eic-live-queue__title-row">
                {entry.missionTitle ?? "Livrable"}
              </div>
              <div className="eic-live-queue__team">
                Équipe <strong>{entry.playerName}</strong>
                {entry.memberInitials.length > 0
                  ? " · " + entry.memberInitials.join(" · ")
                  : null}
              </div>
              <div className="eic-live-queue__actions">
                <Link
                  className="wf-btn eic-live-queue__btn"
                  href={`/admin/players/${entry.playerId}`}
                >
                  Assigner
                </Link>
                <Link
                  className="wf-btn is-primary eic-live-queue__btn"
                  href={`/mentor/submission/${entry.submissionId}`}
                >
                  Réviser →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function formatAgo(minutes: number): string {
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
