"use client";

import { useActionState } from "react";
import { signIn, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import { Button } from "@/components/ui";

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="stack">
      <label className="form-row">
        <span>{t.login_email}</span>
        <input className="input" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="form-row">
        <span>{t.login_password}</span>
        <input
          className="input"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
        />
      </label>
      {state.message && !state.ok ? (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="eic-login-form__submit">
        <Button disabled={isPending} size="lg" type="submit" variant="primary">
          {isPending ? t.login_submitting : t.login_submit}
        </Button>
      </div>
    </form>
  );
}
