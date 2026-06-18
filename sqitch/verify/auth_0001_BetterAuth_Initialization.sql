-- Verify secondMind:auth_0001_BetterAuth_Initialization on pg

BEGIN;

-- Colonnes
SELECT id, name, email, "emailVerified", image, "createdAt", "updatedAt"
  FROM "user" WHERE false;

SELECT id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "activeOrganizationId"
  FROM "session" WHERE false;

SELECT id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken",
       "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt"
  FROM "account" WHERE false;

SELECT id, identifier, value, "expiresAt", "createdAt", "updatedAt"
  FROM "verification" WHERE false;

SELECT id, name, slug, logo, metadata, "createdAt"
  FROM "organization" WHERE false;

SELECT id, "userId", "organizationId", role, "createdAt"
  FROM "member" WHERE false;

SELECT id, email, "inviterId", "organizationId", role, status, "createdAt", "expiresAt"
  FROM "invitation" WHERE false;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_session_user_id',
    'idx_account_user_id',
    'idx_account_provider',
    'idx_member_user_id',
    'idx_member_organization_id',
    'idx_invitation_organization_id'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
