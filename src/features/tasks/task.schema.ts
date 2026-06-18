import { z } from 'zod'

const PRIORITY = ['low', 'medium', 'high', 'urgent'] as const

export const createTaskSchema = z.object({
  title:           z.string().min(1).max(500),
  description:     z.string().max(5000).optional(),
  priority:        z.enum(PRIORITY).optional(),
  due_date:        z.string().date().optional(),
  start_date:      z.string().date().optional(),
  estimated_hours: z.number().positive().optional(),
  column_id:       z.string().uuid(),
})

export const updateTaskSchema = z.object({
  title:           z.string().min(1).max(500).optional(),
  description:     z.string().max(5000).nullable().optional(),
  priority:        z.enum(PRIORITY).nullable().optional(),
  due_date:        z.string().date().nullable().optional(),
  start_date:      z.string().date().nullable().optional(),
  estimated_hours: z.number().positive().nullable().optional(),
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
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
