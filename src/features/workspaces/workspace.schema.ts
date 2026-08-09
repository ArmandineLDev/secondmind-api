import { z } from 'zod'

// L'id d'organisation est un `text` généré par Better Auth, pas un uuid : ne pas
// le valider comme tel. Les nôtres sont des uuid (cf. workspace.datamapper), mais
// ceux créés par la route native de Better Auth ne le seraient pas.
export const workspaceParamsSchema = z.object({
  id: z.string().min(1).max(64),
})
