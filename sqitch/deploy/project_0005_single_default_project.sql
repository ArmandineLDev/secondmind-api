-- Deploy secondMind:project_0005_single_default_project to pg

BEGIN;

-- Un seul projet par défaut par workspace.
--
-- `is_default` existait depuis project_0001 mais rien ne le garantissait : ni
-- contrainte, ni code. Aucun chemin applicatif ne posait `is_default = true`,
-- si bien que le projet par défaut d'un workspace devait être créé à la main en
-- SQL — et que les gardes « projet par défaut non archivable / non supprimable »
-- (project.datamapper) ne protégeaient rien pour un workspace nouvellement créé.
--
-- L'inscription crée désormais ce projet automatiquement. L'index partiel ci-dessous
-- interdit qu'un second apparaisse : c'est le filet en base, le controller reste le
-- filet applicatif.
CREATE UNIQUE INDEX IF NOT EXISTS project_one_default_per_organization
  ON project (organization_id)
  WHERE is_default;

COMMIT;
