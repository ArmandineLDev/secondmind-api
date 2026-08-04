-- Verify secondMind:auth_0002_member_unique on pg

BEGIN;

SELECT 1/COUNT(*)
FROM pg_constraint
WHERE conname = 'member_user_organization_unique';

ROLLBACK;
