-- Revert secondMind:project_0006_contact_id from pg

BEGIN;

DROP INDEX IF EXISTS idx_project_contact_id;
ALTER TABLE project DROP COLUMN IF EXISTS contact_id;

COMMIT;
