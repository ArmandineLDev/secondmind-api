-- Verify secondMind:project_0005_single_default_project on pg

BEGIN;

-- Échoue si l'index partiel n'existe pas.
SELECT 1/COUNT(*) FROM pg_indexes
 WHERE indexname = 'project_one_default_per_organization';

ROLLBACK;
