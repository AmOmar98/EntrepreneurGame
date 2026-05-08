export type Locale = "fr" | "en";

export const dictionaries = {
  fr: {
    cockpit: "Cockpit",
    startup: "Startup",
    coach: "Coach",
    admin: "Admin",
    makeIt: "Make it",
    sellIt: "Sell it",
    lookAfterIt: "Look after it",
    confirmedXp: "XP confirme",
    pendingXp: "XP en attente",
    prestigeXp: "XP prestige",
    nextAction: "Prochaine action",
    submitProof: "Envoyer une preuve",
    bonusClaim: "Declarer un bonus",
    validationQueue: "File de validation",
    cohortAnalytics: "Analytics cohorte",
  },
  en: {
    cockpit: "Cockpit",
    startup: "Startup",
    coach: "Coach",
    admin: "Admin",
    makeIt: "Make it",
    sellIt: "Sell it",
    lookAfterIt: "Look after it",
    confirmedXp: "Confirmed XP",
    pendingXp: "Pending XP",
    prestigeXp: "Prestige XP",
    nextAction: "Next action",
    submitProof: "Submit proof",
    bonusClaim: "Claim a bonus",
    validationQueue: "Validation queue",
    cohortAnalytics: "Cohort analytics",
  },
} as const;

export function getLocale(value?: string | string[]): Locale {
  return value === "en" ? "en" : "fr";
}

export function t(locale: Locale) {
  return dictionaries[locale];
}
