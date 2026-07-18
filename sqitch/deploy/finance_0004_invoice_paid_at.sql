-- Deploy secondMind:finance_0004_invoice_paid_at to pg
-- requires: finance_0002_invoice

BEGIN;

-- Date d'encaissement d'une facture émise (ou de règlement d'une facture reçue).
-- En compta de trésorerie, c'est la date à laquelle le montant compte : le CA est
-- rattaché à paid_at (à défaut, issue_date). Renseignée quand status = 'paid'.
ALTER TABLE invoice
  ADD COLUMN paid_at date;

-- Cohérence des données existantes : toute facture déjà 'paid' reçoit une date de
-- paiement (on retombe sur sa date d'émission, meilleure approximation disponible).
UPDATE invoice
   SET paid_at = issue_date
 WHERE status = 'paid' AND paid_at IS NULL;

CREATE INDEX idx_invoice_paid_at ON invoice (paid_at);

COMMIT;
