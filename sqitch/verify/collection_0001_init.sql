-- Verify secondMind:collection_0001_init on pg

BEGIN;

SELECT id, organization_id, project_id, name, icon FROM collection WHERE false;
SELECT id, collection_id, name, type, options, position FROM collection_field WHERE false;
SELECT id, collection_id, data FROM collection_item WHERE false;

ROLLBACK;
