"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { importPlayersCsv, type ImportWorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: ImportWorkflowState = { ok: false, message: "" };

export function CsvImportForm({ cohortSlug }: { cohortSlug: string }) {
  const [state, formAction] = useActionState(importPlayersCsv, initialState);
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);

  useEffect(() => {
    if (state.report) {
      setErrorsOpen(false);
    }
  }, [state.report]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  };

  return (
    <form
      action={formAction}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 720,
      }}
    >
      <input type="hidden" name="cohortSlug" value={cohortSlug} />
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 500, color: "#0f172a" }}>{t.import_file_label}</span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          style={{ fontSize: 13 }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 500, color: "#0f172a" }}>{t.import_paste_label}</span>
        <textarea
          name="csvText"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={10}
          required
          minLength={10}
          placeholder="team_name,project_name,project_pitch,leader_email,member_emails"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            padding: 10,
            border: "1px solid #cbd5e1",
            borderRadius: 6,
          }}
        />
      </label>
      <SubmitButton />
      {state.message && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            background: state.ok ? "#dcfce7" : "#fee2e2",
            color: state.ok ? "#166534" : "#991b1b",
            fontSize: 13,
          }}
        >
          {state.message}
        </div>
      )}
      {state.report && (
        <section
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 14,
            background: "#fff",
          }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: 16, color: "#0f172a" }}>
            {t.import_report_title}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, color: "#0f172a" }}>
            <li>
              {t.import_report_created} : <strong>{state.report.created}</strong>
            </li>
            <li>
              {t.import_report_existed} : <strong>{state.report.alreadyExisted}</strong>
            </li>
            <li>
              {t.import_report_members} : <strong>{state.report.membersAdded}</strong>
            </li>
            <li>
              {t.import_report_invites} : <strong>{state.report.invitesSent}</strong>
            </li>
            <li>
              {t.import_report_invites_skipped} :{" "}
              <strong>{state.report.invitesSkipped}</strong>
            </li>
            <li>
              {t.import_report_errors} : <strong>{state.report.errors.length}</strong>
            </li>
          </ul>
          {state.report.errors.length > 0 && (
            <details
              open={errorsOpen}
              onToggle={(e) => setErrorsOpen((e.target as HTMLDetailsElement).open)}
              style={{ marginTop: 10 }}
            >
              <summary style={{ cursor: "pointer", fontSize: 13, color: "#475569" }}>
                {t.import_report_errors} ({state.report.errors.length})
              </summary>
              <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 12, color: "#991b1b" }}>
                {state.report.errors.map((err, i) => (
                  <li key={i}>
                    {err.line ? `L${err.line} ` : ""}
                    {err.email ? `<${err.email}> ` : ""}
                    {err.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "10px 14px",
        background: pending ? "#94a3b8" : "#0f172a",
        color: "#fff",
        border: 0,
        borderRadius: 6,
        fontSize: 13,
        cursor: pending ? "not-allowed" : "pointer",
        alignSelf: "flex-start",
      }}
    >
      {pending ? t.import_submitting : t.import_submit}
    </button>
  );
}
