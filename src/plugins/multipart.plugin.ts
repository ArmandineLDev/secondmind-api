import fp from 'fastify-plugin'
import multipart from '@fastify/multipart'

export default fp(async (fastify) => {
  fastify.register(multipart, {
    limits: {
      fileSize:  50 * 1024 * 1024, // 50 Mo max
      files:     1,
    },
  })
})
