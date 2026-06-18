export type ExpenseCategory = 'subscription' | 'equipment' | 'training' | 'travel' | 'other'

export interface Expense {
  id: string
  organization_id: string
  project_id: string | null
  category: ExpenseCategory
  description: string
  amount: string
  currency: string
  date: string
  created_at: Date
}
