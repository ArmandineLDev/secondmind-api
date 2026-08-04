-- Deploy secondMind:auth_0002_member_unique to pg
-- requires: auth_0001_BetterAuth_Initialization

BEGIN;

-- Un utilisateur ne peut avoir qu'UN rôle dans une organisation donnée.
--
-- Deux raisons :
--   1. `addClientMember` (settings.datamapper) fait un
--      `ON CONFLICT ("userId","organizationId")` qui échouait à l'exécution,
--      faute de contrainte correspondante — réinviter un client existant plantait ;
--   2. le cloisonnement lit le rôle du membre à chaque requête authentifiée :
--      deux lignes pour un même couple rendraient ce rôle ambigu.

-- Déduplication préalable, au cas où des doublons existeraient déjà.
-- Règle : on conserve la ligne au rôle le PLUS privilégié (owner avant tout
-- autre), puis la plus ancienne. Conserver arbitrairement la plus ancienne
-- pourrait dégrader un owner en client et le verrouiller hors de son propre
-- workspace.
DELETE FROM "member" m
WHERE EXISTS (
  SELECT 1 FROM "member" keep
  WHERE keep."userId"         = m."userId"
    AND keep."organizationId" = m."organizationId"
    AND keep.id <> m.id
    AND (
      (keep.role = 'owner' AND m.role <> 'owner')
      OR (
        (keep.role = 'owner') = (m.role = 'owner')
        AND (keep."createdAt", keep.id) < (m."createdAt", m.id)
      )
    )
);

ALTER TABLE "member"
  ADD CONSTRAINT member_user_organization_unique UNIQUE ("userId", "organizationId");

COMMIT;
