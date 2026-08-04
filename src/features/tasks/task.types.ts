export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecurrenceFreq = 'weekly' | 'monthly' | 'yearly'

/**
 * Étape de vie d'une tâche (cf. functional-spec §3.9).
 * Pas de `done` : l'achèvement reste porté par la colonne kanban « Terminé »,
 * pour n'avoir qu'une seule source de vérité.
 */
export type TaskStage = 'inbox' | 'backlog' | 'active' | 'cancelled'

export interface Task {
  id: string
  organization_id: string
  /** null tant que la tâche n'est pas rattachée à un projet (inbox, backlog). */
  project_id: string | null
  /** null tant que la tâche n'est pas posée sur un board. */
  column_id: string | null
  stage: TaskStage
  /** Tâche `inbox` masquée du tri jusqu'à cette date. */
  snooze_until: string | null
  title: string
  description: string | null
  priority: TaskPriority | null
  position: number
  due_date: string | null
  start_date: string | null
  estimated_hours: number | null
  recurrence_freq: RecurrenceFreq | null
  recurrence_interval: number
  recurrence_days: number[] | null
  recurrence_until: string | null
  is_blocked: boolean
  created_at: Date
  updated_at: Date
}
