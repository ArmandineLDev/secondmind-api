export interface Company {
  id: string
  organization_id: string
  name: string
  website: string | null
  industry: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}
