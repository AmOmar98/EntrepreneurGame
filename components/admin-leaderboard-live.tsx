"use client";
// design-v3 Mockup 1 — Classement vivant card (col gauche cockpit live).
// Sorted by scoreProject desc. GM-only surface — score visibility OK (R1).

import type { AdminLiveTeam } from "@/lib/admin-live";

type Props = {
  teams: AdminLiveTeam[];
  onSelectTeam: (teamId: string) => void;
};

export function AdminLeaderboardLive({ teams, onSelectTeam }: Props) {
  const sorted = [...teams].sort((a, b) => b.scoreProject - a.scoreProject);
  return (
    <section className="eic-live-leaderboard wf-card">
      <header className="eic-live-leaderboard__head">
        <h2 className="eic-live-leaderboard__title">Classement vivant</h2>
        <span className="wf-pill is-blue" style={{ fontSize: 11 }}>
          ● temps réel
        </span>
      </header>
      {sorted.length === 0 ? (
        <p className="eic-live-leaderboard__empty">Aucune équipe en jeu.</p>
      ) : (
        <ol className="eic-live-leaderboard__list">
          {sorted.map((team, idx) => (
            <li key={team.id} className="eic-live-leaderboard__item">
              <button
                type="button"
                className="eic-live-leaderboard__row"
                onClick={() => onSelectTeam(team.id)}
              >
                <span
                  className={`eic-live-leaderboard__rank eic-live-leaderboard__rank--${rankTone(idx + 1)}`}
                  aria-label={`Rang ${idx + 1}`}
                >
                  {idx + 1}
                </span>

                <div className="eic-live-leaderboard__identity">
                  <div className="eic-live-leaderboard__name-row">
                    <span className="eic-live-leaderboard__name">{team.name}</span>
                    {team.state === "stale" || team.state === "idle" ? (
                      <span className="wf-pill is-amber" style={{ fontSize: 10 }}>
                        silencieuse
                      </span>
                    ) : null}
                  </div>
                  <div className="eic-live-leaderboard__members">
                    <span className="eic-live-leaderboard__avatars">
                      {team.memberInitials.slice(0, 3).map((init, i) => (
                        <span
                          key={`${init}-${i}`}
                          className={`eic-live-leaderboard__avatar eic-live-leaderboard__avatar--${i % 4}`}
                        >
                          {init}
                        </span>
                      ))}
                      {team.memberInitials.length > 3 ? (
                        <span className="eic-live-leaderboard__avatar eic-live-leaderboard__avatar--more">
                          +{team.memberInitials.length - 3}
                        </span>
                      ) : null}
                    </span>
                    <span className="eic-live-leaderboard__members-count">
                      {team.membersCount} pers.
                    </span>
                  </div>
                </div>

                <div className="eic-live-leaderboard__progress">
                  <div className="eic-live-leaderboard__progress-meta">
                    <span className="eic-live-leaderboard__level">
                      L{team.level}
                    </span>
                    <span className="eic-live-leaderboard__livrables">
                      · {team.validatedCount}/{team.submittedCount || 0} livrables
                    </span>
                  </div>
                  <div className="eic-live-leaderboard__bar" aria-hidden="true">
                    <div
                      className="eic-live-leaderboard__bar-fill"
                      style={{
                        width: `${Math.min(100, (team.level / 7) * 100)}%`,
                      }}
                    />
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span
                        key={i}
                        className="eic-live-leaderboard__bar-tick"
                        style={{ left: `${((i + 1) / 8) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="eic-live-leaderboard__score">
                  <div className="eic-live-leaderboard__score-value">
                    {Math.round(team.scoreProject)}
                  </div>
                  <div className="eic-live-leaderboard__score-delta">
                    {deltaCopy(team)}
                  </div>
                </div>

                <span
                  className={`eic-live-leaderboard__status eic-live-leaderboard__status--${team.state}`}
                >
                  ● {stateLabel(team)}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function rankTone(rank: number): "gold" | "silver" | "bronze" | "ghost" {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "ghost";
}

function stateLabel(team: AdminLiveTeam): string {
  if (team.state === "active") {
    return team.submittedCount > team.validatedCount ? "en revue" : "en mission";
  }
  if (team.state === "stale") return "en pause";
  return "silencieuse";
}

function deltaCopy(team: AdminLiveTeam): string {
  if (team.state === "stale" || team.state === "idle") return "— stagne";
  // Approximation visuelle — pas une vraie vélocité (donnée non tracée).
  const delta = Math.max(0, team.validatedCount * 20);
  return delta > 0 ? `+${delta} XP / 1h` : "+0 XP / 1h";
}
