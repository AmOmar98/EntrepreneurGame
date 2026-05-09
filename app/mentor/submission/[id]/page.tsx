// Phase 3 / Plan 02 - Mentor evaluation page (server component).
// Resolves the connected user, gates by role (mentor | game_master), fetches
// the submission + player + deliverable_template + the existing evaluation
// authored by the connected mentor (if any). Renders either the EvaluationForm
// or a readonly summary if the mentor already evaluated.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EvaluationForm } from "@/components/evaluation-form";
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

const t = dictionaries.fr;

const SHELL_MAIN_STYLE: React.CSSProperties = { padding: 24, maxWidth: 900 };

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
  created_at: string;
};

function BackLink() {
  return (
    <p style={{ margin: "0 0 16px" }}>
      <Link
        href="/mentor"
        style={{ fontSize: 13, color: "#1d4ed8", textDecoration: "none" }}
      >
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
    .select("id, scores, total_score, feedback, verdict, created_at")
    .eq("submission_id", submission.id)
    .eq("evaluator_id", user!.id)
    .maybeSingle();
  const existing = (existingRow as ExistingEvalRow | null) ?? null;

  const submissionVersion: 1 | 2 = submission.version === 2 ? 2 : 1;

  return (
    <AppShell role={role ?? "mentor"} variant="staff">
      <main style={SHELL_MAIN_STYLE}>
        <BackLink />

        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 12px", color: "#0f172a" }}>
          {template?.title ?? t.evaluation_title}
        </h1>

        {player ? (
          <section
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              padding: 12,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#f8fafc",
              marginBottom: 16,
            }}
          >
            <Field label={t.evaluation_team} value={player.name} />
            {player.idea ? <Field label={t.evaluation_idea} value={player.idea} /> : null}
            <Field label={t.evaluation_level} value={levelLabel(player.current_level)} />
            <Field
              label={t.evaluation_score_project}
              value={String(
                typeof player.score_project === "string"
                  ? Number(player.score_project)
                  : player.score_project,
              )}
            />
          </section>
        ) : null}

        <section
          style={{
            padding: 12,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "0 0 8px" }}>
            {t.evaluation_title}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
            <Field label={t.evaluation_version} value={`V${submissionVersion}`} />
            <Field
              label={t.evaluation_submitted_at}
              value={new Date(submission.submitted_at).toLocaleString("fr-FR")}
            />
          </div>
          {submission.kind === "proof_url" && submission.proof_url ? (
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong style={{ color: "#475569" }}>{t.evaluation_proof_url}: </strong>
              <a
                href={submission.proof_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#1d4ed8" }}
              >
                {submission.proof_url}
              </a>
            </p>
          ) : null}
          {submission.kind === "proof_text" && submission.proof_text ? (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#475569", fontWeight: 600 }}>
                {t.evaluation_proof_text}
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: 10,
                  background: "#f1f5f9",
                  borderRadius: 6,
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  color: "#0f172a",
                }}
              >
                {submission.proof_text}
              </pre>
            </div>
          ) : null}
        </section>

        {existing ? (
          <section
            style={{
              padding: 12,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#f8fafc",
            }}
          >
            <p
              role="status"
              style={{
                margin: "0 0 12px",
                padding: "10px 14px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {t.evaluation_already_evaluated}
            </p>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "0 0 8px" }}>
              {t.evaluation_existing_summary}
            </h3>
            <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, color: "#0f172a" }}>
              {rubric.map((c) => (
                <li key={c.key}>
                  <strong>{c.label}</strong>: {existing.scores?.[c.key] ?? 0} / {c.max}
                </li>
              ))}
            </ul>
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>
              <strong style={{ color: "#475569" }}>{t.evaluation_total_score}: </strong>
              {String(
                typeof existing.total_score === "string"
                  ? Number(existing.total_score)
                  : existing.total_score,
              )}
            </p>
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>
              <strong style={{ color: "#475569" }}>
                {t.evaluation_existing_verdict}:{" "}
              </strong>
              {verdictLabel(existing.verdict)}
            </p>
            {existing.feedback ? (
              <div>
                <p
                  style={{ margin: "0 0 4px", fontSize: 13, color: "#475569", fontWeight: 600 }}
                >
                  {t.evaluation_existing_feedback}
                </p>
                <pre
                  style={{
                    margin: 0,
                    padding: 10,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    color: "#0f172a",
                  }}
                >
                  {existing.feedback}
                </pre>
              </div>
            ) : null}
          </section>
        ) : (
          <EvaluationForm
            submissionId={submission.id}
            version={submissionVersion}
            rubric={rubric}
          />
        )}
      </main>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 160 }}>
      <p style={{ margin: 0, fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{value}</p>
    </div>
  );
}
