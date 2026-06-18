-- Deploy secondMind:auth_0001_BetterAuth_Initialization to pg

BEGIN;

CREATE TABLE IF NOT EXISTS "user" (
	"id" text NOT NULL PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"emailVerified" boolean NOT NULL DEFAULT false,
	"image" text,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
	"id" text NOT NULL PRIMARY KEY,
	"expiresAt" timestamptz NOT NULL,
	"token" text NOT NULL UNIQUE,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "activeOrganizationId" text
);

CREATE TABLE IF NOT EXISTS "account" (
	"id" text NOT NULL PRIMARY KEY,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamptz,
	"refreshTokenExpiresAt" timestamptz,
	"scope" text,
	"password" text,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "verification" (
	"id" text NOT NULL PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamptz NOT NULL,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "organization" (
	"id" text NOT NULL PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"metadata" text,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "member" (
	"id" text NOT NULL PRIMARY KEY,
	"userId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE,
	FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "invitation" (
	"id" text NOT NULL PRIMARY KEY,
	"email" text NOT NULL,
	"inviterId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"expiresAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP  + INTERVAL '7 days',
	FOREIGN KEY ("inviterId") REFERENCES "user" ("id") ON DELETE CASCADE,
	FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE
);




CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session" ("userId");
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account" ("userId");
CREATE INDEX IF NOT EXISTS idx_account_provider ON "account" ("providerId", "accountId");
CREATE INDEX IF NOT EXISTS idx_member_user_id ON "member" ("userId");
CREATE INDEX IF NOT EXISTS idx_member_organization_id ON "member" ("organizationId");
CREATE INDEX IF NOT EXISTS idx_invitation_organization_id ON "invitation" ("organizationId");

COMMIT;
