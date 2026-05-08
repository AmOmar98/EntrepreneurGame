// DATA-03 — Dual-mode seed accessors.
// When hasSupabaseEnv() is true (prod / Supabase mode), every accessor returns []
// so demo data never leaks into a production response. Demo arrays are only ever
// used in fallback / demo mode (env vars absent). Never bypass these accessors by
// importing demoPlayers / demoMissions / demoDeliverableTemplates directly from
// app code or server actions.
//
// Verification (manual, no test runner installed):
//   1. grep -rn "from \"@/lib/seed/players\"" app components lib  -> only this file
//   2. grep -rn "from \"@/lib/seed/missions\"" app components lib -> only this file
//   3. grep -rn "from \"@/lib/seed/deliverableTemplates\"" app components lib -> only this file
//   4. grep -rn "atlas-soil\|Tamwilcom\|Bank of Africa\|Innov Invest\|Bluespace" lib
//      -> no matches outside intent comments.
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { DeliverableTemplate, Mission, Player } from "@/lib/types";
import { demoDeliverableTemplates } from "./deliverableTemplates";
import { demoMissions } from "./missions";
import { demoPlayers } from "./players";

export function seedPlayers(): Player[] {
  return hasSupabaseEnv() ? [] : demoPlayers;
}

export function seedMissions(): Mission[] {
  return hasSupabaseEnv() ? [] : demoMissions;
}

export function seedDeliverableTemplates(): DeliverableTemplate[] {
  return hasSupabaseEnv() ? [] : demoDeliverableTemplates;
}
