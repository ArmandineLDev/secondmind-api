-- Deploy secondMind:crm_0004_contact_enrichment to pg
-- requires: crm_0003_rename_lead_to_opportunity

BEGIN;

-- Provenance et relance : d'où vient le contact, et quand le recontacter.
-- next_follow_up_at n'est PAS une tâche (le système d'Inbox n'est pas encore
-- codé) : c'est une alerte affichée sur la fiche contact / la liste CRM.
ALTER TABLE contact
  ADD COLUMN source_channel    varchar(20)
    CHECK (source_channel IN ('email', 'phone', 'social_media', 'referral', 'event', 'other')),
  ADD COLUMN source_detail     text,
  ADD COLUMN next_follow_up_at date,
  ADD COLUMN follow_up_note    text;

CREATE TABLE contact_social_link (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid        NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  platform   varchar(20) NOT NULL
    CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'telegram', 'whatsapp', 'other')),
  label      varchar(100),
  url        text        NOT NULL,
  position   smallint    NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_social_link_contact_id ON contact_social_link (contact_id);
CREATE INDEX idx_contact_next_follow_up_at ON contact (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

COMMIT;
