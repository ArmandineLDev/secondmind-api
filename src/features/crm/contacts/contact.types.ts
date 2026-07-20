export type ContactStatus = 'lead' | 'prospect' | 'client' | 'former_client' | 'partner' | 'other'
export type ContactSourceChannel = 'email' | 'phone' | 'social_media' | 'referral' | 'event' | 'other'

export interface Contact {
  id: string
  organization_id: string
  company_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: ContactStatus
  source_channel: ContactSourceChannel | null
  source_detail: string | null
  next_follow_up_at: string | null
  follow_up_note: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

export interface ContactWithCompany extends Contact {
  company_name: string | null
}
