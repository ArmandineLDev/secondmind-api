-- Revert secondMind:marketing_0003_canvas_lean_fields from pg

BEGIN;

ALTER TABLE business_model_canvas
  DROP COLUMN problem,
  DROP COLUMN solution,
  DROP COLUMN key_metrics,
  DROP COLUMN unfair_advantage;

COMMIT;
