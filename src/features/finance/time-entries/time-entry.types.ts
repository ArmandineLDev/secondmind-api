export interface TimeEntry {
  id: string
  organization_id: string
  project_id: string | null
  task_id: string | null
  duration_minutes: number
  hourly_rate: string | null
  date: string
  description: string | null
  created_at: Date
}
