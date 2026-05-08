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
import { AppShell } from "@/components/app-shell";
import { SubmissionForm } from "@/components/submission-form";
import { SubmissionReadonly } from "@/components/submission-readonly";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type {
  RubricCriterion,
  Submission,
  SubmissionKind,
  SubmissionStatus,
} from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

const t = dictionaries.fr;

type DeliverableTemplateRow = {
  id: string;
  title: string;
  description: string;
  rubric: RubricCriterion[] | null;
  max_score: number;
};

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
      <AppShell role="player">
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
      <AppShell role="player">
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
  const { data: tplRow } = await supabase
    .from("deliverable_templates")
    .select("id, title, description, rubric, max_score")
    .eq("id", id)
    .maybeSingle();
  if (!tplRow) {
    notFound();
  }
  const tpl = tplRow as DeliverableTemplateRow;
  const rubric = Array.isArray(tpl.rubric) ? tpl.rubric : [];

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

  const lockedStatuses: SubmissionStatus[] = ["submitted_v1", "submitted_v2", "validated", "rejected"];
  const isLocked = latest !== null && lockedStatuses.includes(latest.status);
  const isFeedbackPendingV2 = latest !== null && latest.status === "feedback_received";

  return (
    <AppShell role="player">
      <main style={SHELL_MAIN_STYLE}>
        <BackLink />

        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
          {tpl.title}
        </h1>

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

        {rubric.length > 0 ? (
          <section style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "0 0 6px" }}>
              {t.submission_rubric}
            </h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#0f172a" }}>
              {rubric.map((c) => (
                <li key={c.key} style={{ marginBottom: 4 }}>
                  <strong>{c.label}</strong> ({c.max} pts)
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {isLocked && latest ? (
          <SubmissionReadonly submission={latest} />
        ) : isFeedbackPendingV2 ? (
          <p
            role="status"
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "#fae8ff",
              color: "#86198f",
              border: "1px solid #f0abfc",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            {t.submission_feedback_pending_v2}
          </p>
        ) : (
          <SubmissionForm deliverableTemplateId={id} />
        )}
      </main>
    </AppShell>
  );
}
