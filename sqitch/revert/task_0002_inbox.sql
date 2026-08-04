-- Revert secondMind:task_0002_inbox from pg

BEGIN;

-- Les tâches hors board ne sont pas représentables dans l'ancien schéma
-- (project_id et column_id NOT NULL) : elles sont supprimées.
-- ⚠️ Perte de données assumée — c'est le prix d'un retour en arrière sur cette
-- feature, les captures non planifiées n'ayant nulle part où aller.
DELETE FROM task WHERE project_id IS NULL OR column_id IS NULL;

DROP INDEX idx_task_snooze_until;
DROP INDEX idx_task_stage;
DROP INDEX idx_task_organization_id;

ALTER TABLE task DROP CONSTRAINT task_active_requires_board;

ALTER TABLE task
  ALTER COLUMN position DROP DEFAULT;

ALTER TABLE task
  ALTER COLUMN project_id SET NOT NULL,
  ALTER COLUMN column_id  SET NOT NULL;

ALTER TABLE task
  DROP COLUMN stage,
  DROP COLUMN snooze_until,
  DROP COLUMN organization_id;

DROP TYPE task_stage;

COMMIT;
