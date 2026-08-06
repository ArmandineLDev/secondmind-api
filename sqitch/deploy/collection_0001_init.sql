-- Deploy secondMind:collection_0001_init to pg
-- requires: project_0001_Project_initialization

BEGIN;

-- Module « soupape » (cf. functional-spec §3.7) : mini bases de données créées
-- par l'owner pour ce qui n'a pas de module dédié. Premier cas d'usage : le
-- suivi des domaines et sous-domaines.
CREATE TABLE collection (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  -- null = collection globale au workspace. SET NULL et non CASCADE : supprimer
  -- un projet ne doit pas emporter une collection qu'on y avait simplement rangée.
  project_id      uuid         REFERENCES project (id) ON DELETE SET NULL,
  name            varchar(255) NOT NULL,
  icon            varchar(50),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_collection_updated_at
  BEFORE UPDATE ON collection
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Définition des colonnes. Le type est contraint côté base : c'est lui qui
-- gouverne le rendu de la cellule et la validation de la saisie.
CREATE TABLE collection_field (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid         NOT NULL REFERENCES collection (id) ON DELETE CASCADE,
  name          varchar(255) NOT NULL,
  type          varchar(20)  NOT NULL
                             CHECK (type IN ('text', 'number', 'select', 'date', 'checkbox', 'url')),
  -- Liste des choix d'un champ `select`, sous forme de tableau JSON.
  -- Le CHECK garantit la cohérence : des options sur un champ qui n'est pas un
  -- select n'auraient aucun sens, et un select sans options serait inutilisable.
  options       jsonb,
  position      integer      NOT NULL DEFAULT 0,
  CONSTRAINT collection_field_options_only_for_select CHECK (
    (type = 'select' AND options IS NOT NULL AND jsonb_typeof(options) = 'array')
    OR (type <> 'select' AND options IS NULL)
  )
);

-- Entrées (lignes). Les valeurs sont en JSONB, indexées par l'id du champ :
-- c'est la dérogation assumée au « tout typé », justifiée par le fait que les
-- colonnes sont définies par l'utilisateur et non par le schéma.
CREATE TABLE collection_item (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid        NOT NULL REFERENCES collection (id) ON DELETE CASCADE,
  data          jsonb       NOT NULL DEFAULT '{}'::jsonb
                            CHECK (jsonb_typeof(data) = 'object'),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_collection_item_updated_at
  BEFORE UPDATE ON collection_item
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_collection_organization_id ON collection (organization_id);
CREATE INDEX idx_collection_project_id ON collection (project_id);
CREATE INDEX idx_collection_field_collection_id ON collection_field (collection_id);
CREATE INDEX idx_collection_item_collection_id ON collection_item (collection_id);

COMMIT;
