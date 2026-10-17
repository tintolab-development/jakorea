/**
 * GET /api/admin/programs/{programId}/schedules
 * 1사1교 배정 create용 scheduleId · 강의일 매칭 SSOT (dashboard schedules 대체 권장)
 *
 * additive: educationSlotKey, scheduleRole, scheduleStatus, publiclyVisible —
 * Orval 반영 전 {@link readProgramScheduleCanonicalFields} 로 loose read.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { AdminProgramScheduleResponse } from '@/features/program/shared/api/admin-program-schedule-response'
import { mergeProgramScheduleCanonicalFields } from '@/features/program/shared/lib/program-schedule-canonical'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'

/** GET /api/admin/programs/{programId}/education-slots — 프로그램 공통 교육 예정 슬롯 (materialized 제외) */
export async function fetchAdminProgramEducationSlotsRemote(
  programId: string
): Promise<ProgramEducationSlotResponse[]> {
  const body = await unwrapApiBody<
    | ProgramEducationSlotResponse[]
    | { items?: ProgramEducationSlotResponse[]; content?: ProgramEducationSlotResponse[] }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/education-slots`,
      method: 'GET',
    })
  )
  const rows = Array.isArray(body) ? body : body.items ?? body.content ?? []
  return rows
}

export async function fetchAdminProgramSchedulesRemote(
  programId: string
): Promise<AdminProgramScheduleResponse[]> {
  const body = await unwrapApiBody<
    ProgramScheduleResponse[] | { items?: ProgramScheduleResponse[]; content?: ProgramScheduleResponse[] }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/schedules`,
      method: 'GET',
    })
  )
  const rows = Array.isArray(body) ? body : body.items ?? body.content ?? []
  return rows.map(row => mergeProgramScheduleCanonicalFields(row))
}
