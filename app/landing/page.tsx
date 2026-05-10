// Phase 11 / C1 — Public landing page (3 role doors + AgreenTech kicker + Pixel bubble).
// Source design: .planning/design-v2/project/landing.jsx (chat2 simplified version).
// EIC advisor copy constraints (CARDINAL R1): no score, no rank, no "X équipes
// en lice", no chiffres comparatifs. Only qualitative copy.
//
// Server component. Reachable in both Supabase mode and demo mode (middleware
// allows /landing as public path). Authenticated users still route by role
// via app/page.tsx.
import Link from "next/link";
import { EICLogo } from "@/components/ui";
import { PixelAvatar } from "@/components/pixel-mascot";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Role = {
  k: "player" | "mentor" | "gm";
  href: string;
  kicker: string;
  title: string;
  desc: string;
  cta: string;
  color: string;
};

const ROLES: Role[] = [
  {
    k: "player",
    href: "/login",
    kicker: t.landing_role_player_kicker,
    title: t.landing_role_player_title,
    desc: t.landing_role_player_desc,
    cta: t.landing_role_player_cta,
    color: "var(--eic-blue)",
  },
  {
    k: "mentor",
    href: "/login",
    kicker: t.landing_role_mentor_kicker,
    title: t.landing_role_mentor_title,
    desc: t.landing_role_mentor_desc,
    cta: t.landing_role_mentor_cta,
    color: "var(--eic-green)",
  },
  {
    k: "gm",
    href: "/login",
    kicker: t.landing_role_gm_kicker,
    title: t.landing_role_gm_title,
    desc: t.landing_role_gm_desc,
    cta: t.landing_role_gm_cta,
    color: "#C44536",
  },
];

export default function LandingPage() {
  return (
    <div className="eic-landing">
      <div aria-hidden="true" className="eic-landing__bg" />
      <div aria-hidden="true" className="eic-landing__halo" />
      <svg
        aria-hidden="true"
        className="eic-landing__hills"
        preserveAspectRatio="none"
        viewBox="0 0 1280 240"
      >
        <path
          d="M0 180 Q200 130 420 160 T820 150 T1280 170 L1280 240 L0 240 Z"
          fill="rgba(46,125,50,0.10)"
        />
        <path
          d="M0 200 Q220 170 480 190 T900 180 T1280 200 L1280 240 L0 240 Z"
          fill="rgba(27,58,92,0.10)"
        />
        <path
          d="M0 220 Q240 200 520 215 T960 210 T1280 220 L1280 240 L0 240 Z"
          fill="rgba(43,38,30,0.08)"
        />
      </svg>

      <header className="eic-landing__topbar">
        <Link aria-label={t.brand_name} href="/landing">
          <EICLogo />
        </Link>
        <span className="eic-landing__grow" />
        <span className="eic-landing__edition-pill">{t.landing_pill_edition}</span>
      </header>

      <main className="eic-landing__main">
        <section className="eic-landing__hero">
          <p className="eic-landing__kicker">{t.landing_kicker}</p>
          <h1 className="eic-landing__title">
            {t.landing_h1_a}
            <em>{t.landing_h1_em}</em>
          </h1>
          <p className="eic-landing__lead">
            {t.landing_lead} <strong>{t.landing_lead_cta}</strong>
          </p>

          <aside className="eic-landing__pixel" aria-label={t.landing_pixel_caption}>
            <span className="eic-landing__pixel-bubble">{t.landing_pixel_bubble}</span>
            <span className="eic-landing__pixel-mascot">
              <PixelAvatar mood="serein" size={120} />
            </span>
            <span className="eic-landing__pixel-caption">{t.landing_pixel_caption}</span>
          </aside>
        </section>

        <section className="eic-landing__doors" aria-label="Roles">
          {ROLES.map((r) => (
            <Link
              className="eic-landing__door"
              href={r.href}
              key={r.k}
              style={{ ["--door-color" as string]: r.color }}
            >
              <span aria-hidden="true" className="eic-landing__door-mark" />
              <span className="eic-landing__door-kicker">{r.kicker}</span>
              <h2 className="eic-landing__door-title">{r.title}</h2>
              <p className="eic-landing__door-desc">{r.desc}</p>
              <span className="eic-landing__door-cta">
                {r.cta}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </section>
      </main>

      <footer className="eic-landing__footer">
        <span>{t.landing_footer}</span>
        <span className="eic-landing__grow" />
        <Link href="#about">{t.landing_link_about}</Link>
        <Link href="#help">{t.landing_link_help}</Link>
      </footer>
    </div>
  );
}
