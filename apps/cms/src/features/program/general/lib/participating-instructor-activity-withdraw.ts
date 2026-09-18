import type { ParticipatingInstructorEducationScheduleRow } from '@/features/program/general/model/participating-instructors'

export type ParticipatingInstructorActivityWithdrawReason = 'institution'

export interface ParticipatingInstructorActivityWithdrawPayload {
  reason: ParticipatingInstructorActivityWithdrawReason
  stopScheduleId?: string
}

export interface ParticipatingInstructorActivityWithdrawScheduleOption {
  value: string
  label: string
}

/** 활동 포기 모달 — 활동 중단일 선택지 (participants sessions enrich) */
export function getParticipatingInstructorActivityWithdrawScheduleOptions(
  schedules: ReadonlyArray<ParticipatingInstructorEducationScheduleRow> = [],
  excludedScheduleIds: ReadonlyArray<string> = []
): ParticipatingInstructorActivityWithdrawScheduleOption[] {
  const excluded = new Set(excludedScheduleIds)
  return schedules
    .filter(row => !excluded.has(row.id))
    .map(row => ({
      value: row.id,
      label: row.scheduleLabel,
    }))
}

/**
 * 실적 반영 기준 — 선택한 활동 중단일(schedule)까지 포함, 이후 일정은 실적 집계에서 제외.
 * API 연동 시 동일 규칙으로 education-record / performance aggregation에 적용할 것.
 */
export function resolveParticipatingInstructorPerformanceIncludedScheduleIds(
  schedules: ReadonlyArray<ParticipatingInstructorEducationScheduleRow>,
  stopScheduleId: string | undefined
): string[] {
  if (schedules.length === 0) return []
  if (!stopScheduleId) {
    return schedules
      .filter(row => row.progress === 'completed' || row.progress === 'in_progress')
      .map(row => row.id)
  }

  const stopIndex = schedules.findIndex(row => row.id === stopScheduleId)
  if (stopIndex === -1) return []

  return schedules.slice(0, stopIndex + 1).map(row => row.id)
}

