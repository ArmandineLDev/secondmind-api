import { z } from 'zod'

const INVOICE_TYPES    = ['outgoing', 'incoming'] as const
const INVOICE_STATUSES = ['pending', 'paid', 'overdue', 'cancelled'] as const

export const createInvoiceSchema = z.object({
  type:       z.enum(INVOICE_TYPES),
  amount:     z.number().positive(),
  issue_date: z.string().date(),
  contact_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  reference:  z.string().max(100).optional(),
  due_date:   z.string().date().optional(),
  status:     z.enum(INVOICE_STATUSES).default('pending'),
  notes:      z.string().optional(),
  currency:   z.string().length(3).default('EUR'),
})

export const updateInvoiceSchema = z.object({
  type:       z.enum(INVOICE_TYPES).optional(),
  amount:     z.number().positive().optional(),
  issue_date: z.string().date().optional(),
  contact_id: z.string().uuid().nullish(),
  project_id: z.string().uuid().nullish(),
  reference:  z.string().max(100).nullish(),
  due_date:   z.string().date().nullish(),
  status:     z.enum(INVOICE_STATUSES).optional(),
  notes:      z.string().nullish(),
  currency:   z.string().length(3).optional(),
})

export const invoiceParamsSchema = z.object({ id: z.string().uuid() })

export const invoiceQuerySchema = z.object({
  type:       z.enum(INVOICE_TYPES).optional(),
  status:     z.enum(INVOICE_STATUSES).optional(),
  project_id: z.string().uuid().optional(),
  year:       z.coerce.number().int().optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type InvoiceQuery       = z.infer<typeof invoiceQuerySchema>
