-- Verify secondMind:marketing_0003_canvas_lean_fields on pg

BEGIN;

SELECT problem, solution, key_metrics, unfair_advantage
FROM business_model_canvas
WHERE false;

ROLLBACK;
