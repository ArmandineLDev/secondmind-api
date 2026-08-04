-- Verify secondMind:stats_0006_offer_performance on pg

BEGIN;

SELECT organization_id, offer_id, offer_name, is_active,
       total_opportunities, won_opportunities, lost_opportunities,
       open_opportunities, conversion_rate, won_value, weighted_pipeline
FROM v_offer_performance
WHERE false;

ROLLBACK;
