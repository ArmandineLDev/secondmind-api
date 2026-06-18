-- Verify secondMind:document_0001_document on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, client_id, project_id, name, type, file_key, file_size, mime_type, uploaded_at
  FROM document WHERE false;

-- Contrainte UNIQUE file_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'document'::regclass AND contype = 'u'
  ) THEN
    RAISE EXCEPTION 'Contrainte UNIQUE manquante sur document.file_key';
  END IF;
END $$;

-- Contrainte CHECK type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'document'::regclass AND contype = 'c' AND conname LIKE '%type%'
  ) THEN
    RAISE EXCEPTION 'Contrainte CHECK manquante sur document.type';
  END IF;
END $$;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_document_organization_id',
    'idx_document_client_id'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
