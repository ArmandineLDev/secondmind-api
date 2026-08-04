-- Revert secondMind:auth_0002_member_unique from pg

BEGIN;

ALTER TABLE "member" DROP CONSTRAINT member_user_organization_unique;

COMMIT;
