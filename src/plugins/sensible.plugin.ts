// TOUJOURS CES 3 LIGNES
import fp from 'fastify-plugin'
import fastifySensible from '@fastify/sensible'

export default fp(async (fastify) => {
    await fastify.register(fastifySensible)
})