// T3X-EXPANSION wave 3 / plan 12-10 — Mentor bonus review route.
// /mentor/bonus/[id] — auth-gated role 'mentor' or 'game_master'.
// Display claim details + form to validate/reject + feedback (client wrapper).
// R1 : multiplier_factor not displayed in T-3 (mentor v0.3 may surface it).
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BonusStatusBadge } from "@/components/bonus-status-badge";
import { MentorBonusReviewForm } from "@/components/mentor-bonus-review-form";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { getBonusEventById } from "@/lib/bonus";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";

const t = dictionaries.fr;

export default async function MentorBonusReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <AppShell role="mentor" variant="staff">
        <main style={{ padding: 32 }}>
          <p>{t.onboarding_demo_disabled}</p>
        </main>
      </AppShell>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const role = await getCurrentRole();
  if (role && role !== "mentor" && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const bonus = await getBonusEventById(id);
  if (!bonus) {
    notFound();
  }

  return (
    <AppShell role={role ?? "mentor"} variant="staff">
      <main style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {t.bonus_review_title}
          </h1>
          <div style={{ marginTop: 8 }}>
            <BonusStatusBadge
              status={bonus.status}
              consumedAt={bonus.multiplierConsumedAt}
            />
          </div>
        </header>

        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "150px 1fr",
            gap: 8,
            fontSize: 14,
          }}
        >
          <dt style={{ fontWeight: 600 }}>Type</dt>
          <dd style={{ margin: 0 }}>{bonus.type}</dd>
          <dt style={{ fontWeight: 600 }}>Titre</dt>
          <dd style={{ margin: 0 }}>{bonus.title}</dd>
          <dt style={{ fontWeight: 600 }}>Description</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{bonus.description}</dd>
          <dt style={{ fontWeight: 600 }}>Preuve</dt>
          <dd style={{ margin: 0 }}>
            {bonus.docUrl ? (
              <a
                href={bonus.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1d4ed8" }}
              >
                {bonus.docUrl}
              </a>
            ) : (
              "(aucune)"
            )}
          </dd>
          <dt style={{ fontWeight: 600 }}>Soumis le</dt>
          <dd style={{ margin: 0 }}>{bonus.claimedAt}</dd>
        </dl>

        {bonus.status === "submitted" ? (
          <MentorBonusReviewForm bonusEventId={bonus.id} />
        ) : (
          <p style={{ marginTop: 24, fontSize: 14, color: "#475569" }}>
            Bonus deja evalue. Feedback : {bonus.feedback || "(aucun)"}
          </p>
        )}
      </main>
    </AppShell>
  );
}
