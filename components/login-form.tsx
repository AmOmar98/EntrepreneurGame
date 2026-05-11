"use client";

import { useActionState } from "react";
import { signIn, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import { Button } from "@/components/ui";
import type { LoginRole } from "@/components/login-split-shell";

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };

export type LoginFormProps = {
  role?: LoginRole;
};

export function LoginForm({ role }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const identifierLabel = role === "mentor" ? t.login_email_mentor : t.login_identifier;

  return (
    <form action={formAction} className="eic-login-v2-form">
      <label className="eic-login-v2-field">
        <span className="eic-login-v2-field__label">{identifierLabel}</span>
        <input
          className="eic-login-v2-field__input"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </label>
      <label className="eic-login-v2-field">
        <span className="eic-login-v2-field__label">{t.login_password}</span>
        <input
          className="eic-login-v2-field__input"
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
      <div className="eic-login-v2-submit">
        <Button
          className={role ? `eic-login-v2-submit__btn--${role}` : undefined}
          disabled={isPending}
          size="lg"
          type="submit"
          variant="primary"
        >
          {isPending ? t.login_submitting : t.login_submit}
          {!isPending ? <span aria-hidden="true">  →</span> : null}
        </Button>
      </div>
    </form>
  );
}
