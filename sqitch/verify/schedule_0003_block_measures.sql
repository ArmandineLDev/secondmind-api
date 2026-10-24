-- Verify secondMind:schedule_0003_block_measures on pg

BEGIN;

SELECT measures FROM schedule_template_block WHERE false;
SELECT measures, measure_values, note FROM schedule_block WHERE false;
SELECT measures FROM schedule_template_expand('x', 'x', '2026-01-05', '2026-01-05');

ROLLBACK;
