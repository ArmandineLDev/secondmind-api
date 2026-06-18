export interface Revenue {
  id: string
  organization_id: string
  project_id: string | null
  contact_id: string | null
  amount: string
  currency: string
  date: string
  description: string | null
  created_at: Date
}
