import type { ApplicationCountResponse } from '@/shared/api/generated/dashboard/schemas/applicationCountResponse'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

/**
 * GET /api/admin/applications/counts
 *
 * The dashboard OpenAPI subset contains the response DTO, but not the operation
 * in its generated client. Keep this small adapter aligned with the published
 * OpenAPI path instead of deriving application existence from a paged list.
 */
export async function fetchProgramApplicationCountsRemote(
  programId: string | number
): Promise<ApplicationCountResponse[]> {
  const numericProgramId = Number(programId)
  if (!Number.isSafeInteger(numericProgramId) || numericProgramId <= 0) {
    throw new Error('신청 현황을 조회할 프로그램 ID가 유효하지 않습니다.')
  }

  const response = await customInstance<unknown>({
    url: '/api/admin/applications/counts',
    method: 'GET',
    params: { programId: numericProgramId },
  })
  const body = unwrapApiBody<unknown>(response)
  if (!Array.isArray(body)) {
    throw new Error('신청 현황 응답 형식이 올바르지 않습니다.')
  }
  return body as ApplicationCountResponse[]
}
