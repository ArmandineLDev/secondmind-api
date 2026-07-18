-- Revert secondMind:kanban_0002_task_recurrence from pg

BEGIN;

ALTER TABLE task
  DROP COLUMN IF EXISTS recurrence_freq,
  DROP COLUMN IF EXISTS recurrence_interval,
  DROP COLUMN IF EXISTS recurrence_days,
  DROP COLUMN IF EXISTS recurrence_until;

COMMIT;
