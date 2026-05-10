// Phase 7 / Plan 07-02 - Onboarding 3 editorial steps page (server).
// Resolves player + members + best-effort mentor display block, then hands
// off to the client <OnboardingStepper>. The legacy 1-step KYC form is
// replaced by an editorial 3-step flow (BIENVENUE / TON EQUIPE / LES REGLES)
// that ends with the same `saveOnboarding` server action -> /journey.
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  OnboardingStepper,
  type OnboardingStepperMember,
} from "@/components/onboarding-stepper";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getCurrentRole, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

// Best-effort first-name extraction from a profile.full_name (e.g. "Yasmine A.")
function getFirstName(fullName: string | null): string | null {
  if (!fullName) return null;
  const first = fullName.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : null;
}

function getInitials(name: string | null, fallback: string): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function OnboardingPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main style={{ padding: 24 }}>
        <h1>{t.onboarding_title}</h1>
        <p>{t.onboarding_demo_disabled}</p>
      </main>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <main style={{ padding: 24 }}>
        <h1>{t.onboarding_title}</h1>
        <p>{t.onboarding_demo_disabled}</p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "player") redirect(pathForRole(role));

  // Resolve player + onboarded_at via membership.
  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id, players(id, name, idea, onboarded_at)")
    .eq("user_id", user.id)
    .maybeSingle();

  const rawPlayer = membership?.players as
    | { id: string; name: string | null; idea: string | null; onboarded_at: string | null }
    | { id: string; name: string | null; idea: string | null; onboarded_at: string | null }[]
    | null
    | undefined;
  const player = Array.isArray(rawPlayer) ? rawPlayer[0] : rawPlayer;

  if (!player) {
    return (
      <AppShell hideTabBar role="player" variant="player">
        <main style={{ padding: 24 }}>
          <h1>{t.onboarding_title}</h1>
          <p>{t.onboarding_no_player}</p>
        </main>
      </AppShell>
    );
  }

  if (player.onboarded_at) redirect("/journey");

  // Load teammates (members of same player). Resolve full_name + email from
  // the joined profiles row so we can render avatars + checkboxes.
  const { data: memberRows } = await supabase
    .from("player_members")
    .select("user_id, profiles(full_name, email)")
    .eq("player_id", player.id);

  const members: OnboardingStepperMember[] = (memberRows ?? []).map((row) => {
    const raw = row.profiles as
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null
      | undefined;
    const profile = Array.isArray(raw) ? raw[0] : raw;
    return {
      userId: row.user_id as string,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });

  // Best-effort mentor resolution. The schema does not expose a stable
  // mentor->player assignment (PLR-08 placeholder), so we show a generic
  // mentor block until Phase 8 wires real assignments. Falls back to null
  // when no profile.full_name is found.
  // TODO Phase 8: replace with real assigned-mentor lookup.
  let mentor: { initials: string; name: string } | null = null;
  const { data: mentorRow } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("app_role", "mentor")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const mentorName = (mentorRow as { full_name?: string | null } | null)?.full_name ?? null;
  if (mentorName) {
    mentor = { initials: getInitials(mentorName, "M"), name: mentorName };
  }

  // First name for the personalised greeting in step 1.
  const { data: profileSelf } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const firstName = getFirstName(
    (profileSelf as { full_name?: string | null } | null)?.full_name ?? null,
  );

  return (
    <AppShell hideTabBar role="player" variant="player">
      <OnboardingStepper
        firstName={firstName}
        initialIdea={player.idea ?? ""}
        initialName={player.name ?? ""}
        members={members}
        mentor={mentor}
      />
    </AppShell>
  );
}
