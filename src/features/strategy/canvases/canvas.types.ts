export interface Canvas {
  id: string
  organization_id: string
  name: string
  customer_segments: string | null
  value_propositions: string | null
  channels: string | null
  customer_relationships: string | null
  revenue_streams: string | null
  key_resources: string | null
  key_activities: string | null
  key_partners: string | null
  cost_structure: string | null
  problem: string | null
  solution: string | null
  key_metrics: string | null
  unfair_advantage: string | null
  created_at: Date
  updated_at: Date
}
