-- Revert secondMind:auth_0003_last_organization from pg

BEGIN;

ALTER TABLE "user" DROP COLUMN IF EXISTS "lastOrganizationId";

COMMIT;
