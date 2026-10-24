-- Verify secondMind:schedule_0004_block_actual_times on pg

BEGIN;

SELECT actual_start, actual_end FROM schedule_block WHERE false;

ROLLBACK;
