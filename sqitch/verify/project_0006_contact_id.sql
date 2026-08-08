-- Verify secondMind:project_0006_contact_id on pg

BEGIN;

SELECT contact_id FROM project WHERE false;

ROLLBACK;
