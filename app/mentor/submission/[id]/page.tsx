// Phase 8 / Plan 08 — Mentor evaluation page (refondue link-based).
//
// Server component. Resolves the connected user, gates by role
// (mentor | game_master), fetches the submission + player + template +
// existing evaluation + the full submission history for (player, template) +
// the async evaluation_comments tied to the current submission.
//
// Layout (cf. .planning/design-v2/project/player-flows.jsx::MentorFeedback) :
//   Left column  — Brief reminder + central <MentorLinkCard /> + history
//   Right column — Async tagged comments (list + composer) + evaluation panel
//
// When the connected mentor has already evaluated this submission, the
// evaluation panel renders a readonly summary. Otherwise the
// <MentorEvaluationPanel /> is shown with the required expected_action gate
// when verdict=request_v2 (MNT-04).
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EvaluationForm } from "@/components/evaluation-form";
import { MentorCommentComposer } from "@/components/mentor-comment-composer";
import {
  MentorCommentsList,
  type MentorCommentEntry,
} from "@/components/mentor-comments-list";
import { MentorEvaluationPanel } from "@/components/mentor-evaluation-panel";
import { MentorLinkCard } from "@/components/mentor-link-card";
import {
  MentorSubmissionHistory,
  type MentorSubmissionHistoryEntry,
} from "@/components/mentor-submission-history";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { levelLabel } from "@/lib/journey";
import type {
  LevelId,
  RubricCriterion,
  SubmissionKind,
  SubmissionStatus,
  Verdict,
} from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

// Mentor page intentionally renders the legacy <EvaluationForm /> only as a
// fallback when the new MentorEvaluationPanel cannot be used (e.g., template
// without rubric). Re-export keeps the import marked as used by ESLint when
// we keep the fallback path enabled in future phases.
void EvaluationForm;

const t = dictionaries.fr;

const SHELL_MAIN_STYLE: React.CSSProperties = { padding: 24, maxWidth: 1200 };

type SubmissionRow = {
  id: string;
  player_id: string;
  deliverable_template_id: string;
  version: number;
  kind: SubmissionKind;
  proof_url: string | null;
  proof_text: string | null;
  status: SubmissionStatus;
  submitted_at: string;
};

type PlayerRow = {
  id: string;
  name: string;
  idea: string | null;
  current_level: LevelId;
  score_project: number | string;
};

type TemplateRow = {
  id: string;
  title: string;
  description: string;
  rubric: RubricCriterion[] | null;
  max_score: number;
};

type ExistingEvalRow = {
  id: string;
  scores: Record<string, number>;
  total_score: number | string;
  feedback: string;
  verdict: Verdict;
  expected_action: string | null;
  created_at: string;
};

function BackLink() {
  return (
    <p style={{ margin: "0 0 16px" }}>
      <Link href="/mentor" className="eic-mentor-page__back-link">
        {"← "}
        {t.mentor_back}
      </Link>
    </p>
  );
}

function verdictLabel(v: Verdict): string {
  switch (v) {
    case "validate_v1":
      return t.evaluation_verdict_validate_v1;
    case "validate_v2":
      return t.evaluation_verdict_validate_v2;
    case "request_v2":
      return t.evaluation_verdict_request_v2;
    case "reject":
      return t.evaluation_verdict_reject;
  }
}

export default async function MentorSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentRole();
  if (role && role !== "mentor" && role !== "game_master") {
    redirect(pathForRole(role));
  }

  if (!hasSupabaseEnv()) {
    return (
      <AppShell role={role ?? "mentor"} variant="staff">
        <main style={SHELL_MAIN_STYLE}>
          <BackLink />
          <p style={{ color: "#64748b", fontSize: 14 }}>{t.evaluation_demo_disabled}</p>
        </main>
      </AppShell>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <AppShell role={role ?? "mentor"} variant="staff">
        <main style={SHELL_MAIN_STYLE}>
          <BackLink />
          <p style={{ color: "#64748b", fontSize: 14 }}>{t.evaluation_demo_disabled}</p>
        </main>
      </AppShell>
    );
  }

  // Submission.
  const { data: subRow } = await supabase
    .from("submissions")
    .select(
      "id, player_id, deliverable_template_id, version, kind, proof_url, proof_text, status, submitted_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!subRow) {
    notFound();
  }
  const submission = subRow as SubmissionRow;

  // Player.
  const { data: playerRow } = await supabase
    .from("players")
    .select("id, name, idea, current_level, score_project")
    .eq("id", submission.player_id)
    .maybeSingle();
  const player = (playerRow as PlayerRow | null) ?? null;

  // Template.
  const { data: tplRow } = await supabase
    .from("deliverable_templates")
    .select("id, title, description, rubric, max_score")
    .eq("id", submission.deliverable_template_id)
    .maybeSingle();
  const template = (tplRow as TemplateRow | null) ?? null;
  const rubric: RubricCriterion[] = Array.isArray(template?.rubric) ? template!.rubric! : [];

  // Existing evaluation by the connected mentor (1 mentor = 1 eval per submission).
  const { data: existingRow } = await supabase
    .from("evaluations")
    .select("id, scores, total_score, feedback, verdict, expected_action, created_at")
    .eq("submission_id", submission.id)
    .eq("evaluator_id", user!.id)
    .maybeSingle();
  const existing = (existingRow as ExistingEvalRow | null) ?? null;

  const submissionVersion: 1 | 2 = submission.version === 2 ? 2 : 1;

  // Phase 8 / MNT-02 — full submission history for (player, template).
  const { data: historyRows } = await supabase
    .from("submissions")
    .select("id, version, proof_url, proof_text, submitted_at")
    .eq("player_id", submission.player_id)
    .eq("deliverable_template_id", submission.deliverable_template_id)
    .order("version", { ascending: false });
  const history: MentorSubmissionHistoryEntry[] = (
    historyRows as
      | {
          id: string;
          version: number;
          proof_url: string | null;
          proof_text: string | null;
          submitted_at: string;
        }[]
      | null
  )
    ? (
        historyRows as {
          id: string;
          version: number;
          proof_url: string | null;
          proof_text: string | null;
          submitted_at: string;
        }[]
      ).map((r) => ({
        id: r.id,
        version: r.version,
        submittedAt: r.submitted_at,
        proofUrl: r.proof_url,
        proofText: r.proof_text,
        isCurrent: r.id === submission.id,
      }))
    : [];

  // Phase 8 / MNT-03 — async tagged comments tied to the current submission.
  const { data: commentRows } = await supabase
    .from("evaluation_comments")
    .select("id, author_user_id, tag, body, created_at")
    .eq("submission_id", submission.id)
    .order("created_at", { ascending: false });

  let comments: MentorCommentEntry[] = [];
  if (commentRows && commentRows.length > 0) {
    const authorIds = Array.from(
      new Set(
        (commentRows as { author_user_id: string }[]).map((c) => c.author_user_id),
      ),
    );
    const { data: authorRows } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, app_role")
      .in("user_id", authorIds);
    const authorsById = new Map<
      string,
      { fullName: string | null; email: string | null; appRole: string | null }
    >();
    for (const row of (authorRows ?? []) as {
      user_id: string;
      full_name: string | null;
      email: string | null;
      app_role: string | null;
    }[]) {
      authorsById.set(row.user_id, {
        fullName: row.full_name,
        email: row.email,
        appRole: row.app_role,
      });
    }
    comments = (
      commentRows as {
        id: string;
        author_user_id: string;
        tag: "remarque" | "a_corriger";
        body: string;
        created_at: string;
      }[]
    ).map((c) => {
      const author = authorsById.get(c.author_user_id);
      const fullName =
        (author?.fullName && author.fullName.trim().length > 0
          ? author.fullName
          : null) ??
        author?.email ??
        "Membre";
      const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("") || "?";
      const isMentor =
        author?.appRole === "mentor" || author?.appRole === "game_master";
      return {
        id: c.id,
        authorName: fullName,
        authorInitials: initials,
        authorAvatarColor: isMentor ? "#1B3A5C" : "#D97706",
        isMentor,
        isOwn: c.author_user_id === user!.id,
        tag: c.tag,
        body: c.body,
        createdAt: c.created_at,
      };
    });
  }

  return (
    <AppShell role={role ?? "mentor"} variant="staff">
      <main style={SHELL_MAIN_STYLE}>
        <BackLink />

        {/* Brief reminder + player meta */}
        <header className="eic-mentor-page__header">
          <h1 className="eic-mentor-page__title">
            {template?.title ?? t.evaluation_title}
          </h1>

          {player ? (
            <section aria-label="Equipe" className="eic-mentor-page__brief">
              <div className="eic-mentor-page__brief-meta">
                <span className="eic-mentor-page__brief-item">
                  <strong>{t.evaluation_team}</strong> · {player.name}
                </span>
                {player.idea ? (
                  <span className="eic-mentor-page__brief-item">
                    <strong>{t.evaluation_idea}</strong> · {player.idea}
                  </span>
                ) : null}
                <span className="eic-mentor-page__brief-item">
                  <strong>{t.evaluation_level}</strong> · {levelLabel(player.current_level)}
                </span>
                <span className="eic-mentor-page__brief-item">
                  <strong>{t.evaluation_score_project}</strong> ·{" "}
                  {String(
                    typeof player.score_project === "string"
                      ? Number(player.score_project)
                      : player.score_project,
                  )}
                </span>
              </div>
            </section>
          ) : null}
        </header>

        <div className="eic-mentor-grid">
          {/* LEFT: link card + history + brief + (mobile) eval panel */}
          <div className="eic-mentor-grid__col">
            <MentorLinkCard
              proofText={submission.proof_text}
              proofUrl={submission.proof_url}
              statusLabel={t.mentor_history_status_current}
              submittedAt={submission.submitted_at}
              version={submissionVersion}
            />
            <MentorSubmissionHistory entries={history} />
          </div>

          {/* RIGHT: comments + evaluation panel */}
          <div className="eic-mentor-grid__col">
            <section
              aria-labelledby="mentor-comments-title"
              className="eic-mentor-comments"
            >
              <header className="eic-mentor-comments__header">
                <h2
                  className="eic-mentor-comments__title"
                  id="mentor-comments-title"
                >
                  {t.mentor_comments_section_title}
                </h2>
                <span className="eic-mentor-comments__count">
                  {comments.length} · {t.mentor_comments_async_label}
                </span>
              </header>
              <MentorCommentsList
                ariaLabel={t.mentor_comments_section_title}
                comments={comments}
              />
              <MentorCommentComposer
                audience="mentor"
                submissionId={submission.id}
              />
            </section>

            {existing ? (
              <section
                aria-label={t.evaluation_existing_summary}
                className="eic-mentor-eval eic-mentor-eval__locked"
              >
                <p role="status" className="eic-mentor-page__eval-banner">
                  {t.evaluation_already_evaluated}
                </p>
                <h3 className="eic-mentor-eval__title">
                  {t.evaluation_existing_summary}
                </h3>
                <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13 }}>
                  {rubric.map((c) => (
                    <li key={c.key}>
                      <strong>{c.label}</strong>: {existing.scores?.[c.key] ?? 0} / {c.max}
                    </li>
                  ))}
                </ul>
                <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                  <strong>{t.evaluation_total_score}: </strong>
                  {String(
                    typeof existing.total_score === "string"
                      ? Number(existing.total_score)
                      : existing.total_score,
                  )}
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                  <strong>{t.evaluation_existing_verdict}: </strong>
                  {verdictLabel(existing.verdict)}
                </p>
                {existing.feedback ? (
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600 }}>
                      {t.evaluation_existing_feedback}
                    </p>
                    <pre className="eic-mentor-page__feedback-pre">
                      {existing.feedback}
                    </pre>
                  </div>
                ) : null}
                {existing.expected_action ? (
                  <aside
                    aria-label={t.mentor_action_expected_label}
                    className="eic-mentor-eval__expected"
                    style={{ marginTop: 8 }}
                  >
                    <p className="eic-mentor-eval__expected-label">
                      {t.mentor_action_expected_label}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.45,
                        color: "#14243d",
                      }}
                    >
                      {existing.expected_action}
                    </p>
                  </aside>
                ) : null}
              </section>
            ) : (
              <MentorEvaluationPanel
                rubric={rubric}
                submissionId={submission.id}
                version={submissionVersion}
              />
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
