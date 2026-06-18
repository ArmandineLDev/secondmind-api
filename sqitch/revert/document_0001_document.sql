-- Revert secondMind:document_0001_document from pg

BEGIN;

DROP TABLE IF EXISTS document;

COMMIT;
