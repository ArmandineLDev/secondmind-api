export type InvoiceType   = 'outgoing' | 'incoming'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  organization_id: string
  type: InvoiceType
  contact_id: string | null
  project_id: string | null
  reference: string | null
  amount: string
  currency: string
  issue_date: string
  due_date: string | null
  status: InvoiceStatus
  notes: string | null
  created_at: Date
  updated_at: Date
}
