-- Verify secondMind:crm_0002_lead_and_interaction on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, contact_id, company_id, title, value, stage, probability, notes, closed_at, created_at, updated_at
  FROM lead WHERE false;

SELECT id, contact_id, lead_id, type, date, notes, created_at
  FROM interaction WHERE false;

-- Trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lead_updated_at'
  ) THEN
    RAISE EXCEPTION 'Trigger manquant : trg_lead_updated_at';
  END IF;
END $$;

-- Contraintes CHECK
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(tbl || '.' || col, ', ') INTO missing
  FROM (VALUES
    ('lead',        'stage'),
    ('lead',        'probability'),
    ('interaction', 'type')
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
    'idx_lead_organization_id',
    'idx_lead_stage',
    'idx_interaction_contact_id',
    'idx_interaction_lead_id'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
