-- Deploy secondMind:project_0004_company_id to pg
-- requires: project_0001_Project_initialization
-- requires: crm_0001_company_and_contact

BEGIN;

-- Entreprise cliente pour qui le projet est réalisé (optionnel : null = projet
-- perso/interne). Distinct de l'accès project_user (« pour qui » ≠ « qui peut se
-- connecter »). Permet d'agréger projets/tâches/documents sur la fiche entreprise.
ALTER TABLE project
  ADD COLUMN company_id uuid REFERENCES company (id) ON DELETE SET NULL;

CREATE INDEX idx_project_company_id ON project (company_id);

COMMIT;
