-- Revert secondMind:project_0001_Project_initialization from pg

BEGIN;

DROP TABLE IF EXISTS project;
DROP TYPE IF EXISTS project_status;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

COMMIT;
