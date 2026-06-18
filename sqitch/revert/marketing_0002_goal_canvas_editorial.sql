-- Revert secondMind:marketing_0002_goal_canvas_editorial from pg

BEGIN;

DROP TABLE IF EXISTS editorial_post;
DROP TABLE IF EXISTS business_model_canvas;
DROP TABLE IF EXISTS goal;

COMMIT;
