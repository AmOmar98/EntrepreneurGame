"use client";

import { useActionState } from "react";
import { signIn, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="stack">
      <label className="form-row">
        {t.login_email}
        <input className="input" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="form-row">
        {t.login_password}
        <input
          className="input"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
        />
      </label>
      {state.message && !state.ok ? <p className="form-error">{state.message}</p> : null}
      <button className="button primary" type="submit">
        {t.login_submit}
      </button>
    </form>
  );
}
