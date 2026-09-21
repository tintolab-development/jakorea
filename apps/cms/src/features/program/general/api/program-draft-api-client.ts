import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  normalizeProgramDraftItem,
  normalizeProgramDraftSaveResponse,
} from '@/features/program/general/api/normalize-program-draft-item'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramDraftItemResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftItemResponse'
import type { ProgramDraftSaveResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftSaveResponse'
import type { ProgramDraftUpsertRequest } from '@/shared/api/generated/forms-surveys/schemas/programDraftUpsertRequest'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

const PROGRAM_DRAFT_QUIET_OPTIONS = { skipGlobalErrorAlert: true } as const

function isMissingProgramDraftError(error: unknown): boolean {
  const status = getApiErrorHttpStatus(error)
  if (status === 404) return true
  // BE: draft 미존재 시 500을 내리는 경우가 있어 등록 진입 GET은 조용히 empty 처리
  if (status === 500) return true
  return false
}

export async function fetchMyProgramDraftRemote(
  programType: string
): Promise<ProgramDraftItemResponse | null> {
  try {
    const payload = await customInstance<unknown>(
      {
        url: '/api/admin/program-draft',
        method: 'GET',
        params: { programType },
      },
      PROGRAM_DRAFT_QUIET_OPTIONS
    )
    return normalizeProgramDraftItem(payload)
  } catch (error) {
    if (isMissingProgramDraftError(error)) return null
    throw error
  }
}

export async function upsertMyProgramDraftRemote(
  body: ProgramDraftUpsertRequest
): Promise<ProgramDraftSaveResponse> {
  const payload = await customInstance<unknown>({
    url: '/api/admin/program-draft',
    method: 'PUT',
    data: body,
  })

  const normalized = normalizeProgramDraftSaveResponse(payload)
  const unwrapped = unwrapApiBody<ProgramDraftSaveResponse>(payload)
  if (normalized?.draftId != null) {
    return {
      ...unwrapped,
      draftId: normalized.draftId,
      programType: normalized.programType ?? unwrapped?.programType ?? body.programType,
      saved: unwrapped?.saved ?? true,
    }
  }
  return unwrapped
}

export async function deleteMyProgramDraftRemote(programType: string): Promise<void> {
  try {
    await customInstance(
      {
        url: '/api/admin/program-draft',
        method: 'DELETE',
        params: { programType },
      },
      PROGRAM_DRAFT_QUIET_OPTIONS
    )
  } catch (error) {
    if (isMissingProgramDraftError(error)) return
    throw error
  }
}
