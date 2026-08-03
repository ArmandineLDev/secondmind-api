-- Verify secondMind:marketing_0004_swot_analysis on pg

BEGIN;

SELECT id, organization_id, name, strengths, weaknesses, opportunities, threats, created_at, updated_at
FROM swot_analysis
WHERE false;

ROLLBACK;
