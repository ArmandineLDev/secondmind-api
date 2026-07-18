export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecurrenceFreq = 'weekly' | 'monthly' | 'yearly'

export interface Task {
  id: string
  project_id: string
  column_id: string
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
