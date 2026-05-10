// Phase 10 / Section 13 — Root App Router 404.
import Link from "next/link";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export default function NotFound() {
  return (
    <main className="main">
      <section className="eic-sys eic-sys--empty">
        <h2 className="eic-sys__title">{t.not_found_title}</h2>
        <p className="eic-sys__lead">{t.not_found_lead}</p>
        <div className="eic-sys__divider" aria-hidden="true" />
        <Link className="eic-button eic-button--primary" href="/journey">
          {t.not_found_cta}
        </Link>
      </section>
    </main>
  );
}
