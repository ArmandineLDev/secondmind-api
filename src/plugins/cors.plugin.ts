import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import { env } from '@/lib/env'
import { FastifyInstance } from 'fastify';

async function corsPlugin(fastify:FastifyInstance){
    await fastify.register(fastifyCors, {
        origin: env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400,
    })
}

export default fp(corsPlugin);