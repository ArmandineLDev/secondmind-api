-- Verify secondMind:kanban_0001_task_enhancements on pg

BEGIN;

SELECT id, start_date, estimated_hours
  FROM task WHERE false;

SELECT task_id, depends_on_id
  FROM task_dependency WHERE false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'task'::regclass
      AND contype = 'c'
      AND conname LIKE '%estimated_hours%'
  ) THEN
    RAISE EXCEPTION 'Contrainte CHECK manquante sur task.estimated_hours';
  END IF;
END $$;

DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_task_dependency_task_id',
    'idx_task_dependency_depends_on_id'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
