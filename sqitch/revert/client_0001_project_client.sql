-- Revert secondMind:client_0001_project_client from pg

BEGIN;

DROP TABLE IF EXISTS project_client;

COMMIT;
