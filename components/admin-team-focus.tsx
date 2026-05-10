"use client";
// Phase 9 / GMR-03 — Editorial focus view for one team.
// Modal-style overlay opened from the radar. Layout: large rank watermark,
// Baskervville title, italic idea quote, member avatars, vital stats strip,
// activity sidebar.

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const lastActivityLabel =
    team.minutesSinceActivity === null
      ? t.admin_team_focus_no_activity
      : t.admin_team_focus_minutes_ago.replace(
          "{n}",
          String(team.minutesSinceActivity),
        );

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
      <div className="eic-admin-focus">
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
          {t.admin_team_focus_back}
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
              {stateLabel}
            </span>
            <span
              className="eic-admin-focus__pill"
              aria-label={`${t.admin_team_focus_rank} ${rank}`}
            >
              #{rank.toString().padStart(2, "0")}
            </span>
          </div>

          <h1 className="eic-admin-focus__title">
            {team.name}
            <em>« {team.idea ?? t.admin_team_focus_no_idea} »</em>
          </h1>

          {team.idea ? (
            <p className="eic-admin-focus__quote">{team.idea}</p>
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

          <div className="eic-admin-focus__stats">
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">
                {t.admin_team_focus_score}
              </div>
              <div className="eic-admin-focus__stat-value">
                {Math.round(team.scoreProject)}
              </div>
              <div className="eic-admin-focus__stat-unit">XP</div>
            </div>
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">
                {t.admin_team_focus_level}
              </div>
              <div className="eic-admin-focus__stat-value">L{team.level}</div>
              <div className="eic-admin-focus__stat-unit">{team.currentLevel}</div>
            </div>
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">
                {t.admin_team_focus_submissions}
              </div>
              <div className="eic-admin-focus__stat-value">
                {team.submittedCount}
              </div>
              <div className="eic-admin-focus__stat-unit">
                {t.admin_team_focus_validated}: {team.validatedCount}
              </div>
            </div>
            <div className="eic-admin-focus__stat">
              <div className="eic-admin-focus__stat-label">
                {t.admin_team_focus_last_activity}
              </div>
              <div className="eic-admin-focus__stat-value">
                {team.minutesSinceActivity === null
                  ? "—"
                  : team.minutesSinceActivity}
              </div>
              <div className="eic-admin-focus__stat-unit">
                {lastActivityLabel}
              </div>
            </div>
          </div>

          <div className="eic-admin-focus__cta-row">
            <Link
              className="eic-admin-focus__cta"
              href={`/admin/players/${team.id}`}
            >
              {t.admin_team_focus_open_detail} →
            </Link>
            <Link
              className="eic-admin-focus__cta eic-admin-focus__cta--secondary"
              href={`/admin/announce?targets=${team.id}`}
            >
              {t.admin_microaction_celebrate}
            </Link>
          </div>
        </div>

        <aside className="eic-admin-focus__side">
          <h2 className="eic-admin-focus__side-title">
            {t.admin_game_flow_title}
          </h2>
          {activity.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: "var(--home-muted, #617084)",
                fontStyle: "italic",
              }}
            >
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
                    {formatHm(entry.at)}
                  </span>
                  {entry.label}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function formatHm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
