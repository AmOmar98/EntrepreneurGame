"use client";
// design-v3 Mockup 2 — Accomplissement débloqué (overlay GM).
// Visual celebration screen triggered manually from AdminTeamFocus CTA
// "Célébrer". GM-only — score/rank visibility OK (R1 cardinal authorise GM).
// No auto-trigger on level-up (would require an event tracker on the server,
// out of scope for the design-v3 polish).

import { useEffect, useRef } from "react";
import type { AdminLiveTeam } from "@/lib/admin-live";

type Props = {
  team: AdminLiveTeam;
  rank: number;
  combo: number;
  xpGained: number;
  onClose: () => void;
};

export function AdminAchievementUnlocked({
  team,
  rank,
  combo,
  xpGained,
  onClose,
}: Props) {
  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    focusRef.current?.focus();
  }, []);

  const levelTag = `L${team.level}`;
  const verb = team.level >= 4 ? "atteint" : "franchit";
  const target = levelStoryTitle(team.level);

  return (
    <div
      className="eic-achievement__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Accomplissement débloqué — ${team.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      ref={focusRef}
      tabIndex={-1}
    >
      <div className="eic-achievement">
        <button
          type="button"
          onClick={onClose}
          className="eic-achievement__close"
          aria-label="Fermer"
        >
          ×
        </button>

        <span className="eic-achievement__badge">
          <span aria-hidden="true">🎉</span>
          <span>ACCOMPLISSEMENT DÉBLOQUÉ</span>
        </span>

        <div className="eic-achievement__level" aria-hidden="true">
          {levelTag}
        </div>

        <h1 className="eic-achievement__title">
          <span className="eic-achievement__title-name">{team.name}</span>{" "}
          {verb} <em className="eic-achievement__title-target">{target}</em>.
        </h1>

        <p className="eic-achievement__subtitle">
          {comboStory(combo, xpGained)}
        </p>

        <div className="eic-achievement__stats">
          <div className="eic-achievement__stat">
            <div className="eic-achievement__stat-label">Combo</div>
            <div className="eic-achievement__stat-value">
              {combo > 0 ? `×${combo}` : "×1"}
            </div>
          </div>
          <div className="eic-achievement__stat">
            <div className="eic-achievement__stat-label">XP gagnés</div>
            <div className="eic-achievement__stat-value">
              +{xpGained > 0 ? xpGained : 80}
            </div>
          </div>
          <div className="eic-achievement__stat">
            <div className="eic-achievement__stat-label">Rang</div>
            <div className="eic-achievement__stat-value">
              #{rank.toString().padStart(1, "0")}
            </div>
          </div>
        </div>

        <div className="eic-achievement__cta-row">
          <button
            type="button"
            className="eic-achievement__cta eic-achievement__cta--secondary"
            onClick={onClose}
          >
            Annoncer dans le live
          </button>
          <button
            type="button"
            className="eic-achievement__cta eic-achievement__cta--primary"
            onClick={onClose}
          >
            Retour au tableau →
          </button>
        </div>
      </div>
    </div>
  );
}

function levelStoryTitle(level: number): string {
  switch (level) {
    case 0: return "le Diagnostic";
    case 1: return "le Problème";
    case 2: return "la Cible";
    case 3: return "la Découverte";
    case 4: return "la Solution";
    case 5: return "le Test";
    case 6: return "le Pitch";
    case 7: return "le statut Alumni";
    default: return "une nouvelle étape";
  }
}

function comboStory(combo: number, xpGained: number): string {
  if (combo >= 3) {
    return `Première équipe à franchir cette étape. Combo de ${combo} livrables validés en 1 heure.`;
  }
  if (combo >= 1) {
    return `${combo} livrable${combo > 1 ? "s" : ""} validé${combo > 1 ? "s" : ""} sur la dernière heure — l'équipe accélère.`;
  }
  if (xpGained > 0) {
    return "L'équipe enchaîne — un moment à marquer dans le fil du jeu.";
  }
  return "Étape débloquée — partage l'élan avec le reste de la cohorte.";
}
