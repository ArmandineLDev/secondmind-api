-- Verify secondMind:crm_0003_rename_lead_to_opportunity on pg

BEGIN;

SELECT id, organization_id, contact_id, company_id, title, value, stage, probability, notes, closed_at
  FROM opportunity WHERE FALSE;
SELECT opportunity_id FROM interaction WHERE FALSE;

ROLLBACK;
