-- Deploy secondMind:project_0006_contact_id to pg
-- requires: project_0004_company_id
-- requires: crm_0001_company_and_contact

BEGIN;

-- Client personne physique, pour qui le projet est réalisé.
--
-- `company_id` seul supposait que tout client soit une entreprise. C'est faux :
-- un client peut être un particulier, ou une entreprise dont on n'a pas encore
-- les informations au moment de créer le projet. Le projet restait alors
-- rattaché à personne, et n'apparaissait sur aucune fiche.
--
-- Même paire que sur `invoice` (crm/finance), et pour la même raison — les deux
-- colonnes sont **indépendantes** : `company_id` seul (B2B, le cas courant),
-- `contact_id` seul (particulier), ou les deux (interlocuteur identifié au sein
-- de l'entreprise cliente). Aucune contrainte ne force l'un ou l'autre : un
-- projet sans client est un projet perso ou interne.
ALTER TABLE project
  ADD COLUMN contact_id uuid REFERENCES contact (id) ON DELETE SET NULL;

CREATE INDEX idx_project_contact_id ON project (contact_id);

COMMIT;
