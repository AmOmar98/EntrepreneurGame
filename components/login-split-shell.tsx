import Link from "next/link";
import type { ReactNode } from "react";
import { EICLogo } from "@/components/ui";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type LoginRole = "player" | "mentor" | "gm";

type RoleCopy = {
  pill: string;
  heroLine1: string;
  heroLine2: string;
  quote: string;
};

const ROLE_COPY: Record<LoginRole, RoleCopy> = {
  player: {
    pill: t.login_role_player,
    heroLine1: t.login_hero_player_line1,
    heroLine2: t.login_hero_player_line2,
    quote: t.login_quote_player,
  },
  mentor: {
    pill: t.login_role_mentor,
    heroLine1: t.login_hero_mentor_line1,
    heroLine2: t.login_hero_mentor_line2,
    quote: t.login_quote_mentor,
  },
  gm: {
    pill: t.login_role_gm,
    heroLine1: t.login_hero_gm_line1,
    heroLine2: t.login_hero_gm_line2,
    quote: t.login_quote_gm,
  },
};

export type LoginSplitShellProps = {
  role: LoginRole;
  children: ReactNode;
};

export function LoginSplitShell({ role, children }: LoginSplitShellProps) {
  const copy = ROLE_COPY[role];
  return (
    <div className={`eic-login-v2-shell eic-login-v2--${role}`}>
      <aside className={`eic-login-v2-hero eic-login-v2-hero--${role}`} aria-hidden="false">
        <header className="eic-login-v2-hero__top">
          <EICLogo variant="white" />
        </header>
        <div className="eic-login-v2-hero__body">
          <span className="eic-login-v2-hero__pill">{copy.pill}</span>
          <h1 className="eic-login-v2-hero__title">
            <span>{copy.heroLine1}</span>
            <br />
            <span>{copy.heroLine2}</span>
          </h1>
          <p className="eic-login-v2-hero__quote">{copy.quote}</p>
        </div>
        <footer className="eic-login-v2-hero__foot">{t.brand_subtitle}</footer>
      </aside>
      <main className="eic-login-v2-panel">
        <Link className="eic-login-v2-back" href="/landing">
          <span aria-hidden="true">←</span> {t.login_back}
        </Link>
        <h2 className="eic-login-v2-panel__title">{t.login_submit}</h2>
        {children}
        <p className="eic-login-v2-legal">
          <Link href="#cgu">{t.login_legal_cgu}</Link>
          <span aria-hidden="true"> · </span>
          <Link href="#privacy">{t.login_legal_privacy}</Link>
        </p>
      </main>
    </div>
  );
}
