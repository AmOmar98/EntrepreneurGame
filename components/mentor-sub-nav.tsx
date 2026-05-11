// MNT-04 — Prev/Next submission navigation with J/K keyboard shortcuts.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function MentorSubNav({
  prevId,
  nextId,
  position,
  total,
}: {
  prevId: string | null;
  nextId: string | null;
  position: number;
  total: number;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Skip when focus is inside an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.key === "k" || e.key === "K" || e.key === "ArrowLeft") && prevId) {
        router.push(`/mentor/submission/${prevId}`);
      } else if ((e.key === "j" || e.key === "J" || e.key === "ArrowRight") && nextId) {
        router.push(`/mentor/submission/${nextId}`);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevId, nextId, router]);

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 12px",
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#334155",
    textDecoration: "none",
  };
  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    color: "#cbd5e1",
    cursor: "default",
    pointerEvents: "none",
  };

  return (
    <nav
      aria-label="Navigation entre soumissions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      {prevId ? (
        <Link href={`/mentor/submission/${prevId}`} style={btnBase} aria-label="Soumission precedente (K)">
          ← Precedent
        </Link>
      ) : (
        <span style={btnDisabled} aria-disabled="true">← Precedent</span>
      )}

      <span style={{ fontSize: 12, color: "#94a3b8", userSelect: "none" }}>
        {position} / {total}
      </span>

      {nextId ? (
        <Link href={`/mentor/submission/${nextId}`} style={btnBase} aria-label="Soumission suivante (J)">
          Suivant →
        </Link>
      ) : (
        <span style={btnDisabled} aria-disabled="true">Suivant →</span>
      )}

      <span
        style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}
        aria-hidden="true"
        title="Raccourcis clavier : K = precedent, J = suivant"
      >
        [K / J]
      </span>
    </nav>
  );
}
