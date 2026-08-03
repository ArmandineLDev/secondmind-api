-- Verify secondMind:marketing_0005_value_proposition_canvas on pg

BEGIN;

SELECT id, organization_id, offer_id, persona_id, name,
       customer_jobs, customer_pains, customer_gains,
       products_services, pain_relievers, gain_creators,
       created_at, updated_at
FROM value_proposition_canvas
WHERE false;

ROLLBACK;
