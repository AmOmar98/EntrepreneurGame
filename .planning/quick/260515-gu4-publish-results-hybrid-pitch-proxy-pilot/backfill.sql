-- ============================================================================
-- Quick 260515-gu4 : backfill pitch_scores + publish results
-- ============================================================================
-- Event: agreentech-fes-meknes-mai-2026 (id f9a386aa-a547-4d0d-91d0-0bb16a29364e)
-- Jurors: 4 (3 smoke EIC Jury 1/2/3 + Omar Ameur GM)
-- Players: 11 (cohorte AgreenTech 2026)
-- Rows: 44 (idempotent UPSERT)
-- Decision context: post-cérémonie 14/05, jurys partenaires Tamwilcom/BoA/Innov
-- Invest/Bluespace ont désigné Metafarm (p07) / OliveFeed (p11) / SAGRIPLAST
-- (p10) comme Top 3. Backfill consolide cette décision dans 4 saisies "jury
-- coordinator" EIC (R1 préservée — Players ne verront pas le ranking).
-- Formule: combined = 0.8 * (avg(total_score)*1.25 si c5=0) + 0.2 * score_project
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. UPSERT 44 pitch_scores rows (c5=0 forces design v2 4-criteria normalization)
-- ============================================================================

INSERT INTO pitch_scores (event_id, player_id, juror_id, c1, c2, c3, c4, c5, total_score)
VALUES
  -- p07 Metafarm (target avg=77/80, normalized=96.25/100, combined=124.6)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7a86ca35-45ce-4721-8f26-a3d371a9d990', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 20, 20, 20, 18, 0, 78),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7a86ca35-45ce-4721-8f26-a3d371a9d990', '9f9e8df9-f847-4828-87fb-141e10eceb59', 20, 20, 19, 18, 0, 77),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7a86ca35-45ce-4721-8f26-a3d371a9d990', '42c30e95-800d-427f-97e5-37a51b7dced1', 20, 20, 18, 19, 0, 77),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7a86ca35-45ce-4721-8f26-a3d371a9d990', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 19, 19, 19, 19, 0, 76),

  -- p11 Bouchenna OliveFeed (target avg=75.25/80, normalized=94.06/100, combined=107.25)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bcbe556-ce13-40b2-ae14-031a435adf5b', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 19, 19, 19, 19, 0, 76),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bcbe556-ce13-40b2-ae14-031a435adf5b', '9f9e8df9-f847-4828-87fb-141e10eceb59', 19, 19, 19, 18, 0, 75),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bcbe556-ce13-40b2-ae14-031a435adf5b', '42c30e95-800d-427f-97e5-37a51b7dced1', 19, 19, 18, 19, 0, 75),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bcbe556-ce13-40b2-ae14-031a435adf5b', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 19, 18, 19, 19, 0, 75),

  -- p10 Gaoua SAGRIPLAST (target avg=76/80, normalized=95.0/100, combined=104.6)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2c5e89eb-9fe7-434c-a979-8074cfcb1486', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 20, 19, 19, 19, 0, 77),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2c5e89eb-9fe7-434c-a979-8074cfcb1486', '9f9e8df9-f847-4828-87fb-141e10eceb59', 19, 19, 19, 19, 0, 76),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2c5e89eb-9fe7-434c-a979-8074cfcb1486', '42c30e95-800d-427f-97e5-37a51b7dced1', 19, 20, 18, 19, 0, 76),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2c5e89eb-9fe7-434c-a979-8074cfcb1486', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 19, 18, 19, 19, 0, 75),

  -- p08 Zradgui Caviar (target avg=52/80, normalized=65/100, combined=99.2)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '60a54325-2b5f-4972-a7d8-d997e1a87392', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 14, 13, 13, 13, 0, 53),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '60a54325-2b5f-4972-a7d8-d997e1a87392', '9f9e8df9-f847-4828-87fb-141e10eceb59', 13, 13, 13, 13, 0, 52),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '60a54325-2b5f-4972-a7d8-d997e1a87392', '42c30e95-800d-427f-97e5-37a51b7dced1', 13, 14, 12, 13, 0, 52),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '60a54325-2b5f-4972-a7d8-d997e1a87392', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 13, 12, 13, 13, 0, 51),

  -- p09 Zerouali (target avg=56/80, normalized=70/100, combined=96.0)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', 'fd203135-40c4-40c3-88b1-51db9a070915', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 15, 14, 14, 14, 0, 57),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', 'fd203135-40c4-40c3-88b1-51db9a070915', '9f9e8df9-f847-4828-87fb-141e10eceb59', 14, 14, 14, 14, 0, 56),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', 'fd203135-40c4-40c3-88b1-51db9a070915', '42c30e95-800d-427f-97e5-37a51b7dced1', 14, 15, 13, 14, 0, 56),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', 'fd203135-40c4-40c3-88b1-51db9a070915', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 14, 13, 14, 14, 0, 55),

  -- p05 Dahbi ZitounTech (target avg=54.5/80, normalized=68.13/100, combined=93.3)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 14, 14, 14, 13, 0, 55),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '9f9e8df9-f847-4828-87fb-141e10eceb59', 14, 13, 14, 13, 0, 54),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '42c30e95-800d-427f-97e5-37a51b7dced1', 14, 14, 13, 14, 0, 55),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 13, 14, 13, 14, 0, 54),

  -- p04 FILAHITECH (target avg=52/80, normalized=65/100, combined=87.0)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7cd13e23-0aaa-4bca-9f21-36aad3cdb487', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 13, 14, 13, 13, 0, 53),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7cd13e23-0aaa-4bca-9f21-36aad3cdb487', '9f9e8df9-f847-4828-87fb-141e10eceb59', 13, 13, 13, 13, 0, 52),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7cd13e23-0aaa-4bca-9f21-36aad3cdb487', '42c30e95-800d-427f-97e5-37a51b7dced1', 13, 13, 12, 14, 0, 52),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '7cd13e23-0aaa-4bca-9f21-36aad3cdb487', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 12, 13, 13, 13, 0, 51),

  -- p01 Adil TADARTI (target avg=48/80, normalized=60/100, combined=81.0)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '51fe7e90-1e05-4ac2-9dc2-0dab699ac181', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 13, 12, 12, 12, 0, 49),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '51fe7e90-1e05-4ac2-9dc2-0dab699ac181', '9f9e8df9-f847-4828-87fb-141e10eceb59', 12, 12, 12, 12, 0, 48),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '51fe7e90-1e05-4ac2-9dc2-0dab699ac181', '42c30e95-800d-427f-97e5-37a51b7dced1', 12, 12, 11, 13, 0, 48),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '51fe7e90-1e05-4ac2-9dc2-0dab699ac181', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 12, 11, 12, 12, 0, 47),

  -- p02 Houenha (target avg=36/80, normalized=45/100, combined=45.6)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '4fab6132-0642-47d8-8685-05bdfee52417', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 10, 9, 9, 9, 0, 37),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '4fab6132-0642-47d8-8685-05bdfee52417', '9f9e8df9-f847-4828-87fb-141e10eceb59', 9, 9, 9, 9, 0, 36),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '4fab6132-0642-47d8-8685-05bdfee52417', '42c30e95-800d-427f-97e5-37a51b7dced1', 9, 10, 8, 9, 0, 36),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '4fab6132-0642-47d8-8685-05bdfee52417', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 9, 8, 9, 9, 0, 35),

  -- p03 El Aissaoui (target avg=20/80, normalized=25/100, combined=20.0)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '171b9ce0-48cc-4508-b6da-a3c5a88528fc', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 6, 5, 5, 5, 0, 21),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '171b9ce0-48cc-4508-b6da-a3c5a88528fc', '9f9e8df9-f847-4828-87fb-141e10eceb59', 5, 5, 5, 5, 0, 20),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '171b9ce0-48cc-4508-b6da-a3c5a88528fc', '42c30e95-800d-427f-97e5-37a51b7dced1', 5, 6, 4, 5, 0, 20),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '171b9ce0-48cc-4508-b6da-a3c5a88528fc', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 5, 4, 5, 5, 0, 19),

  -- p06 Kientega (target avg=12/80, normalized=15/100, combined=12.0)
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '319db5a4-c774-4d7f-b531-e53a362f4479', '379a3b8c-435e-4d97-85cd-2f803a66f4a8', 4, 3, 3, 3, 0, 13),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '319db5a4-c774-4d7f-b531-e53a362f4479', '9f9e8df9-f847-4828-87fb-141e10eceb59', 3, 3, 3, 3, 0, 12),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '319db5a4-c774-4d7f-b531-e53a362f4479', '42c30e95-800d-427f-97e5-37a51b7dced1', 3, 4, 2, 3, 0, 12),
  ('f9a386aa-a547-4d0d-91d0-0bb16a29364e', '319db5a4-c774-4d7f-b531-e53a362f4479', '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334', 3, 2, 3, 3, 0, 11)

ON CONFLICT (event_id, player_id, juror_id) DO UPDATE
SET c1 = EXCLUDED.c1,
    c2 = EXCLUDED.c2,
    c3 = EXCLUDED.c3,
    c4 = EXCLUDED.c4,
    c5 = EXCLUDED.c5,
    total_score = EXCLUDED.total_score,
    updated_at = now();

-- ============================================================================
-- 2. Publish results (UPDATE events SET results_published_at)
-- ============================================================================
-- The UI action `publishResultsFlow` (app/actions.ts:1093) is also valid now
-- since all 11 players have ≥1 pitch_score after step 1. Direct UPDATE is
-- chosen here for atomicity within the same transaction.

UPDATE events
SET results_published_at = now(),
    updated_at = now()
WHERE id = 'f9a386aa-a547-4d0d-91d0-0bb16a29364e'
  AND results_published_at IS NULL;

-- ============================================================================
-- 3. Validation query (run AFTER COMMIT to verify Top 3)
-- ============================================================================
-- Expected: p07 Metafarm > p11 Bouchenna > p10 Gaoua (top 3 in this order)

-- WITH pitch AS (
--   SELECT ps.player_id,
--     AVG(CASE WHEN ps.c5 > 0 THEN ps.total_score ELSE ps.total_score * 1.25 END) AS pitch_avg,
--     COUNT(*) AS juror_count
--   FROM pitch_scores ps
--   WHERE ps.event_id = 'f9a386aa-a547-4d0d-91d0-0bb16a29364e'
--   GROUP BY ps.player_id
-- )
-- SELECT
--   ROW_NUMBER() OVER (ORDER BY (0.8*COALESCE(pi.pitch_avg,0) + 0.2*p.score_project) DESC,
--                              COALESCE(pi.pitch_avg,0) DESC,
--                              p.name ASC) AS rank,
--   p.slug, p.name,
--   COALESCE(pi.pitch_avg, 0)::numeric(6,2) AS pitch_avg,
--   pi.juror_count,
--   p.score_project,
--   (0.8 * COALESCE(pi.pitch_avg, 0) + 0.2 * p.score_project)::numeric(6,2) AS combined
-- FROM players p
-- LEFT JOIN pitch pi ON pi.player_id = p.id
-- ORDER BY combined DESC, pitch_avg DESC, p.name ASC;

COMMIT;
