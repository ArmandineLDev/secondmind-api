-- Revert secondMind:crm_0004_contact_enrichment from pg

BEGIN;

DROP INDEX IF EXISTS idx_contact_next_follow_up_at;
DROP TABLE IF EXISTS contact_social_link;

ALTER TABLE contact
  DROP COLUMN follow_up_note,
  DROP COLUMN next_follow_up_at,
  DROP COLUMN source_detail,
  DROP COLUMN source_channel;

COMMIT;
