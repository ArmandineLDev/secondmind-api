import { z } from 'zod'

const PRIORITY = ['low', 'medium', 'high', 'urgent'] as const
const RECURRENCE_FREQ = ['weekly', 'monthly', 'yearly'] as const
const STAGE = ['inbox', 'backlog', 'active', 'cancelled'] as const

// Jours : du mois (1-31) si monthly, de la semaine (1-7) si weekly. Borne large (31).
const recurrenceDays = z.array(z.coerce.number().int().min(1).max(31)).max(31)

export const createTaskSchema = z.object({
  title:               z.string().min(1).max(500),
  description:         z.string().max(5000).optional(),
  priority:            z.enum(PRIORITY).optional(),
  due_date:            z.string().date().optional(),
  start_date:          z.string().date().optional(),
  estimated_hours:     z.number().positive().optional(),
  column_id:           z.string().uuid(),
  recurrence_freq:     z.enum(RECURRENCE_FREQ).optional(),
  recurrence_interval: z.coerce.number().int().positive().optional(),
  recurrence_days:     recurrenceDays.optional(),
  recurrence_until:    z.string().date().optional(),
})

export const updateTaskSchema = z.object({
  title:               z.string().min(1).max(500).optional(),
  description:         z.string().max(5000).nullable().optional(),
  priority:            z.enum(PRIORITY).nullable().optional(),
  due_date:            z.string().date().nullable().optional(),
  start_date:          z.string().date().nullable().optional(),
  estimated_hours:     z.number().positive().nullable().optional(),
  recurrence_freq:     z.enum(RECURRENCE_FREQ).nullable().optional(),
  recurrence_interval: z.coerce.number().int().positive().optional(),
  recurrence_days:     recurrenceDays.nullable().optional(),
  recurrence_until:    z.string().date().nullable().optional(),
})

export const moveTaskSchema = z.object({
  column_id: z.string().uuid(),
  position: z.number().int().min(0),
})

export const taskParamsSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
})

export const listTasksQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  priority: z.enum(PRIORITY).optional(),
  column_id: z.string().uuid().optional(),
  stage: z.enum(STAGE).optional(),
})

// ─── Capture / Inbox (functional-spec §3.9) ──────────────────────────────────

// Capture rapide : un titre suffit, rien d'autre n'est demandé. C'est tout
// l'intérêt — la moindre friction (choisir un projet, une date) fait perdre l'idée.
export const captureTaskSchema = z.object({
  title: z.string().min(1).max(500),
})

// Tri hebdomadaire de l'inbox.
//   · validate → passe en `backlog`, avec projet et échéance facultatifs
//   · snooze   → reste en `inbox`, masquée jusqu'à `snooze_until`
//   · cancel   → passe en `cancelled`
export const triageTaskSchema = z.discriminatedUnion('action', [
  z.object({
    action:     z.literal('validate'),
    project_id: z.string().uuid().nullish(),
    due_date:   z.string().date().nullish(),
  }),
  z.object({
    action:       z.literal('snooze'),
    snooze_until: z.string().date(),
  }),
  z.object({
    action: z.literal('cancel'),
  }),
])

// Passage sur un board : projet ET colonne deviennent obligatoires, la tâche
// devient `active` (invariant garanti aussi en base par task_active_requires_board).
export const assignTaskSchema = z.object({
  project_id: z.string().uuid(),
  column_id:  z.string().uuid(),
  position:   z.number().int().min(0).optional(),
})

export const taskIdParamsSchema = z.object({ taskId: z.string().uuid() })

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
export type CaptureTaskInput = z.infer<typeof captureTaskSchema>
export type TriageTaskInput = z.infer<typeof triageTaskSchema>
export type AssignTaskInput = z.infer<typeof assignTaskSchema>
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>
