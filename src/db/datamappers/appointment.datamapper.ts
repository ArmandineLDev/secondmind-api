import { db } from '@/lib/db'
import type { Appointment, AppointmentStatus, AppointmentTemplate, ScheduleOwner } from '@/features/schedule/schedule.types'
import type {
  AppointmentQuery,
  CreateAppointmentInput,
  CreateAppointmentTemplateInput,
  UpdateAppointmentInput,
  UpdateAppointmentTemplateInput,
} from '@/features/schedule/appointment.schema'

// ── Modèles de rendez-vous ────────────────────────────────────────────────────

export async function findAppointmentTemplates(owner: ScheduleOwner): Promise<AppointmentTemplate[]> {
  const result = await db.query<AppointmentTemplate>(
    `SELECT * FROM appointment_template WHERE organization_id = $1 AND user_id = $2 ORDER BY name`,
    [owner.organizationId, owner.userId]
  )
  return result.rows
}

export async function createAppointmentTemplate(
  owner: ScheduleOwner,
  input: CreateAppointmentTemplateInput
): Promise<AppointmentTemplate> {
  const result = await db.query<AppointmentTemplate>(
    `INSERT INTO appointment_template
       (organization_id, user_id, name, category, duration_minutes,
        travel_before_minutes, travel_before_label, buffer_minutes, travel_after_minutes, travel_after_label)
     VALUES ($1, $2, $3, COALESCE($4, 'perso')::schedule_category, $5, COALESCE($6, 0), $7, COALESCE($8, 0), COALESCE($9, 0), $10)
     RETURNING *`,
    [
      owner.organizationId, owner.userId, input.name, input.category ?? null, input.duration_minutes,
      input.travel_before_minutes ?? null, input.travel_before_label ?? null,
      input.buffer_minutes ?? null, input.travel_after_minutes ?? null, input.travel_after_label ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateAppointmentTemplate(
  id: string,
  owner: ScheduleOwner,
  input: UpdateAppointmentTemplateInput
): Promise<AppointmentTemplate | null> {
  const result = await db.query<AppointmentTemplate>(
    `UPDATE appointment_template
     SET name                  = COALESCE($4, name),
         category              = COALESCE($5::schedule_category, category),
         duration_minutes      = COALESCE($6, duration_minutes),
         travel_before_minutes = COALESCE($7, travel_before_minutes),
         buffer_minutes        = COALESCE($8, buffer_minutes),
         travel_after_minutes  = COALESCE($9, travel_after_minutes),
         travel_before_label   = CASE WHEN $10::boolean THEN $11 ELSE travel_before_label END,
         travel_after_label    = CASE WHEN $12::boolean THEN $13 ELSE travel_after_label  END
     WHERE id = $1 AND organization_id = $2 AND user_id = $3
     RETURNING *`,
    [
      id, owner.organizationId, owner.userId,
      input.name ?? null, input.category ?? null, input.duration_minutes ?? null,
      input.travel_before_minutes ?? null, input.buffer_minutes ?? null, input.travel_after_minutes ?? null,
      'travel_before_label' in input, input.travel_before_label ?? null,
      'travel_after_label'  in input, input.travel_after_label  ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteAppointmentTemplate(id: string, owner: ScheduleOwner): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM appointment_template WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function appointmentTemplateBelongsTo(id: string, owner: ScheduleOwner): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM appointment_template WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return (result.rowCount ?? 0) > 0
}

// ── Rendez-vous ───────────────────────────────────────────────────────────────

export async function findAppointments(owner: ScheduleOwner, query: AppointmentQuery): Promise<Appointment[]> {
  const result = await db.query<Appointment>(
    `SELECT * FROM appointment
     WHERE organization_id = $1 AND user_id = $2 AND date BETWEEN $3 AND $4
     ORDER BY date, start_time`,
    [owner.organizationId, owner.userId, query.from, query.to]
  )
  return result.rows
}

export async function findAppointmentById(id: string, owner: ScheduleOwner): Promise<Appointment | null> {
  const result = await db.query<Appointment>(
    `SELECT * FROM appointment WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return result.rows[0] ?? null
}

export async function createAppointment(owner: ScheduleOwner, input: CreateAppointmentInput): Promise<Appointment> {
  const result = await db.query<Appointment>(
    `INSERT INTO appointment
       (organization_id, user_id, template_id, title, date, start_time, category, duration_minutes,
        travel_before_minutes, travel_before_label, buffer_minutes, travel_after_minutes, travel_after_label,
        project_id, contact_id, count_travel_time, location, notes)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'perso')::schedule_category, $8,
             COALESCE($9, 0), $10, COALESCE($11, 0), COALESCE($12, 0), $13,
             $14, $15, COALESCE($16, false), $17, $18)
     RETURNING *`,
    [
      owner.organizationId, owner.userId, input.template_id ?? null, input.title, input.date, input.start_time,
      input.category ?? null, input.duration_minutes,
      input.travel_before_minutes ?? null, input.travel_before_label ?? null,
      input.buffer_minutes ?? null, input.travel_after_minutes ?? null, input.travel_after_label ?? null,
      input.project_id ?? null, input.contact_id ?? null, input.count_travel_time ?? null,
      input.location ?? null, input.notes ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateAppointment(
  id: string,
  owner: ScheduleOwner,
  input: UpdateAppointmentInput
): Promise<Appointment | null> {
  const nullable = ['travel_before_label', 'travel_after_label', 'project_id', 'contact_id', 'location', 'notes', 'template_id'] as const
  const result = await db.query<Appointment>(
    `UPDATE appointment
     SET title                 = COALESCE($4, title),
         date                  = COALESCE($5, date),
         start_time            = COALESCE($6, start_time),
         category              = COALESCE($7::schedule_category, category),
         duration_minutes      = COALESCE($8, duration_minutes),
         travel_before_minutes = COALESCE($9, travel_before_minutes),
         buffer_minutes        = COALESCE($10, buffer_minutes),
         travel_after_minutes  = COALESCE($11, travel_after_minutes),
         count_travel_time     = COALESCE($12, count_travel_time),
         travel_before_label   = CASE WHEN $13::boolean THEN $14 ELSE travel_before_label END,
         travel_after_label    = CASE WHEN $15::boolean THEN $16 ELSE travel_after_label  END,
         project_id            = CASE WHEN $17::boolean THEN $18 ELSE project_id          END,
         contact_id            = CASE WHEN $19::boolean THEN $20 ELSE contact_id          END,
         location              = CASE WHEN $21::boolean THEN $22 ELSE location            END,
         notes                 = CASE WHEN $23::boolean THEN $24 ELSE notes               END,
         template_id           = CASE WHEN $25::boolean THEN $26 ELSE template_id         END
     WHERE id = $1 AND organization_id = $2 AND user_id = $3
     RETURNING *`,
    [
      id, owner.organizationId, owner.userId,
      input.title ?? null, input.date ?? null, input.start_time ?? null, input.category ?? null,
      input.duration_minutes ?? null, input.travel_before_minutes ?? null, input.buffer_minutes ?? null,
      input.travel_after_minutes ?? null, input.count_travel_time ?? null,
      ...nullable.flatMap((key) => [key in input, input[key] ?? null]),
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteAppointment(id: string, owner: ScheduleOwner): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM appointment WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return (result.rowCount ?? 0) > 0
}

/**
 * Issue d'un rendez-vous et son temps passé, dans la même transaction. Seul un
 * rendez-vous « fait » relié à un projet compte : la sortie réelle si elle est
 * notée, sinon la durée estimée — la marge d'imprévu n'est jamais comptée
 * d'office, les trajets seulement si `count_travel_time`.
 */
export async function setAppointmentOutcome(
  appointment: Appointment,
  status: AppointmentStatus,
  actualEndTime: string | null
): Promise<Appointment> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query<Appointment>(
      `UPDATE appointment SET status = $2, actual_end_time = $3 WHERE id = $1 RETURNING *`,
      [appointment.id, status, actualEndTime]
    )
    const updated = result.rows[0]

    if (status === 'done' && updated.project_id) {
      await client.query(
        `INSERT INTO time_entry (organization_id, project_id, duration_minutes, date, description, appointment_id)
         SELECT a.organization_id, a.project_id,
                COALESCE(EXTRACT(EPOCH FROM (a.actual_end_time - a.start_time))::int / 60, a.duration_minutes)
                  + CASE WHEN a.count_travel_time THEN a.travel_before_minutes + a.travel_after_minutes ELSE 0 END,
                a.date, a.title, a.id
         FROM appointment a WHERE a.id = $1
         ON CONFLICT (appointment_id) DO UPDATE
         SET project_id       = EXCLUDED.project_id,
             duration_minutes = EXCLUDED.duration_minutes,
             date             = EXCLUDED.date,
             description      = EXCLUDED.description`,
        [updated.id]
      )
    } else {
      await client.query(`DELETE FROM time_entry WHERE appointment_id = $1`, [updated.id])
    }

    await client.query('COMMIT')
    return updated
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
