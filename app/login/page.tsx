import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { signIn } from "@/app/actions";
import { hasSupabaseEnv } from "@/lib/supabase-status";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="stack">
          <ShieldCheck aria-hidden="true" color="var(--green)" size={34} />
          <span className="eyebrow">EIC Venture Journey</span>
          <h1>Connexion espace startup</h1>
          <p className="muted">
            Acces fondateurs, coachs et equipe EIC. En local sans Supabase, l'application reste en mode demo.
          </p>
        </div>
        {configured ? (
          <form action={signIn} className="stack">
            <label className="form-row">
              Email
              <input className="input" name="email" type="email" required />
            </label>
            <label className="form-row">
              Mot de passe
              <input className="input" name="password" type="password" required />
            </label>
            {params.error ? <p className="form-error">Identifiants invalides.</p> : null}
            <button className="button primary" type="submit">Se connecter</button>
          </form>
        ) : (
          <Link className="button primary" href="/">Entrer en mode demo</Link>
        )}
      </section>
    </main>
  );
}
