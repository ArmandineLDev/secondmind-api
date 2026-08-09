-- Deploy secondMind:auth_0003_last_organization to pg
-- requires: auth_0001_BetterAuth_Initialization

BEGIN;

-- Dernier workspace choisi par l'utilisateur.
--
-- `session.activeOrganizationId` ne vit que le temps d'une session : à la
-- reconnexion, le hook de création de session repartait sur l'organisation la
-- PLUS ANCIENNE (findFirstOrganizationIdForUser). Quelqu'un appartenant à deux
-- espaces atterrissait donc systématiquement dans le premier qu'il avait
-- rejoint — éventuellement celui d'un autre, où il n'est que client.
--
-- Cette colonne mémorise le choix au niveau du compte. Le hook la lit en
-- priorité, en vérifiant que l'adhésion existe toujours.
--
-- `ON DELETE SET NULL` : si le workspace disparaît, on retombe simplement sur
-- le plus ancien restant plutôt que de bloquer la connexion.
ALTER TABLE "user"
  ADD COLUMN "lastOrganizationId" text REFERENCES "organization" (id) ON DELETE SET NULL;

COMMIT;
