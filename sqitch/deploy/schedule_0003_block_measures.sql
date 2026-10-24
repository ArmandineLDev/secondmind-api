-- Deploy secondMind:schedule_0003_block_measures to pg
-- requires: schedule_0002_functions

BEGIN;

-- Mesures au bilan (décidé le 2026-10-24) : un créneau de la semaine type peut
-- porter des mesures facultatives — « Contacts » (nombre) sur « Prospection ».
-- Comme le reste du créneau, leur DÉFINITION est copiée dans la semaine réelle :
-- changer la semaine type ne réécrit pas les semaines passées.
--
-- `measures`       : [{ "label": "Contacts", "type": "number", "unit": null }, …]
-- `measure_values` : { "Contacts": 8 } — indexé par libellé, unique dans un créneau.
--   Le libellé (et non un id) permet de totaliser sur la semaine des créneaux
--   distincts qui mesurent la même chose (une « Prospection » par jour ouvré).
--
-- JSONB : la liste est définie par l'utilisateur, comme les colonnes de
-- Collections. La cohérence valeur ↔ définition est portée par l'API.
ALTER TABLE schedule_template_block
  ADD COLUMN measures jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(measures) = 'array');

ALTER TABLE schedule_block
  ADD COLUMN measures       jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(measures) = 'array'),
  ADD COLUMN measure_values jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(measure_values) = 'object'),
  -- Note libre de bilan (« ce qui a coincé sur ce créneau »).
  ADD COLUMN note           text;

-- Le dépliage renvoie désormais les mesures : la signature change, il faut
-- supprimer puis recréer (CREATE OR REPLACE refuse un nouveau type de retour).
DROP FUNCTION schedule_template_expand(text, text, date, date);

CREATE FUNCTION schedule_template_expand(p_org text, p_user text, p_from date, p_to date)
RETURNS TABLE (
  block_date        date,
  template_block_id uuid,
  start_time        time,
  end_time          time,
  label             varchar,
  category          schedule_category,
  project_id        uuid,
  measures          jsonb
)
LANGUAGE sql STABLE AS $$
  SELECT d::date, t.id, t.start_time, t.end_time, t.label, t.category, t.project_id, t.measures
  FROM generate_series(p_from, p_to, interval '1 day') AS d
  JOIN schedule_template_block t
    ON t.organization_id = p_org
   AND t.user_id = p_user
   AND t.weekday = EXTRACT(ISODOW FROM d)
  WHERE t.period_rule = 'always'
     -- school_holidays : le jour doit être en vacances ; school_days : il ne doit pas l'être.
     OR (t.period_rule = 'school_holidays') = EXISTS (
          SELECT 1 FROM school_holiday_period hp
          WHERE hp.organization_id = p_org
            AND hp.user_id = p_user
            AND d::date BETWEEN hp.start_date AND hp.end_date
        )
  ORDER BY d, t.start_time
$$;

CREATE OR REPLACE FUNCTION apply_schedule_template(p_week_id uuid, p_from date, p_to date)
RETURNS integer
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  inserted integer;
BEGIN
  INSERT INTO schedule_block (week_id, template_block_id, date, start_time, end_time, label, category, project_id, measures)
  SELECT w.id, e.template_block_id, e.block_date, e.start_time, e.end_time, e.label, e.category, e.project_id, e.measures
  FROM schedule_week w
  CROSS JOIN LATERAL schedule_template_expand(
    w.organization_id, w.user_id, GREATEST(p_from, w.week_start), LEAST(p_to, w.week_start + 6)
  ) e
  WHERE w.id = p_week_id
    AND NOT EXISTS (SELECT 1 FROM schedule_day_off o WHERE o.week_id = w.id AND o.date = e.block_date)
    AND NOT EXISTS (
      SELECT 1 FROM schedule_block b
      WHERE b.week_id = w.id AND b.template_block_id = e.template_block_id AND b.date = e.block_date
    );
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

COMMIT;
