-- Verify secondMind:kanban_0002_task_recurrence on pg

BEGIN;

SELECT id, recurrence_freq, recurrence_interval, recurrence_days, recurrence_until
  FROM task WHERE false;

ROLLBACK;
