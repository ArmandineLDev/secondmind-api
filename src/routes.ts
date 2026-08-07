import { FastifyInstance } from 'fastify'
import { authRoutes } from '@/features/auth/auth.routes'
import { projectRoutes } from '@/features/projects/project.routes'
import { taskRoutes } from '@/features/tasks/task.routes'
import { taskDependencyRoutes } from '@/features/tasks/task-dependency.routes'
import { companyRoutes } from '@/features/crm/companies/company.routes'
import { contactRoutes } from '@/features/crm/contacts/contact.routes'
import { opportunityRoutes } from '@/features/crm/opportunities/opportunity.routes'
import { budgetRoutes } from '@/features/finance/budgets/budget.routes'
import { expenseRoutes } from '@/features/finance/expenses/expense.routes'
import { timeEntryRoutes } from '@/features/finance/time-entries/time-entry.routes'
import { invoiceRoutes } from '@/features/finance/invoices/invoice.routes'
import { offerRoutes } from '@/features/marketing/offers/offer.routes'
import { personaRoutes } from '@/features/marketing/personas/persona.routes'
import { goalRoutes } from '@/features/marketing/goals/goal.routes'
import { canvasRoutes } from '@/features/marketing/canvases/canvas.routes'
import { swotRoutes } from '@/features/marketing/swot/swot.routes'
import { vpCanvasRoutes } from '@/features/marketing/vp-canvas/vp-canvas.routes'
import { editorialPostRoutes } from '@/features/marketing/editorial-posts/editorial-post.routes'
import { statsRoutes } from '@/features/stats/stats.routes'
import { documentRoutes } from '@/features/documents/document.routes'
import { collectionRoutes } from '@/features/collections/collection.routes'
import { clientRoutes }    from '@/features/client/client.routes'
import { settingsRoutes }  from '@/features/settings/settings.routes'

export async function registerRoutes(fastify: FastifyInstance) {
  // Les routes auth n'ont pas le préfixe /v1 car Better Auth gère ses propres URLs
  fastify.register(authRoutes, { prefix: '/api' })

  // Routes métier — toutes préfixées /api/v1
  fastify.register(projectRoutes,        { prefix: '/api/v1' })
  fastify.register(taskRoutes,           { prefix: '/api/v1' })
  fastify.register(taskDependencyRoutes, { prefix: '/api/v1' })
  fastify.register(companyRoutes,        { prefix: '/api/v1' })
  fastify.register(contactRoutes,        { prefix: '/api/v1' })
  fastify.register(opportunityRoutes,    { prefix: '/api/v1' })
  fastify.register(budgetRoutes,         { prefix: '/api/v1' })
  fastify.register(expenseRoutes,        { prefix: '/api/v1' })
  fastify.register(timeEntryRoutes,      { prefix: '/api/v1' })
  fastify.register(invoiceRoutes,        { prefix: '/api/v1' })
  fastify.register(offerRoutes,          { prefix: '/api/v1' })
  fastify.register(personaRoutes,        { prefix: '/api/v1' })
  fastify.register(goalRoutes,           { prefix: '/api/v1' })
  fastify.register(canvasRoutes,         { prefix: '/api/v1' })
  fastify.register(swotRoutes,           { prefix: '/api/v1' })
  fastify.register(vpCanvasRoutes,       { prefix: '/api/v1' })
  fastify.register(editorialPostRoutes,  { prefix: '/api/v1' })
  fastify.register(statsRoutes,          { prefix: '/api/v1' })
  fastify.register(documentRoutes,       { prefix: '/api/v1' })
  fastify.register(collectionRoutes,     { prefix: '/api/v1' })
  fastify.register(clientRoutes,         { prefix: '/api/v1' })
  fastify.register(settingsRoutes,       { prefix: '/api/v1' })
}
