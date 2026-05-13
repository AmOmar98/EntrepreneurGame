// Build draft mailto: URLs for the 11 AgreenTech Player onboarding emails.
// Reads cohorte-agreentech-creds.csv (gitignored, contains PROD passwords) and
// writes PLAYER-MAILS-J1.local.md (also gitignored via **/*.local.md).
//
// Usage:
//   node scripts/build-player-mails.cjs
//
// Output: PLAYER-MAILS-J1.local.md at repo root, with 11 markdown sections
// (one per Player), each containing a clickable mailto: URL + a human-readable
// preview of the email body for review.

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(REPO_ROOT, "cohorte-agreentech-creds.csv");
const OUT_PATH = path.join(REPO_ROOT, "PLAYER-MAILS-J1.local.md");

const SUBJECT = "AgreenTech 2026 — Vos accès au pilote Hack-Days (13-14 mai)";
const PROD_URL = "https://entrepreneur-game-six.vercel.app";
const SENDER_EMAIL = "omar.ameur98@gmail.com";

// Explicit first-name mapping per project_code. Robust against name-order
// ambiguity (e.g. P02 = "Houenha Ange-Herson Evaeme" where Houenha is the
// surname) and composite first names with dashes.
const FIRST_NAMES = {
  P01: { lead: "Adil", members: ["Mohamed Amine"] },
  P02: { lead: "Ange-Herson", members: ["Faizan"] },
  P03: { lead: "Fatim-Ezzahra", members: ["Zakaria", "Noufel"] },
  P04: { lead: "Tariq", members: ["Abdelhadi"] },
  P05: { lead: "Nouhaila", members: ["Leila"] },
  P06: { lead: "Souleymane", members: [] },
  P07: { lead: "Hicham", members: ["Imad", "Abderrahmane"] },
  P08: { lead: "Kamal", members: [] },
  P09: { lead: "Jaouad", members: ["Monsef"] },
  P10: { lead: "Said", members: ["Younes"] },
  P11: { lead: "Ghizlane", members: ["Nouhaila"] },
};

// Build the salutation from the explicit mapping above.
function salutation(projectCode) {
  const entry = FIRST_NAMES[projectCode];
  if (!entry) {
    throw new Error(`No first-name mapping for ${projectCode} — update FIRST_NAMES.`);
  }
  const { lead, members } = entry;
  if (!members || members.length === 0) return `Bonjour ${lead},`;
  if (members.length === 1) return `Bonjour ${lead} et ${members[0]},`;
  const last = members[members.length - 1];
  const rest = members.slice(0, -1).join(", ");
  return `Bonjour ${lead}, ${rest} et ${last},`;
}

function emailBody({ projectCode, email, password, ideaSeed }) {
  const greet = salutation(projectCode);
  const projectMention = ideaSeed && ideaSeed.trim()
    ? `\nProjet enregistré : ${ideaSeed.split(" — ")[0]} (vous pourrez l'affiner lors de l'onboarding).\n`
    : "";
  return [
    greet,
    "",
    "Bienvenue dans le pilote AgreenTech 2026. Le Hack-Days 2 jours (13-14 mai) démarre aujourd'hui à 8h30 à l'UEMF Fès.",
    "",
    "Vos accès à la plateforme EIC Entrepreneur Game :",
    "",
    `URL : ${PROD_URL}`,
    `Email : ${email}`,
    `Mot de passe : ${password}`,
    projectMention.trim() ? projectMention : null,
    "Comment ça marche",
    "1. Connectez-vous avec vos identifiants ci-dessus",
    "2. Complétez votre onboarding (profil, projet, équipe)",
    "3. 7 missions (L1 à L6 + bonus) à compléter pendant le bootcamp",
    "4. Pour chaque mission, soumettez votre livrable via la plateforme - vos mentors EIC et le jury évalueront en temps réel",
    "5. À J2, vous présenterez votre pitch final devant le jury et les partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace)",
    "",
    "Besoin d'aide",
    "- En séance : un GameMaster ou un mentor EIC sera toujours présent",
    `- En urgence technique : répondez à ce mail (${SENDER_EMAIL})`,
    "",
    "À tout de suite à l'UEMF Fès,",
    "",
    "Omar Ameur",
    "EIC UEMF",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function buildMailto(toEmail, subject, body) {
  // RFC 6068 compliant: percent-encode using encodeURIComponent, then restore
  // a few safe chars to keep URL readable.
  const enc = (s) =>
    encodeURIComponent(s).replace(/%20/g, "%20"); // keep space encoded for max compatibility
  return `mailto:${toEmail}?subject=${enc(subject)}&body=${enc(body)}`;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else cur += c;
    }
    cells.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (cells[i] || "").trim()]));
  });
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERROR: ${CSV_PATH} not found.`);
    process.exit(1);
  }
  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8")).filter(
    (r) => r.app_role === "player"
  );

  const out = [];
  out.push("# AgreenTech 2026 — Brouillons mail Player J1 (13/05)");
  out.push("");
  out.push(`**Généré** : ${new Date().toISOString()}`);
  out.push(`**Expéditeur** : ${SENDER_EMAIL}`);
  out.push(`**Sujet** : ${SUBJECT}`);
  out.push("");
  out.push(
    "Cliquez chaque lien `Ouvrir brouillon` ci-dessous — votre client mail par défaut s'ouvrira avec destinataire + sujet + corps pré-remplis. Vérifiez avant d'envoyer.\n"
  );
  out.push("> ⚠️ **Fichier gitignored** (`**/*.local.md` dans `.gitignore`) — contient les passwords en clair. Ne pas partager.");
  out.push("");
  out.push("---");
  out.push("");

  for (const r of rows) {
    const body = emailBody({
      projectCode: r.project_code,
      email: r.email,
      password: r.password,
      ideaSeed: r.idea_seed,
    });
    const url = buildMailto(r.email, SUBJECT, body);

    out.push(`## ${r.project_code} — ${r.holder_name}`);
    out.push("");
    out.push(`**Destinataire** : ${r.email}`);
    if (r.members) out.push(`**Équipier(s)** : ${r.members}`);
    out.push(`**Ville** : ${r.city}`);
    out.push("");
    out.push(`▶️ **[Ouvrir brouillon dans le client mail](${url})**`);
    out.push("");
    out.push("<details>");
    out.push("<summary>Aperçu du corps du mail</summary>");
    out.push("");
    out.push("```");
    out.push(body);
    out.push("```");
    out.push("");
    out.push("</details>");
    out.push("");
    out.push(`<details><summary>URL mailto: brute (copier-coller dans un navigateur)</summary>`);
    out.push("");
    out.push("```");
    out.push(url);
    out.push("```");
    out.push("");
    out.push("</details>");
    out.push("");
    out.push("---");
    out.push("");
  }

  fs.writeFileSync(OUT_PATH, out.join("\n"), "utf8");
  console.log(`Wrote ${rows.length} draft emails → ${OUT_PATH}`);
}

main();
