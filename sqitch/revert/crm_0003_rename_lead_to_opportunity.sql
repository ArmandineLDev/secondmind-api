-- Revert secondMind:crm_0003_rename_lead_to_opportunity from pg

BEGIN;

ALTER INDEX idx_interaction_opportunity_id RENAME TO idx_interaction_lead_id;
ALTER TABLE interaction RENAME CONSTRAINT interaction_opportunity_id_fkey TO interaction_lead_id_fkey;
ALTER TABLE interaction RENAME COLUMN opportunity_id TO lead_id;

ALTER TRIGGER trg_opportunity_updated_at ON opportunity RENAME TO trg_lead_updated_at;

ALTER INDEX idx_opportunity_stage RENAME TO idx_lead_stage;
ALTER INDEX idx_opportunity_organization_id RENAME TO idx_lead_organization_id;

ALTER TABLE opportunity RENAME CONSTRAINT opportunity_probability_check TO lead_probability_check;
ALTER TABLE opportunity RENAME CONSTRAINT opportunity_stage_check TO lead_stage_check;
ALTER TABLE opportunity RENAME CONSTRAINT opportunity_company_id_fkey TO lead_company_id_fkey;
ALTER TABLE opportunity RENAME CONSTRAINT opportunity_contact_id_fkey TO lead_contact_id_fkey;
ALTER TABLE opportunity RENAME CONSTRAINT opportunity_organization_id_fkey TO lead_organization_id_fkey;
ALTER TABLE opportunity RENAME CONSTRAINT opportunity_pkey TO lead_pkey;
ALTER TABLE opportunity RENAME TO lead;

COMMIT;
