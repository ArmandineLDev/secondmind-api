-- Verify secondMind:crm_0004_contact_enrichment on pg

BEGIN;

SELECT source_channel, source_detail, next_follow_up_at, follow_up_note FROM contact WHERE FALSE;
SELECT id, contact_id, platform, label, url, position FROM contact_social_link WHERE FALSE;

ROLLBACK;
