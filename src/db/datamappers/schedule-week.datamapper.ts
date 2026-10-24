import { db } from '@/lib/db'
import type {
  MeasureValues,
  ProjectedBlock,
  PublicHoliday,
  ScheduleBlock,
  ScheduleBlockStatus,
  ScheduleDayOff,
  ScheduleOwner,
  ScheduleWeek,
} from '@/features/schedule/schedule.types'
import type { CreateBlockInput, ReviewInput, UpdateBlockInput } from '@/features/schedule/schedule.schema'

// ── Semaines ──────────────────────────────────────────────────────────────────

export async function findWeekByStart(owner: ScheduleOwner, weekStart: string): Promise<ScheduleWeek | null> {
  const result = await db.query<ScheduleWeek>(
    `SELECT * FROM schedule_week WHERE organization_id = $1 AND user_id = $2 AND week_start = $3`,
    [owner.organizationId, owner.userId, weekStart]
  )
  return result.rows[0] ?? null
}

export async function findWeekById(id: string, owner: ScheduleOwner): Promise<ScheduleWeek | null> {
  const result = await db.query<ScheduleWeek>(
    `SELECT * FROM schedule_week WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return result.rows[0] ?? null
}

/**
 * Crée la semaine, ses fériés chômés et la copie du modèle — tout est dans la
 * fonction PostgreSQL, donc dans une seule transaction. Une semaine existante
 * lève l'erreur d'unicité 23505, à traduire en 409 par l'appelant.
 */
export async function generateWeek(owner: ScheduleOwner, weekStart: string): Promise<string> {
  const result = await db.query<{ id: string }>(
    `SELECT generate_schedule_week($1, $2, $3) AS id`,
    [owner.organizationId, owner.userId, weekStart]
  )
  return result.rows[0].id
}

export async function findDaysOff(weekId: string): Promise<ScheduleDayOff[]> {
  const result = await db.query<ScheduleDayOff>(
    `SELECT * FROM schedule_day_off WHERE week_id = $1 ORDER BY date`,
    [weekId]
  )
  return result.rows
}

export async function findBlocks(weekId: string): Promise<ScheduleBlock[]> {
  const result = await db.query<ScheduleBlock>(
    `SELECT * FROM schedule_block WHERE week_id = $1 ORDER BY date, start_time`,
    [weekId]
  )
  return result.rows
}

/** Ce que serait une semaine non créée : la semaine type dépliée, rien n'est écrit. */
export async function projectWeek(owner: ScheduleOwner, weekStart: string): Promise<ProjectedBlock[]> {
  const result = await db.query<ProjectedBlock>(
    `SELECT block_date AS date, template_block_id, start_time, end_time, label, category, project_id, measures
     FROM schedule_template_expand($1, $2, $3::date, $3::date + 6)`,
    [owner.organizationId, owner.userId, weekStart]
  )
  return result.rows
}

/** Fériés tombant dans la semaine (week-end compris, pour l'affichage). */
export async function findPublicHolidays(weekStart: string): Promise<PublicHoliday[]> {
  const result = await db.query<PublicHoliday>(
    `SELECT DISTINCT holiday::text AS date, label
     FROM (
       SELECT * FROM french_public_holidays(EXTRACT(YEAR FROM $1::date)::int)
       UNION ALL
       SELECT * FROM french_public_holidays(EXTRACT(YEAR FROM $1::date + 6)::int)
     ) ph
     WHERE holiday BETWEEN $1::date AND $1::date + 6
     ORDER BY date`,
    [weekStart]
  )
  return result.rows
}

/**
 * Réapplique la semaine type : retire les créneaux issus du modèle encore
 * « prévus », puis recopie le modèle. Les créneaux ajoutés à la main et ceux
 * déjà renseignés au bilan restent ; ces derniers bloquent leur recopie.
 */
export async function reapplyTemplate(weekId: string): Promise<void> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `DELETE FROM schedule_block
       WHERE week_id = $1 AND template_block_id IS NOT NULL AND status = 'planned'`,
      [weekId]
    )
    await client.query(
      `SELECT apply_schedule_template(w.id, w.week_start, w.week_start + 6) FROM schedule_week w WHERE w.id = $1`,
      [weekId]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Annule la préparation d'une semaine : elle redevient une projection du modèle.
 * Refusé (false) dès qu'un bilan existe — créneau renseigné, note, mesure, ou
 * bilan de la semaine : supprimer ferait perdre l'historique, et les entrées de
 * temps déjà créées resteraient orphelines (puis doublées au bilan suivant).
 * Une seule requête : la vérification et la suppression ne peuvent pas se croiser.
 * Les rendez-vous, rattachés à une date, ne sont pas concernés.
 */
export async function deleteWeekIfUntouched(weekId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM schedule_week w
     WHERE w.id = $1
       AND w.reviewed_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM schedule_block b
         WHERE b.week_id = w.id
           AND (b.status <> 'planned' OR b.note IS NOT NULL OR b.measure_values <> '{}'::jsonb)
       )`,
    [weekId]
  )
  return (result.rowCount ?? 0) > 0
}

/**
 * Chômer un jour retire ses créneaux issus du modèle encore prévus (les
 * créneaux ajoutés à la main restent) ; le rétablir recopie le modèle pour ce
 * seul jour.
 */
export async function setDayOff(weekId: string, date: string, off: boolean): Promise<void> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    if (off) {
      await client.query(
        `INSERT INTO schedule_day_off (week_id, date, reason) VALUES ($1, $2, 'personal')
         ON CONFLICT (week_id, date) DO NOTHING`,
        [weekId, date]
      )
      await client.query(
        `DELETE FROM schedule_block
         WHERE week_id = $1 AND date = $2 AND template_block_id IS NOT NULL AND status = 'planned'`,
        [weekId, date]
      )
    } else {
      await client.query(`DELETE FROM schedule_day_off WHERE week_id = $1 AND date = $2`, [weekId, date])
      await client.query(`SELECT apply_schedule_template($1, $2, $2)`, [weekId, date])
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateReview(weekId: string, input: ReviewInput): Promise<ScheduleWeek> {
  const result = await db.query<ScheduleWeek>(
    `UPDATE schedule_week
     SET review_went_well = CASE WHEN $2::boolean THEN $3 ELSE review_went_well END,
         review_blocked   = CASE WHEN $4::boolean THEN $5 ELSE review_blocked   END,
         review_notes     = CASE WHEN $6::boolean THEN $7 ELSE review_notes     END,
         reviewed_at      = now()
     WHERE id = $1
     RETURNING *`,
    [
      weekId,
      'review_went_well' in input, input.review_went_well ?? null,
      'review_blocked'   in input, input.review_blocked   ?? null,
      'review_notes'     in input, input.review_notes     ?? null,
    ]
  )
  return result.rows[0]
}

// ── Créneaux ──────────────────────────────────────────────────────────────────

/** Un créneau avec le lundi de sa semaine, filtré par propriétaire (via la semaine). */
export async function findBlockById(
  id: string,
  owner: ScheduleOwner
): Promise<(ScheduleBlock & { week_start: string }) | null> {
  const result = await db.query<ScheduleBlock & { week_start: string }>(
    `SELECT b.*, w.week_start
     FROM schedule_block b
     JOIN schedule_week w ON w.id = b.week_id
     WHERE b.id = $1 AND w.organization_id = $2 AND w.user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return result.rows[0] ?? null
}

export async function createBlock(weekId: string, input: CreateBlockInput): Promise<ScheduleBlock> {
  const result = await db.query<ScheduleBlock>(
    `INSERT INTO schedule_block (week_id, date, start_time, end_time, label, category, project_id, measures)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'pro')::schedule_category, $7, $8::jsonb)
     RETURNING *`,
    [weekId, input.date, input.start_time, input.end_time, input.label, input.category ?? null, input.project_id ?? null,
     JSON.stringify(input.measures ?? [])]
  )
  return result.rows[0]
}

export async function updateBlock(id: string, input: UpdateBlockInput): Promise<ScheduleBlock> {
  const result = await db.query<ScheduleBlock>(
    `UPDATE schedule_block
     SET date       = COALESCE($2, date),
         start_time = COALESCE($3, start_time),
         end_time   = COALESCE($4, end_time),
         label      = COALESCE($5, label),
         category   = COALESCE($6::schedule_category, category),
         project_id = CASE WHEN $7::boolean THEN $8 ELSE project_id END,
         measures   = COALESCE($9::jsonb, measures),
         -- Une mesure retirée emporte sa valeur : sinon elle resterait en base,
         -- invisible à l'écran mais comptée dans les totaux.
         measure_values = CASE WHEN $9::jsonb IS NULL THEN measure_values ELSE (
           SELECT COALESCE(jsonb_object_agg(v.key, v.value), '{}'::jsonb)
           FROM jsonb_each(measure_values) v
           WHERE EXISTS (SELECT 1 FROM jsonb_array_elements($9::jsonb) m WHERE m ->> 'label' = v.key)
         ) END
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.date ?? null, input.start_time ?? null, input.end_time ?? null, input.label ?? null,
      input.category ?? null,
      'project_id' in input, input.project_id ?? null,
      input.measures ? JSON.stringify(input.measures) : null,
    ]
  )
  return result.rows[0]
}

export async function deleteBlock(id: string): Promise<void> {
  await db.query(`DELETE FROM schedule_block WHERE id = $1`, [id])
}

/**
 * Statut de bilan d'un créneau, et l'entrée de temps qui va avec, dans la même
 * transaction. Prévu ≠ réalisé : seul « fait » ou « en partie » sur un créneau
 * pro relié à un projet produit du temps passé. L'unicité de
 * `time_entry.schedule_block_id` fait de l'écriture un upsert : valider deux
 * fois met à jour, ne double jamais.
 */
export async function setBlockStatus(
  id: string,
  organizationId: string,
  review: {
    status: ScheduleBlockStatus
    actualMinutes: number | null
    actualStart: string | null
    actualEnd: string | null
    note: string | null
    measureValues: MeasureValues
  }
): Promise<ScheduleBlock> {
  const { status, actualMinutes, actualStart, actualEnd, note, measureValues } = review
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query<ScheduleBlock>(
      `UPDATE schedule_block
       SET status = $2, actual_minutes = $3, note = $4, measure_values = $5::jsonb,
           actual_start = $6, actual_end = $7
       WHERE id = $1 RETURNING *`,
      [id, status, actualMinutes, note, JSON.stringify(measureValues), actualStart, actualEnd]
    )
    const block = result.rows[0]

    const counts = (status === 'done' || status === 'partial') && block.category === 'pro' && block.project_id
    if (counts) {
      await client.query(
        `INSERT INTO time_entry (organization_id, project_id, duration_minutes, date, description, schedule_block_id)
         VALUES ($1, $2,
                 COALESCE($3, EXTRACT(EPOCH FROM ($4::time - $5::time))::int / 60),
                 $6, $7, $8)
         ON CONFLICT (schedule_block_id) DO UPDATE
         SET project_id       = EXCLUDED.project_id,
             duration_minutes = EXCLUDED.duration_minutes,
             date             = EXCLUDED.date,
             description      = EXCLUDED.description`,
        [organizationId, block.project_id, actualMinutes, block.end_time, block.start_time, block.date, block.label, block.id]
      )
    } else {
      await client.query(`DELETE FROM time_entry WHERE schedule_block_id = $1`, [id])
    }

    await client.query('COMMIT')
    return block
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
