-- Deploy secondMind:crm_0005_interaction_message_type to pg
-- requires: crm_0004_contact_enrichment

BEGIN;

-- Les échanges de prospection passent aussi par des messages sur les réseaux
-- sociaux (DM Instagram/LinkedIn, WhatsApp, Telegram) — distinct d'un email.
ALTER TABLE interaction DROP CONSTRAINT interaction_type_check;
ALTER TABLE interaction ADD CONSTRAINT interaction_type_check
  CHECK (type IN ('email', 'call', 'meeting', 'message', 'other'));

COMMIT;
