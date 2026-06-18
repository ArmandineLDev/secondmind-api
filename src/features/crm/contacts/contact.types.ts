export type ContactStatus = 'lead' | 'prospect' | 'client' | 'former_client' | 'partner' | 'other'

export interface Contact {
  id: string
  organization_id: string
  company_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: ContactStatus
  notes: string | null
  created_at: Date
  updated_at: Date
}

export interface ContactWithCompany extends Contact {
  company_name: string | null
}
