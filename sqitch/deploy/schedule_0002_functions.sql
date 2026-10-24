-- Deploy secondMind:schedule_0002_functions to pg
-- requires: schedule_0001_init

BEGIN;

-- Jours fériés nationaux d'une année. Pâques par l'algorithme de
-- Meeus/Jones/Butcher (calendrier grégorien) : lundi de Pâques, Ascension et
-- lundi de Pentecôte en découlent. Aucun service externe, aucune table.
-- Les deux fériés propres à l'Alsace-Moselle ne sont pas couverts.
CREATE FUNCTION french_public_holidays(p_year int)
RETURNS TABLE (holiday date, label text)
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  a int := p_year % 19;
  b int := p_year / 100;
  c int := p_year % 100;
  d int := b / 4;
  e int := b % 4;
  f int := (b + 8) / 25;
  g int := (b - f + 1) / 3;
  h int := (19 * a + b - d - g + 15) % 30;
  i int := c / 4;
  k int := c % 4;
  l int := (32 + 2 * e + 2 * i - h - k) % 7;
  m int := (a + 11 * h + 22 * l) / 451;
  easter date := make_date(p_year, (h + l - 7 * m + 114) / 31, ((h + l - 7 * m + 114) % 31) + 1);
BEGIN
  RETURN QUERY VALUES
    (make_date(p_year, 1, 1),   'Jour de l''an'),
    (easter + 1,                'Lundi de Pâques'),
    (make_date(p_year, 5, 1),   'Fête du Travail'),
    (make_date(p_year, 5, 8),   'Victoire 1945'),
    (easter + 39,               'Ascension'),
    (easter + 50,               'Lundi de Pentecôte'),
    (make_date(p_year, 7, 14),  'Fête nationale'),
    (make_date(p_year, 8, 15),  'Assomption'),
    (make_date(p_year, 11, 1),  'Toussaint'),
    (make_date(p_year, 11, 11), 'Armistice'),
    (make_date(p_year, 12, 25), 'Noël');
END;
$$;

-- Dépliage de la semaine type sur une plage de dates : un créneau du modèle par
-- jour où il s'applique. La condition de période s'évalue DATE PAR DATE, si bien
-- qu'une semaine à cheval sur la rentrée est juste des deux côtés.
-- Seule source de vérité pour la création d'une semaine ET pour sa projection
-- (semaine future consultée sans être créée).
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

-- Copie dans une semaine réelle les créneaux du modèle qui lui manquent, sur une
-- plage de ses jours. Saute les jours chômés, et tout créneau déjà présent pour
-- ce couple (modèle, date) — quel que soit son statut : un créneau renseigné au
-- bilan n'est jamais doublé ni écrasé.
CREATE FUNCTION apply_schedule_template(p_week_id uuid, p_from date, p_to date)
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

-- Crée une semaine réelle : la semaine, les fériés des jours ouvrés proposés
-- chômés, puis la copie du modèle. Un seul appel, donc une seule transaction.
-- Une semaine déjà existante lève l'erreur d'unicité (23505), que l'API traduit
-- en 409.
CREATE FUNCTION generate_schedule_week(p_org text, p_user text, p_week_start date)
RETURNS uuid
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  week_id uuid;
BEGIN
  INSERT INTO schedule_week (organization_id, user_id, week_start)
  VALUES (p_org, p_user, p_week_start)
  RETURNING id INTO week_id;

  INSERT INTO schedule_day_off (week_id, date, reason)
  SELECT DISTINCT week_id, ph.holiday, 'public_holiday'::schedule_day_off_reason
  FROM (
    SELECT * FROM french_public_holidays(EXTRACT(YEAR FROM p_week_start)::int)
    UNION ALL
    SELECT * FROM french_public_holidays(EXTRACT(YEAR FROM p_week_start + 6)::int)
  ) ph
  WHERE ph.holiday BETWEEN p_week_start AND p_week_start + 6
    AND EXTRACT(ISODOW FROM ph.holiday) <= 5;

  PERFORM apply_schedule_template(week_id, p_week_start, p_week_start + 6);
  RETURN week_id;
END;
$$;

COMMIT;
