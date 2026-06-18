import { createProject } from '@/db/datamappers/project.datamapper'
import { createDefaultColumns } from '@/db/datamappers/column.datamapper'
import type { CreateProjectInput } from '@/features/projects/project.schema'
import type { Project } from '@/features/projects/project.types'

export async function createProjectWithDefaults(
  organizationId: string,
  input: CreateProjectInput
): Promise<Project> {
  const project = await createProject(organizationId, input)
  await createDefaultColumns(project.id)
  return project
}
