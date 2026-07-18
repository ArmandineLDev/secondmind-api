-- Deploy secondMind:finance_0003_invoice_company to pg
-- requires: finance_0002_invoice
-- requires: crm_0001_company_and_contact

BEGIN;

-- Une facture cible désormais une entreprise (client B2B par défaut) ET/OU un
-- contact (personne physique, cas B2C). Les deux sont facultatifs et
-- indépendants : company_id vient en complément de contact_id, sans le remplacer.
ALTER TABLE invoice
  ADD COLUMN company_id uuid REFERENCES company (id) ON DELETE SET NULL;

CREATE INDEX idx_invoice_company_id ON invoice (company_id);

COMMIT;
