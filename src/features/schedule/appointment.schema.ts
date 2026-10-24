import { z } from 'zod'
import { toMinutes } from './schedule.schema'

const CATEGORY = ['pro', 'perso'] as const

// Pas de 5 minutes pour toutes les durées et l'heure d'un rendez-vous (CHECK en base).
const minutes  = z.number().int().min(0).max(24 * 60).multipleOf(5, 'Pas de 5 minutes')
const duration = z.number().int().min(5).max(24 * 60).multipleOf(5, 'Pas de 5 minutes')
const time5    = z.string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/, 'Heure au format HH:MM')
  .refine((t) => toMinutes(t) % 5 === 0, 'Pas de 5 minutes')

const phases = {
  travel_before_minutes: minutes.optional(),
  travel_before_label:   z.string().max(100).nullish(),
  buffer_minutes:        minutes.optional(),
  travel_after_minutes:  minutes.optional(),
  travel_after_label:    z.string().max(100).nullish(),
}

// ── Modèles ───────────────────────────────────────────────────────────────────
export const createAppointmentTemplateSchema = z.object({
  name:             z.string().min(1).max(255),
  category:         z.enum(CATEGORY).optional(),
  duration_minutes: duration,
  ...phases,
})

export const updateAppointmentTemplateSchema = z.object({
  name:             z.string().min(1).max(255).optional(),
  category:         z.enum(CATEGORY).optional(),
  duration_minutes: duration.optional(),
  ...phases,
})

// ── Rendez-vous ───────────────────────────────────────────────────────────────
// Le modèle pré-remplit le formulaire côté client : l'API reçoit des valeurs
// complètes et les copie. `template_id` ne garde que la trace de l'origine.
const appointmentFields = {
  template_id:       z.string().uuid().nullish(),
  category:          z.enum(CATEGORY).optional(),
  project_id:        z.string().uuid().nullish(),
  contact_id:        z.string().uuid().nullish(),
  count_travel_time: z.boolean().optional(),
  location:          z.string().max(255).nullish(),
  notes:             z.string().max(5000).nullish(),
  ...phases,
}

export const createAppointmentSchema = z.object({
  title:            z.string().min(1).max(255),
  date:             z.string().date(),
  start_time:       time5,
  duration_minutes: duration,
  ...appointmentFields,
})

export const updateAppointmentSchema = z.object({
  title:            z.string().min(1).max(255).optional(),
  date:             z.string().date().optional(),
  start_time:       time5.optional(),
  duration_minutes: duration.optional(),
  ...appointmentFields,
})

export const appointmentQuerySchema = z.object({
  from: z.string().date(),
  to:   z.string().date(),
}).refine((v) => v.to >= v.from, { message: 'Période invalide', path: ['to'] })

export const appointmentOutcomeSchema = z.object({
  status:          z.enum(['planned', 'done', 'cancelled']),
  actual_end_time: time5.nullish(),
})

export type CreateAppointmentTemplateInput = z.infer<typeof createAppointmentTemplateSchema>
export type UpdateAppointmentTemplateInput = z.infer<typeof updateAppointmentTemplateSchema>
export type CreateAppointmentInput         = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput         = z.infer<typeof updateAppointmentSchema>
export type AppointmentQuery               = z.infer<typeof appointmentQuerySchema>
export type AppointmentOutcomeInput        = z.infer<typeof appointmentOutcomeSchema>
