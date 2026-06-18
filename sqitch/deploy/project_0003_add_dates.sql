-- Deploy secondMind:project_0003_add_dates to pg

BEGIN;

ALTER TABLE project
  ADD COLUMN start_date date,
  ADD COLUMN end_date   date;

ALTER TABLE project
  ADD CONSTRAINT chk_project_dates
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

COMMIT;
