-- Revert secondMind:marketing_0005_value_proposition_canvas from pg

BEGIN;

DROP TABLE value_proposition_canvas;

COMMIT;
