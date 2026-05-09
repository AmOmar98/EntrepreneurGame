import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { getCurrentRole, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { OnboardingForm, type OnboardingMember } from "@/components/onboarding-form";

const t = dictionaries.fr;

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
      <AppShell hideTabBar role="player" variant="player">
        <main style={{ padding: 24 }}>
          <h1>{t.onboarding_title}</h1>
          <p>{t.onboarding_no_player}</p>
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
    <AppShell hideTabBar role="player" variant="player">
      <main style={{ padding: 24, display: "grid", gap: 24 }}>
        <header>
          <h1>{t.onboarding_title}</h1>
          <p>{t.onboarding_header_subtitle}</p>
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
