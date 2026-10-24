-- Revert secondMind:schedule_0002_functions from pg

BEGIN;

DROP FUNCTION IF EXISTS generate_schedule_week(text, text, date);
DROP FUNCTION IF EXISTS apply_schedule_template(uuid, date, date);
DROP FUNCTION IF EXISTS schedule_template_expand(text, text, date, date);
DROP FUNCTION IF EXISTS french_public_holidays(int);

COMMIT;
