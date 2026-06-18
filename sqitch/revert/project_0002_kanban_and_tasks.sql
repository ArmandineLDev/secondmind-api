-- Revert secondMind:project_0002_kanban_and_tasks from pg

BEGIN;

DROP TABLE IF EXISTS project_user;
DROP TABLE IF EXISTS task;
DROP TABLE IF EXISTS kanban_column;

COMMIT;
