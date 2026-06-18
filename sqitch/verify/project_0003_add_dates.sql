-- Verify secondMind:project_0003_add_dates on pg

BEGIN;

SELECT id, start_date, end_date
  FROM project WHERE false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'project'::regclass
      AND contype = 'c'
      AND conname = 'chk_project_dates'
  ) THEN
    RAISE EXCEPTION 'Contrainte CHECK manquante : chk_project_dates';
  END IF;
END $$;

ROLLBACK;
