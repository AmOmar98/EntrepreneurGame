// T3X-EXPANSION wave 3 / plan 12-10 — MoSCoW snapshot SSR.
// Consumed comme proof_url par submitMoscowDeliverableFlow (Plan 12-06).
// URL : /journey/deliverable/[id]/moscow-snapshot?p=<playerId>
// RLS moscow_cards_select gates : Player owner OR Mentor.
// R1 STRICT : no score/rank/multiplier in render.
// No AppShell intentionally : this is a proof page, not a navigation surface.
import { notFound, redirect } from "next/navigation";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { getMoscowCardsForPlayerDeliverable } from "@/lib/moscow";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { MoscowBucket, MoscowCard } from "@/lib/types";

const t = dictionaries.fr;

const BUCKETS: { id: MoscowBucket; label: string }[] = [
  { id: "must", label: "Must" },
  { id: "should", label: "Should" },
  { id: "could", label: "Could" },
  { id: "wont", label: "Won't" },
];

export default async function MoscowSnapshotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id: deliverableTemplateId } = await params;
  const { p: playerId } = await searchParams;

  if (!playerId) {
    notFound();
  }

  // WR-04 : defense-in-depth auth/role gate matching app/journey/deliverable/[id]/page.tsx.
  // Dual-mode demo preserved : auth checks ONLY run when Supabase env is set.
  // RLS moscow_cards_select is the primary gate ; this is belt-and-suspenders.
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const role = await getCurrentRole();
    if (role && role !== "player" && role !== "mentor" && role !== "game_master") {
      redirect(pathForRole(role));
    }
  }

  const cards = await getMoscowCardsForPlayerDeliverable(playerId, deliverableTemplateId);

  const grouped: Record<MoscowBucket, MoscowCard[]> = {
    must: [],
    should: [],
    could: [],
    wont: [],
  };
  for (const c of cards) {
    grouped[c.bucket].push(c);
  }
  for (const b of Object.keys(grouped) as MoscowBucket[]) {
    grouped[b].sort((a, b2) => a.ord - b2.ord);
  }

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t.moscow_kanban_title} — Snapshot
      </h1>
      <p style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
        Snapshot lecture seule des cartes priorisees par l&apos;equipe. Source de
        verite : table public.moscow_cards.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 24,
        }}
      >
        {BUCKETS.map((b) => (
          <section
            key={b.id}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 12,
              minHeight: 120,
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>
              {b.label}{" "}
              <span style={{ color: "#94a3b8", fontSize: 12 }}>
                ({grouped[b.id].length})
              </span>
            </h2>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {grouped[b.id].map((c) => (
                <li
                  key={c.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: 8,
                    fontSize: 13,
                  }}
                >
                  <strong>{c.feature}</strong>
                  {c.pourquoi ? (
                    <p style={{ margin: "4px 0 0", color: "#475569" }}>{c.pourquoi}</p>
                  ) : null}
                  {c.contrainte ? (
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#475569",
                        fontStyle: "italic",
                      }}
                    >
                      Contrainte : {c.contrainte}
                    </p>
                  ) : null}
                </li>
              ))}
              {grouped[b.id].length === 0 ? (
                <li style={{ fontSize: 12, color: "#94a3b8" }}>(aucune carte)</li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
