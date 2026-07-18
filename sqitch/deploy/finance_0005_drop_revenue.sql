-- Deploy secondMind:finance_0005_drop_revenue to pg
-- requires: stats_0003_ca_from_invoices

BEGIN;

-- Le CA est désormais dérivé des factures émises payées (voir stats_0003).
-- La table revenue n'est plus référencée par aucune vue : on peut la supprimer.
-- (Les index idx_revenue_* tombent automatiquement avec la table.)
DROP TABLE IF EXISTS revenue;

COMMIT;
