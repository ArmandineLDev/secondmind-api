-- Deploy secondMind:crm_0006_opportunity_offer_link to pg
-- requires: crm_0003_rename_lead_to_opportunity
-- requires: marketing_0001_offer_and_persona

BEGIN;

-- Une opportunité peut partir d'une offre du catalogue, ou rester sur-mesure
-- (offer_id NULL = « offre personnalisée », titre et montant en libre).
-- ON DELETE SET NULL : retirer une offre du catalogue ne doit pas effacer
-- l'historique commercial qui en découle.
ALTER TABLE opportunity
  ADD COLUMN offer_id uuid REFERENCES offer (id) ON DELETE SET NULL;

CREATE INDEX idx_opportunity_offer_id ON opportunity (offer_id);

COMMIT;
