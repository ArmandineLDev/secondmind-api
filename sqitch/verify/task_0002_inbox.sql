-- Verify secondMind:task_0002_inbox on pg

BEGIN;

SELECT stage, snooze_until, organization_id FROM task WHERE false;

-- L'invariant doit exister...
SELECT 1/COUNT(*) FROM pg_constraint WHERE conname = 'task_active_requires_board';
-- ...et les colonnes être devenues nullables.
SELECT 1/COUNT(*) FROM information_schema.columns
WHERE table_name = 'task' AND column_name = 'project_id' AND is_nullable = 'YES';

ROLLBACK;
