export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

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
  is_blocked: boolean
  created_at: Date
  updated_at: Date
}
