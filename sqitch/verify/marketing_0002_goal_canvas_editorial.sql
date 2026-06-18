-- Verify secondMind:marketing_0002_goal_canvas_editorial on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, title, description, category, target_value, current_value, unit, due_date, status, created_at, updated_at
  FROM goal WHERE false;

SELECT id, organization_id, name, customer_segments, value_propositions, channels, customer_relationships,
       revenue_streams, key_resources, key_activities, key_partners, cost_structure, created_at, updated_at
  FROM business_model_canvas WHERE false;

SELECT id, organization_id, persona_id, network, title, content, status, scheduled_at, published_at, tags, created_at, updated_at
  FROM editorial_post WHERE false;

-- Triggers
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(t, ', ') INTO missing
  FROM unnest(ARRAY[
    'trg_goal_updated_at',
    'trg_business_model_canvas_updated_at',
    'trg_editorial_post_updated_at'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = t
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Trigger(s) manquant(s) : %', missing;
  END IF;
END $$;

-- Contraintes CHECK
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(tbl || '.' || col, ', ') INTO missing
  FROM (VALUES
    ('goal',          'category'),
    ('goal',          'status'),
    ('editorial_post','network'),
    ('editorial_post','status')
  ) AS t(tbl, col)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = t.tbl::regclass AND contype = 'c' AND conname LIKE '%' || t.col || '%'
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Contrainte(s) CHECK manquante(s) : %', missing;
  END IF;
END $$;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_goal_organization_id',
    'idx_business_model_canvas_organization_id',
    'idx_editorial_post_organization_id',
    'idx_editorial_post_scheduled_at'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
