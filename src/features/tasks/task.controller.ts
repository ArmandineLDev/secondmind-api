import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  findAllTasks,
  findTasksByProject,
  findTaskById,
  createTask,
  updateTask,
  moveTask,
  rescheduleTask,
  deleteTask,
  captureTask as createCapturedTask,
  triageTask as triageCapturedTask,
  assignTask as assignCapturedTask,
} from '@/db/datamappers/task.datamapper'
import { findProjectById } from '@/db/datamappers/project.datamapper'
import { computeNextOccurrence } from '@/features/tasks/recurrence.service'
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  taskParamsSchema,
  listTasksQuerySchema,
  captureTaskSchema,
  triageTaskSchema,
  assignTaskSchema,
  taskIdParamsSchema,
} from '@/features/tasks/task.schema'
import { projectParamsSchema } from '@/features/projects/project.schema'

async function assertProjectAccess(projectId: string, organizationId: string, reply: FastifyReply) {
  const project = await findProjectById(projectId, organizationId)
  if (!project) {
    reply.notFound('Projet introuvable')
    return false
  }
  return true
}

export async function getTasks(request: FastifyRequest, reply: FastifyReply) {
  const query = listTasksQuerySchema.safeParse(request.query)
  if (!query.success) throw query.error

  const tasks = await findAllTasks(request.organizationId, query.data)
  return reply.send(tasks)
}

export async function getProjectTasks(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const tasks = await findTasksByProject(params.data.id, request.organizationId)
  return reply.send(tasks)
}

export async function addTask(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const body = createTaskSchema.safeParse(request.body)
  if (!body.success) throw body.error

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const task = await createTask(params.data.id, body.data)
  return reply.status(201).send(task)
}

export async function patchTask(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const body = updateTaskSchema.safeParse(request.body)
  if (!body.success) throw body.error

  const task = await updateTask(params.data.taskId, params.data.id, request.organizationId, body.data)
  if (!task) return reply.notFound('Tâche introuvable')
  return reply.send(task)
}

export async function relocateTask(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const body = moveTaskSchema.safeParse(request.body)
  if (!body.success) throw body.error

  const task = await moveTask(params.data.taskId, params.data.id, request.organizationId, body.data)
  if (!task) return reply.notFound('Tâche introuvable')
  return reply.send(task)
}

// « Fait — replanifier » : avance la tâche récurrente à sa prochaine occurrence
// et la remet en début de board. Si la prochaine dépasse recurrence_until, la
// récurrence est clôturée (recurrence_freq repassé à null) et la tâche reste en place.
export async function rescheduleRecurringTask(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const task = await findTaskById(params.data.taskId, params.data.id, request.organizationId)
  if (!task) return reply.notFound('Tâche introuvable')
  if (!task.recurrence_freq) return reply.badRequest('Cette tâche n\'est pas récurrente')

  const base = task.due_date ?? new Date().toISOString().slice(0, 10)
  const next = computeNextOccurrence(
    base,
    task.recurrence_freq,
    task.recurrence_interval,
    task.recurrence_days,
  )

  if (task.recurrence_until && next > task.recurrence_until) {
    const ended = await updateTask(params.data.taskId, params.data.id, request.organizationId, {
      recurrence_freq: null,
    })
    return reply.send(ended)
  }

  const rescheduled = await rescheduleTask(params.data.taskId, params.data.id, request.organizationId, next)
  if (!rescheduled) return reply.notFound('Tâche introuvable')
  return reply.send(rescheduled)
}

export async function removeTask(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const deleted = await deleteTask(params.data.taskId, params.data.id, request.organizationId)
  if (!deleted) return reply.notFound('Tâche introuvable')
  return reply.status(204).send()
}

// ─── Capture / Inbox (functional-spec §3.9) ──────────────────────────────────

// Capture rapide : POST /tasks avec un titre. Volontairement NON imbriquée sous
// un projet — c'est tout le point, la tâche n'en a pas encore.
export async function captureTask(request: FastifyRequest, reply: FastifyReply) {
  const body = captureTaskSchema.safeParse(request.body)
  if (!body.success) throw body.error

  const task = await createCapturedTask(request.organizationId, body.data.title)
  return reply.status(201).send(task)
}

// Tri hebdomadaire : valider / différer / annuler.
export async function triage(request: FastifyRequest, reply: FastifyReply) {
  const params = taskIdParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const body = triageTaskSchema.safeParse(request.body)
  if (!body.success) throw body.error

  const task = await triageCapturedTask(params.data.taskId, request.organizationId, body.data)
  if (!task) {
    // Le report ne s'applique qu'à une tâche encore dans l'inbox : distinguer les
    // deux cas évite de faire croire à une tâche disparue.
    return body.data.action === 'snooze'
      ? reply.badRequest('Seule une tâche encore dans l\'inbox peut être différée')
      : reply.notFound('Tâche introuvable')
  }
  return reply.send(task)
}

// Passage sur un board : la tâche devient `active`.
export async function assign(request: FastifyRequest, reply: FastifyReply) {
  const params = taskIdParamsSchema.safeParse(request.params)
  if (!params.success) throw params.error

  const body = assignTaskSchema.safeParse(request.body)
  if (!body.success) throw body.error

  const task = await assignCapturedTask(params.data.taskId, request.organizationId, body.data)
  // Un null ici signifie soit une tâche inconnue, soit un projet/colonne hors du
  // workspace, soit une colonne n'appartenant pas au projet visé : le datamapper
  // vérifie les trois d'un coup, on ne peut pas les distinguer sans requête en plus.
  if (!task) return reply.badRequest('Tâche, projet ou colonne introuvable, ou colonne n\'appartenant pas à ce projet')
  return reply.send(task)
}
