-- Deploy secondMind:marketing_0003_canvas_lean_fields to pg
-- requires: marketing_0002_goal_canvas_editorial

BEGIN;

ALTER TABLE business_model_canvas
  ADD COLUMN problem          text,
  ADD COLUMN solution         text,
  ADD COLUMN key_metrics      text,
  ADD COLUMN unfair_advantage text;

COMMIT;
