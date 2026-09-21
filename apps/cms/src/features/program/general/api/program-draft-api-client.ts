import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramDraftItemResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftItemResponse'
import type { ProgramDraftSaveResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftSaveResponse'
import type { ProgramDraftUpsertRequest } from '@/shared/api/generated/forms-surveys/schemas/programDraftUpsertRequest'

const PROGRAM_DRAFT_SKIP_ALERT = { skipGlobalErrorAlert: true } as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** GET 래퍼·에러 봉투를 draft 아이템으로 정규화. 없거나 실패면 null */
export function readProgramDraftItemResponse(payload: unknown): ProgramDraftItemResponse | null {
  if (!isRecord(payload)) return null
  if (payload.success === false) return null
  const unwrapped = unwrapApiBody<unknown>(payload)
  if (!isRecord(unwrapped)) return null
  if (unwrapped.success === false) return null
  const draftId = unwrapped.draftId
  if (typeof draftId !== 'number' || !Number.isFinite(draftId)) return null
  return unwrapped as ProgramDraftItemResponse
}

export async function fetchMyProgramDraftRemote(
  programType: string
): Promise<ProgramDraftItemResponse | null> {
  try {
    const payload = await customInstance(
      {
        url: '/api/admin/program-draft',
        method: 'GET',
        params: { programType },
      },
      PROGRAM_DRAFT_SKIP_ALERT
    )
    return readProgramDraftItemResponse(payload)
  } catch {
    return null
  }
}

export async function upsertMyProgramDraftRemote(
  body: ProgramDraftUpsertRequest,
  options?: { skipGlobalErrorAlert?: boolean }
): Promise<ProgramDraftSaveResponse> {
  return unwrapApiBody<ProgramDraftSaveResponse>(
    await customInstance(
      {
        url: '/api/admin/program-draft',
        method: 'PUT',
        data: body,
      },
      options?.skipGlobalErrorAlert === true ? PROGRAM_DRAFT_SKIP_ALERT : undefined
    )
  )
}

export async function deleteMyProgramDraftRemote(programType: string): Promise<void> {
  await customInstance(
    {
      url: '/api/admin/program-draft',
      method: 'DELETE',
      params: { programType },
    },
    PROGRAM_DRAFT_SKIP_ALERT
  )
}
