export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: ProjectStatus
  is_archived: boolean
  is_default: boolean
  archived_at: Date | null
  start_date: Date | null
  end_date: Date | null
  created_at: Date
  updated_at: Date
}

export interface KanbanColumn {
  id: string
  project_id: string
  name: string
  position: number
  color: string | null
}

export interface Task {
  id: string
  project_id: string
  column_id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  position: number
  due_date: string | null
  created_at: Date
  updated_at: Date
}
