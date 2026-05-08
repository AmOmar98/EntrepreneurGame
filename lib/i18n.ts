export type Locale = "fr" | "en";

export const dictionaries = {
  fr: {
    brand_name: "Entrepreneur Game",
    tagline: "EIC / UEMF pilot",
    cta_login: "Se connecter",
    role_player: "Player",
    role_mentor: "Mentor",
    role_game_master: "GameMaster",
    onboarding_title: "Bienvenue dans l'Entrepreneur Game",
    onboarding_team_name: "Nom d'equipe",
    onboarding_idea: "Idee de projet",
    onboarding_idea_counter: "caracteres",
    onboarding_q1: "Notre probleme client est clairement identifie.",
    onboarding_q2: "Nous avons deja parle a au moins 5 utilisateurs cibles.",
    onboarding_q3: "Nous avons une solution pressentie.",
    onboarding_q4: "Nous connaissons notre marche et la concurrence.",
    onboarding_q5: "Nous savons comment nous allons monetiser.",
    onboarding_members: "Membres presents",
    onboarding_submit: "Valider et demarrer",
  },
  en: {
    brand_name: "Entrepreneur Game",
    tagline: "EIC / UEMF pilot",
    cta_login: "Sign in",
    role_player: "Player",
    role_mentor: "Mentor",
    role_game_master: "GameMaster",
    onboarding_title: "Welcome to the Entrepreneur Game",
    onboarding_team_name: "Team name",
    onboarding_idea: "Project idea",
    onboarding_idea_counter: "characters",
    onboarding_q1: "Our customer problem is clearly identified.",
    onboarding_q2: "We have already talked to at least 5 target users.",
    onboarding_q3: "We have a candidate solution in mind.",
    onboarding_q4: "We know our market and competitors.",
    onboarding_q5: "We know how we will monetize.",
    onboarding_members: "Members present",
    onboarding_submit: "Validate and start",
  },
} as const;

export function getLocale(value?: string | string[]): Locale {
  return value === "en" ? "en" : "fr";
}

export function t(locale: Locale) {
  return dictionaries[locale];
}
