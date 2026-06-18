-- Verify secondMind:project_0002_kanban_and_tasks on pg

BEGIN;

-- Colonnes
SELECT id, project_id, name, position, color
  FROM kanban_column WHERE false;

SELECT id, project_id, column_id, title, description, priority, position, due_date, created_at, updated_at
  FROM task WHERE false;

SELECT project_id, user_id, created_at
  FROM project_user WHERE false;

-- Trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_task_updated_at'
  ) THEN
    RAISE EXCEPTION 'Trigger manquant : trg_task_updated_at';
  END IF;
END $$;

-- Contrainte CHECK priority sur task
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'task'::regclass AND contype = 'c' AND conname LIKE '%priority%'
  ) THEN
    RAISE EXCEPTION 'Contrainte CHECK manquante sur task.priority';
  END IF;
END $$;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_kanban_column_project_id',
    'idx_task_project_id',
    'idx_task_column_id'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
