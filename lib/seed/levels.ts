// DEMO DATA ONLY (DATA-03) -- used only when hasSupabaseEnv() is false.
// In Supabase prod mode, lib/seed/index.ts returns [] (cf DATA-03).
// Labels use ASCII only (no accents) for mailto/CSV payload safety.
import type { Level } from "@/lib/types";

export const demoLevels: Level[] = [
  { id: "L0_diagnostic",     ord: 0, label: "Niveau 0 - Diagnostic",          description: "" },
  { id: "L1_problem",        ord: 1, label: "Niveau 1 - Probleme",             description: "" },
  { id: "L2_solution",       ord: 2, label: "Niveau 2 - Solution",             description: "" },
  { id: "L3_market",         ord: 3, label: "Niveau 3 - Marche",               description: "" },
  { id: "L4_business_model", ord: 4, label: "Niveau 4 - Modele economique",    description: "" },
  { id: "L5_pitch",          ord: 5, label: "Niveau 5 - Pitch",                description: "" },
  { id: "L6_traction",       ord: 6, label: "Niveau 6 - Traction",             description: "" },
  { id: "L7_alumni",         ord: 7, label: "Niveau 7 - Alumni",               description: "" },
];
