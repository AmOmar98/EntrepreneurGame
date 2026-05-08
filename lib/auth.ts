import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { AppRole } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return "player"; // sensible default if no profile row
  return data.app_role as AppRole;
}

export function pathForRole(role: AppRole): string {
  switch (role) {
    case "player":
      return "/journey";
    case "mentor":
      return "/mentor";
    case "game_master":
      return "/admin";
  }
}

export async function redirectForRole(): Promise<never> {
  const role = await getCurrentRole();
  if (!role) redirect("/login");
  redirect(pathForRole(role));
}
