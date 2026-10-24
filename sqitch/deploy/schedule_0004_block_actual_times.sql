-- Deploy secondMind:schedule_0004_block_actual_times to pg
-- requires: schedule_0003_block_measures

BEGIN;

-- Heures réelles d'un créneau, notées au bilan (décidé le 2026-10-24) : « prévu
-- 9 h 30 – 10 h 15, fait 9 h 30 – 10 h 30 ». Le prévu reste intact — c'est lui
-- que le bilan compare — et la grille affiche le réel en surimpression : on voit
-- où la journée a glissé.
--
-- Les deux ou aucune : une heure de début seule ne dit rien de la durée.
-- `actual_minutes` reste la source du temps passé ; l'API la calcule à partir de
-- ces heures quand elles sont renseignées.
ALTER TABLE schedule_block
  ADD COLUMN actual_start time,
  ADD COLUMN actual_end   time,
  ADD CONSTRAINT schedule_block_actual_pair CHECK ((actual_start IS NULL) = (actual_end IS NULL)),
  ADD CONSTRAINT schedule_block_actual_order CHECK (actual_end IS NULL OR actual_end > actual_start);

COMMIT;
