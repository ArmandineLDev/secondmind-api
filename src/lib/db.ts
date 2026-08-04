import pg from 'pg'
import { env } from './env.ts'

// Le type `date` de PostgreSQL (OID 1082) est une date civile : ni heure, ni fuseau.
// Par défaut, le driver `pg` la convertit en objet Date JS interprété en heure locale,
// ce qui pose deux problèmes :
//   1. nos types TypeScript la déclarent `string` — c'était un mensonge au runtime, et
//      `computeNextOccurrence` plantait dessus (« currentISO.split is not a function »)
//      → 500 sur PATCH /tasks/:id/reschedule ;
//   2. à la sérialisation JSON, la date recule d'un jour en UTC+ : `2026-09-01` stocké
//      en base ressort en `2026-08-31T22:00:00.000Z`, que les `<input type="date">` du
//      front (qui attendent `YYYY-MM-DD`) rejettent en affichant un champ vide.
// On garde donc la valeur telle que PostgreSQL l'envoie : 'YYYY-MM-DD'.
// `timestamptz` (created_at, scheduled_at…) n'est PAS concerné : il porte une heure et
// un fuseau, sa conversion en Date est légitime.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value)

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
