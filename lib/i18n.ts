export type Locale = "fr" | "en";

export const dictionaries = {
  fr: {
    brand_name: "Entrepreneur Game",
    tagline: "EIC / UEMF pilot",
    cta_login: "Se connecter",
    role_player: "Player",
    role_mentor: "Mentor",
    role_game_master: "GameMaster",
  },
  en: {
    brand_name: "Entrepreneur Game",
    tagline: "EIC / UEMF pilot",
    cta_login: "Sign in",
    role_player: "Player",
    role_mentor: "Mentor",
    role_game_master: "GameMaster",
  },
} as const;

export function getLocale(value?: string | string[]): Locale {
  return value === "en" ? "en" : "fr";
}

export function t(locale: Locale) {
  return dictionaries[locale];
}
