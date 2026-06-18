-- Verify secondMind:crm_0001_company_and_contact on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, name, website, industry, notes, created_at, updated_at
  FROM company WHERE false;

SELECT id, organization_id, company_id, first_name, last_name, email, phone, status, notes, created_at, updated_at
  FROM contact WHERE false;

-- Triggers
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(t, ', ') INTO missing
  FROM unnest(ARRAY['trg_company_updated_at', 'trg_contact_updated_at']) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = t
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Trigger(s) manquant(s) : %', missing;
  END IF;
END $$;

-- Contrainte CHECK status sur contact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'contact'::regclass AND contype = 'c' AND conname LIKE '%status%'
  ) THEN
    RAISE EXCEPTION 'Contrainte CHECK manquante sur contact.status';
  END IF;
END $$;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_company_organization_id',
    'idx_contact_organization_id'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
