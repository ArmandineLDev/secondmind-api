export type InteractionType = 'email' | 'call' | 'meeting' | 'other'

export interface Interaction {
  id: string
  contact_id: string
  lead_id: string | null
  type: InteractionType
  date: string
  notes: string | null
  created_at: Date
}
