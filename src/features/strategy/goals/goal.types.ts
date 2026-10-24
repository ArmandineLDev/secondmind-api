export type GoalCategory = 'revenue' | 'marketing' | 'project' | 'personal' | 'other'
export type GoalStatus   = 'in_progress' | 'achieved' | 'missed'

export interface Goal {
  id: string
  organization_id: string
  title: string
  description: string | null
  category: GoalCategory
  target_value: string | null
  current_value: string | null
  unit: string | null
  due_date: string | null
  status: GoalStatus
  created_at: Date
  updated_at: Date
}
