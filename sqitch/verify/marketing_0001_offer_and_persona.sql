-- Verify secondMind:marketing_0001_offer_and_persona on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, name, description, price, currency, billing_type, is_active, created_at, updated_at
  FROM offer WHERE false;

SELECT id, organization_id, name, demo_first_name, demo_last_name, demo_age, demo_marital_status,
       demo_job_title, demo_professional_status, demo_income, interests, general_description,
       drivers, vital_needs, purchase_motivations, purchase_barriers, offer_discovery, path_to_goal,
       created_at, updated_at
  FROM persona WHERE false;

-- Triggers
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(t, ', ') INTO missing
  FROM unnest(ARRAY['trg_offer_updated_at', 'trg_persona_updated_at']) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = t
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Trigger(s) manquant(s) : %', missing;
  END IF;
END $$;

-- Contrainte CHECK billing_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'offer'::regclass AND contype = 'c' AND conname LIKE '%billing_type%'
  ) THEN
    RAISE EXCEPTION 'Contrainte CHECK manquante sur offer.billing_type';
  END IF;
END $$;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_offer_organization_id',
    'idx_persona_organization_id'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
