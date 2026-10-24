-- Revert secondMind:schedule_0003_block_measures from pg

BEGIN;

-- Fonctions d'abord : la version d'origine de apply_schedule_template ne copie
-- plus `measures`, et la colonne doit disparaître ensuite.
DROP FUNCTION schedule_template_expand(text, text, date, date);

CREATE FUNCTION schedule_template_expand(p_org text, p_user text, p_from date, p_to date)
RETURNS TABLE (
  block_date        date,
  template_block_id uuid,
  start_time        time,
  end_time          time,
  label             varchar,
  category          schedule_category,
  project_id        uuid
)
LANGUAGE sql STABLE AS $$
  SELECT d::date, t.id, t.start_time, t.end_time, t.label, t.category, t.project_id
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
  INSERT INTO schedule_block (week_id, template_block_id, date, start_time, end_time, label, category, project_id)
  SELECT w.id, e.template_block_id, e.block_date, e.start_time, e.end_time, e.label, e.category, e.project_id
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

ALTER TABLE schedule_block
  DROP COLUMN IF EXISTS note,
  DROP COLUMN IF EXISTS measure_values,
  DROP COLUMN IF EXISTS measures;

ALTER TABLE schedule_template_block DROP COLUMN IF EXISTS measures;

COMMIT;
