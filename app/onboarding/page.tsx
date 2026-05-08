import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getCurrentRole, pathForRole } from "@/lib/auth";
import { OnboardingForm, type OnboardingMember } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Onboarding</h1>
        <p>Onboarding necessite la configuration Supabase de production.</p>
      </main>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Onboarding</h1>
        <p>Onboarding necessite la configuration Supabase de production.</p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "player") redirect(pathForRole(role));

  // Resolve player + onboarded_at via membership
  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id, players(id, name, idea, onboarded_at)")
    .eq("user_id", user.id)
    .maybeSingle();

  const player = membership?.players as
    | { id: string; name: string | null; idea: string | null; onboarded_at: string | null }
    | null
    | undefined;

  if (!player) {
    return (
      <AppShell role="player">
        <main style={{ padding: 24 }}>
          <h1>Onboarding</h1>
          <p>Aucun Player rattache a votre compte. Contactez le GameMaster.</p>
        </main>
      </AppShell>
    );
  }

  if (player.onboarded_at) redirect("/journey");

  // Load teammates (members of same player)
  const { data: memberRows } = await supabase
    .from("player_members")
    .select("user_id, profiles(full_name, email)")
    .eq("player_id", player.id);

  const members: OnboardingMember[] = (memberRows ?? []).map((row) => {
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

  return (
    <AppShell role="player">
      <main style={{ padding: 24, display: "grid", gap: 24 }}>
        <header>
          <h1>Bienvenue dans l&apos;Entrepreneur Game</h1>
          <p>
            Niveau 0 - Diagnostic initial. Renseignez votre equipe et votre idee pour debloquer le parcours.
          </p>
        </header>
        <OnboardingForm
          initialName={player.name ?? ""}
          initialIdea={player.idea ?? ""}
          members={members}
        />
      </main>
    </AppShell>
  );
}
