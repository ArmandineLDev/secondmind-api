-- Verify secondMind:finance_0005_drop_revenue on pg

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'revenue') THEN
    RAISE EXCEPTION 'La table revenue existe encore alors qu''elle devait être supprimée';
  END IF;
END $$;

ROLLBACK;
