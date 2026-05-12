"use client";
// Phase 9 / GMR-03 — Editorial focus view for one team.
// design-v3 Mockup 3 (2026-05-12) — refonte éditoriale alignée maquette
// "Focus équipe : Atlas". Le H1 se découpe en `{name}` ink + verb phrase
// italique rose dérivée du `team.state`. La sidebar active une vraie
// timeline d'activité, complétée d'un watermark vertical des niveaux.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminAchievementUnlocked } from "@/components/admin-achievement-unlocked";
import type { AdminLiveTeam, GameFlowEntry } from "@/lib/admin-live";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  team: AdminLiveTeam;
  rank: number; // 1-based rank in cohort by scoreProject
  activity: GameFlowEntry[]; // already filtered for this team
  onClose: () => void;
};

export function AdminTeamFocus({ team, rank, activity, onClose }: Props) {
  const [celebrateOpen, setCelebrateOpen] = useState(false);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (celebrateOpen) setCelebrateOpen(false);
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, celebrateOpen]);

  // A11y: save trigger element, autoFocus modal, restore focus on unmount.
  const focusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    focusRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  const stateClass =
    team.state === "active"
      ? "eic-admin-focus__pill--active"
      : team.state === "stale"
        ? "eic-admin-focus__pill--stale"
        : "eic-admin-focus__pill--idle";
  const stateLabel =
    team.state === "active"
      ? t.admin_team_focus_state_active
      : team.state === "stale"
        ? t.admin_team_focus_state_stale
        : t.admin_team_focus_state_idle;

  // design-v3 Mockup 3 — pithy verb phrase derived from team state × rank.
  // Replaces the literal idea quote that lived in the H1 originally; the
  // idea itself stays just below in a proper blockquote.
  const verbPhrase = pickVerbPhrase(team, rank);

  // design-v3 — derive an XP/h "élan" + combo count from the filtered
  // activity. Approximation only (no velocity column server-side), good
  // enough for the editorial feel of the mock-up.
  const { elan, combo } = useMemo(() => {
    const oneHourAgo = Date.now() - 60 * 60_000;
    let validated = 0;
    let submissions = 0;
    for (const e of activity) {
      const t = new Date(e.at).getTime();
      if (!Number.isFinite(t) || t < oneHourAgo) continue;
      if (e.kind === "validated") validated += 1;
      if (e.kind === "submission_v1" || e.kind === "submission_v2") submissions += 1;
    }
    return { elan: validated * 80 + submissions * 20, combo: validated };
  }, [activity]);

  return (
    <div
      className="eic-admin-focus__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t.admin_team_focus_aria}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      ref={focusRef}
      tabIndex={-1}
    >
      <div className="eic-admin-focus eic-admin-focus--v3">
        <span
          className="eic-admin-focus__rank-watermark"
          aria-hidden="true"
        >
          {rank.toString().padStart(2, "0")}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="eic-admin-focus__back"
          aria-label={t.admin_team_focus_back}
        >
          ← Toutes les équipes
        </button>
        <button
          type="button"
          onClick={onClose}
          className="eic-admin-focus__close"
          aria-label={t.admin_team_focus_close}
        >
          ×
        </button>

        <div className="eic-admin-focus__main">
          <div className="eic-admin-focus__pills">
            <span className={`eic-admin-focus__pill ${stateClass}`}>
              ● {stateLabel}
            </span>
            {team.submittedCount > team.validatedCount ? (
              <span className="eic-admin-focus__pill eic-admin-focus__pill--review">
                ! soumission en revue
              </span>
            ) : null}
            <span
              className="eic-admin-focus__pill eic-admin-focus__pill--ghost"
              aria-label={`${t.admin_team_focus_rank} ${rank}`}
            >
              équipe #{team.slug || team.name.toLowerCase()} · {team.membersCount} membres
            </span>
          </div>

          <h1 className="eic-admin-focus__title eic-admin-focus__title--v3">
            <span className="eic-admin-focus__title-name">{team.name}</span>
            <em className="eic-admin-focus__title-verb">{verbPhrase}</em>
          </h1>

          {team.idea ? (
            <p className="eic-admin-focus__quote">« {team.idea} »</p>
          ) : null}

          <div className="eic-admin-focus__avatars">
            <div className="eic-admin-focus__avatars-cluster">
              {team.memberInitials.length === 0 ? (
                <span className="eic-admin-focus__avatar eic-admin-focus__avatar--0">
                  ??
                </span>
              ) : (
                team.memberInitials.map((init, i) => (
                  <span
                    key={`${init}-${i}`}
                    className={`eic-admin-focus__avatar eic-admin-focus__avatar--${i % 4}`}
                  >
                    {init}
                  </span>
                ))
              )}
            </div>
            <span className="eic-admin-focus__members-count">
              {team.membersCount} pers.
            </span>
          </div>

          <div className="eic-admin-focus__stats eic-admin-focus__stats--v3">
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">XP</div>
              <div className="eic-admin-focus__stat-value">
                {Math.round(team.scoreProject)}
              </div>
              <div className="eic-admin-focus__stat-unit">/ 2000</div>
            </div>
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">Niveau</div>
              <div className="eic-admin-focus__stat-value">L{team.level}</div>
              <div className="eic-admin-focus__stat-unit">
                {levelTitle(team.level)}
              </div>
            </div>
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">Élan</div>
              <div className="eic-admin-focus__stat-value">
                {elan > 0 ? `+${elan}` : "—"}
              </div>
              <div className="eic-admin-focus__stat-unit">XP / heure</div>
            </div>
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">Combo</div>
              <div className="eic-admin-focus__stat-value">
                {combo > 0 ? `×${combo}` : "—"}
              </div>
              <div className="eic-admin-focus__stat-unit">validés 1h</div>
            </div>
          </div>

          <div className="eic-admin-focus__cta-row">
            <Link
              className="eic-admin-focus__cta"
              href={`/admin/players/${team.id}`}
            >
              {t.admin_team_focus_open_detail} →
            </Link>
            <button
              type="button"
              className="eic-admin-focus__cta eic-admin-focus__cta--secondary"
              onClick={() => setCelebrateOpen(true)}
            >
              🎉 Célébrer
            </button>
          </div>
        </div>

        <aside className="eic-admin-focus__side eic-admin-focus__side--v3">
          <div
            className="eic-admin-focus__levels"
            aria-hidden="true"
            data-current={team.level}
          >
            {[7, 6, 5, 4, 3, 2, 1, 0].map((lv) => (
              <span
                key={lv}
                className={
                  "eic-admin-focus__level-marker" +
                  (lv === team.level ? " is-current" : "") +
                  (lv < team.level ? " is-done" : "")
                }
              >
                {lv === team.level
                  ? lv
                  : lv < team.level
                    ? "✓"
                    : ""}
              </span>
            ))}
          </div>
          <h2 className="eic-admin-focus__side-title">
            ▲ Pitch <span className="eic-admin-focus__side-title-kicker">· ACTIVITÉ · 1h</span>
          </h2>
          {activity.length === 0 ? (
            <p className="eic-admin-focus__activity-empty">
              {t.admin_game_flow_empty}
            </p>
          ) : (
            <ul className="eic-admin-focus__activity">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className={`eic-admin-focus__activity-item eic-admin-focus__activity-item--${entry.tone}`}
                >
                  <span className="eic-admin-focus__activity-time">
                    {formatHm(entry.at)}{" "}
                    <strong>{entryKindWord(entry)}</strong>
                  </span>
                  {entry.label}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {celebrateOpen ? (
        <AdminAchievementUnlocked
          team={team}
          rank={rank}
          combo={combo}
          xpGained={elan}
          onClose={() => setCelebrateOpen(false)}
        />
      ) : null}
    </div>
  );
}

function pickVerbPhrase(team: AdminLiveTeam, rank: number): string {
  if (team.state === "idle") return "attend son tour.";
  if (team.state === "stale") return "ralentit le souffle.";
  if (rank === 1) return "tient le rythme.";
  if (rank <= 3) return "garde le tempo.";
  return "remonte la pente.";
}

function levelTitle(level: number): string {
  switch (level) {
    case 0: return "Diagnostic";
    case 1: return "Problème";
    case 2: return "Cible";
    case 3: return "Découverte";
    case 4: return "Solution";
    case 5: return "Test";
    case 6: return "Pitch";
    case 7: return "Alumni";
    default: return "—";
  }
}

function entryKindWord(entry: GameFlowEntry): string {
  switch (entry.kind) {
    case "submission_v1":
    case "submission_v2":
      return "soumission";
    case "validated":
      return "+80 XP";
    case "evaluation":
      return "verdict";
    case "comment":
      return "feedback";
    default:
      return "—";
  }
}

function formatHm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
