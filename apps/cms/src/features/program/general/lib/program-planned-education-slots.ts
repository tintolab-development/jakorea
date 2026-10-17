import {
  fetchAdminProgramEducationSlotsRemote,
  fetchAdminProgramSchedulesRemote,
} from '@/features/program/general/api/program-schedules-api-client'
import type { AdminProgramScheduleResponse } from '@/features/program/shared/api/admin-program-schedule-response'
import {
  filterProgramSchedulesForNewEducationAssignment,
  mergeProgramScheduleCanonicalFields,
} from '@/features/program/shared/lib/program-schedule-canonical'
import { isPlannedProgramScheduleForLegacySchedulesList } from '@/features/program/shared/lib/program-schedule-origin'
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

export function filterProgramSchedulesForPlannedEducationDisplay<T extends ProgramScheduleResponse>(
  schedules: ReadonlyArray<T>
): T[] {
  const planned = schedules.filter(schedule =>
    isPlannedProgramScheduleForLegacySchedulesList(schedule)
  )
  return filterProgramSchedulesForNewEducationAssignment(planned)
}

export function mapEducationSlotsToPlannedAdminSchedules(
  slots: ReadonlyArray<ProgramEducationSlotResponse>
): AdminProgramScheduleResponse[] {
  return slots.map(mapEducationSlotToAdminScheduleShape)
}

/**
 * 예정 슬롯 SSOT — `GET education-slots` 우선.
 * API 미배포·빈 응답 시 `/schedules`에서 origin·role 필터 폴백.
 */
export async function fetchProgramPlannedEducationSlots(
  programId: string
): Promise<AdminProgramScheduleResponse[]> {
  const trimmed = programId.trim()
  if (!trimmed) return []

  try {
    const slots = await fetchAdminProgramEducationSlotsRemote(trimmed)
    if (slots.length > 0) {
      return mapEducationSlotsToPlannedAdminSchedules(slots)
    }
  } catch {
    // education-slots 미배포·권한 오류 — 레거시 schedules 폴백
  }

  const schedules = await fetchAdminProgramSchedulesRemote(trimmed)
  return filterProgramSchedulesForPlannedEducationDisplay(schedules)
}

export function resolvePlannedEducationSlotsFromCaches(input: {
  educationSlots?: ReadonlyArray<ProgramEducationSlotResponse> | null
  programSchedules?: ReadonlyArray<ProgramScheduleResponse> | null
}): AdminProgramScheduleResponse[] {
  const slots = input.educationSlots ?? []
  if (slots.length > 0) {
    return mapEducationSlotsToPlannedAdminSchedules(slots)
  }
  return filterProgramSchedulesForPlannedEducationDisplay(input.programSchedules ?? [])
}
