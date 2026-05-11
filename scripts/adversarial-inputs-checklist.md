# Phase 15-03 — Checklist adversariale inputs server actions

**Cardinal R2** : validators warn-only côté UI, mais Zod côté server actions DOIT refuser proprement via `safeParse` + retour `WorkflowState { ok: false, message }`. Aucune exception ne doit remonter au client. Aucun crash 500.

**Compte test recommandé** : P11 (`p.player11@ueuromed.org`) en PROD, ou compte burner via Supabase Auth. Mode demo (sans env Supabase) valide la plupart des vecteurs côté Zod (schémas identiques client/server).

**Exécution** : DevTools Console fetch / curl. La forme attendue d'une rejection est `{ ok: false, message: "..." }` ; jamais d'exception non-catchée.

Procédure type curl (extrait — adapter cookies de session) :

```bash
curl -X POST "https://entrepreneur-game-six.vercel.app/journey/deliverable/<id>" \
  -H "Cookie: sb-...=<jwt>" \
  -F "deliverableTemplateId=<uuid>" \
  -F "kind=proof_url" \
  -F "proofUrl=javascript:alert(1)"
```

---

## Surfaces ciblées (référence)

- `app/actions.ts:174` — `httpsUrl` Zod refine (`.refine(u => u.startsWith("https://"))`)
- `app/actions.ts:179-205` — `submissionSchema` (kind, proofUrl, proofText ≤ 4000)
- `app/actions.ts:207-321` — `submitDeliverable` (ownership check via `player_members` + duplicate V1 block + V2 path)
- `app/actions.ts:333-355` — `evaluationSchema` (scores 0..25 par dim, feedback ≤ 4000, expectedAction ≤ 500)
- `app/actions.ts:357+` — `evaluateSubmission` (auth check + ownership via `is_mentor()`)

Défense en profondeur SQL : `database/schema.sql:95,179,199` (checks `^https://` sur `*_url` colonnes).

---

## Vecteurs

### V-01 — URL `javascript:` (proofUrl)
- **Cible** : `submitDeliverable` champ `proofUrl`
- **Payload** : `proofUrl=javascript:alert(1)`
- **OWASP / CWE** : A03:2021 Injection / CWE-79 XSS
- **Verdict attendu** : Zod `httpsUrl.refine` refuse → `{ ok: false, message: "URL doit commencer par https://" }`
- **Mode** : demo + prod (Zod identique)

### V-02 — URL `data:text/html` (proofUrl)
- **Cible** : `submitDeliverable` champ `proofUrl`
- **Payload** : `proofUrl=data:text/html,<script>alert(1)</script>`
- **OWASP / CWE** : A03:2021 / CWE-79
- **Verdict attendu** : Zod refuse via `.url()` (data URI échoue) ou via `.refine` (not startsWith https://) → `{ ok: false, message }`
- **Mode** : demo + prod

### V-03 — URL `ftp://`
- **Cible** : `submitDeliverable` champ `proofUrl`
- **Payload** : `proofUrl=ftp://anonymous@example.com/etc/passwd`
- **OWASP / CWE** : CWE-918 SSRF (potentiel)
- **Verdict attendu** : Zod `.url()` accepte ftp, mais `.refine(startsWith https://)` refuse → message FR
- **Mode** : demo + prod

### V-04 — URL `file:///` (LFI / local read)
- **Cible** : `submitDeliverable` champ `proofUrl`
- **Payload** : `proofUrl=file:///etc/passwd`
- **OWASP / CWE** : A05:2021 / CWE-22 path traversal
- **Verdict attendu** : Zod refuse (pas https) → message FR
- **Mode** : demo + prod

### V-05 — URL `https://127.0.0.1:8080/admin` (SSRF localhost)
- **Cible** : `submitDeliverable` champ `proofUrl`
- **Payload** : `proofUrl=https://127.0.0.1:8080/admin`
- **OWASP / CWE** : A10:2021 SSRF / CWE-918
- **Verdict attendu** : **ACCEPTÉ** par `httpsUrl` (passe `.startsWith("https://")`, hostname non whitelisté). **Known limitation** — non-exploitable actuellement car aucun fetch server-side de `proof_url`. À blocker en v0.3 (allowlist hostname). Defer SEED-002.
- **Mode** : prod (compte authentifié requis pour atteindre l'insert)
- **Status** : KNOWN LIMITATION

### V-06 — URL `https://169.254.169.254/latest/meta-data/` (AWS metadata)
- **Cible** : `submitDeliverable` champ `proofUrl`
- **Payload** : `proofUrl=https://169.254.169.254/latest/meta-data/iam/security-credentials/`
- **OWASP / CWE** : A10:2021 SSRF
- **Verdict attendu** : **ACCEPTÉ** (même raison V-05). Non-exploitable Vercel/Supabase, mais defer SEED-002 v0.3 pour allowlist.
- **Mode** : prod
- **Status** : KNOWN LIMITATION

### V-07 — proofText 4001 chars (Zod max)
- **Cible** : `submitDeliverable` champ `proofText` (`z.string().max(4000)`)
- **Payload** : `proofText="A".repeat(4001)`, `kind=proof_text`
- **OWASP / CWE** : CWE-20 input validation
- **Verdict attendu** : Zod refuse → `{ ok: false, message: "String must contain at most 4000 character(s)" }` (ou variante zod v4)
- **Mode** : demo + prod

### V-08 — proofText vide (< 10 chars superRefine)
- **Cible** : `submitDeliverable` champ `proofText`
- **Payload** : `proofText="abc"`, `kind=proof_text`
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : Zod superRefine refuse → `{ ok: false, message: "Texte de preuve requis (>=10 caracteres)" }`
- **Mode** : demo + prod

### V-09 — feedback 4001 chars (evaluation)
- **Cible** : `evaluateSubmission` champ `feedback` (`z.string().min(0).max(4000)`)
- **Payload** : `feedback="X".repeat(4001)`
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : Zod refuse → message tronqué
- **Mode** : prod (compte mentor requis)

### V-10 — expectedAction 501 chars
- **Cible** : `evaluateSubmission` champ `expectedAction` (`z.string().max(500).optional()`)
- **Payload** : `expectedAction="Y".repeat(501)`, `verdict=request_v2`
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : Zod refuse
- **Mode** : prod (mentor)

### V-11 — score=99 (hors-bornes max 25)
- **Cible** : `evaluateSubmission` champ `scores.<dim>` (`z.coerce.number().min(0).max(25)`)
- **Payload** : `scoresJson='{"innovation":99}'`
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : Zod refuse → message FR
- **Mode** : prod

### V-12 — score=-5 (hors-bornes min 0)
- **Cible** : `evaluateSubmission` champ `scores.<dim>`
- **Payload** : `scoresJson='{"innovation":-5}'`
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : Zod refuse (.min(0))
- **Mode** : prod

### V-13 — score='abc' (non numérique)
- **Cible** : `evaluateSubmission` champ `scores.<dim>`
- **Payload** : `scoresJson='{"innovation":"abc"}'`
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : Zod `.coerce.number()` produit NaN → `.min(0)` refuse
- **Mode** : prod

### V-14 — scoresJson malformed JSON
- **Cible** : `evaluateSubmission` champ `scoresJson` (parsing try/catch `app/actions.ts:373-378`)
- **Payload** : `scoresJson='{"innovation":}'` (JSON cassé)
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : `{ ok: false, message: "Notes invalides (JSON)." }` (early return)
- **Mode** : prod

### V-15 — Ownership bypass : POST submit avec UUID d'un livrable mais Player non-membre
- **Cible** : `submitDeliverable` ownership check (`app/actions.ts:240-250`)
- **Payload** : `deliverableTemplateId=<uuid_valide>` mais compte authentifié n'a aucune ligne dans `player_members`
- **OWASP / CWE** : A01:2021 Broken Access Control / CWE-862
- **Verdict attendu** : `{ ok: false, message: "Aucun Player rattache a votre compte." }`
- **Mode** : prod (compte burner sans player_members row)

### V-16 — Re-submit V1 alors que V1 existe déjà (duplicate block)
- **Cible** : `submitDeliverable` duplicate guard (`app/actions.ts:262-273`)
- **Payload** : double POST `submitDeliverable` consécutifs avec même `deliverableTemplateId` et compte avec V1 déjà `submitted_v1`
- **OWASP / CWE** : CWE-362 race / business logic
- **Verdict attendu** : 2ème POST → `{ ok: false, message: "Une soumission V1 existe deja. Attendez le feedback du Mentor." }`
- **Mode** : prod (P11)

### V-17 — Verdict transition invalide (validate_v2 sur submission version=1 sans request_v2 préalable)
- **Cible** : `evaluateSubmission` — actuellement schéma Zod accepte tous les verdicts pour toute submission, pas de check transition.
- **Payload** : `verdict=validate_v2` sur submission `version=1` jamais demandée en V2
- **OWASP / CWE** : A04:2021 Insecure Design
- **Verdict attendu** : **ACCEPTÉ** côté Zod (pas de check transition). Le trigger `trg_evaluation_recalc` calcule quand même `score_project` correctement (max(total_score) sur validated). **Known limitation pédagogique** non-bloquante. Defer SEED-002 v0.3 (state machine évaluation stricte).
- **Mode** : prod (mentor)
- **Status** : KNOWN LIMITATION

### V-18 — Update evaluation post results_published_at
- **Cible** : `evaluateSubmission` — pas de check `events.results_published_at`
- **Payload** : update verdict d'une evaluation après que GameMaster ait publié les résultats
- **OWASP / CWE** : A04:2021
- **Verdict attendu** : **ACCEPTÉ** côté code. Pas de freeze applicatif des évaluations post-publish. Risque pédagogique (modifier la note après ranking publié). **Known limitation** ops-only (GameMaster discipline). Defer SEED-002 v0.3.
- **Mode** : prod (mentor + GM coordination)
- **Status** : KNOWN LIMITATION

### V-19 — Injection SQL via feedback `'; DROP TABLE players; --`
- **Cible** : `evaluateSubmission` champ `feedback` (sera inséré dans `evaluations.feedback`)
- **Payload** : `feedback="'; DROP TABLE players; --"`
- **OWASP / CWE** : A03:2021 / CWE-89
- **Verdict attendu** : Zod traite comme string opaque. Supabase JS SDK utilise parameterized statements (PostgREST). String stockée verbatim, pas d'injection. **PASS by design**.
- **Mode** : prod
- **Note** : tester aussi `proofText` même payload (même résultat attendu).

### V-20 — UUID deliverableTemplateId invalide (`'not-a-uuid'`)
- **Cible** : `submitDeliverable` champ `deliverableTemplateId` (`z.string().uuid()`)
- **Payload** : `deliverableTemplateId=not-a-uuid-format`
- **OWASP / CWE** : CWE-20
- **Verdict attendu** : Zod refuse via `.uuid()` → `{ ok: false, message }`
- **Mode** : demo + prod

---

## Récapitulatif catégories couvertes

| Catégorie | Vecteurs | Total |
|-----------|----------|-------|
| URLs malformées | V-01, V-02, V-03, V-04, V-05, V-06 | 6 |
| Longueurs limite | V-07, V-08, V-09, V-10 | 4 |
| Scores hors-bornes rubric | V-11, V-12, V-13, V-14 | 4 |
| Ownership / duplicate | V-15, V-16 | 2 |
| Transitions verdict | V-17, V-18 | 2 |
| Injection SQL | V-19 | 1 |
| UUID malformé | V-20 | 1 |
| **TOTAL** | | **20** |

## Known limitations explicites (defer v0.3 SEED-002)

- **V-05 / V-06 SSRF localhost + AWS metadata** : `httpsUrl` accepte `127.0.0.1`, `169.254.169.254`, `metadata.google.internal`. Non-exploitable actuellement (aucun fetch server-side de `proof_url` / `logo_url`). À blocker via allowlist hostname si Phase v0.3 introduit fetch côté serveur (preview cards, OG image scraping, etc.).
- **V-17 verdict transitions** : pas de state machine stricte côté Zod. Risque limité car trigger trg_evaluation_recalc recalcule sur max(total_score) validated. Acceptable pilote.
- **V-18 update post-publish** : aucun freeze applicatif des évaluations après publication des résultats. Risque pédagogique pur (discipline GameMaster). À ajouter dans SEED-002 (check `events.results_published_at` avant update).

## Notes de procédure

- En mode demo (sans `NEXT_PUBLIC_SUPABASE_URL`), `submitDeliverable` retourne immédiatement `{ ok: false, message: "Backend non configure." }` AVANT le parsing Zod (cf. `app/actions.ts:211-213`). Les vecteurs V-01..V-04, V-07, V-08, V-11..V-14, V-20 nécessitent un test PROD ou un test isolé du schéma Zod via REPL.
- Pour tester en isolation : `node -e "const z = require('zod'); /* importer schéma */"` ou ouvrir une session Next.js dev avec env Supabase configurée.
- Aucun vecteur ne nécessite de fuzzer automatisé : la checklist est exhaustive pour les surfaces actuelles.

## Cross-références

- `app/actions.ts` (lecture seule, surface Zod)
- `database/schema.sql:95,179,199` (checks `^https://` SQL défense en profondeur)
- `.planning/codebase/CONCERNS.md` §SSRF + §Test Coverage Gaps
- `lib/types.ts` (`WorkflowState` shape attendue)
