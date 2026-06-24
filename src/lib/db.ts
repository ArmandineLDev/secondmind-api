import pg from 'pg'
import { env } from './env.ts'

export const db = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
})

// Une erreur sur un client idle (ex. connexion coupée par le serveur) émet un
// event 'error' sur le pool. Sans handler, elle remonte en exception non gérée
// et peut tuer le process. On la log et on laisse le pool recycler le client.
db.on('error', (err) => {
  console.error('[db] Erreur inattendue sur un client PostgreSQL idle:', err)
})
