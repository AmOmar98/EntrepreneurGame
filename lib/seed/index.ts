import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { DeliverableTemplate, Mission, Player } from "@/lib/types";
import { demoDeliverableTemplates } from "./deliverableTemplates";
import { demoMissions } from "./missions";
import { demoPlayers } from "./players";

// Dual-mode seed accessors (DATA-03 prep).
// When Supabase env is configured we return [] so demo data never leaks into prod responses.

export function seedPlayers(): Player[] {
  return hasSupabaseEnv() ? [] : demoPlayers;
}

export function seedMissions(): Mission[] {
  return hasSupabaseEnv() ? [] : demoMissions;
}

export function seedDeliverableTemplates(): DeliverableTemplate[] {
  return hasSupabaseEnv() ? [] : demoDeliverableTemplates;
}
