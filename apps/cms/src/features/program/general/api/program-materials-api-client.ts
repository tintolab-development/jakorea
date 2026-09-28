import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramMaterialAssignmentResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialAssignmentResponse'
import type { ProgramMaterialResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialResponse'

/** GET /api/admin/programs/{programId}/materials — codegen 대기 없이 직접 호출 */
export async function fetchProgramMaterialTextbookIds(programId: string): Promise<Set<string>> {
  const id = programId.trim()
  if (!id) return new Set()

  const payload = await customInstance<unknown>({
    url: `/api/admin/programs/${encodeURIComponent(id)}/materials`,
    method: 'GET',
  })
  const body = unwrapApiBody<ProgramMaterialAssignmentResponse | ProgramMaterialResponse[]>(payload)
  const items = Array.isArray(body) ? body : (body.items ?? [])
  const ids = new Set<string>()
  for (const item of items) {
    if (item.textbookId != null) ids.add(String(item.textbookId))
  }
  return ids
}
