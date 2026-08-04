-- Verify secondMind:crm_0006_opportunity_offer_link on pg

BEGIN;

SELECT offer_id FROM opportunity WHERE false;

ROLLBACK;
