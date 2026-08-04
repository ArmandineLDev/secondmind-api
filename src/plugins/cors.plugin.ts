import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import { env } from '@/lib/env'
import { FastifyInstance } from 'fastify'

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyCors, {
    origin: env.CORS_ORIGIN,
    // ⚠️ PATCH manquait ici. Le préflight répondait bien 204, mais sans PATCH
    // dans `Access-Control-Allow-Methods` le navigateur bloquait la requête
    // réelle — qui n'atteignait donc jamais l'API. Toutes les routes PATCH
    // étaient inutilisables depuis le web (déplacement de tâche en drag & drop,
    // archivage de projet, réordonnancement des colonnes, « Fait — replanifier »,
    // et le tri de l'inbox). Bruno, lui, n'applique pas le CORS : les mêmes
    // routes y passaient sans erreur, ce qui a masqué le problème.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    // ⚠️ Le résultat du préflight est mis en cache 24 h par le navigateur :
    // après un changement ici, vider le cache ou attendre l'expiration.
    maxAge: 86400,
  })
}

export default fp(corsPlugin)
