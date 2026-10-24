import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createOfferSchema,
  updateOfferSchema,
  offerParamsSchema,
  offerQuerySchema,
} from './offer.schema'
import * as dm from '@/db/datamappers/offer.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = offerQuerySchema.parse(req.query)
  const offers = await dm.findAllOffers(req.organizationId, query)
  reply.send(offers)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = offerParamsSchema.parse(req.params)
  const offer = await dm.findOfferById(id, req.organizationId)
  if (!offer) return reply.notFound('Offre introuvable')
  reply.send(offer)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createOfferSchema.parse(req.body)
  const offer = await dm.createOffer(req.organizationId, input)
  reply.code(201).send(offer)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = offerParamsSchema.parse(req.params)
  const input = updateOfferSchema.parse(req.body)
  const offer = await dm.updateOffer(id, req.organizationId, input)
  if (!offer) return reply.notFound('Offre introuvable')
  reply.send(offer)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = offerParamsSchema.parse(req.params)
  const deleted = await dm.deleteOffer(id, req.organizationId)
  if (!deleted) return reply.notFound('Offre introuvable')
  reply.code(204).send()
}
