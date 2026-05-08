"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboarding, type WorkflowState } from "@/app/actions";

const initialState: WorkflowState = { ok: false, message: "" };

export type OnboardingMember = {
  userId: string;
  fullName: string | null;
  email: string | null;
};

const LIKERT_QUESTIONS: { id: "q1" | "q2" | "q3" | "q4" | "q5"; label: string }[] = [
  { id: "q1", label: "Notre probleme client est clairement identifie." },
  { id: "q2", label: "Nous avons deja parle a au moins 5 utilisateurs cibles." },
  { id: "q3", label: "Nous avons une solution pressentie." },
  { id: "q4", label: "Nous connaissons notre marche et la concurrence." },
  { id: "q5", label: "Nous savons comment nous allons monetiser." },
];

const LIKERT_SCALE = [1, 2, 3, 4, 5];

export function OnboardingForm({
  initialName,
  initialIdea,
  members,
}: {
  initialName: string;
  initialIdea: string;
  members: OnboardingMember[];
}) {
  const [state, formAction, pending] = useActionState(saveOnboarding, initialState);
  const [idea, setIdea] = useState(initialIdea);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.push("/journey");
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} style={{ display: "grid", gap: 24, maxWidth: 720 }}>
      <section style={{ display: "grid", gap: 8 }}>
        <label htmlFor="teamName">
          <strong>Nom d&apos;equipe</strong>
        </label>
        <input
          id="teamName"
          name="teamName"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initialName}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #d0d4dc" }}
        />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <label htmlFor="idea">
          <strong>Idee de projet</strong>
        </label>
        <textarea
          id="idea"
          name="idea"
          required
          minLength={10}
          maxLength={500}
          rows={4}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #d0d4dc" }}
        />
        <small aria-live="polite">{idea.length} / 500 caracteres</small>
      </section>

      <fieldset style={{ display: "grid", gap: 12, border: "1px solid #d0d4dc", padding: 12, borderRadius: 6 }}>
        <legend>
          <strong>Diagnostic initial (1 = pas du tout, 5 = tout a fait)</strong>
        </legend>
        {LIKERT_QUESTIONS.map((q) => (
          <div key={q.id} style={{ display: "grid", gap: 4 }}>
            <span>{q.label}</span>
            <div style={{ display: "flex", gap: 12 }} role="radiogroup" aria-label={q.label}>
              {LIKERT_SCALE.map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="radio" name={q.id} value={v} required />
                  {v}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      {members.length > 0 && (
        <fieldset style={{ display: "grid", gap: 8, border: "1px solid #d0d4dc", padding: 12, borderRadius: 6 }}>
          <legend>
            <strong>Membres presents</strong>
          </legend>
          {members.map((m) => (
            <label key={m.userId} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="membersConfirmed" value={m.userId} defaultChecked />
              <span>
                {m.fullName ?? "(sans nom)"} {m.email ? `- ${m.email}` : ""}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            background: "#1a73e8",
            color: "white",
            border: 0,
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {pending ? "Enregistrement..." : "Valider et demarrer"}
        </button>
        {state.message && (
          <span role="status" style={{ color: state.ok ? "#1f7a3a" : "#b3261e" }}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
