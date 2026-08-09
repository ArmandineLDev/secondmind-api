-- Verify secondMind:auth_0003_last_organization on pg

BEGIN;

SELECT "lastOrganizationId" FROM "user" WHERE false;

ROLLBACK;
