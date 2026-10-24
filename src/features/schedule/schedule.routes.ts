import type { FastifyInstance } from 'fastify'
import * as template from './template.controller'
import * as holiday from './holiday.controller'
import * as week from './week.controller'
import * as appointment from './appointment.controller'

export async function scheduleRoutes(fastify: FastifyInstance) {
  // Réservé à l'owner, et filtré par utilisateur en plus du workspace : une
  // semaine appartient à quelqu'un, pas à la structure (cf. functional-spec §3.11).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  // Semaine type.
  fastify.get('/schedule/template-blocks', auth,        template.getAll)
  fastify.post('/schedule/template-blocks', auth,       template.create)
  fastify.put('/schedule/template-blocks/:id', auth,    template.update)
  fastify.delete('/schedule/template-blocks/:id', auth, template.remove)

  // Vacances scolaires.
  fastify.get('/schedule/holidays', auth,        holiday.getAll)
  fastify.post('/schedule/holidays', auth,       holiday.create)
  fastify.put('/schedule/holidays/:id', auth,    holiday.update)
  fastify.delete('/schedule/holidays/:id', auth, holiday.remove)

  // Semaines réelles. GET sur une semaine non créée renvoie sa projection.
  fastify.get('/schedule/weeks/:weekStart', auth,          week.getWeek)
  fastify.post('/schedule/weeks', auth,                    week.createWeek)
  fastify.post('/schedule/weeks/:id/reapply-template', auth, week.reapplyTemplate)
  fastify.put('/schedule/weeks/:id/review', auth,          week.updateReview)
  fastify.put('/schedule/weeks/:id/days/:date', auth,      week.setDayOff)
  fastify.post('/schedule/weeks/:id/blocks', auth,         week.createBlock)
  fastify.put('/schedule/blocks/:id', auth,                week.updateBlock)
  fastify.delete('/schedule/blocks/:id', auth,             week.removeBlock)
  fastify.patch('/schedule/blocks/:id/status', auth,       week.setBlockStatus)

  // Modèles de rendez-vous.
  fastify.get('/schedule/appointment-templates', auth,        appointment.getTemplates)
  fastify.post('/schedule/appointment-templates', auth,       appointment.createTemplate)
  fastify.put('/schedule/appointment-templates/:id', auth,    appointment.updateTemplate)
  fastify.delete('/schedule/appointment-templates/:id', auth, appointment.removeTemplate)

  // Rendez-vous.
  fastify.get('/schedule/appointments', auth,                appointment.getAll)
  fastify.post('/schedule/appointments', auth,               appointment.create)
  fastify.put('/schedule/appointments/:id', auth,            appointment.update)
  fastify.delete('/schedule/appointments/:id', auth,         appointment.remove)
  fastify.patch('/schedule/appointments/:id/outcome', auth,  appointment.setOutcome)
}
