-- =============================================================================
-- 20260511000000_reapply_seed_t3_polish_refonte.sql
-- =============================================================================
-- Patch : re-applique les 10 livrables AgreenTech avec titles refondus.
-- Contexte : la migration 20260510160000_seed_event_hackdays_agritech.sql a ete
-- editee localement (commit 64569a2 T-3 polish) APRES son apply en PROD. Supabase
-- ne re-applique pas un fichier modifie sous la meme version. Cette migration
-- patch upsert les 10 livrables (idempotent ON CONFLICT DO UPDATE) pour aligner
-- PROD sur le seed local.
--
-- Surface UAT : decouvert pendant Phase 12 UAT Test 5 (MoSCoW Kanban) 2026-05-11
-- car `fiche-produit-plan-dev-v1` avait title "3 verbatims terrain agriculteurs"
-- au lieu de "MoSCoW prototype (format Kanban link)" + `tam-sam-som-v1` manquait.
--
-- Idempotency : ON CONFLICT (mission_id, slug) DO UPDATE.
-- Submissions existantes preservees (FK submissions.deliverable_template_id).
-- =============================================================================

-- 5.1 — Mission 1 (L1) : Persona AgriTech [REFONTE T-3 polish 2026-05-10]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'personae-v1',
       'Persona AgriTech (fiche tableau sourcee)',
       E'1 fiche persona = 1 agriculteur reel (pas une moyenne), au format tableau Attribut / Valeur / Source, avec au moins 2 sources distinctes.\n\n'
       E'Champs minimum (7) :\n'
       E'- Nom + age\n'
       E'- Filiere / culture (ex : maraichage R''kiz, oliveraie Sefrou, elevage caprin Moyen-Atlas)\n'
       E'- Zone agro-ecologique (oasis / irrigue / bour / montagne)\n'
       E'- Taille exploitation (ha)\n'
       E'- Revenu annuel estime (DH) — chiffre precis, pas un rond non source\n'
       E'- Canal d''information principal (radio / WhatsApp / cooperative / ORMVA / voisin)\n'
       E'- Douleur observee terrain (1 phrase)\n\n'
       E'Sources acceptees : article / recherche / formulaire / entretien terrain / experience personnelle.\n'
       E'Au moins 2 sources distinctes (anti-fabrication : si "experience personnelle" partout, le mentor flaggera).\n\n'
       E'Livrable : URL HTTPS du Sheet / Notion / Doc partage en lecture publique.',
       '[
          {"key":"precision","label":"Precision cible (filiere + zone, pas trop generique)","max":5},
          {"key":"pain_terrain","label":"Douleur observee terrain (citation/observation, pas supposee)","max":5},
          {"key":"concretude","label":"Chiffres concrets (revenu non rond, taille_ha, canaux nommes)","max":5},
          {"key":"evidence","label":"Triangulation sources (>=2 sources distinctes en colonne Source)","max":5},
          {"key":"quality","label":"Qualite fiche (lisibilite, structuration tableau)","max":5}
        ]'::jsonb,
       25, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L1_problem'
  and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.2 — Mission 1 (L1) : Hypothese VP cible [REFONTE T-3 polish 2026-05-10 — completion-based]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'probleme-v1',
       'Hypothese VP cible (formulation Lean + pitch 1min)',
       E'Une phrase Lean testable : Pour {cible}, qui {besoin}, notre offre {offre} contrairement a {differenciation}. Plus pitch oral 1min en atelier.\n\n'
       E'Champs a remplir (1 phrase chacun) :\n'
       E'- Cible : filiere + zone (ex : maraichers irrigues du Souss-Massa), pas "agriculteurs marocains".\n'
       E'- Besoin : douleur observee terrain (a verifier en M2 via verbatims), pas suppose.\n'
       E'- Offre : ce que vous proposez de concret, en 1 phrase.\n'
       E'- Differenciation : contre quoi vous vous positionnez (statu quo, alternative existante).\n\n'
       E'Pitch oral 1min : chaque equipe presente sa phrase Lean a la cohorte, 1 minute chrono.\n\n'
       E'Validation mentor : completion du doc + pitch 1min realise = full points (25/25). Pas de scoring detaille a ce stade.\n\n'
       E'Livrable : URL HTTPS d''un doc partage (1 page suffit).',
       '[
          {"key":"completion","label":"Hypothese soumise + pitch 1min realise (0 = a refaire, 25 = complet)","max":25}
        ]'::jsonb,
       25, 2
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L1_problem'
  and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.3 — Mission 2 (L2) : Business Model Canvas [REFONTE T-3 polish 2026-05-10 — BMC 9 blocs]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'esquisse-solution-v1',
       'Business Model Canvas (9 blocs)',
       E'Business Model Canvas AgriTech : 9 blocs a remplir, lies a la persona L1 et aux verbatims L2.\n\n'
       E'Les 9 blocs (2-3 phrases ou bullets chacun) :\n'
       E'1. Segments de clientele — qui ? (reprendre persona L1)\n'
       E'2. Proposition de valeur — quoi ? (reprendre hypothese VP L1)\n'
       E'3. Canaux — par quels canaux on touche les clients ?\n'
       E'4. Relations clients — presentiel / distance / automatise ?\n'
       E'5. Sources de revenus — vente / abonnement / leasing / service a l''hectare\n'
       E'6. Ressources cles — humaines / technologiques / financieres\n'
       E'7. Activites cles — production / R&D / support / formation\n'
       E'8. Partenaires cles — ORMVA / cooperatives / fournisseurs / institutions\n'
       E'9. Structure de couts — CAPEX initial + OPEX recurrent\n\n'
       E'Format : Strategyzer.com OU Notion OU Google Doc avec tableau 9 cellules.\n\n'
       E'Astuce sous-livrables : remplir chaque bloc dans l''ordre. Bloc 1 et 2 recopient persona L1 + hypothese VP. Bloc 5 et 9 alimenteront ROI/ha (L4).\n\n'
       E'Livrable : URL HTTPS du BMC partage en lecture publique.',
       '[
          {"key":"completion","label":"Completion 9 blocs (>=2 phrases chacun, pas de bloc vide)","max":15},
          {"key":"coherence","label":"Coherence avec persona L1, verbatims L2 et hypothese VP","max":10}
        ]'::jsonb,
       25, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L2_solution'
  and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.4 — Mission 2 (L2) : MoSCoW prototype (Kanban link) [REFONTE T-3 polish 2026-05-10 — verbatims migres vers bonus]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'fiche-produit-plan-dev-v1',
       'MoSCoW prototype (format Kanban link)',
       E'Prioriser MUST / SHOULD / COULD / WON''T pour le prototype pilote 1 saison, format Kanban Trello / Miro / Notion.\n\n'
       E'Pour chaque carte (carte = 1 feature) :\n'
       E'- Feature / capacite (1 phrase)\n'
       E'- Pourquoi a ce niveau de priorite\n'
       E'- Contrainte terrain levee (MUST et SHOULD uniquement) :\n'
       E'  autonomie energetique / maintenance / litteratie tech / connectivite 3G-2G /\n'
       E'  cout-par-ha / resistance climat / conformite ONSSA-ORMVA\n\n'
       E'Recommandations :\n'
       E'- >= 2 cartes MUST (sans elles, le prototype ne tient pas en conditions reelles)\n'
       E'- >= 1 carte WON''T (anti scope-creep — explicitement ecarte)\n'
       E'- Chaque MUST devrait lever une contrainte terrain reelle, pas une feature de luxe\n\n'
       E'Format : tableau Trello / Miro / Notion / Google Sheet kanban.\n'
       E'Note v0.3 post-pilote : version native in-app a venir avec DnD + export CSV.\n\n'
       E'Livrable : URL HTTPS du Kanban partage en lecture publique.',
       '[
          {"key":"completion","label":"Completion (4 colonnes, >=2 MUST, >=1 WONT, cartes avec feature+pourquoi)","max":15},
          {"key":"pertinence","label":"MUST levent vraies contraintes terrain ; WONT = vrai arbitrage (pas trivial)","max":10}
        ]'::jsonb,
       25, 2
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L2_solution'
  and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.5 — Mission 3 (L3) : Analyse concurrentielle + carte positionnement [REFONTE T-3 polish 2026-05-10 — MoSCoW migre vers #4]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'etude-marche-v1',
       'Analyse concurrentielle + carte de positionnement',
       E'3-5 concurrents identifies (locaux + internationaux) places sur une carte de positionnement (axes libres definis par le porteur).\n\n'
       E'Pour chaque concurrent (3-5) :\n'
       E'- Nom + URL (site, app, contact si solution informelle)\n'
       E'- Filiere / segment (la meme ou adjacente)\n'
       E'- Geographie (Maroc / MENA / Europe / autre)\n'
       E'- Modele economique (vente / abonnement / leasing / service)\n'
       E'- Forces (1-2 phrases)\n'
       E'- Faiblesses ou angle d''attaque (1-2 phrases)\n\n'
       E'Carte de positionnement (axes libres) :\n'
       E'- 2 axes au choix (ex : prix vs feature, complexite vs accessibilite, technologique vs traditionnel)\n'
       E'- Placer chaque concurrent + votre solution sur la carte\n'
       E'- Justifier votre position (1 phrase) — votre angle differenciant doit ressortir\n'
       E'- But : prouver votre differenciation par rapport a hypothese VP L1.\n\n'
       E'Livrable : URL HTTPS d''un doc partage (Notion, Google Doc, slide unique).',
       '[
          {"key":"competitors","label":"3-5 concurrents identifies, fiche complete par concurrent","max":10},
          {"key":"positioning","label":"Carte avec 2 axes pertinents, votre solution placee + justifiee","max":10},
          {"key":"differenciation","label":"Lien clair avec hypothese VP L1 (votre angle ressort)","max":5}
        ]'::jsonb,
       25, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L3_market'
  and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.5bis — Mission 3 (L3) : TAM / SAM / SOM [NEW T-3 polish 2026-05-10 — 2eme livrable L3]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'tam-sam-som-v1',
       'TAM / SAM / SOM (avec hypotheses de calcul)',
       E'Estimer le marche : TAM (total filiere Maroc), SAM (zone accessible), SOM (capture annee 1). Chaque chiffre = 1 hypothese de calcul explicite.\n\n'
       E'TAM (Total Addressable Market) :\n'
       E'- Nombre total d''agriculteurs / exploitations dans votre filiere au Maroc\n'
       E'- Source : HCP, ONCA, ORMVA, FAO, articles, etudes\n'
       E'- Hypothese : ex "1.5M exploitations Maroc * 12% maraichage = 180k cibles"\n\n'
       E'SAM (Serviceable Addressable Market) :\n'
       E'- Sous-ensemble du TAM accessible (zone, taille, segment)\n'
       E'- Ex : "180k * 30% Souss-Massa irrigue = 54k cibles"\n\n'
       E'SOM (Serviceable Obtainable Market) :\n'
       E'- Capture realiste annee 1 ou 3\n'
       E'- Ex : "54k * 5% taux adoption an 1 = 2700 clients"\n'
       E'- Multiplie par CA moyen client = revenu annee 1\n\n'
       E'Anti-fabrication : chaque chiffre = SA source OU SON hypothese. Pas de "180k parce que ca sonne bien".\n\n'
       E'Livrable : URL HTTPS d''un doc partage (tableau ou doc avec 3 sections).',
       '[
          {"key":"calcul_explicite","label":"3 niveaux estimes, chaque chiffre a source/hypothese explicite","max":15},
          {"key":"realisme_som","label":"SOM coherent avec acquisition L5 (taux d''adoption credible)","max":5},
          {"key":"coherence_persona","label":"SAM coherent avec persona L1 (filiere, zone)","max":5}
        ]'::jsonb,
       25, 2
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L3_market'
  and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.6 — Mission 4 (L4) : ROI/ha + modele portage [REFONTE T-3 polish 2026-05-10]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'bmc-v1',
       'ROI / ha + modele de portage',
       E'Calculer le ROI agriculteur par hectare + choisir un modele de portage adapte au persona L1.\n\n'
       E'Calcul ROI / ha (etapes) :\n'
       E'- Cout total / ha = CAPEX amorti (sur N annees) + OPEX annuel\n'
       E'- Gain attendu / ha = rendement supplementaire en valeur OU economie\n'
       E'  (ex : moins d''eau / engrais / main-d''oeuvre)\n'
       E'- ROI / ha = (gain annuel - cout annuel) / cout\n'
       E'- Periode de retour = nombre de mois pour amortir le CAPEX initial\n\n'
       E'Modele de portage (choisir 1 + justifier) :\n'
       E'- Achat direct — agriculteur achete en propre\n'
       E'- Leasing cooperative — cooperative achete et loue\n'
       E'- Service a l''hectare — paiement a l''usage\n'
       E'- Abonnement annuel\n'
       E'Justification : pourquoi ce modele est adapte a votre persona L1 (revenu, taille).\n\n'
       E'Sources possibles : etudes FAO / ANRT, prix marche, retours pilotes ailleurs.\n'
       E'Anti-fabrication : OPEX/ha doit etre <= 30% revenu_persona (sinon agriculteur insolvable).\n\n'
       E'Livrable : URL HTTPS d''un doc partage (tableau ou doc structure).',
       '[
          {"key":"calcul_roi","label":"ROI/ha calcule, cout+gain detailles, periode de retour","max":10},
          {"key":"portage_choix","label":"Modele de portage choisi + justifie vs persona L1 (revenu, taille)","max":10},
          {"key":"coherence_revenu","label":"OPEX/ha <= 30% revenu persona (agriculteur solvable)","max":5}
        ]'::jsonb,
       25, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L4_business_model'
  and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.7 — Mission 4 (L4) : Couts agronomiques detail [REFONTE T-3 polish 2026-05-10]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'couts-previsions-v1',
       'Couts agronomiques detail (CAPEX/OPEX/ha)',
       E'Detail des couts agronomiques par hectare : CAPEX initial (installation) + OPEX annuel recurrent. Alimente le calcul ROI (#6).\n\n'
       E'CAPEX / ha (cout d''installation initial — paye 1 fois) :\n'
       E'- Materiel principal (capteurs, equipements, infrastructure)\n'
       E'- Logiciel / abonnement initial\n'
       E'- Installation / formation initiale\n'
       E'- Total CAPEX / ha\n'
       E'- Duree d''amortissement (annees)\n\n'
       E'OPEX / ha (cout recurrent annuel) :\n'
       E'- Maintenance materiel\n'
       E'- Consommables (energie, calibration, pieces)\n'
       E'- Support / formation continue\n'
       E'- Abonnement service / licence\n'
       E'- Total OPEX / ha annuel\n\n'
       E'Coherence avec persona L1 :\n'
       E'- Revenu annuel persona x 30% maximum = OPEX/ha tolere\n'
       E'- Si depasse : repenser le scope MUST (#4) ou changer modele portage (#6)\n\n'
       E'Sources : devis fournisseurs reels OU benchmarks FAO / ANRT / etudes pilote.\n'
       E'Anti-fabrication : pas de "200 DH/ha" sans devis ou source.\n\n'
       E'Livrable : URL HTTPS d''un tableau (Sheet recommande) avec lignes detaillees.',
       '[
          {"key":"capex_detail","label":"CAPEX detaille par poste, total, duree amortissement","max":10},
          {"key":"opex_detail","label":"OPEX detaille par poste, total annuel","max":10},
          {"key":"sources","label":"Devis ou sources cites par ligne (anti-fabrication)","max":5}
        ]'::jsonb,
       25, 2
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L4_business_model'
  and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.8 — Mission 5 (L4) : Plan acquisition AgriTech [REFONTE T-3 polish 2026-05-10]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'strategie-commerciale-v1',
       'Plan acquisition AgriTech (3-5 relais)',
       E'3-5 organisations relais identifiees (cooperative, ORMVA, ONCA, foires) avec action concrete semaine 1 post-bootcamp.\n\n'
       E'Pour chaque organisation relais (3-5) :\n'
       E'- Nom + URL ou contact\n'
       E'- Type (ORMVA / Cooperative / ONCA / association / foire / influenceur agricole)\n'
       E'- Decideur (qui decide chez eux ? quel cycle de decision ?)\n'
       E'- Canal (digital / physique / mixte)\n'
       E'- Action concrete semaine 1 post-bootcamp\n'
       E'  (ex : appel telephonique, RDV terrain, demo produit, message LinkedIn cible)\n\n'
       E'Recommandations :\n'
       E'- >= 1 canal non-digital (l''AgriTech au Maroc ne se vend pas par Facebook Ads)\n'
       E'- Mix d''organisations : institutionnelles (ORMVA, ONCA) + terrain (cooperatives) + foires/salons\n'
       E'- Action S1 doit etre activable des 15/05 (lendemain bootcamp)\n\n'
       E'Format : tableau avec colonnes (organisation, type, decideur, canal, action_s1).\n'
       E'Livrable : URL HTTPS du doc partage.',
       '[
          {"key":"relais_count","label":"3-5 organisations identifiees, fiche complete par relais","max":10},
          {"key":"mix_canaux","label":">=1 canal non-digital + diversite types organisations","max":5},
          {"key":"action_concrete","label":"Action S1 post-bootcamp concrete et activable des 15/05","max":10}
        ]'::jsonb,
       25, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L4_business_model'
  and m.ord = 5
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.9 — Mission 6 (L5) : Pitch deck final AgriTech [REFONTE T-3 polish 2026-05-10]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'pitch-deck-v1',
       'Pitch deck final AgriTech (10-12 slides)',
       E'Deck final pour le pitch jury 14/05 14h00. 10-12 slides AgriTech avec probleme filiere, solution, marche, ROI/ha, equipe, demande.\n\n'
       E'Structure recommandee 10-12 slides :\n'
       E'1. Couverture (nom equipe, projet, baseline)\n'
       E'2. Probleme filiere (douleur observee terrain)\n'
       E'3. Solution AgriTech proposee\n'
       E'4. PREUVE TERRAIN — slide critique (verbatim OU chiffre concret)\n'
       E'5. Marche TAM/SAM/SOM\n'
       E'6. Differenciation vs concurrents (#5 carte positionnement)\n'
       E'7. Modele economique (ROI/ha, portage)\n'
       E'8. Plan acquisition (relais ORMVA / cooperatives / foires)\n'
       E'9. Roadmap pilote 1 saison + jalons\n'
       E'10. Equipe + competences cles\n'
       E'11. Demande (montant, ressources, partenariats)\n'
       E'12. Remerciement + contact\n\n'
       E'Slide 4 (Preuve terrain) est OBLIGATOIRE :\n'
       E'- SOIT citation textuelle d''agriculteur entre guillemets (avec nom + canal de collecte)\n'
       E'- SOIT chiffre quantifie de votre etude (ROI, marche, taux adoption avec source)\n'
       E'- Sans preuve = signal anti-fabrication flagge par le jury.\n\n'
       E'Format : Google Slides / Canva / Keynote / PowerPoint partage en lecture publique.\n'
       E'Note : ce livrable score le DECK (artifact). La performance pitch live est scoree separement par le jury (pondere 80% du score final).\n\n'
       E'Livrable : URL HTTPS du deck.',
       '[
          {"key":"structure","label":"10-12 slides, structure standard pitch deck","max":5},
          {"key":"preuve_slide4","label":"Slide 4 contient verbatim OU chiffre terrain source (anti-fabrication)","max":10},
          {"key":"coherence_parcours","label":"Reprend persona L1 + hypothese VP + ROI L4 + plan L5","max":5},
          {"key":"clarte","label":"Lisibilite, design propre, demande claire","max":5}
        ]'::jsonb,
       25, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L5_pitch'
  and m.ord = 6
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;
