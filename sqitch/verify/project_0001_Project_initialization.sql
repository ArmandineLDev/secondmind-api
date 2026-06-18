-- Verify secondMind:project_0001_Project_initialization on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, name, description, status, is_archived, is_default, archived_at, created_at, updated_at
  FROM project WHERE false;

-- Enum project_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'project_status' AND typnamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'Type enum manquant : project_status';
  END IF;
END $$;

-- Fonction trigger set_updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    RAISE EXCEPTION 'Fonction manquante : set_updated_at()';
  END IF;
END $$;

-- Trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_project_updated_at'
  ) THEN
    RAISE EXCEPTION 'Trigger manquant : trg_project_updated_at';
  END IF;
END $$;

-- Index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_project_organization_id'
  ) THEN
    RAISE EXCEPTION 'Index manquant : idx_project_organization_id';
  END IF;
END $$;

-- Contrainte FK organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_organization_id_fkey'
      AND contype = 'f'
  ) THEN
    RAISE EXCEPTION 'Contrainte FK manquante : project_organization_id_fkey';
  END IF;
END $$;

ROLLBACK;
