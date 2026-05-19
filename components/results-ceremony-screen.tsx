"use client";
// Design v2 (polish/design-v2-match V8) — Closing ceremony reveal screen.
// Refreshed quick-260519-jpr W2 #5 : théâtre sombre plein écran, halos dorés
// sur podium, reveal staggered 3e→2e→1er (delay 0s/3s/6s), confetti CSS only,
// footer logos partenaires, bouton retour top-right. GM-only (gated upstream
// by /results/ceremony page).
import { useState } from "react";
import Link from "next/link";
import { PartnerBanner } from "@/components/partner-banner";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type CeremonyEntry = {
  rank: 1 | 2 | 3;
  teamName: string;
  idea: string | null;
  combined: number;
};

type Props = {
  podium: CeremonyEntry[];
};

const RANK_LABEL: Record<1 | 2 | 3, string> = {
  1: t.results_ceremony_rank_first,
  2: t.results_ceremony_rank_second,
  3: t.results_ceremony_rank_third,
};

const RANK_GLYPH: Record<1 | 2 | 3, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const RANK_HEIGHT: Record<1 | 2 | 3, number> = {
  1: 320,
  2: 240,
  3: 190,
};

// Display order on the podium row (2 - 1 - 3) but reveal order is 3 first,
// then 2, then 1 (« on garde le suspense pour la première place »).
const DISPLAY_ORDER: Array<1 | 2 | 3> = [2, 1, 3];
const REVEAL_ORDER: Array<1 | 2 | 3> = [3, 2, 1];

// Confetti pieces — 24 absolute spans with randomised animation-delay /
// horizontal position via :nth-child in globals.css.
const CONFETTI_COUNT = 24;

export function ResultsCeremonyScreen({ podium }: Props) {
  // revealStep: 0 = idle, 1 = bronze visible, 2 = silver visible, 3 = gold visible
  const [revealStep, setRevealStep] = useState<0 | 1 | 2 | 3>(0);

  const top3 = podium.slice(0, 3);
  const showConfetti = revealStep === 3;

  function startReveal() {
    // Auto-staggered reveal: 0s → bronze, 3s → silver, 6s → gold
    setRevealStep(1);
    setTimeout(() => setRevealStep(2), 3000);
    setTimeout(() => setRevealStep(3), 6000);
  }

  return (
    <div className="eic-ceremony">
      {/* Decorative aurora blobs (dark theatre ambiance) */}
      <div aria-hidden="true" className="eic-ceremony__aurora eic-ceremony__aurora--blue" />
      <div aria-hidden="true" className="eic-ceremony__aurora eic-ceremony__aurora--green" />

      {/* Confetti layer — pure CSS, only after the gold reveal */}
      {showConfetti ? (
        <div aria-hidden="true" className="eic-ceremony__confetti-layer">
          {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
            <span className="eic-ceremony__confetti" key={i} />
          ))}
        </div>
      ) : null}

      {/* Back button top-right */}
      <header className="eic-ceremony__topbar">
        <Link href="/results" className="eic-ceremony__back">
          {t.results_ceremony_back}
        </Link>
      </header>

      {/* Hero */}
      <section className="eic-ceremony__hero">
        <p className="eic-ceremony__hero-kicker">
          {t.results_ceremony_hero_subtitle}
        </p>
        <h1 className="eic-ceremony__hero-title">
          {t.results_ceremony_hero_title}
        </h1>
        <p className="eic-ceremony__hero-body">
          11 équipes, 2 jours, 1 podium. L'EIC vous remercie pour votre énergie,
          votre rigueur et l'audace de vos projets.
        </p>
      </section>

      {/* Reveal CTA / podium */}
      <section className="eic-ceremony__stage">
        {top3.length < 3 ? (
          <p className="eic-ceremony__empty">{t.results_ceremony_empty}</p>
        ) : revealStep === 0 ? (
          <button
            type="button"
            onClick={startReveal}
            className="eic-ceremony__reveal-btn"
            aria-live="polite"
          >
            {t.results_ceremony_reveal_button}
          </button>
        ) : (
          <>
            <p className="eic-ceremony__podium-kicker">
              {t.results_ceremony_podium_kicker}
            </p>
            <div className="eic-ceremony__podium-row">
              {DISPLAY_ORDER.map((rank) => {
                const entry = top3.find((e) => e.rank === rank);
                if (!entry) return null;
                // Reveal step: bronze first (1), silver second (2), gold third (3).
                const revealIdx = REVEAL_ORDER.indexOf(rank) + 1;
                const revealed = revealStep >= revealIdx;
                return (
                  <article
                    key={rank}
                    className={`eic-ceremony__podium-card eic-ceremony__podium-card--rank-${rank} ${
                      revealed ? "is-revealed" : ""
                    }`}
                    style={{ minHeight: RANK_HEIGHT[rank] }}
                    aria-label={`${RANK_LABEL[rank]} - ${entry.teamName}`}
                  >
                    <div className="eic-ceremony__podium-glyph" aria-hidden="true">
                      {RANK_GLYPH[rank]}
                    </div>
                    <div className="eic-ceremony__podium-label">
                      {RANK_LABEL[rank]}
                    </div>
                    <div className="eic-ceremony__podium-team">
                      {entry.teamName}
                    </div>
                    {entry.idea ? (
                      <div className="eic-ceremony__podium-idea">
                        {entry.idea}
                      </div>
                    ) : null}
                    <div className="eic-ceremony__podium-scorewrap">
                      <div className="eic-ceremony__podium-score">
                        {entry.combined.toFixed(1)}
                      </div>
                      <div className="eic-ceremony__podium-scorelabel">
                        score combiné
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Partner footer */}
      <footer className="eic-ceremony__footer">
        <p className="eic-ceremony__footer-label">
          {t.results_ceremony_partners_label}
        </p>
        <div className="eic-ceremony__footer-banner">
          <PartnerBanner />
        </div>
      </footer>
    </div>
  );
}
