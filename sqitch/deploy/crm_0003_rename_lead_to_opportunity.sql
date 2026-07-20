-- Deploy secondMind:crm_0003_rename_lead_to_opportunity to pg
-- requires: crm_0002_lead_and_interaction

BEGIN;

-- Renommage de l'entité "lead" en "opportunity" : le terme "lead" désignait à
-- la fois une opportunité chiffrée (titre, valeur, stade de négo) et le statut
-- d'un contact pas encore qualifié (contact.status = 'lead', inchangé). Pour
-- lever l'ambiguïté, seule l'opportunité commerciale est renommée ici.

ALTER TABLE lead RENAME TO opportunity;
ALTER TABLE opportunity RENAME CONSTRAINT lead_pkey TO opportunity_pkey;
ALTER TABLE opportunity RENAME CONSTRAINT lead_organization_id_fkey TO opportunity_organization_id_fkey;
ALTER TABLE opportunity RENAME CONSTRAINT lead_contact_id_fkey TO opportunity_contact_id_fkey;
ALTER TABLE opportunity RENAME CONSTRAINT lead_company_id_fkey TO opportunity_company_id_fkey;
ALTER TABLE opportunity RENAME CONSTRAINT lead_stage_check TO opportunity_stage_check;
ALTER TABLE opportunity RENAME CONSTRAINT lead_probability_check TO opportunity_probability_check;

ALTER INDEX idx_lead_organization_id RENAME TO idx_opportunity_organization_id;
ALTER INDEX idx_lead_stage RENAME TO idx_opportunity_stage;

ALTER TRIGGER trg_lead_updated_at ON opportunity RENAME TO trg_opportunity_updated_at;

ALTER TABLE interaction RENAME COLUMN lead_id TO opportunity_id;
ALTER TABLE interaction RENAME CONSTRAINT interaction_lead_id_fkey TO interaction_opportunity_id_fkey;
ALTER INDEX idx_interaction_lead_id RENAME TO idx_interaction_opportunity_id;

COMMIT;
