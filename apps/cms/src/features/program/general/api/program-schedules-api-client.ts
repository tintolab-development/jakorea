/**
 * GET /api/admin/programs/{programId}/schedules
 * 1사1교 배정 create용 scheduleId · 강의일 매칭 SSOT (dashboard schedules 대체 권장)
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

export async function fetchAdminProgramSchedulesRemote(
  programId: string
): Promise<ProgramScheduleResponse[]> {
  const body = await unwrapApiBody<
    ProgramScheduleResponse[] | { items?: ProgramScheduleResponse[]; content?: ProgramScheduleResponse[] }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/schedules`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? body.content ?? []
}
