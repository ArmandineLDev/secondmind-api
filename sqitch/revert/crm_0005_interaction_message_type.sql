-- Revert secondMind:crm_0005_interaction_message_type from pg

BEGIN;

ALTER TABLE interaction DROP CONSTRAINT interaction_type_check;
ALTER TABLE interaction ADD CONSTRAINT interaction_type_check
  CHECK (type IN ('email', 'call', 'meeting', 'other'));

COMMIT;
