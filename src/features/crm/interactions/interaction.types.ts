export type InteractionType = 'email' | 'call' | 'meeting' | 'message' | 'other'

export interface Interaction {
  id: string
  contact_id: string
  opportunity_id: string | null
  type: InteractionType
  date: string
  notes: string | null
  created_at: Date
}
