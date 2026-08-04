-- Deploy secondMind:document_0002_client_nullable to pg
-- requires: document_0001_document

BEGIN;

-- `document.client_id` était NOT NULL ... ON DELETE CASCADE. Deux conséquences
-- fâcheuses :
--
--   1. RGPD vs conservation : honorer une demande d'effacement d'un compte
--      client aurait supprimé TOUS les documents qui lui étaient adressés —
--      devis, contrats, livrables. Ces fichiers appartiennent à l'activité de
--      l'owner ; le client n'en est que le destinataire.
--   2. Un document interne (sans destinataire) n'était pas représentable : le
--      service le rattachait par défaut à l'uploader lui-même
--      (`meta.client_id ?? currentUserId`), ce qui brouillait le sens de la colonne.
--
-- Désormais : NULL = document non adressé à un client (interne), et la
-- suppression d'un compte client détache ses documents sans les détruire.
ALTER TABLE document
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE document
  DROP CONSTRAINT document_client_id_fkey;

ALTER TABLE document
  ADD CONSTRAINT document_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES "user" (id) ON DELETE SET NULL;

COMMIT;
