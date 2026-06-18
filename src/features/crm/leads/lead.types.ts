export type LeadStage = 'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Lead {
  id: string
  organization_id: string
  contact_id: string | null
  company_id: string | null
  title: string
  value: string | null
  stage: LeadStage
  probability: number | null
  notes: string | null
  closed_at: string | null
  created_at: Date
  updated_at: Date
}

export interface LeadWithRelations extends Lead {
  contact_first_name: string | null
  contact_last_name: string | null
  company_name: string | null
  weighted_value: string | null
}
