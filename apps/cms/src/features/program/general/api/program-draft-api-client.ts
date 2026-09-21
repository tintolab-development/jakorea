import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramDraftItemResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftItemResponse'
import type { ProgramDraftSaveResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftSaveResponse'
import type { ProgramDraftUpsertRequest } from '@/shared/api/generated/forms-surveys/schemas/programDraftUpsertRequest'

export async function fetchMyProgramDraftRemote(
  programType: string
): Promise<ProgramDraftItemResponse | null> {
  try {
    return unwrapApiBody<ProgramDraftItemResponse>(
      await customInstance({
        url: '/api/admin/program-draft',
        method: 'GET',
        params: { programType },
      })
    )
  } catch {
    return null
  }
}

export async function upsertMyProgramDraftRemote(
  body: ProgramDraftUpsertRequest
): Promise<ProgramDraftSaveResponse> {
  return unwrapApiBody<ProgramDraftSaveResponse>(
    await customInstance({
      url: '/api/admin/program-draft',
      method: 'PUT',
      data: body,
    })
  )
}

export async function deleteMyProgramDraftRemote(programType: string): Promise<void> {
  await customInstance({
    url: '/api/admin/program-draft',
    method: 'DELETE',
    params: { programType },
  })
}
