export interface Persona {
  id: string
  organization_id: string
  name: string
  demo_first_name: string | null
  demo_last_name: string | null
  demo_age: string | null
  demo_marital_status: string | null
  demo_job_title: string | null
  demo_professional_status: string | null
  demo_income: string | null
  interests: string | null
  general_description: string | null
  drivers: string | null
  vital_needs: string | null
  purchase_motivations: string | null
  purchase_barriers: string | null
  offer_discovery: string | null
  path_to_goal: string | null
  created_at: Date
  updated_at: Date
}
