import Image from "next/image";
import { LoginForm } from "@/components/login-form";
import { PartnerBanner } from "@/components/partner-banner";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <main className="auth-main">
        <div className="auth-card">
          <header className="auth-header">
            <Image
              src="/brand/logo-eic.svg"
              alt="EIC - UEMF"
              width={180}
              height={48}
              className="brand-logo"
              priority
            />
            <h1>{t.login_title}</h1>
            <p className="auth-subtitle">{t.login_subtitle}</p>
          </header>
          <LoginForm />
        </div>
      </main>
      <PartnerBanner />
      <p className="auth-footer">{t.login_partners_caption}</p>
    </div>
  );
}
