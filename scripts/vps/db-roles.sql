-- Rôles PostgreSQL à moindre privilège pour le VPS.
-- À exécuter UNE FOIS sur le PostgreSQL Coolify, connecté en superuser (postgres),
-- APRÈS avoir remplacé les deux mots de passe (openssl rand -hex 24 —
-- hex uniquement : pas de / ni + qui casseraient les URLs de connexion).
--
--   psql "$ADMIN_DATABASE_URL" -f scripts/vps/db-roles.sql
--
-- secondmind_migrator : propriétaire du schéma, utilisé uniquement par Sqitch (DDL)
-- secondmind_app      : compte runtime de l'app, données uniquement (DML)

\set ON_ERROR_STOP on

CREATE ROLE secondmind_migrator LOGIN PASSWORD 'CHANGE_ME_MIGRATOR';
CREATE ROLE secondmind_app LOGIN PASSWORD 'CHANGE_ME_APP';

CREATE DATABASE secondmind OWNER secondmind_migrator;

\connect secondmind

-- Le schéma public appartient au migrator ; personne d'autre n'y crée d'objets
ALTER SCHEMA public OWNER TO secondmind_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT CONNECT ON DATABASE secondmind TO secondmind_app;
GRANT USAGE ON SCHEMA public TO secondmind_app;

-- Droits sur les objets existants (après restauration/migrations initiales)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO secondmind_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO secondmind_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO secondmind_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO secondmind_app; -- vues incluses

-- Droits automatiques sur les objets créés par les FUTURES migrations Sqitch :
-- sans ça, chaque nouvelle table exigerait un GRANT manuel
ALTER DEFAULT PRIVILEGES FOR ROLE secondmind_migrator IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO secondmind_app;
ALTER DEFAULT PRIVILEGES FOR ROLE secondmind_migrator IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO secondmind_app;
ALTER DEFAULT PRIVILEGES FOR ROLE secondmind_migrator IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO secondmind_app;
