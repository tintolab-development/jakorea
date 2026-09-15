/**
 * 1사1교 1일1교 충돌 — instructor_assignment_calendar write 가드와 동일 기준(강사×강의일).
 * BE error code: ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT
 * Calendar 전용 GET은 없으므로 assignments + schedule.startAt 날짜로 FE 유도.
 */

import type { InstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentListItemResponse'
import type { WaitingInstructorAssignmentStatus } from '@/features/program/general/lib/waiting-instructor-assignment'

export const ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT =
  'ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT' as const

export const ONE_SCHOOL_PER_DAY_CONFLICT_ALERT_MESSAGE =
  '동일 강사는 하루 한 학교만 배정할 수 있습니다. (1일1교)'

const ACTIVE_ASSIGNMENT_STATUSES = new Set([
  'ASSIGNED',
  'WAITING_ASSIGNMENT',
  'CONFIRMED',
  'COMPLETED',
  'IN_PROGRESS',
])

/** YYYY-MM-DD 키. `YYYY. MM. DD` · ISO datetime · `2026-09-12(금)` 허용 */
export function extractLectureDateKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  const isoDate = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`
  const dotted = trimmed.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/)
  if (dotted) {
    return `${dotted[1]}-${dotted[2].padStart(2, '0')}-${dotted[3].padStart(2, '0')}`
  }
  return null
}

export function isActiveInstructorAssignmentStatus(status: string | null | undefined): boolean {
  if (!status?.trim()) return true
  const normalized = status.trim().toUpperCase()
  if (normalized === 'CANCELLED' || normalized === 'CANCELED' || normalized === 'REJECTED') {
    return false
  }
  if (ACTIVE_ASSIGNMENT_STATUSES.has(normalized)) return true
  // 알 수 없는 상태도 활성으로 취급(충돌 과소 표시 방지)
  return true
}

export function buildScheduleLectureDateById(
  schedules: Array<{ scheduleId?: number | string | null; startAt?: string | null }>
): Map<string, string> {
  const map = new Map<string, string>()
  for (const schedule of schedules) {
    if (schedule.scheduleId == null) continue
    const dateKey = extractLectureDateKey(schedule.startAt ?? undefined)
    if (!dateKey) continue
    map.set(String(schedule.scheduleId), dateKey)
  }
  return map
}

/**
 * 강사 키(participantId · memberId) → 이미 점유된 강의일(YYYY-MM-DD) 집합.
 * 동일 기관 배정일도 포함(정책: 강사×일 중복 금지).
 */
export function buildOccupiedLectureDatesByInstructorKeys(
  assignments: InstructorAssignmentListItemResponse[] | undefined | null,
  scheduleDateById: Map<string, string>
): Map<string, Set<string>> {
  const occupied = new Map<string, Set<string>>()

  const add = (key: string | null | undefined, dateKey: string) => {
    if (!key) return
    const id = String(key)
    let set = occupied.get(id)
    if (!set) {
      set = new Set()
      occupied.set(id, set)
    }
    set.add(dateKey)
  }

  for (const assignment of assignments ?? []) {
    if (!isActiveInstructorAssignmentStatus(assignment.assignmentStatus)) continue
    if (assignment.scheduleId == null) continue
    const dateKey = scheduleDateById.get(String(assignment.scheduleId))
    if (!dateKey) continue
    add(
      assignment.participantId != null ? String(assignment.participantId) : null,
      dateKey
    )
    add(
      assignment.instructorMemberId != null ? String(assignment.instructorMemberId) : null,
      dateKey
    )
  }

  return occupied
}

export function resolveOneSchoolPerDayAssignmentStatus(
  hopeDateOrLine: string | null | undefined,
  occupiedDatesForInstructor: Set<string> | undefined | null
): WaitingInstructorAssignmentStatus {
  const hopeDate = extractLectureDateKey(hopeDateOrLine)
  if (!hopeDate || !occupiedDatesForInstructor?.size) return 'waiting'
  return occupiedDatesForInstructor.has(hopeDate) ? 'unavailable' : 'waiting'
}

export function isOneSchoolPerDayConflictErrorCode(code: string | null | undefined): boolean {
  return code?.trim() === ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT
}
