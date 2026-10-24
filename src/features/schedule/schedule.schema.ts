import { z } from 'zod'

const CATEGORY    = ['pro', 'perso'] as const
const PERIOD_RULE = ['always', 'school_days', 'school_holidays'] as const
const STATUS      = ['planned', 'done', 'partial', 'skipped'] as const

/** Minutes depuis minuit d'une heure 'HH:MM' ou 'HH:MM:SS' (format renvoyé par pg). */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Les CHECK en base portent les mêmes règles : Zod les rend lisibles (400 avec
// le nom du champ) au lieu d'un 500 sur violation de contrainte.
const time = (step: number) =>
  z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/, 'Heure au format HH:MM')
    .refine((t) => toMinutes(t) % step === 0, `Pas de ${step} minutes`)

const blockTime = time(15)

const isMonday = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay() === 1

const endAfterStart = <T extends { start_time?: string; end_time?: string }>(v: T) =>
  !v.start_time || !v.end_time || toMinutes(v.end_time) > toMinutes(v.start_time)
const endAfterStartError = { message: 'La fin doit suivre le début', path: ['end_time'] }

// Mesures au bilan : quelques-unes par créneau, libellés uniques (ils servent de
// clé aux valeurs et de regroupement pour les totaux de la semaine).
const measureSchema = z.object({
  label: z.string().trim().min(1).max(50),
  type:  z.enum(['number', 'text']),
  unit:  z.string().trim().max(20).nullish().transform((u) => u || null),
})
const measuresSchema = z.array(measureSchema).max(6)
  .refine((list) => new Set(list.map((m) => m.label.toLowerCase())).size === list.length,
    'Deux mesures portent le même libellé')

// ── Semaine type ──────────────────────────────────────────────────────────────
export const createTemplateBlockSchema = z.object({
  weekday:     z.number().int().min(1).max(7),
  start_time:  blockTime,
  end_time:    blockTime,
  label:       z.string().min(1).max(255),
  category:    z.enum(CATEGORY).optional(),
  project_id:  z.string().uuid().nullish(),
  period_rule: z.enum(PERIOD_RULE).optional(),
  measures:    measuresSchema.optional(),
}).refine(endAfterStart, endAfterStartError)

export const updateTemplateBlockSchema = z.object({
  weekday:     z.number().int().min(1).max(7).optional(),
  start_time:  blockTime.optional(),
  end_time:    blockTime.optional(),
  label:       z.string().min(1).max(255).optional(),
  category:    z.enum(CATEGORY).optional(),
  project_id:  z.string().uuid().nullish(),
  period_rule: z.enum(PERIOD_RULE).optional(),
  measures:    measuresSchema.optional(),
}).refine(endAfterStart, endAfterStartError)

// ── Vacances scolaires ────────────────────────────────────────────────────────
export const createHolidaySchema = z.object({
  label:      z.string().min(1).max(100),
  start_date: z.string().date(),
  end_date:   z.string().date(),
}).refine((v) => v.end_date >= v.start_date, { message: 'La fin doit suivre le début', path: ['end_date'] })

export const updateHolidaySchema = z.object({
  label:      z.string().min(1).max(100).optional(),
  start_date: z.string().date().optional(),
  end_date:   z.string().date().optional(),
}).refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date,
  { message: 'La fin doit suivre le début', path: ['end_date'] })

// ── Semaines réelles ──────────────────────────────────────────────────────────
const weekStart = z.string().date().refine(isMonday, 'La semaine commence un lundi')

export const weekStartParamsSchema = z.object({ weekStart })
export const createWeekSchema      = z.object({ week_start: weekStart })

export const reviewSchema = z.object({
  review_went_well: z.string().max(5000).nullish(),
  review_blocked:   z.string().max(5000).nullish(),
  review_notes:     z.string().max(5000).nullish(),
})

export const dayParamsSchema = z.object({ id: z.string().uuid(), date: z.string().date() })
export const dayOffSchema    = z.object({ off: z.boolean() })

export const createBlockSchema = z.object({
  date:       z.string().date(),
  start_time: blockTime,
  end_time:   blockTime,
  label:      z.string().min(1).max(255),
  category:   z.enum(CATEGORY).optional(),
  project_id: z.string().uuid().nullish(),
  measures:   measuresSchema.optional(),
}).refine(endAfterStart, endAfterStartError)

export const updateBlockSchema = z.object({
  date:       z.string().date().optional(),
  start_time: blockTime.optional(),
  end_time:   blockTime.optional(),
  label:      z.string().min(1).max(255).optional(),
  category:   z.enum(CATEGORY).optional(),
  project_id: z.string().uuid().nullish(),
  measures:   measuresSchema.optional(),
}).refine(endAfterStart, endAfterStartError)

// Heure réelle : à la minute près, pas de pas imposé — on note ce qui s'est passé.
const actualTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/, 'Heure au format HH:MM')

export const blockStatusSchema = z.object({
  status:         z.enum(STATUS),
  actual_minutes: z.number().int().positive().max(24 * 60).nullish(),
  actual_start:   actualTime.nullish(),
  actual_end:     actualTime.nullish(),
  note:           z.string().max(2000).nullish(),
  measure_values: z.record(z.string(), z.union([z.number().min(0), z.string().max(500)])).optional(),
})
  .refine((v) => !v.actual_start === !v.actual_end,
    { message: 'Indiquez l\'heure de début ET l\'heure de fin réelles', path: ['actual_end'] })
  .refine((v) => !v.actual_start || !v.actual_end || toMinutes(v.actual_end) > toMinutes(v.actual_start),
    { message: 'La fin réelle doit suivre le début', path: ['actual_end'] })
  .refine((v) => v.status !== 'partial' || v.actual_minutes || v.actual_start,
    { message: 'Indiquez le temps réellement passé', path: ['actual_minutes'] })

export const idParamsSchema = z.object({ id: z.string().uuid() })

export type CreateTemplateBlockInput = z.infer<typeof createTemplateBlockSchema>
export type UpdateTemplateBlockInput = z.infer<typeof updateTemplateBlockSchema>
export type CreateHolidayInput       = z.infer<typeof createHolidaySchema>
export type UpdateHolidayInput       = z.infer<typeof updateHolidaySchema>
export type ReviewInput              = z.infer<typeof reviewSchema>
export type CreateBlockInput         = z.infer<typeof createBlockSchema>
export type UpdateBlockInput         = z.infer<typeof updateBlockSchema>
export type BlockStatusInput         = z.infer<typeof blockStatusSchema>
