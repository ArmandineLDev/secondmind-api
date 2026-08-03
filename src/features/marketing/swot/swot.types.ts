export interface Swot {
  id: string
  organization_id: string
  name: string
  strengths: string | null
  weaknesses: string | null
  opportunities: string | null
  threats: string | null
  created_at: Date
  updated_at: Date
}
