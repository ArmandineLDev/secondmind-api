-- Revert secondMind:schedule_0004_block_actual_times from pg

BEGIN;

ALTER TABLE schedule_block
  DROP CONSTRAINT IF EXISTS schedule_block_actual_order,
  DROP CONSTRAINT IF EXISTS schedule_block_actual_pair,
  DROP COLUMN IF EXISTS actual_end,
  DROP COLUMN IF EXISTS actual_start;

COMMIT;
