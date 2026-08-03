export type BillingType = 'fixed' | 'hourly' | 'monthly' | 'custom'

export interface Offer {
  id: string
  organization_id: string
  name: string
  description: string | null
  price: string | null
  currency: string
  billing_type: BillingType
  is_active: boolean
  canvas_id: string | null
  swot_id: string | null
  created_at: Date
  updated_at: Date
}
