-- Verify secondMind:finance_0002_invoice on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, type, contact_id, project_id, reference, amount, currency, issue_date, due_date, status, notes, created_at, updated_at
  FROM invoice WHERE false;

-- Trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_invoice_updated_at'
  ) THEN
    RAISE EXCEPTION 'Trigger manquant : trg_invoice_updated_at';
  END IF;
END $$;

-- Contraintes CHECK type et status
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(c, ', ') INTO missing
  FROM (VALUES ('type'), ('status')) AS t(c)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'invoice'::regclass AND contype = 'c' AND conname LIKE '%' || t.c || '%'
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Contrainte(s) CHECK manquante(s) sur invoice : %', missing;
  END IF;
END $$;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_invoice_organization_id',
    'idx_invoice_status',
    'idx_invoice_due_date'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
