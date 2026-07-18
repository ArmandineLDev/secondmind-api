-- Revert secondMind:project_0004_company_id from pg

BEGIN;

DROP INDEX IF EXISTS idx_project_company_id;

ALTER TABLE project
  DROP COLUMN IF EXISTS company_id;

COMMIT;
