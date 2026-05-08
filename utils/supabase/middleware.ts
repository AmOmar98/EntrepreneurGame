import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/callback");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Onboarding gate (ONBOARD-02): only enforced for authenticated users on
  // non-public, non-onboarding routes that are not pure asset / api paths.
  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("app_role")
      .eq("user_id", user.id)
      .maybeSingle();

    const appRole = profile?.app_role as "player" | "mentor" | "game_master" | undefined;

    if (appRole === "player") {
      const { data: membership } = await supabase
        .from("player_members")
        .select("player_id, players(onboarded_at)")
        .eq("user_id", user.id)
        .maybeSingle();

      const onboardedAt =
        (membership?.players as { onboarded_at: string | null } | null | undefined)?.onboarded_at ??
        null;

      const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

      if (!onboardedAt && !isOnboardingRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (onboardedAt && isOnboardingRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/journey";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
