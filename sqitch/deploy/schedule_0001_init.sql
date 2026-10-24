-- Deploy secondMind:schedule_0001_init to pg
-- requires: project_0001_Project_initialization
-- requires: crm_0001_company_and_contact
-- requires: finance_0001_revenue_budget_expense_time

BEGIN;

-- Module « Ma semaine » (cf. functional-spec §3.11) : une semaine type, des
-- semaines réelles qui en sont des COPIES jamais réécrites, des rendez-vous
-- rattachés à une date, et un bilan qui alimente le temps passé.
--
-- Tout appartient à un utilisateur DANS un workspace (organization_id +
-- user_id) : deux associés d'une même structure ont chacun leur semaine.
--
-- Heures murales : `date` + `time`, jamais `timestamptz`. On planifie une heure
-- d'horloge locale ; le passage à l'heure d'été ne doit rien décaler.

CREATE TYPE schedule_category       AS ENUM ('pro', 'perso');
CREATE TYPE schedule_period_rule    AS ENUM ('always', 'school_days', 'school_holidays');
CREATE TYPE schedule_block_status   AS ENUM ('planned', 'done', 'partial', 'skipped');
CREATE TYPE schedule_day_off_reason AS ENUM ('public_holiday', 'personal');
CREATE TYPE appointment_status      AS ENUM ('planned', 'done', 'cancelled');

-- ── Semaine type ────────────────────────────────────────────────────────────
-- Pas de table « semaine type » : il n'en existe qu'une par utilisateur et par
-- workspace, ses créneaux suffisent à la décrire.
CREATE TABLE schedule_template_block (
  id              uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text                 NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  user_id         text                 NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  weekday         smallint             NOT NULL CHECK (weekday BETWEEN 1 AND 7), -- ISO : 1 = lundi
  start_time      time                 NOT NULL,
  end_time        time                 NOT NULL,
  label           varchar(255)         NOT NULL,
  category        schedule_category    NOT NULL DEFAULT 'pro',
  project_id      uuid                 REFERENCES project (id) ON DELETE SET NULL,
  period_rule     schedule_period_rule NOT NULL DEFAULT 'always',
  created_at      timestamptz          NOT NULL DEFAULT now(),
  updated_at      timestamptz          NOT NULL DEFAULT now(),
  -- Pas de créneau à cheval sur minuit, et un pas de 15 minutes : c'est la
  -- granularité de la grille, une autre valeur ne s'afficherait pas proprement.
  CONSTRAINT schedule_template_block_order CHECK (end_time > start_time),
  CONSTRAINT schedule_template_block_step CHECK (
    EXTRACT(MINUTE FROM start_time)::int % 15 = 0 AND EXTRACT(SECOND FROM start_time) = 0
    AND EXTRACT(MINUTE FROM end_time)::int % 15 = 0 AND EXTRACT(SECOND FROM end_time) = 0
  )
);

CREATE TRIGGER trg_schedule_template_block_updated_at
  BEFORE UPDATE ON schedule_template_block
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Périodes de vacances scolaires, saisies à la main dans les Réglages. Elles
-- décident, jour par jour, quels créneaux conditionnels s'appliquent.
CREATE TABLE school_holiday_period (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  user_id         text         NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  label           varchar(100) NOT NULL,
  start_date      date         NOT NULL,
  end_date        date         NOT NULL,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT school_holiday_period_order CHECK (end_date >= start_date)
);

-- ── Semaines réelles ────────────────────────────────────────────────────────
CREATE TABLE schedule_week (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  text        NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  user_id          text        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  week_start       date        NOT NULL CHECK (EXTRACT(ISODOW FROM week_start) = 1),
  review_went_well text,
  review_blocked   text,
  review_notes     text,
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  -- Une seule semaine par lundi : c'est aussi l'index de lecture du module.
  CONSTRAINT schedule_week_unique UNIQUE (organization_id, user_id, week_start)
);

CREATE TRIGGER trg_schedule_week_updated_at
  BEFORE UPDATE ON schedule_week
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Jours chômés. Un jour absent de la table est travaillé.
CREATE TABLE schedule_day_off (
  id      uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid                    NOT NULL REFERENCES schedule_week (id) ON DELETE CASCADE,
  date    date                    NOT NULL,
  reason  schedule_day_off_reason NOT NULL DEFAULT 'personal',
  CONSTRAINT schedule_day_off_unique UNIQUE (week_id, date)
);

-- Créneaux d'une semaine réelle. Le contenu est RECOPIÉ depuis la semaine type :
-- `template_block_id` ne sert qu'à savoir d'où vient le créneau (réappliquer le
-- modèle, chômer un jour). SET NULL : supprimer un créneau du modèle ne touche à
-- aucune semaine existante.
CREATE TABLE schedule_block (
  id                uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id           uuid                  NOT NULL REFERENCES schedule_week (id) ON DELETE CASCADE,
  template_block_id uuid                  REFERENCES schedule_template_block (id) ON DELETE SET NULL,
  date              date                  NOT NULL,
  start_time        time                  NOT NULL,
  end_time          time                  NOT NULL,
  label             varchar(255)          NOT NULL,
  category          schedule_category     NOT NULL DEFAULT 'pro',
  project_id        uuid                  REFERENCES project (id) ON DELETE SET NULL,
  status            schedule_block_status NOT NULL DEFAULT 'planned',
  actual_minutes    integer               CHECK (actual_minutes > 0),
  created_at        timestamptz           NOT NULL DEFAULT now(),
  updated_at        timestamptz           NOT NULL DEFAULT now(),
  CONSTRAINT schedule_block_order CHECK (end_time > start_time),
  CONSTRAINT schedule_block_step CHECK (
    EXTRACT(MINUTE FROM start_time)::int % 15 = 0 AND EXTRACT(SECOND FROM start_time) = 0
    AND EXTRACT(MINUTE FROM end_time)::int % 15 = 0 AND EXTRACT(SECOND FROM end_time) = 0
  ),
  -- « En partie » sans durée réelle ne dirait pas combien de temps a été passé.
  CONSTRAINT schedule_block_partial_needs_minutes CHECK (status <> 'partial' OR actual_minutes IS NOT NULL)
);

CREATE TRIGGER trg_schedule_block_updated_at
  BEFORE UPDATE ON schedule_block
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Rendez-vous ─────────────────────────────────────────────────────────────
-- Phases fixes : trajet aller, heure, durée estimée, marge d'imprévu, trajet
-- retour. Pas de 5 minutes : un rendez-vous à 14 h 10, ça existe.
CREATE TABLE appointment_template (
  id                    uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       text              NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  user_id               text              NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  name                  varchar(255)      NOT NULL,
  category              schedule_category NOT NULL DEFAULT 'perso',
  travel_before_minutes integer           NOT NULL DEFAULT 0 CHECK (travel_before_minutes >= 0 AND travel_before_minutes % 5 = 0),
  travel_before_label   varchar(100),
  duration_minutes      integer           NOT NULL CHECK (duration_minutes > 0 AND duration_minutes % 5 = 0),
  buffer_minutes        integer           NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0 AND buffer_minutes % 5 = 0),
  travel_after_minutes  integer           NOT NULL DEFAULT 0 CHECK (travel_after_minutes >= 0 AND travel_after_minutes % 5 = 0),
  travel_after_label    varchar(100),
  created_at            timestamptz       NOT NULL DEFAULT now(),
  updated_at            timestamptz       NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_appointment_template_updated_at
  BEFORE UPDATE ON appointment_template
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Un rendez-vous vit seul, rattaché à une DATE et non à une semaine : on le pose
-- dans six mois sans créer la semaine, et « réappliquer la semaine type » ne
-- peut pas l'effacer. Les valeurs du modèle sont copiées à la création.
CREATE TABLE appointment (
  id                    uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       text               NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  user_id               text               NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  template_id           uuid               REFERENCES appointment_template (id) ON DELETE SET NULL,
  title                 varchar(255)       NOT NULL,
  date                  date               NOT NULL,
  start_time            time               NOT NULL,
  category              schedule_category  NOT NULL DEFAULT 'perso',
  travel_before_minutes integer            NOT NULL DEFAULT 0 CHECK (travel_before_minutes >= 0 AND travel_before_minutes % 5 = 0),
  travel_before_label   varchar(100),
  duration_minutes      integer            NOT NULL CHECK (duration_minutes > 0 AND duration_minutes % 5 = 0),
  buffer_minutes        integer            NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0 AND buffer_minutes % 5 = 0),
  travel_after_minutes  integer            NOT NULL DEFAULT 0 CHECK (travel_after_minutes >= 0 AND travel_after_minutes % 5 = 0),
  travel_after_label    varchar(100),
  project_id            uuid               REFERENCES project (id) ON DELETE SET NULL,
  contact_id            uuid               REFERENCES contact (id) ON DELETE SET NULL,
  count_travel_time     boolean            NOT NULL DEFAULT false,
  location              varchar(255),
  notes                 text,
  status                appointment_status NOT NULL DEFAULT 'planned',
  actual_end_time       time,
  created_at            timestamptz        NOT NULL DEFAULT now(),
  updated_at            timestamptz        NOT NULL DEFAULT now(),
  CONSTRAINT appointment_step CHECK (
    EXTRACT(MINUTE FROM start_time)::int % 5 = 0 AND EXTRACT(SECOND FROM start_time) = 0
  ),
  CONSTRAINT appointment_actual_end_after_start CHECK (actual_end_time IS NULL OR actual_end_time > start_time)
);

CREATE TRIGGER trg_appointment_updated_at
  BEFORE UPDATE ON appointment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Temps passé ─────────────────────────────────────────────────────────────
-- Le bilan crée l'entrée de temps. UNIQUE : valider deux fois le même créneau
-- met à jour l'entrée existante au lieu d'en créer une seconde. SET NULL :
-- supprimer le créneau garde le temps déclaré.
ALTER TABLE time_entry
  ADD COLUMN schedule_block_id uuid UNIQUE REFERENCES schedule_block (id) ON DELETE SET NULL,
  ADD COLUMN appointment_id    uuid UNIQUE REFERENCES appointment (id) ON DELETE SET NULL,
  ADD CONSTRAINT time_entry_single_schedule_origin
    CHECK (schedule_block_id IS NULL OR appointment_id IS NULL);

CREATE INDEX idx_schedule_template_block_owner ON schedule_template_block (organization_id, user_id, weekday);
CREATE INDEX idx_school_holiday_period_owner   ON school_holiday_period (organization_id, user_id, start_date);
CREATE INDEX idx_schedule_block_week_id        ON schedule_block (week_id, date);
CREATE INDEX idx_appointment_owner_date        ON appointment (organization_id, user_id, date);
CREATE INDEX idx_appointment_template_owner    ON appointment_template (organization_id, user_id);

COMMIT;
