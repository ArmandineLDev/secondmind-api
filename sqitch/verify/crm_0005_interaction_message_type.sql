-- Verify secondMind:crm_0005_interaction_message_type on pg

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'interaction_type_check'
      AND pg_get_constraintdef(oid) LIKE '%message%'
  ) THEN
    RAISE EXCEPTION 'interaction_type_check ne contient pas ''message''';
  END IF;
END $$;

ROLLBACK;
