"use client";

import { useActionState } from "react";
import { signIn, type WorkflowState } from "@/app/actions";

const initialState: WorkflowState = { ok: false, message: "" };

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Entrepreneur Game</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>EIC / UEMF pilot</p>
      <form action={formAction} className="stack">
        <label className="form-row">
          Email
          <input className="input" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="form-row">
          Mot de passe
          <input className="input" name="password" type="password" required minLength={6} autoComplete="current-password" />
        </label>
        {state.message && !state.ok ? (
          <p className="form-error" style={{ color: "#c00" }}>
            {state.message}
          </p>
        ) : null}
        <button className="button primary" type="submit">
          Se connecter
        </button>
      </form>
    </main>
  );
}
