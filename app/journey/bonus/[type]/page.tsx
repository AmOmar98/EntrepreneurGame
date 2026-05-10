// T3X-EXPANSION wave 3 / plan 12-10 — Player bonus claim route.
// /journey/bonus/[type] — params.type in BonusType.
// Auth-gated, role 'player'. Render BonusClaimForm + history of claims for this type.
// R1 STRICT : no score / multiplier numerique render. Only qualitative BonusStatusBadge.
// Dual-mode safe : hasSupabaseEnv() check ; fallback FR message.
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BonusClaimForm } from "@/components/bonus-claim-form";
import { BonusStatusBadge } from "@/components/bonus-status-badge";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { getBonusEventsForPlayer } from "@/lib/bonus";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { BONUS_DEFAULTS, type BonusType } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

const t = dictionaries.fr;

const VALID_BONUS_TYPES: BonusType[] = [
  "bonus_verbatims_terrain",
  "bonus_dev_plan",
  "bonus_prototype_draft",
];

export default async function BonusClaimPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: rawType } = await params;
  if (!VALID_BONUS_TYPES.includes(rawType as BonusType)) {
    notFound();
  }
  const bonusType = rawType as BonusType;

  // Dual-mode demo guard : auth via middleware in Supabase mode ; demo mode
  // renders a static fallback without touching auth helpers.
  if (!hasSupabaseEnv()) {
    return (
      <AppShell role="player" variant="player">
        <main style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {BONUS_DEFAULTS[bonusType].titleFr}
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
            {t.onboarding_demo_disabled}
          </p>
        </main>
      </AppShell>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const role = await getCurrentRole();
  if (role && role !== "player") {
    redirect(pathForRole(role));
  }

  const supabase = await createClient();
  let history: Awaited<ReturnType<typeof getBonusEventsForPlayer>> = [];
  if (supabase) {
    const { data: membership } = await supabase
      .from("player_members")
      .select("player_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const playerId = (membership as { player_id?: string } | null)?.player_id;
    if (playerId) {
      const all = await getBonusEventsForPlayer(playerId);
      history = all.filter((b) => b.type === bonusType);
    }
  }

  return (
    <AppShell role="player" variant="player">
      <main style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          {BONUS_DEFAULTS[bonusType].titleFr}
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
          {t.bonus_section_subtitle}
        </p>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{t.bonus_claim_submit}</h2>
          <BonusClaimForm
            bonusType={bonusType}
            defaultTitle={BONUS_DEFAULTS[bonusType].titleFr}
          />
        </section>

        {history.length > 0 ? (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Historique</h2>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {history.map((b) => (
                <li
                  key={b.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 12,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14, color: "#0f172a" }}>{b.title}</span>
                  <BonusStatusBadge status={b.status} consumedAt={b.multiplierConsumedAt} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
