-- Verify secondMind:schedule_0001_init on pg

BEGIN;

SELECT id, organization_id, user_id, weekday, start_time, end_time, label, category, project_id, period_rule
FROM schedule_template_block WHERE false;

SELECT id, organization_id, user_id, label, start_date, end_date FROM school_holiday_period WHERE false;

SELECT id, organization_id, user_id, week_start, review_went_well, review_blocked, review_notes, reviewed_at
FROM schedule_week WHERE false;

SELECT id, week_id, date, reason FROM schedule_day_off WHERE false;

SELECT id, week_id, template_block_id, date, start_time, end_time, label, category, project_id, status, actual_minutes
FROM schedule_block WHERE false;

SELECT id, name, travel_before_minutes, duration_minutes, buffer_minutes, travel_after_minutes
FROM appointment_template WHERE false;

SELECT id, template_id, title, date, start_time, project_id, contact_id, count_travel_time, status, actual_end_time
FROM appointment WHERE false;

SELECT schedule_block_id, appointment_id FROM time_entry WHERE false;

ROLLBACK;
