import { LoginForm } from "@/components/login-form";
import { PartnerBanner } from "@/components/partner-banner";
import { EICLogo } from "@/components/ui";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export default function LoginPage() {
  return (
    <div className="eic-login-shell">
      <div aria-hidden="true" className="eic-aurora">
        <span className="blob3" />
      </div>
      <header className="eic-login-header">
        <EICLogo />
      </header>
      <main className="eic-login-main">
        <section className="eic-login-card eic-glass">
          <p className="kicker">{t.brand_subtitle}</p>
          <h1>{t.login_title}</h1>
          <p className="lead">{t.login_subtitle}</p>
          <LoginForm />
        </section>
      </main>
      <footer className="eic-login-partners">
        <PartnerBanner />
        <p className="eic-login-partners__caption">{t.login_partners_caption}</p>
      </footer>
    </div>
  );
}
