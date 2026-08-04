-- Verify secondMind:document_0002_client_nullable on pg

BEGIN;

-- La colonne doit être nullable...
SELECT 1/COUNT(*) FROM information_schema.columns
WHERE table_name = 'document' AND column_name = 'client_id' AND is_nullable = 'YES';

-- ...et la FK en SET NULL (confdeltype 'n').
SELECT 1/COUNT(*) FROM pg_constraint
WHERE conname = 'document_client_id_fkey' AND confdeltype = 'n';

ROLLBACK;
