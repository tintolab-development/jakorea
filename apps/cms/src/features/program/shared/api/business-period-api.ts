import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

/** `PATCH /api/admin/programs/{programId}/business-period` 요청 */
export type ProgramBusinessPeriodExtendRequest = {
  businessEndDate: string
  reason?: string
}

export type ProgramBusinessPeriodHistoryItem = {
  previousBusinessEndDate?: string | null
  businessEndDate?: string | null
  reason?: string | null
  changedByName?: string | null
  changedAt?: string | null
}

/** `PATCH /api/admin/programs/{programId}/business-period` 응답 */
export type ProgramBusinessPeriodResponse = {
  programId?: number
  businessStartDate?: string | null
  businessEndDate?: string | null
  previousBusinessEndDate?: string | null
  reason?: string | null
  changedByName?: string | null
  changedAt?: string | null
  businessPeriodHistories?: ProgramBusinessPeriodHistoryItem[]
}

export async function extendBusinessPeriod(
  programId: string,
  body: ProgramBusinessPeriodExtendRequest
): Promise<ProgramBusinessPeriodResponse> {
  const payload: ProgramBusinessPeriodExtendRequest = {
    businessEndDate: body.businessEndDate,
  }
  const reason = body.reason?.trim()
  if (reason) payload.reason = reason

  return unwrapApiBody<ProgramBusinessPeriodResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/business-period`,
      method: 'PATCH',
      data: payload,
    })
  )
}
