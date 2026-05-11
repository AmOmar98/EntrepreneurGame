"use client";
// Design v2 (polish/design-v2-match V8) — Closing ceremony reveal screen.
// GM-only (gated upstream by /results/ceremony page). Projector-friendly:
// dark background, large Baskervville typography, podium reveal with
// staggered transition (3rd → 2nd → 1st), partner logos footer.
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
  1: 280,
  2: 220,
  3: 180,
};

const RANK_ORDER: Array<1 | 2 | 3> = [2, 1, 3];

export function ResultsCeremonyScreen({ podium }: Props) {
  const [revealStep, setRevealStep] = useState<0 | 1 | 2 | 3>(0);

  const top3 = podium.slice(0, 3);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, #1B3A5C 0%, #0E1F33 60%, #050B14 100%)",
        color: "#fff",
        fontFamily: "var(--font-body, Montserrat, system-ui), sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative aurora blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-20%",
          left: "10%",
          width: "60%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(78,156,229,0.16) 0%, transparent 60%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "10%",
          width: "50%",
          height: "50%",
          background:
            "radial-gradient(circle, rgba(76,175,80,0.14) 0%, transparent 60%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Top bar with back link */}
      <header
        style={{
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Link
          href="/results"
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {t.results_ceremony_back}
        </Link>
      </header>

      {/* Hero */}
      <section
        style={{
          flex: "0 0 auto",
          textAlign: "center",
          padding: "32px 24px 24px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body), Montserrat, sans-serif",
            fontSize: 11,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            margin: "0 0 16px",
          }}
        >
          {t.results_ceremony_hero_subtitle}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading, Baskervville, serif)",
            fontSize: "clamp(40px, 6vw, 84px)",
            fontWeight: 600,
            margin: "0 0 12px",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
          }}
        >
          {t.results_ceremony_hero_title}
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.7)",
            margin: 0,
            maxWidth: 540,
            marginInline: "auto",
            lineHeight: 1.5,
          }}
        >
          11 équipes, 2 jours, 1 podium. L'EIC vous remercie pour votre énergie,
          votre rigueur et l'audace de vos projets AgreenTech.
        </p>
      </section>

      {/* Reveal button or podium */}
      <section
        style={{
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 2,
          minHeight: 340,
        }}
      >
        {top3.length < 3 ? (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
            {t.results_ceremony_empty}
          </p>
        ) : revealStep === 0 ? (
          <button
            type="button"
            onClick={() => setRevealStep(1)}
            style={{
              padding: "16px 36px",
              fontSize: 18,
              fontWeight: 600,
              background:
                "linear-gradient(135deg, var(--wf-blue) 0%, #2A5A8C 100%)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 14,
              cursor: "pointer",
              fontFamily: "var(--font-body), Montserrat, sans-serif",
              boxShadow: "0 10px 32px rgba(27,58,92,0.45)",
              letterSpacing: "0.01em",
            }}
            aria-live="polite"
          >
            {t.results_ceremony_reveal_button}
          </button>
        ) : (
          <>
            <p
              style={{
                fontFamily: "var(--font-body), Montserrat, sans-serif",
                fontSize: 11,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                margin: "0 0 36px",
              }}
            >
              {t.results_ceremony_podium_kicker}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(180px, 280px))",
                gap: 28,
                alignItems: "end",
              }}
            >
              {RANK_ORDER.map((rank, i) => {
                const entry = top3.find((e) => e.rank === rank);
                if (!entry) return null;
                const revealed = revealStep >= i + 1;
                return (
                  <article
                    key={rank}
                    style={{
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? "translateY(0)" : "translateY(28px)",
                      transition:
                        "opacity 520ms ease-out, transform 520ms ease-out",
                      transitionDelay: revealed ? `${i * 240}ms` : "0ms",
                      background:
                        rank === 1
                          ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(27,58,92,0.5) 100%)"
                          : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(14,31,51,0.5) 100%)",
                      border:
                        rank === 1
                          ? "1px solid rgba(255,215,128,0.5)"
                          : "1px solid rgba(255,255,255,0.14)",
                      borderRadius: 16,
                      padding: "20px 18px 24px",
                      textAlign: "center",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      minHeight: RANK_HEIGHT[rank],
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      boxShadow:
                        rank === 1
                          ? "0 18px 48px rgba(27,58,92,0.55)"
                          : "0 12px 32px rgba(14,31,51,0.45)",
                    }}
                    aria-label={`${RANK_LABEL[rank]} - ${entry.teamName}`}
                  >
                    <div
                      style={{
                        fontSize: rank === 1 ? 52 : 40,
                        lineHeight: 1,
                      }}
                      aria-hidden="true"
                    >
                      {RANK_GLYPH[rank]}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {RANK_LABEL[rank]}
                    </div>
                    <div
                      style={{
                        fontFamily:
                          "var(--font-heading, Baskervville, serif)",
                        fontSize: rank === 1 ? 28 : 22,
                        fontWeight: 600,
                        lineHeight: 1.15,
                        margin: "4px 0",
                      }}
                    >
                      {entry.teamName}
                    </div>
                    {entry.idea ? (
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.7)",
                          lineHeight: 1.4,
                          margin: "0 0 8px",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {entry.idea}
                      </div>
                    ) : null}
                    <div style={{ marginTop: "auto" }}>
                      <div
                        style={{
                          fontFamily: "Montserrat, sans-serif",
                          fontSize: rank === 1 ? 36 : 28,
                          fontWeight: 800,
                          color: rank === 1 ? "#FFD780" : "#BFD3E8",
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                        }}
                      >
                        {entry.combined.toFixed(1)}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          color: "rgba(255,255,255,0.5)",
                          textTransform: "uppercase",
                          marginTop: 4,
                        }}
                      >
                        score combiné
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {revealStep < 3 ? (
              <button
                type="button"
                onClick={() =>
                  setRevealStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : 3))
                }
                style={{
                  marginTop: 36,
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: 500,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "var(--font-body), Montserrat, sans-serif",
                }}
              >
                Continuer →
              </button>
            ) : null}
          </>
        )}
      </section>

      {/* Partner footer */}
      <footer
        style={{
          padding: "24px 32px 32px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.25)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 14px",
          }}
        >
          {t.results_ceremony_partners_label}
        </p>
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            borderRadius: 12,
            padding: "12px 18px",
            display: "inline-block",
          }}
        >
          <PartnerBanner />
        </div>
      </footer>
    </div>
  );
}
