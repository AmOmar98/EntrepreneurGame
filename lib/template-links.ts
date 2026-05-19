// Liens OneDrive UEMF pour les 13 deliverable_templates Digi-Hackathon 2026
// (8 livrables officiels + 5 bonus) + Welcome Guide global.
// Source : "Links Templates Livrables Digi-Hackathon.xlsx" (Omar / EIC, mai 2026).
// Mapping base sur deliverable_templates.slug (cf PROD restructure 260519-pyx).
// Bonus mappes sur PDF parent de leur mission (coherent avec rubrics).

export type TemplateLink = { templateUrl: string; label: string };

// URLs partagees entre plusieurs slugs (bonus + livrable principal d'une meme mission).
const DESIGN_THINKING_URL =
  "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQB1eg6xKSGJSr-BUiGGF_NVAWi6lL0aYM33Z3uNqbqAr30?e=UDn6lY";
const MARCHE_TECHNIQUE_URL =
  "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBQd5pSBYaOTqyM5alG1DxHAVNwwskD7qRfn-ZeGX3DZ84?e=Vq2n4i";
const COMMERCIALISATION_URL =
  "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQDaSjUNjt14Q5BHtY9GxDA4AZSVZn_ysdyRktKE5db7OLw?e=Zt0LlL";

export const TEMPLATE_LINKS: Record<string, TemplateLink> = {
  // M1 - Atelier Persona + Design Thinking (bonus) [quick 260519-l1l]
  "persona-v1": {
    templateUrl: DESIGN_THINKING_URL,
    label: "EIC-DigiHackathon-02-Design-Thinking",
  },
  "design-thinking-v1": {
    templateUrl: DESIGN_THINKING_URL,
    label: "EIC-DigiHackathon-02-Design-Thinking",
  },

  // M2 - Préparation entretiens + Fiches [quick 260519-l1l]
  // 02a Préparation = guide questions (point sur PDF Design Thinking 02 par défaut, à
  // remplacer par lien spécifique 02a quand il existera).
  "prep-questions-v1": {
    templateUrl: DESIGN_THINKING_URL,
    label: "EIC-DigiHackathon-02a-Preparation-Entretiens",
  },
  // 02b Fiches entretien = template fiche d'entretien (même PDF parent).
  "fiches-entretien-v1": {
    templateUrl: DESIGN_THINKING_URL,
    label: "EIC-DigiHackathon-02b-Fiche-Entretien",
  },

  // M3 - Business Model Canvas
  "bmc-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQDfctMur7k_TYk9sq9o87-uAcJtPWXpOmkQhnTBd5-wyWo?e=z1XYOb",
    label: "EIC-DigiHackathon-03-BMC",
  },

  // M3 - Etude marche & analyse technique
  "marche-technique-v1": {
    templateUrl: MARCHE_TECHNIQUE_URL,
    label: "EIC-DigiHackathon-04-Marche-Technique",
  },
  "moscow-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQC2pqIzOVJ9SJSuv5NPeU-8AbsKFDQ8OCxeaNZ8jdq_XM8?e=Tvkxfc",
    label: "EIC-DigiHackathon-04b-MoSCoW",
  },
  "tam-sam-som-v1": {
    templateUrl: MARCHE_TECHNIQUE_URL,
    label: "EIC-DigiHackathon-04-Marche-Technique",
  },
  "positionnement-v1": {
    templateUrl: MARCHE_TECHNIQUE_URL,
    label: "EIC-DigiHackathon-04-Marche-Technique",
  },
  "comparaison-v1": {
    templateUrl: MARCHE_TECHNIQUE_URL,
    label: "EIC-DigiHackathon-04-Marche-Technique",
  },

  // M4 - Strategie de commercialisation
  "commercialisation-v1": {
    templateUrl: COMMERCIALISATION_URL,
    label: "EIC-DigiHackathon-05-Commercialisation",
  },
  "strategie-100-users-v1": {
    templateUrl: COMMERCIALISATION_URL,
    label: "EIC-DigiHackathon-05-Commercialisation",
  },

  // M5 - Analyse financiere (Unit Economics)
  "unit-economics-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQCXH2YCGuJyRYHeEY9kXmSWAV7Op6uCqChZombAia10tOU?e=TwAcN2",
    label: "EIC-DigiHackathon-06-Unit-Economics",
  },

  // M6 - Techniques de pitch + Pitch jury
  "techniques-pitch-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBH5shqL33xQZFWAnihHCNuAevzdQ_P45AQXROmWmLupzg?e=HQgpnw",
    label: "EIC-DigiHackathon-07-Techniques-Pitch",
  },
  "pitch-deck-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQCVXFKynh32TKSSB3ht3oLfAZdoPdu3_8xt1Zvs2B8IMvg?e=D5mM5n",
    label: "EIC-DigiHackathon-08-Pitch-Deck",
  },
};

export const WELCOME_GUIDE_URL =
  "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBNWS9VBk5URrInYsRtb5bSAcTs572O6KbUkFUo5a_tX08?e=OrvBRE";

// Pas d'URL dediee pour le dossier "Exemples completes" Digi-Hackathon dans
// la source actuelle - on retombe sur le Welcome Guide (lien general qui
// pointe vers le dossier parent OneDrive ou tout le materiel est dispo).
export const EXAMPLES_FOLDER_URL = WELCOME_GUIDE_URL;

export function getTemplateLink(slug: string): TemplateLink | null {
  return TEMPLATE_LINKS[slug] ?? null;
}
