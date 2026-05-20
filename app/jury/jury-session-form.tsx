"use client";

// quick-260520-124 V4 — session mode jury (dark theater layout).
// Layout 2-col : left = team header + timer + deliverable links + queue ;
// right = juror card + 5 critères /5 + commentaires + CTA + autres jurés.
//
// Score UI 1-5 mappe sur DB 0-20 (step 4) : 1→4, 2→8, 3→12, 4→16, 5→20.
// Lib jury aggregate restera /100 inchangé (sum*5/4 quand c5=0).
//
// R1 OK : pas de rank/leaderboard. Score Player-facing seulement sur détail livrable.
// R2 OK : pas de nouveau validator ; Zod côté server reste warn-only.

import { useActionState, useState } from "react";
import { savePitchScoreFlow, type WorkflowState } from "@/app/actions";
import type { dictionaries } from "@/lib/i18n";
import type {
  JuryAggregate,
  PitchScoreWithComments,
  SubmissionRef,
} from "@/lib/jury";
import type { Player } from "@/lib/types";
import { JuryVerdictPills } from "@/components/jury-verdict-pills";

const initialState: WorkflowState = { ok: false, message: "" };

type Dict = (typeof dictionaries)["fr"];

export type JurorBadgeInfo = {
  fullName: string;
  role?: string | null;
};

export type OtherJurorProgress = {
  fullName: string;
  criteriaScored: number;
  total: number;
};

export type QueueEntry = {
  name: string;
  etaMinutes: number | null;
  level: string;
};

type Props = {
  player: Player;
  existing: PitchScoreWithComments | null;
  eventId: string;
  dict: Dict;
  /** Cross-juror aggregate (populated only when pitch_mode_state === 'closed'). */
  aggregate?: JuryAggregate | null;
  juror: JurorBadgeInfo;
  position: { current: number; total: number };
  submissions: SubmissionRef[];
  otherJurors: OtherJurorProgress[];
  upNext: QueueEntry[];
  /** Static label rendered in topbar (event name + level). */
  topbarLabel?: string;
  /** quick-260520-124 V4 — href vers l'équipe précédente (null si première). */
  navPrevHref?: string | null;
  /** quick-260520-124 V4 — href vers l'équipe suivante (null si dernière). */
  navNextHref?: string | null;
  /** quick-260520-124 V4 — toutes les équipes pour navigation directe. */
  teamsList?: ReadonlyArray<{
    idx: number;
    name: string;
    level: string;
    scored: boolean;
    isCurrent: boolean;
  }>;
};

// ---------------------------------------------------------------------------
// Score mapping helpers — UI is 1..5, DB stores 0..20 (step 4).
// ---------------------------------------------------------------------------

function uiToDb(ui: number): number {
  if (ui <= 0) return 0;
  if (ui >= 5) return 20;
  return ui * 4;
}

function dbToUi(db: number): number {
  if (db <= 0) return 0;
  if (db >= 20) return 5;
  return Math.round(db / 4);
}

// ---------------------------------------------------------------------------
// Submission status badge — short FR label.
// ---------------------------------------------------------------------------

function statusBadgeLabel(status: SubmissionRef["status"]): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "submitted_v1":
      return "Soumis v1";
    case "feedback_received":
      return "Retour reçu";
    case "submitted_v2":
      return "Soumis v2";
    case "validated":
      return "Validé";
    case "rejected":
      return "Rejeté";
    default:
      return status;
  }
}

function levelShort(levelId: string): string {
  // L1_problem → L1
  const m = levelId.match(/^L(\d+)/);
  return m ? `L${m[1]}` : levelId;
}

// ---------------------------------------------------------------------------
// JurySessionForm — main client component.
// ---------------------------------------------------------------------------

export function JurySessionForm({
  player,
  existing,
  eventId,
  dict,
  juror,
  position,
  submissions,
  otherJurors,
  upNext,
  topbarLabel,
  aggregate,
  navPrevHref,
  navNextHref,
  teamsList,
}: Props) {
  const [state, formAction, pending] = useActionState(
    savePitchScoreFlow,
    initialState,
  );

  // c1..c5 stored in UI scale 0..5 ; converted to DB 0..20 on submit.
  const [c1, setC1] = useState<number>(dbToUi(existing?.c1 ?? 0));
  const [c2, setC2] = useState<number>(dbToUi(existing?.c2 ?? 0));
  const [c3, setC3] = useState<number>(dbToUi(existing?.c3 ?? 0));
  const [c4, setC4] = useState<number>(dbToUi(existing?.c4 ?? 0));
  const [c5, setC5] = useState<number>(dbToUi(existing?.c5 ?? 0));

  const [commentC1, setCommentC1] = useState<string>(existing?.commentC1 ?? "");
  const [commentC2, setCommentC2] = useState<string>(existing?.commentC2 ?? "");
  const [commentC3, setCommentC3] = useState<string>(existing?.commentC3 ?? "");
  const [commentC4, setCommentC4] = useState<string>(existing?.commentC4 ?? "");
  const [commentC5, setCommentC5] = useState<string>(existing?.commentC5 ?? "");
  const [commentGlobal, setCommentGlobal] = useState<string>(
    existing?.commentGlobal ?? "",
  );

  const criteria: ReadonlyArray<{
    key: "c1" | "c2" | "c3" | "c4" | "c5";
    label: string;
    help: string;
    value: number;
    setter: (n: number) => void;
    comment: string;
    setComment: (s: string) => void;
  }> = [
    {
      key: "c1",
      label: dict.jury_c1_label,
      help: dict.jury_c1_help,
      value: c1,
      setter: setC1,
      comment: commentC1,
      setComment: setCommentC1,
    },
    {
      key: "c2",
      label: dict.jury_c2_label,
      help: dict.jury_c2_help,
      value: c2,
      setter: setC2,
      comment: commentC2,
      setComment: setCommentC2,
    },
    {
      key: "c3",
      label: dict.jury_c3_label,
      help: dict.jury_c3_help,
      value: c3,
      setter: setC3,
      comment: commentC3,
      setComment: setCommentC3,
    },
    {
      key: "c4",
      label: dict.jury_c4_label,
      help: dict.jury_c4_help,
      value: c4,
      setter: setC4,
      comment: commentC4,
      setComment: setCommentC4,
    },
    {
      key: "c5",
      // jury_c5_label is "" since c5 retired in V1/V3 ; we revive it for V4.
      label: dict.jury_c5_label || "Présentation",
      help: dict.jury_c5_help || "Clarté, ton, structure du pitch.",
      value: c5,
      setter: setC5,
      comment: commentC5,
      setComment: setCommentC5,
    },
  ];

  const done = criteria.filter((c) => c.value > 0).length;
  const total = criteria.length;
  const progressLabel = dict.jury_session_criteria_progress
    .replace("{done}", String(done))
    .replace("{total}", String(total));

  const ctaLabel = dict.jury_session_validate_cta.replace(
    "{team}",
    player.name,
  );
  const positionLabel = dict.jury_session_team_position
    .replace("{ordinal}", String(position.current))
    .replace("{total}", String(position.total));

  const initials = player.name.charAt(0).toUpperCase();
  const jurorInitials = juror.fullName
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <form action={formAction} className="eic-jury-session">
      <input type="hidden" name="playerId" value={player.id} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="c1" value={uiToDb(c1)} />
      <input type="hidden" name="c2" value={uiToDb(c2)} />
      <input type="hidden" name="c3" value={uiToDb(c3)} />
      <input type="hidden" name="c4" value={uiToDb(c4)} />
      <input type="hidden" name="c5" value={uiToDb(c5)} />
      <input type="hidden" name="commentC1" value={commentC1} />
      <input type="hidden" name="commentC2" value={commentC2} />
      <input type="hidden" name="commentC3" value={commentC3} />
      <input type="hidden" name="commentC4" value={commentC4} />
      <input type="hidden" name="commentC5" value={commentC5} />
      <input type="hidden" name="commentGlobal" value={commentGlobal} />

      {/* ---------------- Topbar ---------------- */}
      <header className="eic-jury-session__topbar">
        <div className="eic-jury-session__topbar-brand">
          <strong>Entrepreneur Game</strong>
          <span className="eic-jury-session__topbar-event">
            {topbarLabel ??
              `${dict.jury_session_mode_label} · ${dict.jury_session_topbar_event}`}
          </span>
        </div>
        <div className="eic-jury-session__topbar-actions">
          <span className="eic-jury-session__live-pill" aria-hidden="true">
            LIVE · {dict.jury_session_live_pitch}
          </span>
          <span className="eic-jury-session__timer" aria-hidden="true">
            04:12<span>/5:00</span>
          </span>
          <button
            type="button"
            className="eic-jury-session__topbar-btn"
            disabled
            aria-label={dict.jury_session_pause}
          >
            {dict.jury_session_pause}
          </button>
          {navPrevHref ? (
            <a
              href={navPrevHref}
              className="eic-jury-session__topbar-btn"
              aria-label="Équipe précédente"
            >
              ← Précédente
            </a>
          ) : null}
          {navNextHref ? (
            <a
              href={navNextHref}
              className="eic-jury-session__topbar-btn eic-jury-session__topbar-btn--primary"
              aria-label={dict.jury_session_next_team}
            >
              {dict.jury_session_next_team}
            </a>
          ) : (
            <button
              type="button"
              className="eic-jury-session__topbar-btn eic-jury-session__topbar-btn--primary"
              disabled
              aria-label={dict.jury_session_next_team}
            >
              {dict.jury_session_next_team}
            </button>
          )}
        </div>
      </header>

      {/* ---------------- Main grid ---------------- */}
      <div className="eic-jury-session__main">
        {/* ============ LEFT COLUMN ============ */}
        <section className="eic-jury-session__left">
          <div className="eic-jury-session__pill-now">
            {dict.jury_session_now_pitching}
            <span className="eic-jury-session__pill-position">
              {positionLabel}
            </span>
          </div>

          <header className="eic-jury-session__team">
            <div className="eic-jury-session__avatar">{initials}</div>
            <div className="eic-jury-session__team-info">
              <h2>{player.name}</h2>
              {player.idea ? <em>« {player.idea} »</em> : null}
              <p className="eic-jury-session__team-meta">
                Équipe · {levelShort(player.currentLevel)} atteint
              </p>
            </div>
          </header>

          {/* Timer principal */}
          <div className="eic-jury-session__big-timer" aria-hidden="true">
            <span className="eic-jury-session__big-timer-value">04:12</span>
            <span className="eic-jury-session__big-timer-label">
              {dict.jury_session_timer_elapsed}
            </span>
            <div className="eic-jury-session__progress-bar">
              <div
                className="eic-jury-session__progress-bar-fill"
                style={{ width: "84%" }}
              />
            </div>
          </div>

          {/* Deliverable links */}
          <div className="eic-jury-session__deliverables">
            <h3 className="eic-jury-session__deliverables-title">
              {dict.jury_session_deliverables_label}
            </h3>
            {submissions.length === 0 ? (
              <p className="eic-jury-session__deliverables-empty">
                {dict.jury_session_no_deliverables}
              </p>
            ) : (
              <ul className="eic-jury-session__deliverables-list">
                {submissions.map((s) => (
                  <li
                    key={s.id}
                    className="eic-jury-session__deliverable-row"
                  >
                    <span className="eic-jury-session__deliverable-level">
                      {levelShort(s.levelId)}
                    </span>
                    <span className="eic-jury-session__deliverable-title">
                      {s.templateTitle}
                    </span>
                    <span className="eic-jury-session__deliverable-status">
                      {statusBadgeLabel(s.status)}
                    </span>
                    {s.proofUrl ? (
                      <a
                        href={s.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="eic-jury-session__deliverable-link"
                        aria-label={`Ouvrir le livrable ${s.templateTitle}`}
                      >
                        Ouvrir →
                      </a>
                    ) : (
                      <span className="eic-jury-session__deliverable-no-link">
                        —
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Navigateur d'équipes — toutes les équipes cliquables (V4 quick-260520-124) */}
          {/* quick-260520-124 ext (Task #9) — sort hint when smart queue active. */}
          <div className="eic-jury-session__queue">
            <h3 className="eic-jury-session__queue-title">
              {teamsList && teamsList.length > 0
                ? "TOUTES LES ÉQUIPES"
                : dict.jury_session_queue_label}
            </h3>
            <p
              style={{
                fontSize: 10,
                margin: "0 0 6px",
                color: "rgba(255,255,255,0.55)",
                letterSpacing: 0.4,
              }}
              aria-hidden="true"
            >
              {dict.jury_session_queue_sort_hint}
            </p>
            {teamsList && teamsList.length > 0 ? (
              <ul className="eic-jury-session__queue-list" role="list">
                {teamsList.map((t) => (
                  <li
                    key={`team-${t.idx}`}
                    className={
                      "eic-jury-session__queue-row" +
                      (t.isCurrent ? " is-current" : "") +
                      (t.scored ? " is-scored" : "")
                    }
                  >
                    {t.isCurrent ? (
                      <span
                        className="eic-jury-session__queue-name"
                        aria-current="true"
                      >
                        ▶ {t.name}
                      </span>
                    ) : (
                      <a
                        href={`/jury?ui=session&team=${t.idx}`}
                        className="eic-jury-session__queue-name eic-jury-session__queue-link"
                      >
                        {t.name}
                      </a>
                    )}
                    <span className="eic-jury-session__queue-eta">
                      {t.scored ? "✓ noté" : "— à noter"}
                    </span>
                    <span className="eic-jury-session__queue-level">{t.level}</span>
                  </li>
                ))}
              </ul>
            ) : upNext.length === 0 ? (
              <p className="eic-jury-session__queue-empty">—</p>
            ) : (
              <ul className="eic-jury-session__queue-list">
                {upNext.map((q, idx) => (
                  <li key={`${q.name}-${idx}`} className="eic-jury-session__queue-row">
                    <span className="eic-jury-session__queue-name">{q.name}</span>
                    <span className="eic-jury-session__queue-eta">
                      {idx === 0
                        ? dict.jury_session_queue_next
                        : q.etaMinutes !== null
                          ? `+${q.etaMinutes}min`
                          : "—"}
                    </span>
                    <span className="eic-jury-session__queue-level">{q.level}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ============ RIGHT COLUMN ============ */}
        <aside className="eic-jury-session__right">
          {/* Juror card */}
          <div className="eic-jury-session__juror-card">
            <div className="eic-jury-session__juror-avatar">{jurorInitials}</div>
            <div>
              <p className="eic-jury-session__juror-name">{juror.fullName}</p>
              <p className="eic-jury-session__juror-role">
                {juror.role ?? dict.jury_session_juror_role_default}
              </p>
            </div>
          </div>

          {/* Grille de notation header */}
          <div className="eic-jury-session__grille-header">
            <p className="eic-jury-session__grille-label">
              {dict.jury_session_grille_label}
            </p>
            <p className="eic-jury-session__grille-progress">{progressLabel}</p>
          </div>

          {/* 5 critères */}
          {criteria.map((c) => (
            <fieldset
              key={c.key}
              className="eic-jury-session__criterion"
              aria-labelledby={`${c.key}-${player.id}-legend`}
            >
              <div className="eic-jury-session__criterion-header">
                <legend
                  id={`${c.key}-${player.id}-legend`}
                  className="eic-jury-session__criterion-label"
                >
                  {c.label}
                </legend>
                <span className="eic-jury-session__criterion-score">
                  {c.value}/5
                </span>
              </div>
              {c.help ? (
                <p className="eic-jury-session__criterion-help">
                  <em>{c.help}</em>
                </p>
              ) : null}
              <div
                className="eic-jury-session__criterion-rubric"
                role="radiogroup"
                aria-label={c.label}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={c.value === n}
                    className={
                      c.value === n
                        ? "eic-jury-session__rubric-button eic-jury-session__rubric-button--active"
                        : "eic-jury-session__rubric-button"
                    }
                    onClick={() => c.setter(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <textarea
                className="eic-jury-session__criterion-comment"
                placeholder={dict.jury_session_comment_placeholder}
                value={c.comment}
                onChange={(e) => c.setComment(e.target.value)}
                maxLength={500}
                rows={2}
                aria-label={`Commentaire pour ${c.label}`}
              />
            </fieldset>
          ))}

          {/* Global comment */}
          <textarea
            className="eic-jury-session__comment-global"
            placeholder={dict.jury_session_comment_global_placeholder}
            value={commentGlobal}
            onChange={(e) => setCommentGlobal(e.target.value)}
            maxLength={2000}
            rows={3}
            aria-label="Commentaire global"
          />

          {/* quick-260520-124 ext (Task 5) — Verdict pills V4. */}
          <JuryVerdictPills initial={existing?.verdict ?? null} dict={dict} />

          {/* Status badge (existing row : draft or validated). */}
          {existing ? (
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                margin: "8px 0 0",
                padding: "4px 8px",
                borderRadius: 4,
                background:
                  existing.isDraft === false ? "#dcfce7" : "#fef3c7",
                color:
                  existing.isDraft === false ? "#15803d" : "#92400e",
                border:
                  existing.isDraft === false
                    ? "1px solid #86efac"
                    : "1px solid #fde68a",
                textAlign: "center",
              }}
            >
              {existing.isDraft === false
                ? dict.jury_status_validated
                : dict.jury_status_draft}
            </p>
          ) : null}

          {/* quick-260520-124 ext (Task 6) — Brouillon / Valider dual submit. */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <button
              type="submit"
              name="isDraft"
              value="true"
              disabled={pending}
              className="eic-jury-session__cta eic-jury-session__cta--draft"
              style={{ flex: "1 1 140px" }}
            >
              {dict.jury_save_draft}
            </button>
            <button
              type="submit"
              name="isDraft"
              value="false"
              disabled={pending}
              className="eic-jury-session__cta"
              style={{ flex: "2 1 200px" }}
            >
              {pending ? dict.jury_saving : ctaLabel}
            </button>
          </div>

          {state.message ? (
            <p
              className={
                state.ok
                  ? "eic-jury-session__feedback eic-jury-session__feedback--ok"
                  : "eic-jury-session__feedback eic-jury-session__feedback--err"
              }
              role="status"
            >
              {state.message}
            </p>
          ) : null}

          {/* Cross-juror aggregate (closed mode only) */}
          {aggregate ? (
            <div
              className="eic-jury-session__aggregate"
              role="status"
              aria-label={dict.jury_pitch_aggregate_label}
            >
              <p className="eic-jury-session__aggregate-header">
                {dict.jury_pitch_aggregate_label}
              </p>
              <p className="eic-jury-session__aggregate-value">
                <strong>{aggregate.avg100.toFixed(1)}</strong>
                <span className="eic-jury-session__aggregate-unit">/100</span>
              </p>
              <p className="eic-jury-session__aggregate-count">
                {dict.jury_pitch_aggregate_juror_count.replace(
                  "{n}",
                  String(aggregate.jurorCount),
                )}
              </p>
            </div>
          ) : null}

          {/* Other jurors progress */}
          <div className="eic-jury-session__other-jurors">
            <p className="eic-jury-session__other-jurors-header">
              {dict.jury_session_other_jurors_header}
            </p>
            {otherJurors.length === 0 ? (
              <p className="eic-jury-session__other-jurors-empty">—</p>
            ) : (
              <ul className="eic-jury-session__other-jurors-list">
                {otherJurors.map((j) => (
                  <li
                    key={j.fullName}
                    className="eic-jury-session__other-jurors-row"
                  >
                    <span className="eic-jury-session__other-jurors-name">
                      {j.fullName}
                    </span>
                    <span className="eic-jury-session__other-jurors-progress">
                      <span
                        className="eic-jury-session__other-jurors-progress-fill"
                        style={{
                          width: `${
                            j.total === 0 ? 0 : (j.criteriaScored / j.total) * 100
                          }%`,
                        }}
                      />
                    </span>
                    <span className="eic-jury-session__other-jurors-count">
                      {j.criteriaScored}/{j.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
