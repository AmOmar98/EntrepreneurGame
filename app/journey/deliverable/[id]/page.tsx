// Phase 2 / Plan 03 - Deliverable detail page (server component).
// Resolves the connected user, gates by role, fetches the deliverable template
// and the latest submission for the current Player. Renders either the
// SubmissionForm (no submission yet) or the SubmissionReadonly (V1+ exists).
//
// Ownership defense-in-depth: RLS on `submissions` and `player_members` already
// returns 0 rows for foreign Players, so notFound() naturally fires when a
// Player tries to access another Player's deliverable URL.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/ui";
import { EngagementMilestonesBadges } from "@/components/engagement-milestones-badges";
import { MentorCommentComposer } from "@/components/mentor-comment-composer";
import {
  MentorCommentsList,
  type MentorCommentEntry,
} from "@/components/mentor-comments-list";
import { FichesEntretienComposer } from "@/components/fiches-entretien-composer";
import { MoscowKanban } from "@/components/moscow-kanban";
import { RevisionPanel } from "@/components/revision-panel";
import { SubmissionForm } from "@/components/submission-form";
import { SubmissionReadonly } from "@/components/submission-readonly";
import { SubmissionTicket } from "@/components/submission-ticket";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { getMoscowCardsForPlayerDeliverable } from "@/lib/moscow";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type {
  RubricCriterion,
  Submission,
  SubmissionKind,
  SubmissionStatus,
  Verdict,
} from "@/lib/types";
import { EXAMPLES_FOLDER_URL } from "@/lib/template-links";
import { createClient } from "@/utils/supabase/server";

const t = dictionaries.fr;

type DeliverableTemplateRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  rubric: RubricCriterion[] | null;
  max_score: number;
  is_bonus?: boolean | null;
  // ENGINE-05: data-driven columns (pre-migration defensive: may be null/absent)
  composer_kind?: string | null;
  template_url?: string | null;
  auto_validate?: boolean | null;
  soft_recommends_before?: string | null;
};

// T3X-EXPANSION wave 3 / plan 12-10 — MoSCoW Kanban surfacing.
// ENGINE-05: Now reads composer_kind column instead of MOSCOW_DELIVERABLE_SLUG literal.
// When the template's composer_kind === "moscow", surface <MoscowKanban>
// IN ADDITION to the existing SubmissionForm/Ticket flow (R3 : ProofWorkflow
// fallback preserved, never replaces).
// Pre-migration defensive: composer_kind may be absent → defaults to "simple".

type SubmissionRow = {
  id: string;
  player_id: string;
  deliverable_template_id: string;
  version: number;
  kind: SubmissionKind;
  proof_url: string | null;
  proof_text: string | null;
  status: SubmissionStatus;
  submitted_by: string;
  submitted_at: string;
};

function mapSubmission(row: SubmissionRow): Submission {
  const base = {
    id: row.id,
    playerId: row.player_id,
    deliverableTemplateId: row.deliverable_template_id,
    kind: row.kind,
    proofUrl: row.proof_url,
    proofText: row.proof_text,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
  };
  if (row.version === 2) {
    return { ...base, version: 2 };
  }
  return { ...base, version: 1 };
}

const SHELL_MAIN_STYLE: React.CSSProperties = { padding: 24, maxWidth: 800 };

function BackLink() {
  return (
    <p style={{ margin: "0 0 16px" }}>
      <Link
        href="/journey"
        style={{ fontSize: 13, color: "#1d4ed8", textDecoration: "none" }}
      >
        {"← "}
        {t.submission_back_to_journey}
      </Link>
    </p>
  );
}

export default async function DeliverableDetailPage({
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
  if (role && role !== "player") {
    redirect(pathForRole(role));
  }

  if (!hasSupabaseEnv()) {
    return (
      <AppShell role="player" variant="player">
        <main style={SHELL_MAIN_STYLE}>
          <BackLink />
          <p style={{ color: "#64748b", fontSize: 14 }}>{t.submission_demo_disabled}</p>
        </main>
      </AppShell>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <AppShell role="player" variant="player">
        <main style={SHELL_MAIN_STYLE}>
          <BackLink />
          <p style={{ color: "#64748b", fontSize: 14 }}>{t.submission_demo_disabled}</p>
        </main>
      </AppShell>
    );
  }

  // Resolve Player membership (ownership precondition).
  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    notFound();
  }
  const playerId = (membership as { player_id: string }).player_id;

  // Fetch the deliverable template by id.
  // ENGINE-05: also fetch composer_kind, template_url, auto_validate,
  // soft_recommends_before (pre-migration: may be absent → defensive ?? fallbacks).
  const { data: tplRow } = await supabase
    .from("deliverable_templates")
    .select("id, slug, title, description, rubric, max_score, is_bonus, composer_kind, template_url, auto_validate, soft_recommends_before")
    .eq("id", id)
    .maybeSingle();
  if (!tplRow) {
    notFound();
  }
  const tpl = tplRow as DeliverableTemplateRow;
  const rubric = Array.isArray(tpl.rubric) ? tpl.rubric : [];

  // ENGINE-05 defensive reads (pre-migration: columns may be absent).
  const composerKind: string = tpl?.composer_kind ?? "simple";
  const templateUrl: string | null = tpl?.template_url ?? null;
  const autoValidate: boolean = tpl?.auto_validate ?? false;

  // T3X-EXPANSION wave 3 / plan 12-10 — surface MoscowKanban conditionally.
  // ENGINE-05: uses composer_kind column (pre-migration defensive ?? "simple" above).
  // ProofWorkflow / SubmissionForm fallback remains accessible below (R3 : never block).
  const isMoscowDeliverable = composerKind === "moscow";
  const moscowCards = isMoscowDeliverable
    ? await getMoscowCardsForPlayerDeliverable(playerId, tpl.id)
    : null;

  // quick-260519-l1l : Fiches d'entretien (02b) composer + R3 exception hard-block
  // gate on prep-questions-v1 (02a). Signed Omar 2026-05-19. ONLY hard-block in
  // pilot — every other deliverable transition stays amber-warn-only.
  // ENGINE-05: uses composer_kind + auto_validate columns (defensive defaults above).
  const isFichesEntretienDeliverable = composerKind === "multi_url" && autoValidate === true;
  let fichesGateLocked = false;
  let fichesGateReason: string | undefined;
  // quick-260519-uuy / Task 3 — hoist prep-questions-v1 template id so the
  // composer can render an actionable Link back to the prerequisite. Stays
  // null when the prep template is absent (e.g. demo seed without 02a).
  // The slug remains a literal here (R3 exception, signed Omar 2026-05-19).
  let prepQuestionsDeliverableId: string | null = null;
  if (isFichesEntretienDeliverable) {
    const { data: prepTpl } = await supabase
      .from("deliverable_templates")
      .select("id")
      .eq("slug", "prep-questions-v1")
      .maybeSingle();
    if (prepTpl) {
      prepQuestionsDeliverableId = (prepTpl as { id: string }).id;
      const { data: prepSubs } = await supabase
        .from("submissions")
        .select("status")
        .eq("player_id", playerId)
        .eq("deliverable_template_id", (prepTpl as { id: string }).id)
        .order("version", { ascending: false })
        .limit(1);
      const prepValidated =
        prepSubs && prepSubs.length > 0 &&
        (prepSubs[0] as { status: string }).status === "validated";
      if (!prepValidated) {
        fichesGateLocked = true;
        fichesGateReason =
          "Préparation 2A à valider par votre mentor avant de débloquer les fiches d'entretien (02b).";
      }
    }
  }

  // ENGINE-06: soft_recommends_before amber hint (R3 CARDINAL — advisory only, zero disabled DOM).
  // Fetch the prerequisite template title + check if player already validated it.
  let softRecommendsHintVisible = false;
  let prerequisiteTitle = "";
  if (tpl.soft_recommends_before) {
    const { data: prereqTpl } = await supabase
      .from("deliverable_templates")
      .select("id, title")
      .eq("id", tpl.soft_recommends_before)
      .maybeSingle();
    if (prereqTpl) {
      const prereqRow = prereqTpl as { id: string; title: string };
      prerequisiteTitle = prereqRow.title;
      // Check if this player already validated the prerequisite.
      const { data: prereqSubs } = await supabase
        .from("submissions")
        .select("status")
        .eq("player_id", playerId)
        .eq("deliverable_template_id", prereqRow.id)
        .order("version", { ascending: false })
        .limit(1);
      const prereqValidated =
        prereqSubs && prereqSubs.length > 0 &&
        (prereqSubs[0] as { status: string }).status === "validated";
      // Only show hint when prereq exists but is NOT yet validated.
      softRecommendsHintVisible = !prereqValidated;
    }
  }

  // Fetch latest submission for this (player, template). RLS naturally returns
  // empty rows for any foreign player_id, so any "wrong owner" scenario simply
  // shows the form (which the action will then refuse). Defense-in-depth.
  const { data: subRows } = await supabase
    .from("submissions")
    .select(
      "id, player_id, deliverable_template_id, version, kind, proof_url, proof_text, status, submitted_by, submitted_at",
    )
    .eq("player_id", playerId)
    .eq("deliverable_template_id", id)
    .order("version", { ascending: false })
    .limit(1);

  const latest =
    subRows && subRows.length > 0 ? mapSubmission(subRows[0] as SubmissionRow) : null;
  const latestRow = subRows && subRows.length > 0 ? (subRows[0] as SubmissionRow) : null;

  const lockedStatuses: SubmissionStatus[] = ["submitted_v1", "submitted_v2", "validated", "rejected"];
  const isLocked = latest !== null && lockedStatuses.includes(latest.status);
  const isFeedbackPendingV2 = latest !== null && latest.status === "feedback_received";

  // R1 revised (2026-05-11) — surface the latest mentor evaluation to the
  // Player on the deliverable detail page for every status where a review
  // exists. Score remains invisible everywhere else on Player UI.
  const statusesWithEvaluation: SubmissionStatus[] = [
    "feedback_received",
    "submitted_v2",
    "validated",
    "rejected",
  ];
  let latestEvaluation: {
    scores: Record<string, number>;
    totalScore: number;
    feedback: string;
    verdict: Verdict;
    expectedAction: string | null;
  } | null = null;
  if (latestRow && statusesWithEvaluation.includes(latestRow.status)) {
    const { data: evalRow } = await supabase
      .from("evaluations")
      .select("scores, total_score, feedback, verdict, expected_action")
      .eq("submission_id", latestRow.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (evalRow) {
      const row = evalRow as {
        scores: Record<string, number> | null;
        total_score: number | null;
        feedback: string | null;
        verdict: Verdict;
        expected_action: string | null;
      };
      latestEvaluation = {
        scores: row.scores ?? {},
        totalScore: Number(row.total_score ?? 0),
        feedback: row.feedback ?? "",
        verdict: row.verdict,
        expectedAction: row.expected_action ?? null,
      };
    }
  }

  // Phase 8 / MNT-03 — load async comments tied to the latest submission.
  // Visible to both Mentor (on /mentor/submission/[id]) and Player (here in
  // the revision panel). RLS enforces visibility; we additionally check role
  // for avatar coloring.
  let comments: MentorCommentEntry[] = [];
  if (latestRow) {
    const { data: commentRows } = await supabase
      .from("evaluation_comments")
      .select("id, author_user_id, tag, body, created_at")
      .eq("submission_id", latestRow.id)
      .order("created_at", { ascending: false });
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
          isOwn: c.author_user_id === user.id,
          tag: c.tag,
          body: c.body,
          createdAt: c.created_at,
        };
      });
    }
  }

  return (
    <AppShell role="player" variant="player">
      <main style={SHELL_MAIN_STYLE}>
        <BackLink />

        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px", color: "#0f172a", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>{tpl.title}</span>
          {tpl.is_bonus ? (
            <Pill tone="amber">{t.deliverable_bonus_badge}</Pill>
          ) : null}
        </h1>

        {/* Phase 14 / W3 — Engagement milestones (qualitative R1).
            Derives from submission status alone : status === 'submitted_v1'
            means submitted but not reviewed yet ; any other locked status
            ('feedback_received', 'submitted_v2', 'validated', 'rejected')
            implies the mentor has at least reviewed once. 'validated' is
            the only status indicating the latest verdict is validate_v1 or
            validate_v2 (cf. database/migrations/202605110007 trigger).
            Status-based derivation is consistent with the DB trigger because
            status transitions are driven by the same verdicts. */}
        <EngagementMilestonesBadges
          milestones={{
            submitted: latest !== null,
            reviewed: latest !== null && latest.status !== "submitted_v1",
            validated: latest !== null && latest.status === "validated",
          }}
        />

        {tpl.description ? (
          <section style={{ marginTop: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "0 0 6px" }}>
              {t.submission_description}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#0f172a", whiteSpace: "pre-wrap" }}>
              {tpl.description}
            </p>
          </section>
        ) : null}

        {/* ENGINE-06 / R3 CARDINAL — soft_recommends_before amber hint.
            Advisory ONLY: no disabled DOM, no pointer-events:none, no grayed CTAs.
            Renders when the prerequisite template is not yet validated. */}
        {softRecommendsHintVisible ? (
          <p className="eic-locked-hint--amber" role="note" style={{ marginTop: 12, marginBottom: 0 }}>
            <Info size={14} aria-hidden style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            {t.admin_engine_soft_recommends_hint.replace("[titre]", prerequisiteTitle)}
          </p>
        ) : null}

        {/* Ressources EIC : template OneDrive (data-driven via template_url column,
            ENGINE-05) + dossier exemples completes (global). Liens externes,
            ouverture nouvel onglet. Si template_url absent, seul l'exemple
            global s'affiche. */}
        {(() => {
          return (
            <section style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "0 0 6px" }}>
                Ressources EIC
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {templateUrl ? (
                  <a
                    href={templateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "#1B3A5C",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    Ouvrir le template OneDrive
                  </a>
                ) : null}
                <a
                  href={EXAMPLES_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#ffffff",
                    color: "#1B3A5C",
                    border: "1px solid #1B3A5C",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Voir un exemple complete
                </a>
              </div>
            </section>
          );
        })()}

        {rubric.length > 0 ? (
          <section style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "0 0 6px" }}>
              {t.submission_rubric}
            </h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#0f172a" }}>
              {rubric.map((c) => (
                <li key={c.key} style={{ marginBottom: 4 }}>
                  <strong>{c.label}</strong>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* T3X-EXPANSION wave 3 / plan 12-10 — MoSCoW Kanban surfacing. */}
        {/* Conditional on template.slug ; ProofWorkflow fallback below preserves R3. */}
        {isMoscowDeliverable && moscowCards !== null ? (
          <section
            style={{
              marginTop: 24,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#ffffff",
            }}
          >
            <MoscowKanban
              deliverableTemplateId={tpl.id}
              initialCards={moscowCards}
            />
          </section>
        ) : null}

        {isLocked && latest && latest.status === "submitted_v1" ? (
          // PLR-06 — editorial SOUMIS ticket replaces the legacy readonly view.
          <SubmissionTicket
            deliverableTitle={tpl.title}
            rewardXp={tpl.max_score}
            submission={latest}
          />
        ) : isLocked && latest ? (
          <SubmissionReadonly
            evaluation={latestEvaluation}
            maxScore={tpl.max_score}
            rubric={rubric}
            submission={latest}
          />
        ) : isFeedbackPendingV2 && latestEvaluation && latestRow ? (
          // PLR-07 — pedagogical revision panel for verdict request_v2.
          <RevisionPanel
            commentsSlot={
              <section
                aria-labelledby="player-comments-title"
                className="eic-mentor-comments"
              >
                <header className="eic-mentor-comments__header">
                  <h2
                    className="eic-mentor-comments__title"
                    id="player-comments-title"
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
                  audience="player"
                  submissionId={latestRow.id}
                />
              </section>
            }
            deliverableTemplateId={id}
            deliverableTitle={tpl.title}
            evaluation={latestEvaluation}
            previousSubmission={latest}
            rewardXp={tpl.max_score}
            rubric={rubric}
          />
        ) : isFeedbackPendingV2 ? (
          // Defensive fallback when feedback_received but no evaluation row found.
          <>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#0f172a",
                margin: "24px 0 8px",
              }}
            >
              {t.submission_v2_title}
            </h2>
            <SubmissionForm deliverableTemplateId={id} version={2} />
          </>
        ) : isFichesEntretienDeliverable ? (
          // quick-260519-l1l : dedicated 10-URL composer for fiches-entretien-v1
          // with hard-block gate on prep-questions-v1 (R3 exception, signed Omar
          // 2026-05-19). Defense-in-depth: server action ALSO rejects if gate
          // not passed (cf app/actions.ts HARD_BLOCK_DEPENDENCIES).
          <FichesEntretienComposer
            deliverableTemplateId={id}
            locked={fichesGateLocked}
            lockedReason={fichesGateReason}
            prepQuestionsDeliverableId={prepQuestionsDeliverableId}
          />
        ) : (
          <SubmissionForm deliverableTemplateId={id} />
        )}
      </main>
    </AppShell>
  );
}
