-- Verify secondMind:schedule_0002_functions on pg

BEGIN;

-- Pâques 2026 = 5 avril → lundi de Pâques le 6, Ascension le 14 mai, Pentecôte le 25 mai.
SELECT 1 / (COUNT(*) = 3)::int FROM french_public_holidays(2026)
WHERE holiday IN ('2026-04-06', '2026-05-14', '2026-05-25');

SELECT has_function_privilege('schedule_template_expand(text, text, date, date)', 'execute');
SELECT has_function_privilege('apply_schedule_template(uuid, date, date)', 'execute');
SELECT has_function_privilege('generate_schedule_week(text, text, date)', 'execute');

ROLLBACK;
