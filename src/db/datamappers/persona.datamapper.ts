import { db } from '@/lib/db'
import type { Persona } from '@/features/marketing/personas/persona.types'
import type { CreatePersonaInput, UpdatePersonaInput } from '@/features/marketing/personas/persona.schema'

export async function findAllPersonas(organizationId: string): Promise<Persona[]> {
  const result = await db.query<Persona>(
    `SELECT * FROM persona WHERE organization_id = $1 ORDER BY name ASC`,
    [organizationId]
  )
  return result.rows
}

export async function findPersonaById(
  id: string,
  organizationId: string
): Promise<Persona | null> {
  const result = await db.query<Persona>(
    `SELECT * FROM persona WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createPersona(
  organizationId: string,
  input: CreatePersonaInput
): Promise<Persona> {
  const result = await db.query<Persona>(
    `INSERT INTO persona (
       organization_id, name,
       demo_first_name, demo_last_name, demo_age, demo_marital_status,
       demo_job_title, demo_professional_status, demo_income,
       interests, general_description, drivers, vital_needs,
       purchase_motivations, purchase_barriers, offer_discovery, path_to_goal
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      organizationId,
      input.name,
      input.demo_first_name          ?? null,
      input.demo_last_name           ?? null,
      input.demo_age                 ?? null,
      input.demo_marital_status      ?? null,
      input.demo_job_title           ?? null,
      input.demo_professional_status ?? null,
      input.demo_income              ?? null,
      input.interests                ?? null,
      input.general_description      ?? null,
      input.drivers                  ?? null,
      input.vital_needs              ?? null,
      input.purchase_motivations     ?? null,
      input.purchase_barriers        ?? null,
      input.offer_discovery          ?? null,
      input.path_to_goal             ?? null,
    ]
  )
  return result.rows[0]
}

export async function updatePersona(
  id: string,
  organizationId: string,
  input: UpdatePersonaInput
): Promise<Persona | null> {
  const result = await db.query<Persona>(
    `UPDATE persona
     SET name                     = COALESCE($3, name),
         demo_first_name          = CASE WHEN $4::boolean  THEN $5  ELSE demo_first_name          END,
         demo_last_name           = CASE WHEN $6::boolean  THEN $7  ELSE demo_last_name           END,
         demo_age                 = CASE WHEN $8::boolean  THEN $9  ELSE demo_age                 END,
         demo_marital_status      = CASE WHEN $10::boolean THEN $11 ELSE demo_marital_status      END,
         demo_job_title           = CASE WHEN $12::boolean THEN $13 ELSE demo_job_title           END,
         demo_professional_status = CASE WHEN $14::boolean THEN $15 ELSE demo_professional_status END,
         demo_income              = CASE WHEN $16::boolean THEN $17 ELSE demo_income              END,
         interests                = CASE WHEN $18::boolean THEN $19 ELSE interests                END,
         general_description      = CASE WHEN $20::boolean THEN $21 ELSE general_description      END,
         drivers                  = CASE WHEN $22::boolean THEN $23 ELSE drivers                  END,
         vital_needs              = CASE WHEN $24::boolean THEN $25 ELSE vital_needs              END,
         purchase_motivations     = CASE WHEN $26::boolean THEN $27 ELSE purchase_motivations     END,
         purchase_barriers        = CASE WHEN $28::boolean THEN $29 ELSE purchase_barriers        END,
         offer_discovery          = CASE WHEN $30::boolean THEN $31 ELSE offer_discovery          END,
         path_to_goal             = CASE WHEN $32::boolean THEN $33 ELSE path_to_goal             END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.name ?? null,
      'demo_first_name'          in input, input.demo_first_name          ?? null,
      'demo_last_name'           in input, input.demo_last_name           ?? null,
      'demo_age'                 in input, input.demo_age                 ?? null,
      'demo_marital_status'      in input, input.demo_marital_status      ?? null,
      'demo_job_title'           in input, input.demo_job_title           ?? null,
      'demo_professional_status' in input, input.demo_professional_status ?? null,
      'demo_income'              in input, input.demo_income              ?? null,
      'interests'                in input, input.interests                ?? null,
      'general_description'      in input, input.general_description      ?? null,
      'drivers'                  in input, input.drivers                  ?? null,
      'vital_needs'              in input, input.vital_needs              ?? null,
      'purchase_motivations'     in input, input.purchase_motivations     ?? null,
      'purchase_barriers'        in input, input.purchase_barriers        ?? null,
      'offer_discovery'          in input, input.offer_discovery          ?? null,
      'path_to_goal'             in input, input.path_to_goal             ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deletePersona(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM persona WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
