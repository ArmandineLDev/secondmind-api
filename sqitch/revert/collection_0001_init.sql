-- Revert secondMind:collection_0001_init from pg

BEGIN;

-- L'ordre importe peu (les CASCADE feraient le travail), mais on reste explicite.
DROP TABLE collection_item;
DROP TABLE collection_field;
DROP TABLE collection;

COMMIT;
