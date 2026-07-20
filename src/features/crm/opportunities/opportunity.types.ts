export type OpportunityStage = 'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Opportunity {
  id: string
  organization_id: string
  contact_id: string | null
  company_id: string | null
  title: string
  value: string | null
  stage: OpportunityStage
  probability: number | null
  notes: string | null
  closed_at: string | null
  created_at: Date
  updated_at: Date
}

export interface OpportunityWithRelations extends Opportunity {
  contact_first_name: string | null
  contact_last_name: string | null
  company_name: string | null
  weighted_value: string | null
}
