-- Revert secondMind:document_0002_client_nullable from pg

BEGIN;

-- Un NULL ne peut pas être restauré en NOT NULL : les documents sans
-- destinataire sont rattachés à l'owner de leur organisation, comme le faisait
-- l'ancien comportement par défaut.
UPDATE document d
SET client_id = (
  SELECT m."userId" FROM "member" m
  WHERE m."organizationId" = d.organization_id AND m.role = 'owner'
  ORDER BY m."createdAt" ASC LIMIT 1
)
WHERE d.client_id IS NULL;

DELETE FROM document WHERE client_id IS NULL;

ALTER TABLE document DROP CONSTRAINT document_client_id_fkey;

ALTER TABLE document
  ADD CONSTRAINT document_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE document ALTER COLUMN client_id SET NOT NULL;

COMMIT;
