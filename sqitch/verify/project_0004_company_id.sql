-- Verify secondMind:project_0004_company_id on pg

BEGIN;

SELECT id, company_id
  FROM project WHERE false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'project' AND indexname = 'idx_project_company_id'
  ) THEN
    RAISE EXCEPTION 'Index manquant : idx_project_company_id';
  END IF;
END $$;

ROLLBACK;
