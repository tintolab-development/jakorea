import {
  fetchAdminProgramEducationSlotsRemote,
} from '@/features/program/general/api/program-schedules-api-client'
import type { AdminProgramScheduleResponse } from '@/features/program/shared/api/admin-program-schedule-response'
import {
  filterProgramSchedulesForNewEducationAssignment,
  mergeProgramScheduleCanonicalFields,
} from '@/features/program/shared/lib/program-schedule-canonical'
import { PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED } from '@/features/program/shared/lib/program-schedule-origin'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

/** education-slots 응답 → 승인·OSA·설문에서 쓰는 최소 ProgramScheduleResponse 호환 뷰 */
export function mapEducationSlotToAdminScheduleShape(
  slot: ProgramEducationSlotResponse
): AdminProgramScheduleResponse {
  const scheduleId =
    typeof slot.scheduleId === 'number' && Number.isFinite(slot.scheduleId) && slot.scheduleId > 0
      ? Math.trunc(slot.scheduleId)
      : undefined
  const base: ProgramScheduleResponse = {
    id: scheduleId,
    sessionNo: slot.sessionNo,
    startAt: slot.startAt,
    endAt: slot.endAt,
    allDay: slot.allDay,
    scheduleOrigin: slot.scheduleOrigin,
  }
  return mergeProgramScheduleCanonicalFields({
    ...base,
    educationSlotKey: slot.educationSlotKey,
    scheduleRole: slot.scheduleRole,
    scheduleStatus: slot.scheduleStatus,
  })
}

function isProgramDefinedEducationSlot(slot: ProgramEducationSlotResponse): boolean {
  return slot.scheduleOrigin?.trim().toUpperCase() === PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED
}

export function mapEducationSlotsToPlannedAdminSchedules(
  slots: ReadonlyArray<ProgramEducationSlotResponse>
): AdminProgramScheduleResponse[] {
  return filterProgramSchedulesForNewEducationAssignment(
    slots.filter(isProgramDefinedEducationSlot).map(mapEducationSlotToAdminScheduleShape)
  )
}

/**
 * 예정 슬롯 SSOT — `GET education-slots` only.
 * 빈 배열은 BE 배포·migration 미반영 또는 공통 예정 일정 없음으로 처리하며 `/schedules`로 폴백하지 않는다.
 */
export async function fetchProgramPlannedEducationSlots(
  programId: string
): Promise<AdminProgramScheduleResponse[]> {
  const trimmed = programId.trim()
  if (!trimmed) return []

  const slots = await fetchAdminProgramEducationSlotsRemote(trimmed)
  return mapEducationSlotsToPlannedAdminSchedules(slots)
}

export function resolvePlannedEducationSlotsFromCaches(input: {
  educationSlots?: ReadonlyArray<ProgramEducationSlotResponse> | null
}): AdminProgramScheduleResponse[] {
  const slots = input.educationSlots ?? []
  return mapEducationSlotsToPlannedAdminSchedules(slots)
}
