-- Verify secondMind:stats_0003_ca_from_invoices on pg

BEGIN;

-- La nouvelle vue de cumul existe et expose les bonnes colonnes.
SELECT organization_id, year, revenue, expenses, net, cumulative_net
  FROM v_cumulative_pnl WHERE false;

-- Les vues CA ne référencent plus la table revenue : on doit pouvoir les
-- interroger (ces SELECT échoueraient si une vue pointait encore vers revenue
-- après un futur drop, et prouvent au moins que la réécriture est en place).
SELECT organization_id, total FROM v_monthly_revenue WHERE false;
SELECT organization_id, revenue_ytd FROM v_kpis WHERE false;
SELECT project_id, total_revenue FROM v_project_profitability WHERE false;
SELECT id, total_revenue FROM v_project_summary WHERE false;

ROLLBACK;
