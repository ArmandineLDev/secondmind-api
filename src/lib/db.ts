import pg from 'pg'
import { env } from './env.ts'

export const db = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
})
