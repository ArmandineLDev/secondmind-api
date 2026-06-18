-- Revert secondMind:kanban_0001_task_enhancements from pg

BEGIN;

DROP TABLE IF EXISTS task_dependency;

ALTER TABLE task
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS estimated_hours;

COMMIT;
