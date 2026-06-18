-- Revert secondMind:project_0003_add_dates from pg

BEGIN;

ALTER TABLE project
  DROP CONSTRAINT IF EXISTS chk_project_dates,
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date;

COMMIT;
