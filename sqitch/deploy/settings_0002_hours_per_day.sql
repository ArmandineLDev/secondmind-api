-- Deploy secondMind:settings_0002_hours_per_day to pg
-- requires: settings_0001_org_settings

BEGIN;

-- Nombre d'heures facturables par jour, pour convertir le TJM (default_daily_rate)
-- en taux horaire : taux_horaire = default_daily_rate / hours_per_day.
-- Défaut 7 (semaine légale française 35 h / 5 jours).
ALTER TABLE organization_settings
  ADD COLUMN hours_per_day numeric(4,2) NOT NULL DEFAULT 7
    CHECK (hours_per_day > 0);

COMMIT;
