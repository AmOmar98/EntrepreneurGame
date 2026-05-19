/# Perf Prod Pilote AgreenTech — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer 3 fixes app (`Promise.all` + Speed Insights) et 3 migrations SQL (RLS initplan + multiple permissive + FK indexes) sur la branche `polish/design-v2-match`, validés par smoke automatisé local. Aucun commit `main` avant le pilote 13-14/05. Apply migrations + merge polish→main = post-pilote 14/05 soir.

**Architecture:** Tous les changements sur `polish/design-v2-match`. Smoke = scripts Node automatisables (Lighthouse CLI pour perf, fetch HTTP pour status, `@supabase/supabase-js` pour RLS). Pas de Playwright ajouté (out-of-scope pour ce batch). 6 commits de feature + 1 commit smoke harness + 1 commit SUMMARY.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase (RLS), Vercel (cdg1). Smoke harness : Node 20+, `lighthouse` via `npx -y`, `@supabase/supabase-js` (déjà dépendance).

**Source spec:** `.planning/quick/260511-spd-perf-prod-pilot-quickwins/PLAN.md`

**Constraint exécutant:** smoke tests automatisables uniquement — aucune étape « ouvre le navigateur et clique sur X ». Si une étape ne peut pas être scriptée, la marquer comme « gate humain » dans `SUMMARY.md` mais ne PAS la traiter comme un step exécutable du plan.

---

## File Structure

**Créés** :
- `scripts/perf-baseline.mjs` — capture Lighthouse JSON sur prod URL, écrit dans `.planning/quick/260511-spd-.../baseline-prod.json`
- `scripts/smoke-rls-prod.mjs` — login P01 via `@supabase/supabase-js`, lit `/journey` data via Supabase, vérifie 0 erreur RLS
- `scripts/smoke-http.mjs` — fetch GET sur prod URLs, vérifie status 200 + présence markers HTML
- `database/migrations/202605121200_rls_initplan_fix.sql`
- `database/migrations/202605121201_multiple_permissive_fix.sql`
- `database/migrations/202605121202_fk_indexes.sql`
- `.planning/quick/260511-spd-perf-prod-pilot-quickwins/baseline-prod.json` (artefact mesure)
- `.planning/quick/260511-spd-perf-prod-pilot-quickwins/AUDIT.md`
- `.planning/quick/260511-spd-perf-prod-pilot-quickwins/SUMMARY.md`
- `.planning/quick/260511-spd-perf-prod-pilot-quickwins/deferred-items.md`

**Modifiés** :
- `app/layout.tsx` — ajout `<SpeedInsights />`
- `app/journey/page.tsx` — `Promise.all` sur `getJourneyData` + `getCohortPulse` + `getAnnouncementsForPlayer`
- `app/admin/page.tsx` — fold query `events` dans `Promise.all` existant
- `package.json` — dépendance `@vercel/speed-insights`
- `package-lock.json` — résolution

---

## Pre-flight

- [ ] **Step 0.1: Vérifier branche courante**

```powershell
git branch --show-current
```
Expected: `polish/design-v2-match`. Si autre branche, STOP et demander à Omar.

- [ ] **Step 0.2: Vérifier état clean ou commits design intermédiaires acceptables**

```powershell
git status --short
```
Expected: aucun fichier modifié non-commité bloquant. Untracked acceptables.

---

## Task 1: Smoke Harness — scripts automatisables

Crée 3 scripts Node ESM exécutables localement (`node scripts/<name>.mjs`). Aucune dépendance externe au-delà de `@supabase/supabase-js` (déjà dans `package.json`) et `lighthouse` invoqué via `npx -y`.

**Files:**
- Create: `scripts/perf-baseline.mjs`
- Create: `scripts/smoke-rls-prod.mjs`
- Create: `scripts/smoke-http.mjs`

- [ ] **Step 1.1: Créer `scripts/perf-baseline.mjs`**

```js
// scripts/perf-baseline.mjs
// Usage: node scripts/perf-baseline.mjs <output-path>
// Lance Lighthouse mobile sur 2 URLs prod et concatène les métriques clés.
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const URLS = [
  { name: "journey", url: "https://entrepreneur-game-six.vercel.app/journey" },
  { name: "admin", url: "https://entrepreneur-game-six.vercel.app/admin" },
];

const out = process.argv[2];
if (!out) {
  console.error("Usage: node scripts/perf-baseline.mjs <output-path>");
  process.exit(2);
}
mkdirSync(dirname(out), { recursive: true });

const results = [];
for (const { name, url } of URLS) {
  console.log(`[lighthouse] ${name} → ${url}`);
  const tmp = `${out}.${name}.json`;
  const res = spawnSync("npx", [
    "-y", "lighthouse",
    url,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox",
    "--preset=desktop",
    "--only-categories=performance",
    "--output=json",
    `--output-path=${tmp}`,
  ], { stdio: "inherit", shell: true });
  if (res.status !== 0) {
    console.error(`[lighthouse] FAILED for ${name}`);
    process.exit(res.status ?? 1);
  }
  // Read minimal metrics
  const lhr = JSON.parse((await import("node:fs")).readFileSync(tmp, "utf8"));
  results.push({
    name,
    url,
    measuredAt: new Date().toISOString(),
    lcpMs: Math.round(lhr.audits["largest-contentful-paint"].numericValue),
    fcpMs: Math.round(lhr.audits["first-contentful-paint"].numericValue),
    ttiMs: Math.round(lhr.audits["interactive"].numericValue),
    tbtMs: Math.round(lhr.audits["total-blocking-time"].numericValue),
    perfScore: Math.round(lhr.categories.performance.score * 100),
  });
}

writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`[perf-baseline] wrote ${out}`);
console.table(results);
```

- [ ] **Step 1.2: Créer `scripts/smoke-rls-prod.mjs`**

```js
// scripts/smoke-rls-prod.mjs
// Usage: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//        SMOKE_EMAIL=p01@... SMOKE_PWD=... node scripts/smoke-rls-prod.mjs
// Vérifie qu'un porteur peut login + lire ses player_members + ses submissions
// sans 'permission denied for table' (régression RLS).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.SMOKE_EMAIL;
const pwd = process.env.SMOKE_PWD;
if (!url || !anon || !email || !pwd) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SMOKE_EMAIL, SMOKE_PWD");
  process.exit(2);
}

const sb = createClient(url, anon);
const { error: signErr } = await sb.auth.signInWithPassword({ email, password: pwd });
if (signErr) {
  console.error("[smoke-rls] signIn FAILED:", signErr.message);
  process.exit(1);
}
console.log("[smoke-rls] signIn OK");

const checks = [
  { name: "player_members select self", q: () => sb.from("player_members").select("player_id").limit(1) },
  { name: "profiles select self", q: () => sb.from("profiles").select("user_id, app_role").limit(1) },
  { name: "submissions select own", q: () => sb.from("submissions").select("id, status").limit(5) },
  { name: "announcements select audience", q: () => sb.from("announcements").select("id").limit(5) },
];

let failed = 0;
for (const c of checks) {
  const { data, error } = await c.q();
  if (error) {
    console.error(`[smoke-rls] ${c.name}: FAIL — ${error.message}`);
    failed++;
  } else {
    console.log(`[smoke-rls] ${c.name}: OK (rows=${data?.length ?? 0})`);
  }
}

await sb.auth.signOut();
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 1.3: Créer `scripts/smoke-http.mjs`**

```js
// scripts/smoke-http.mjs
// Usage: node scripts/smoke-http.mjs
// Fetch GET sur prod URLs publiques, vérifie status 2xx/3xx + marker HTML.
const TARGETS = [
  { url: "https://entrepreneur-game-six.vercel.app/login", marker: "Entrepreneur Game" },
  { url: "https://entrepreneur-game-six.vercel.app/", marker: null }, // redirect 307 vers /login
];

let failed = 0;
for (const t of TARGETS) {
  try {
    const res = await fetch(t.url, { redirect: "manual" });
    const ok = res.status >= 200 && res.status < 400;
    if (!ok) {
      console.error(`[smoke-http] ${t.url}: FAIL status=${res.status}`);
      failed++;
      continue;
    }
    if (t.marker) {
      const html = await res.text();
      if (!html.includes(t.marker)) {
        console.error(`[smoke-http] ${t.url}: FAIL marker '${t.marker}' missing`);
        failed++;
        continue;
      }
    }
    console.log(`[smoke-http] ${t.url}: OK status=${res.status}`);
  } catch (e) {
    console.error(`[smoke-http] ${t.url}: FAIL ${e.message}`);
    failed++;
  }
}
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 1.4: Tester `smoke-http.mjs` localement (n'a pas besoin d'env)**

```powershell
node scripts/smoke-http.mjs
```
Expected: 2 lignes `OK status=...`, exit 0. Si fail → STOP, prod inaccessible ou marker changé.

- [ ] **Step 1.5: Commit smoke harness**

```powershell
git add scripts/perf-baseline.mjs scripts/smoke-rls-prod.mjs scripts/smoke-http.mjs
git commit -m "(quick-260511-spd) add automated smoke harness for perf quickwins"
```

---

## Task 2: Capture baseline perf prod

Avant tout edit code, capturer la perf actuelle de `v0.2-pilot-ready` pour comparaison post-merge.

**Files:**
- Create: `.planning/quick/260511-spd-perf-prod-pilot-quickwins/baseline-prod.json`

- [ ] **Step 2.1: Lancer baseline Lighthouse**

```powershell
node scripts/perf-baseline.mjs .planning/quick/260511-spd-perf-prod-pilot-quickwins/baseline-prod.json
```
Expected: console.table avec 2 lignes (`journey`, `admin`), JSON écrit. Exit 0.

⚠️ **Note** : `/journey` et `/admin` redirigent vers `/login` si non authentifié → Lighthouse mesurera `/login`. Acceptable comme baseline TTFB shell. Pour mesure authentifiée, post-pilote uniquement.

- [ ] **Step 2.2: Inspecter le baseline**

```powershell
Get-Content .planning/quick/260511-spd-perf-prod-pilot-quickwins/baseline-prod.json
```
Expected: JSON valide avec `lcpMs`, `fcpMs`, `ttiMs`, `tbtMs`, `perfScore` pour chaque URL.

- [ ] **Step 2.3: Commit baseline**

```powershell
git add .planning/quick/260511-spd-perf-prod-pilot-quickwins/baseline-prod.json
git commit -m "(quick-260511-spd) capture perf baseline pre-changes (v0.2-pilot-ready)"
```

---

## Task 3: C1 — Vercel Speed Insights

**Files:**
- Modify: `app/layout.tsx`
- Modify: `package.json`, `package-lock.json` (npm install)

- [ ] **Step 3.1: Installer la dépendance**

```powershell
npm install @vercel/speed-insights
```
Expected: ajout dans `package.json` dependencies + lockfile mis à jour. Exit 0.

- [ ] **Step 3.2: Modifier `app/layout.tsx`**

Ajouter l'import en tête (après les imports CSS) et le composant `<SpeedInsights />` dans le `<body>` (juste après `{children}`).

Diff cible :
```tsx
// app/layout.tsx (après ligne 5)
import { SpeedInsights } from "@vercel/speed-insights/next";

// app/layout.tsx (modifier le return du RootLayout)
<html className={`${baskervville.variable} ${montserrat.variable}`} lang="fr">
  <body>
    {children}
    <SpeedInsights />
  </body>
</html>
```

- [ ] **Step 3.3: Vérifier typecheck + lint + build**

```powershell
npm run typecheck && npm run lint && npm run build
```
Expected: tous exit 0. Le build Next.js doit afficher `app/layout` sans erreur.

- [ ] **Step 3.4: Smoke HTTP local — démarrer dev server brièvement**

```powershell
$env:NODE_ENV="development"; Start-Process -FilePath "npm" -ArgumentList "run","dev" -PassThru
# attendre 10s puis :
Start-Sleep -Seconds 10
$res = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
$ok = $res.Content -match "speed-insights"
Write-Host "Speed Insights script tag detected: $ok"
# tuer le dev server
Get-Process node | Where-Object { $_.MainWindowTitle -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue
```
Expected: `Speed Insights script tag detected: True`. Si False, vérifier l'edit `app/layout.tsx`.

> Alternative scriptable : `Start-Job` qui lance `npm run dev`, fetch local, puis `Stop-Job`. L'exécutant adapte selon l'environnement Windows. **Critère** : la sortie doit contenir le mot `speed-insights` quelque part dans le HTML reçu.

- [ ] **Step 3.5: Commit C1**

```powershell
git add app/layout.tsx package.json package-lock.json
git commit -m "(quick-260511-spd) feat: add Vercel Speed Insights for RUM collection

Apply post-merge to start collecting LCP/INP/TTFB on prod traffic. No
runtime impact — lazy-loaded script."
```

---

## Task 4: A1 — Promise.all sur `/journey`

**Files:**
- Modify: `app/journey/page.tsx`

- [ ] **Step 4.1: Identifier les 3 awaits indépendants**

Re-vérifier `app/journey/page.tsx` lignes 34-116 :
- L34 : `const user = hasSupabaseEnv() ? await getCurrentUser() : null;`
- L39 : `const role = hasSupabaseEnv() ? await getCurrentRole() : null;` ← séquentiel après user, ne dépend QUE de l'auth (peut être parallèle avec L34 ? Non, role lit aussi `auth.getUser()` — laissons-le séquentiel pour ce batch)
- L46 : `const data = await getJourneyData(user?.id ?? "");` ← dépend de `user.id`
- L54 : `const cohortPulse = await getCohortPulse(user?.id ?? "");` ← dépend de `user.id`
- L113-116 : `const announcements = ... await getAnnouncementsForPlayer(user.id, 5)` ← dépend de `user.id`

→ `data`, `cohortPulse`, `announcements` peuvent tous tourner en parallèle après `user` + `role`.

- [ ] **Step 4.2: Modifier `app/journey/page.tsx`**

Remplacer le bloc actuel par un `Promise.all`. Edit cible :

```tsx
// app/journey/page.tsx (remplacer lignes 44-54 + déplacer le bloc announcements)

// In demo mode user is null ; getJourneyData short-circuits to EMPTY when
// createClient() returns null, so the userId arg is never read in that path.
// Quick-260511-spd : parallélisation des 3 fetchs indépendants (data, cohortPulse,
// announcements) — gain TTFB ~200-500ms attendu.
const [data, cohortPulse, announcements] = await Promise.all([
  getJourneyData(user?.id ?? ""),
  getCohortPulse(user?.id ?? ""),
  hasSupabaseEnv() && user
    ? getAnnouncementsForPlayer(user.id, 5)
    : Promise.resolve([] as Awaited<ReturnType<typeof getAnnouncementsForPlayer>>),
]);
```

Et supprimer les déclarations dupliquées plus bas (lignes 113-116). Le bloc `if (data.empty || !data.player) { ... }` reste tel quel.

- [ ] **Step 4.3: Vérifier typecheck + lint + build**

```powershell
npm run typecheck && npm run lint && npm run build
```
Expected: exit 0. Si erreur de type sur `Awaited<ReturnType<...>>`, simplifier avec `getAnnouncementsForPlayer(user.id, 5).catch(() => [])` ou typer explicitement avec le type d'announcement déjà importé.

- [ ] **Step 4.4: Smoke local en mode demo (sans Supabase)**

Démarrer dev server sans env Supabase pour exercer le fallback seed (route `/journey` doit rendre sans crash).

```powershell
# Forcer absence Supabase env
Remove-Item env:NEXT_PUBLIC_SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item env:NEXT_PUBLIC_SUPABASE_ANON_KEY -ErrorAction SilentlyContinue
Start-Process -FilePath "npm" -ArgumentList "run","dev" -PassThru
Start-Sleep -Seconds 10
$res = Invoke-WebRequest -Uri "http://localhost:3000/journey" -UseBasicParsing
Write-Host "Status: $($res.StatusCode)"
$hasJourneyMarker = $res.Content -match "journey"  # marker générique
Write-Host "Journey content: $hasJourneyMarker"
Get-Process node | Where-Object { $_.MainWindowTitle -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue
```
Expected: `Status: 200` (mode demo route accessible) + `Journey content: True`. Si Status 500 → Promise.all a cassé quelque chose.

- [ ] **Step 4.5: Commit A1**

```powershell
git add app/journey/page.tsx
git commit -m "(quick-260511-spd) perf(journey): parallelize 3 independent fetches

Was: sequential awaits getJourneyData → getCohortPulse → getAnnouncements
Now: Promise.all — same data, fewer round-trips. Behavior-equivalent."
```

---

## Task 5: A2 — Promise.all sur `/admin`

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 5.1: Re-lire `app/admin/page.tsx` lignes 48-78**

Vérifier que :
- L48-58 : `Promise.all` déjà présent sur `[getCohortOverview(), getGlobalCounters(), getAdminLiveSnapshot()]`
- L63-78 : query `events` séquentielle après le Promise.all → cible à intégrer

- [ ] **Step 5.2: Modifier `app/admin/page.tsx`**

Refactor : extraire la query events dans une fonction locale et l'ajouter au `Promise.all`. Edit cible :

```tsx
// app/admin/page.tsx (juste avant le Promise.all existant, ajouter une helper)

async function fetchCurrentEvent(): Promise<{
  id: string | null;
  pitchOrder: PitchOrder | null;
}> {
  const supabase = await createClient();
  if (!supabase) return { id: null, pitchOrder: null };
  const { data: eventRow } = await supabase
    .from("events")
    .select("id, pitch_order_json")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const r = eventRow as { id: string; pitch_order_json: PitchOrder | null } | null;
  return { id: r?.id ?? null, pitchOrder: r?.pitch_order_json ?? null };
}

// Remplacer le Promise.all + le bloc events (lignes 48-78) par :
const [rows, counters, snapshot, eventInfo] = hasSupabaseEnv()
  ? await Promise.all([
      getCohortOverview(),
      getGlobalCounters(),
      getAdminLiveSnapshot(),
      fetchCurrentEvent(),
    ])
  : [
      [] as CohortRow[],
      { totalSubmissions: 0, pendingReview: 0, validated: 0, totalDeliverableSlots: 0 },
      emptySnapshot,
      { id: null, pitchOrder: null },
    ];

const currentEventId = eventInfo.id;
const pitchOrder = eventInfo.pitchOrder;
```

Supprimer le bloc original `let currentEventId / let pitchOrder / if (hasSupabaseEnv()) { ... }` (lignes 60-78).

- [ ] **Step 5.3: Vérifier typecheck + lint + build**

```powershell
npm run typecheck && npm run lint && npm run build
```
Expected: exit 0.

- [ ] **Step 5.4: Smoke local mode demo**

```powershell
# Mode demo (no Supabase env) — /admin doit rendre sans crash
Start-Process -FilePath "npm" -ArgumentList "run","dev" -PassThru
Start-Sleep -Seconds 10
$res = Invoke-WebRequest -Uri "http://localhost:3000/admin" -UseBasicParsing
Write-Host "Status: $($res.StatusCode)"
Get-Process node | Where-Object { $_.MainWindowTitle -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue
```
Expected: `Status: 200` ou `Status: 307` (redirect login en mode demo selon politique). Aucun 500.

- [ ] **Step 5.5: Commit A2**

```powershell
git add app/admin/page.tsx
git commit -m "(quick-260511-spd) perf(admin): fold events query into existing Promise.all

GM cockpit was: Promise.all(3) + sequential events query.
Now: Promise.all(4). Same data, one round-trip saved."
```

---

## Task 6: S1 — RLS initplan migration file (NE PAS APPLY)

**Files:**
- Create: `database/migrations/202605121200_rls_initplan_fix.sql`

- [ ] **Step 6.1: Récupérer les définitions actuelles des 16 policies via Supabase MCP**

Utiliser `mcp__plugin_supabase_supabase__execute_sql` pour récupérer le SQL exact de chaque policy WARN identifiée par l'advisor (cf. PLAN.md §2 lot S1).

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,         -- USING clause
  with_check    -- WITH CHECK clause
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'profiles_self_or_mentor_select',
    'profiles_self_or_gm_insert',
    'profiles_self_or_gm_update',
    'player_members_self_or_mentor_select',
    'submissions_member_self_insert',
    'submissions_member_self_update',
    'evaluations_mentor_self_insert',
    'evaluations_mentor_self_update',
    'pitch_scores_mentor_self_insert',
    'pitch_scores_mentor_self_update',
    'evaluation_comments_mentor_self_insert',
    'announcements_audience_select',
    'announcements_gm_insert',
    'bonus_events_player_insert',
    'moscow_cards_player_insert'
  )
ORDER BY tablename, policyname;
```

⚠️ Liste = 15 noms (16 WARN dans l'advisor, mais 1 doublon possible). Vérifier le retour : si 16 lignes, ajuster la liste.

- [ ] **Step 6.2: Générer le fichier migration**

Pour chaque policy retournée, générer un bloc :
```sql
DROP POLICY IF EXISTS "<policyname>" ON public.<tablename>;
CREATE POLICY "<policyname>" ON public.<tablename>
  AS <PERMISSIVE|RESTRICTIVE>
  FOR <cmd>
  TO <roles>
  USING (<qual avec auth.uid() remplacé par (select auth.uid())>)
  [WITH CHECK (<with_check avec même substitution>)];
```

Pourquoi DROP+CREATE et pas ALTER POLICY ? `ALTER POLICY` n'autorise pas tous les attributs en une commande. DROP+CREATE est idempotent et explicite.

Exemple concret (à adapter pour chaque ligne du résultat Step 6.1) :
```sql
-- profiles_self_or_mentor_select
DROP POLICY IF EXISTS "profiles_self_or_mentor_select" ON public.profiles;
CREATE POLICY "profiles_self_or_mentor_select" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_mentor());
```

Écrire le fichier complet dans `database/migrations/202605121200_rls_initplan_fix.sql` avec :
- Header de commentaire expliquant le but + référence advisor `auth_rls_initplan`
- BEGIN / COMMIT transaction
- Les 15-16 blocs DROP+CREATE
- Footer commentaire avec rollback (les CREATE POLICY originaux, pour rollback manuel si besoin)

- [ ] **Step 6.3: Validation visuelle**

```powershell
Select-String -Path database/migrations/202605121200_rls_initplan_fix.sql -Pattern "auth\.uid\(\)" | Where-Object { $_.Line -notmatch "\(select auth\.uid\(\)\)" -and $_.Line -notmatch "^--" }
```
Expected: aucun match. Si match → un `auth.uid()` non-wrappé reste, à fixer avant commit.

- [ ] **Step 6.4: Commit S1 (fichier uniquement, NE PAS apply)**

```powershell
git add database/migrations/202605121200_rls_initplan_fix.sql
git commit -m "(quick-260511-spd) sql: RLS initplan fix (16 policies wrap auth.uid())

Wraps auth.uid() in (select auth.uid()) per Supabase advisor recommendation
auth_rls_initplan. Strictly behavior-equivalent. APPLY = post-pilot 14/05."
```

---

## Task 7: S2 — Multiple permissive migration file (NE PAS APPLY)

**Files:**
- Create: `database/migrations/202605121201_multiple_permissive_fix.sql`

- [ ] **Step 7.1: Récupérer les policies dupliquées**

```sql
SELECT tablename, policyname, permissive, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cohorts', 'deliverable_templates', 'events', 'levels', 'missions')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
```

Vérifier qu'on retrouve bien 2 policies SELECT permissives par table : `xxx_authenticated_select` + `xxx_gm_all`.

- [ ] **Step 7.2: Choisir la stratégie**

Stratégie recommandée (la plus simple, comportement préservé) : **consolidation**. Le `xxx_gm_all` accorde déjà tout aux GM ; le `xxx_authenticated_select` accorde le SELECT aux authenticated. Comme la GM est `authenticated` par définition, on peut :

Option a) Restreindre `xxx_gm_all` à `INSERT, UPDATE, DELETE` (retirer SELECT) → conserve sa puissance pour writes, le SELECT est délégué à `xxx_authenticated_select`.

Option b) Marquer `xxx_gm_all` comme RESTRICTIVE (mais alors il refuse tout ce qui n'est pas GM, ce qui change la sémantique pour les autres rôles → ÉCARTÉ).

→ **Choisir option a)**.

- [ ] **Step 7.3: Générer le fichier migration**

Pour chacune des 5 tables :
```sql
DROP POLICY IF EXISTS "<table>_gm_all" ON public.<table>;
-- Recréer en excluant SELECT
CREATE POLICY "<table>_gm_all_writes" ON public.<table>
  AS PERMISSIVE
  FOR ALL  -- mais on va re-décliner par cmd écrit
  TO authenticated
  USING (public.is_game_master())
  WITH CHECK (public.is_game_master());
```

⚠️ `FOR ALL` couvre SELECT — donc on doit spécialiser. Soit créer 3 policies (`_gm_insert`, `_gm_update`, `_gm_delete`), soit garder `FOR ALL` si Postgres ne ré-évalue pas redondamment (vérifier advisor après apply en post-pilote).

→ **Approche minimale et sûre** : créer 3 policies par table (`_gm_insert`, `_gm_update`, `_gm_delete`), retirer le SELECT.

Écrire le fichier `202605121201_multiple_permissive_fix.sql` avec, pour chaque table :
```sql
-- cohorts
DROP POLICY IF EXISTS "cohorts_gm_all" ON public.cohorts;
CREATE POLICY "cohorts_gm_insert" ON public.cohorts FOR INSERT TO authenticated
  WITH CHECK (public.is_game_master());
CREATE POLICY "cohorts_gm_update" ON public.cohorts FOR UPDATE TO authenticated
  USING (public.is_game_master()) WITH CHECK (public.is_game_master());
CREATE POLICY "cohorts_gm_delete" ON public.cohorts FOR DELETE TO authenticated
  USING (public.is_game_master());
```

Répéter pour `deliverable_templates`, `events`, `levels`, `missions`.

Footer : commentaire rollback (recréer les `xxx_gm_all` originaux).

- [ ] **Step 7.4: Commit S2 (fichier uniquement)**

```powershell
git add database/migrations/202605121201_multiple_permissive_fix.sql
git commit -m "(quick-260511-spd) sql: split _gm_all into per-cmd policies (5 tables)

cohorts/deliverable_templates/events/levels/missions: remove duplicate
SELECT policy by restricting _gm_all to INSERT/UPDATE/DELETE only.
Per Supabase advisor multiple_permissive_policies. APPLY = post-pilot 14/05."
```

---

## Task 8: S3 — FK indexes migration file (NE PAS APPLY)

**Files:**
- Create: `database/migrations/202605121202_fk_indexes.sql`

- [ ] **Step 8.1: Écrire le fichier migration**

```sql
-- 202605121202_fk_indexes.sql
-- Add covering indexes for 7 FKs flagged by Supabase advisor unindexed_foreign_keys.
-- APPLY = post-pilot 14/05 via mcp__supabase__apply_migration.
-- Note: CONCURRENTLY cannot run in transaction block — apply via DDL stream
-- one by one, or wrap each in its own statement when applying.

CREATE INDEX IF NOT EXISTS announcements_created_by_user_id_idx
  ON public.announcements (created_by_user_id);

CREATE INDEX IF NOT EXISTS bonus_events_claimed_by_idx
  ON public.bonus_events (claimed_by);

CREATE INDEX IF NOT EXISTS bonus_events_reviewed_by_idx
  ON public.bonus_events (reviewed_by);

CREATE INDEX IF NOT EXISTS missions_level_id_idx
  ON public.missions (level_id);

CREATE INDEX IF NOT EXISTS moscow_cards_created_by_idx
  ON public.moscow_cards (created_by);

CREATE INDEX IF NOT EXISTS pitch_scores_player_id_idx
  ON public.pitch_scores (player_id);

CREATE INDEX IF NOT EXISTS submissions_submitted_by_idx
  ON public.submissions (submitted_by);
```

Note importante : `CONCURRENTLY` simplifié en non-concurrent ici car volume table très faible (< 1000 rows par table en prod pilote). En post-pilote l'apply ira vite, pas de risque de lock long.

- [ ] **Step 8.2: Commit S3**

```powershell
git add database/migrations/202605121202_fk_indexes.sql
git commit -m "(quick-260511-spd) sql: add 7 FK covering indexes

Per Supabase advisor unindexed_foreign_keys. Low pilot impact (small tables)
but useful for GM joins and DELETE cascades. APPLY = post-pilot 14/05."
```

---

## Task 9: AUDIT.md — résultats par lot

**Files:**
- Create: `.planning/quick/260511-spd-perf-prod-pilot-quickwins/AUDIT.md`

- [ ] **Step 9.1: Capturer SHAs et résultats**

```powershell
$shas = git log --oneline -8 --grep="quick-260511-spd"
Write-Host $shas
```

- [ ] **Step 9.2: Écrire AUDIT.md**

Template :
```markdown
# AUDIT — Perf Prod Quick Wins (260511-spd)

**Date :** 2026-05-12
**Branche :** polish/design-v2-match
**Commits :** [list SHAs from Step 9.1]

## Validation par lot

| Lot | Commit SHA | typecheck | lint | build | smoke |
|-----|------------|-----------|------|-------|-------|
| Smoke harness | `<sha>` | n/a | n/a | n/a | smoke-http OK |
| Baseline | `<sha>` | n/a | n/a | n/a | lighthouse OK |
| C1 Speed Insights | `<sha>` | ✅ | ✅ | ✅ | smoke-http detects script tag ✅ |
| A1 Promise.all /journey | `<sha>` | ✅ | ✅ | ✅ | demo route 200 ✅ |
| A2 Promise.all /admin | `<sha>` | ✅ | ✅ | ✅ | demo route 200 ✅ |
| S1 RLS migration file | `<sha>` | n/a | n/a | n/a | grep `(select auth.uid())` clean |
| S2 multiple permissive file | `<sha>` | n/a | n/a | n/a | review visuelle GM coverage OK |
| S3 FK indexes file | `<sha>` | n/a | n/a | n/a | n/a (DDL pure) |

## Migrations préparées (NON appliquées)

- `database/migrations/202605121200_rls_initplan_fix.sql` — 15-16 policies
- `database/migrations/202605121201_multiple_permissive_fix.sql` — 5 tables
- `database/migrations/202605121202_fk_indexes.sql` — 7 indexes

## Apply post-pilote 14/05 soir

Voir `EXEC-PLAN.md` Phase post-pilote (Task 11).
```

- [ ] **Step 9.3: Commit AUDIT.md**

```powershell
git add .planning/quick/260511-spd-perf-prod-pilot-quickwins/AUDIT.md
git commit -m "(quick-260511-spd) audit: validation results per lot"
```

---

## Task 10: SUMMARY.md + deferred-items.md

**Files:**
- Create: `.planning/quick/260511-spd-perf-prod-pilot-quickwins/SUMMARY.md`
- Create: `.planning/quick/260511-spd-perf-prod-pilot-quickwins/deferred-items.md`

- [ ] **Step 10.1: Écrire SUMMARY.md**

Template :
```markdown
# SUMMARY — Perf Prod Quick Wins (260511-spd)

## Décisions clés

- Tout polish strict (pas de hotfix main pré-pilote) — Omar 2026-05-12.
- Branche : polish/design-v2-match.
- Apply migrations + merge polish→main = post-pilote 14/05 soir.

## Commits livrés

[liste avec SHA + message court depuis git log]

## Baseline perf (v0.2-pilot-ready, 2026-05-12)

[contenu de baseline-prod.json]

## Apply procedure 14/05 soir (gate humain)

1. Tag pré-merge : `git tag v0.2.1-pre-perf-merge && git push origin v0.2.1-pre-perf-merge`
2. Merge : `git checkout main && git merge polish/design-v2-match --no-ff`
3. Apply S1 : `mcp__supabase__apply_migration` avec contenu de `202605121200_rls_initplan_fix.sql`
4. Re-run advisor : 0 WARN auth_rls_initplan attendu
5. Apply S2 puis S3
6. Push main → Vercel redeploy
7. Smoke prod auto :
   ```powershell
   $env:SMOKE_EMAIL="<P01 email>"; $env:SMOKE_PWD="<P01 pwd>"
   $env:NEXT_PUBLIC_SUPABASE_URL="<prod url>"; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>"
   node scripts/smoke-rls-prod.mjs
   node scripts/smoke-http.mjs
   node scripts/perf-baseline.mjs .planning/quick/260511-spd-perf-prod-pilot-quickwins/post-merge-prod.json
   ```
8. Comparer baseline-prod.json vs post-merge-prod.json — capturer delta dans cette section.

## Critères de succès atteints

- [ ] 6 commits feature + 1 smoke harness + 1 baseline + AUDIT + SUMMARY = 10 commits sur polish branch.
- [ ] typecheck + lint + build verts à chaque étape.
- [ ] Baseline perf capturée.
- [ ] Migrations préparées mais NON appliquées (gate humain post-pilote).
```

- [ ] **Step 10.2: Écrire deferred-items.md**

```markdown
# Deferred items — v0.3 perf

Items identifiés pendant 260511-spd, sortis de scope pilote :

- Refonte `getJourneyData` en RPC Postgres unique (collapse 5 queries → 1).
- Suspense streaming sur `/journey` (CohortPulse + Announcements + BonusRail).
- Partial Prerendering (PPR) Next.js 15 sur shell `/journey`.
- Bundle splitting `JourneyClient`.
- `loading.tsx` skeletons par route.
- Cleanup 6 unused indexes :
  - `deliverable_templates_active_idx`
  - `announcements_event_created_idx`
  - `announcements_kind_idx`
  - `bonus_events_status_idx`
  - `bonus_events_validated_active_idx`
  - `moscow_cards_project_idx`
- Audit bundle JS client + tree-shaking lucide-react.
- Cache headers DiceBear avatars.
- Mesure perf authentifiée (Lighthouse + cookies session) — actuellement baseline mesure le shell `/login`.
```

- [ ] **Step 10.3: Commit final**

```powershell
git add .planning/quick/260511-spd-perf-prod-pilot-quickwins/SUMMARY.md `
        .planning/quick/260511-spd-perf-prod-pilot-quickwins/deferred-items.md
git commit -m "(quick-260511-spd) summary: quick complete, gate humain post-pilote pour apply"
```

---

## Task 11: Phase post-pilote (gate humain — NE PAS exécuter pré-pilote)

⚠️ **Cette section est documentation pour l'exécutant humain le 14/05 soir.** Aucun step à cocher pré-pilote. L'agent qui exécute ce plan s'arrête à Task 10 et signale « Phase 1 complete, awaiting Omar 14/05 evening ».

Procédure post-pilote (référence) :

1. Tag pré-merge `main` :
   ```powershell
   git checkout main
   git tag v0.2.1-pre-perf-merge
   git push origin v0.2.1-pre-perf-merge
   ```

2. Merge polish→main :
   ```powershell
   git merge polish/design-v2-match --no-ff -m "merge polish/design-v2-match → main (post-pilote)"
   ```
   Résoudre conflits éventuels (probable : `app/layout.tsx` si autre polish y a touché).

3. Apply migrations Supabase via MCP, dans l'ordre :
   - `mcp__plugin_supabase_supabase__apply_migration` avec name=`rls_initplan_fix`, query=contenu fichier S1
   - idem `multiple_permissive_fix` (S2)
   - idem `fk_indexes` (S3)

4. Re-run `mcp__plugin_supabase_supabase__get_advisors --type performance` → vérifier :
   - 0 WARN `auth_rls_initplan`
   - 0 WARN `multiple_permissive_policies` sur les 5 tables ciblées
   - 0 INFO `unindexed_foreign_keys` sur les 7 FKs ciblés

5. Push main + redeploy Vercel auto :
   ```powershell
   git push origin main
   ```

6. Smoke prod automatisé (env vars depuis `.env.local` ou injecté manuellement) :
   ```powershell
   node scripts/smoke-http.mjs
   node scripts/smoke-rls-prod.mjs   # nécessite SMOKE_EMAIL/SMOKE_PWD/SUPABASE_URL/ANON_KEY
   node scripts/perf-baseline.mjs .planning/quick/260511-spd-perf-prod-pilot-quickwins/post-merge-prod.json
   ```

7. Comparer baseline vs post-merge :
   ```powershell
   Get-Content .planning/quick/260511-spd-perf-prod-pilot-quickwins/baseline-prod.json
   Get-Content .planning/quick/260511-spd-perf-prod-pilot-quickwins/post-merge-prod.json
   ```
   Compléter `SUMMARY.md` section delta.

8. Si régression critique : rollback via tag :
   ```powershell
   git reset --hard v0.2.1-pre-perf-merge
   git push origin main --force-with-lease
   # Et rollback migrations Supabase via SQL inverse documenté en footer de chaque fichier .sql
   ```

---

## Self-Review (pré-handoff)

**Spec coverage** :
- Lot C1 → Task 3 ✅
- Lot A1 → Task 4 ✅
- Lot A2 → Task 5 ✅
- Lot S1 → Task 6 ✅
- Lot S2 → Task 7 ✅
- Lot S3 → Task 8 ✅
- Plan validation (PLAN §5) → Tasks 4.4 / 5.4 / 9.1 (smoke automatisé) ✅
- Risques + mitigations → couverts dans steps (validation visuelle Step 6.3, smoke Step 4.4 etc.) ✅
- Critères de succès → checklist explicite Task 10.1 SUMMARY.md ✅

**Placeholder scan** : aucun TBD/TODO dans les steps. Steps avec « adapter à l'environnement » (Step 3.4 Windows) explicitent le critère de succès mesurable.

**Type consistency** : `fetchCurrentEvent()` retour `{ id, pitchOrder }` matche `currentEventId / pitchOrder` réutilisés Task 5.2. `getAnnouncementsForPlayer` typé via `Awaited<ReturnType<...>>` Task 4.2 — fallback simple si TS bronche.

**Constraint « only automatable smoke »** : ✅ — tous les smokes utilisent `npm run`, `node scripts/*.mjs`, `Invoke-WebRequest`, ou MCP Supabase. Aucune étape manuelle. La phase 11 est explicitement marquée gate humain et exclue du plan exécutable.
