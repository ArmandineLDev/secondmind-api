import { z } from 'zod'

const GOAL_CATEGORIES = ['revenue', 'marketing', 'project', 'personal', 'other'] as const
const GOAL_STATUSES   = ['in_progress', 'achieved', 'missed'] as const

export const createGoalSchema = z.object({
  title:         z.string().min(1).max(255),
  description:   z.string().optional(),
  category:      z.enum(GOAL_CATEGORIES),
  target_value:  z.number().optional(),
  current_value: z.number().optional(),
  unit:          z.string().max(50).optional(),
  due_date:      z.string().date().optional(),
  status:        z.enum(GOAL_STATUSES).default('in_progress'),
})

export const updateGoalSchema = z.object({
  title:         z.string().min(1).max(255).optional(),
  description:   z.string().nullish(),
  category:      z.enum(GOAL_CATEGORIES).optional(),
  target_value:  z.number().nullish(),
  current_value: z.number().nullish(),
  unit:          z.string().max(50).nullish(),
  due_date:      z.string().date().nullish(),
  status:        z.enum(GOAL_STATUSES).optional(),
})

export const goalParamsSchema = z.object({ id: z.string().uuid() })

export const goalQuerySchema = z.object({
  category: z.enum(GOAL_CATEGORIES).optional(),
  status:   z.enum(GOAL_STATUSES).optional(),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type GoalQuery       = z.infer<typeof goalQuerySchema>
