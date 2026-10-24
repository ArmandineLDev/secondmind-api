export interface VpCanvas {
  id: string
  organization_id: string
  offer_id: string | null
  persona_id: string | null
  name: string
  customer_jobs: string | null
  customer_pains: string | null
  customer_gains: string | null
  products_services: string | null
  pain_relievers: string | null
  gain_creators: string | null
  created_at: Date
  updated_at: Date
}

export interface VpCanvasWithRelations extends VpCanvas {
  offer_name: string | null
  persona_name: string | null
}
