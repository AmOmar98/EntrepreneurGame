// Liens OneDrive UEMF pour les 10 livrables AgreenTech 2026
// + 2 ressources globales (Welcome Guide, dossier Exemples completes).
// Source : "Liste Lien livrables et contenus.xlsx" (Omar / EIC, mai 2026).
// Mapping base sur deliverable_templates.slug (cf database/seed_event_hackdays.sql).

export type TemplateLink = { templateUrl: string; label: string };

export const TEMPLATE_LINKS: Record<string, TemplateLink> = {
  "personae-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQAV81YoAAkCQ4XjwxAZaLF4Ac9Vkq3qKHy8lYg2Fyy3mhs?e=hrv1Ff",
    label: "EIC-AgreenTech-01-Persona",
  },
  "probleme-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQAD6N8SdpQ0RKJ7Sx057BfAAW2ALSBNrQqjR8eBw6oCCx0?e=qXBWca",
    label: "EIC-AgreenTech-02-Hypothese-VP",
  },
  "esquisse-solution-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQDCHAn4y5jXQbT7UbGXkga_AdS9d4g5b5Q6XOXRd7sF1pY?e=Lk5mCv",
    label: "EIC-AgreenTech-03-BMC",
  },
  "fiche-produit-plan-dev-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBreVP2oAKEQr9Df87cbR5hAS_hVPac7sBj-HNdi1LzfmI?e=xTsIEP",
    label: "EIC-AgreenTech-04-MoSCoW",
  },
  "etude-marche-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQD177M9Otv9S5dBC7nRortVAdvP0Gh2DChVkgqG807Cx_A?e=tVtYOC",
    label: "EIC-AgreenTech-05-Analyse-Concurrentielle",
  },
  "tam-sam-som-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQDLe9_WiQthQJU02i68bnggASM7pu6qVfBX1m5Y26O_bXI?e=Vf9gAV",
    label: "EIC-AgreenTech-06-TAM-SAM-SOM",
  },
  "bmc-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBDYvVt5R_EQJSbhY_b61_LAbnCU5UEAQJceEtu_LnXus8?e=MMbOkz",
    label: "EIC-AgreenTech-07-ROI-Portage",
  },
  "couts-previsions-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQAnelbqHSm-SpE8aGDE1KrgAX8hj27CqQmbm6SScaJSZks?e=0Gu3Wh",
    label: "EIC-AgreenTech-08-Couts-Capex-Opex",
  },
  "strategie-commerciale-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQAiU6Oxt9HXQaEEb2UuByz-ARs96NBOLow9DP76AWyRxVs?e=9D81Gv",
    label: "EIC-AgreenTech-09-Plan-Acquisition",
  },
  "pitch-deck-v1": {
    templateUrl:
      "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBLNlSs3Zp-Tq6HnlacLFvnAah0dgtJY6VMY74q1xdZLB8?e=Pg81bX",
    label: "EIC-AgreenTech-10-Pitch-Deck",
  },
};

export const EXAMPLES_FOLDER_URL =
  "https://universiteeurome-my.sharepoint.com/:f:/g/personal/o_ameur_ueuromed_org/IgCD6cBkq6_nToAqFO4B_wHPAReUfszNuMOC3smesN1BadU?e=DHF5F7";

export const WELCOME_GUIDE_URL =
  "https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBifqOr-fmhSY2HZUlJAxDvARUvH5En0t9IKWq5H3Mz1tk?e=KtZYZp";

export function getTemplateLink(slug: string): TemplateLink | null {
  return TEMPLATE_LINKS[slug] ?? null;
}
