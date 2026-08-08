import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createContactSchema,
  updateContactSchema,
  contactParamsSchema,
  contactQuerySchema,
} from './contact.schema'
import * as dm from '@/db/datamappers/contact.datamapper'
import * as projectDm from '@/db/datamappers/project.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = contactQuerySchema.parse(req.query)
  const contacts = await dm.findAllContacts(req.organizationId, query)
  reply.send(contacts)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const contact = await dm.findContactById(id, req.organizationId)
  if (!contact) return reply.notFound('Contact introuvable')
  reply.send(contact)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createContactSchema.parse(req.body)
  const contact = await dm.createContact(req.organizationId, input)
  reply.code(201).send(contact)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const input = updateContactSchema.parse(req.body)
  const contact = await dm.updateContact(id, req.organizationId, input)
  if (!contact) return reply.notFound('Contact introuvable')
  reply.send(contact)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const deleted = await dm.deleteContact(id, req.organizationId)
  if (!deleted) return reply.notFound('Contact introuvable')
  reply.code(204).send()
}

// ─── RGPD ─────────────────────────────────────────────────────────────────────

// Droit d'accès et de portabilité (RGPD art. 15 et 20). Renvoie en JSON tout ce
// que l'organisation détient sur la personne, en pièce jointe téléchargeable —
// de quoi répondre directement à une demande écrite.
export async function exportData(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const data = await dm.exportContactData(id, req.organizationId)
  if (!data) return reply.notFound('Contact introuvable')

  const name = `${data.contact?.first_name ?? ''}-${data.contact?.last_name ?? ''}`
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // diacritiques
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'contact'

  reply
    .header('Content-Disposition', `attachment; filename="donnees-${name}.json"`)
    .type('application/json')
    .send({
      exported_at: new Date().toISOString(),
      notice:
        "Export des données personnelles détenues sur cette personne (RGPD, droit d'accès et de "
        + 'portabilité). Les factures sont incluses au titre du droit d\'accès mais ne peuvent pas '
        + 'être effacées : leur conservation est une obligation comptable (10 ans).',
      ...data,
    })
}

// Projets réalisés pour cette personne (fiche contact 360).
//
// Pendant de `GET /companies/:id/projects` : tout client n'est pas une
// entreprise, et un projet peut n'être rattaché qu'à une personne physique.
export async function getProjects(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const contact = await dm.findContactById(id, req.organizationId)
  if (!contact) return reply.notFound('Contact introuvable')
  reply.send(await projectDm.findProjectsByContact(id, req.organizationId))
}

// Empreinte de la personne dans la base : ce qu'une suppression détruirait,
// ce qu'elle se contenterait de détacher. Sert à confirmer en connaissance de cause.
export async function footprint(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const contact = await dm.findContactById(id, req.organizationId)
  if (!contact) return reply.notFound('Contact introuvable')

  reply.send(await dm.countContactFootprint(id, req.organizationId))
}
