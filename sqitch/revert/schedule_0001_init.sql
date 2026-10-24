-- Revert secondMind:schedule_0001_init from pg

BEGIN;

ALTER TABLE time_entry
  DROP CONSTRAINT IF EXISTS time_entry_single_schedule_origin,
  DROP COLUMN IF EXISTS appointment_id,
  DROP COLUMN IF EXISTS schedule_block_id;

DROP TABLE IF EXISTS appointment;
DROP TABLE IF EXISTS appointment_template;
DROP TABLE IF EXISTS schedule_block;
DROP TABLE IF EXISTS schedule_day_off;
DROP TABLE IF EXISTS schedule_week;
DROP TABLE IF EXISTS school_holiday_period;
DROP TABLE IF EXISTS schedule_template_block;

DROP TYPE IF EXISTS appointment_status;
DROP TYPE IF EXISTS schedule_day_off_reason;
DROP TYPE IF EXISTS schedule_block_status;
DROP TYPE IF EXISTS schedule_period_rule;
DROP TYPE IF EXISTS schedule_category;

COMMIT;
