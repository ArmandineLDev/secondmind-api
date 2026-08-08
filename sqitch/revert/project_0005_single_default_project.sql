-- Revert secondMind:project_0005_single_default_project from pg

BEGIN;

DROP INDEX IF EXISTS project_one_default_per_organization;

COMMIT;
