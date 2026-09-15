/**
 * 1사1교 1일1교 충돌 — instructor_assignment_calendar SSOT + list lectureDate.
 * BE error code: ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT
 */

import type { InstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentListItemResponse'
import type { WaitingInstructorAssignmentStatus } from '@/features/program/general/lib/waiting-instructor-assignment'
import type {
  InstructorAssignmentCalendarItem,
  InstructorAssignmentListItemEnriched,
} from '@/features/program/general/api/instructor-assignment-types'

export const ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT =
  'ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT' as const

/** 409 안내 — BE message와 동일 톤 */
export const ONE_SCHOOL_PER_DAY_CONFLICT_ALERT_MESSAGE =
  '같은 강사를 같은 날짜에 두 학교에 배정할 수 없습니다.'

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

function addOccupied(
  occupied: Map<string, Set<string>>,
  key: string | null | undefined,
  dateKey: string
) {
  if (!key) return
  const id = String(key)
  let set = occupied.get(id)
  if (!set) {
    set = new Set()
    occupied.set(id, set)
  }
  set.add(dateKey)
}

/**
 * Calendar GET items → 강사 memberId → 점유 강의일.
 * activeYn === false 는 제외.
 */
export function buildOccupiedLectureDatesFromCalendar(
  items: InstructorAssignmentCalendarItem[] | undefined | null
): Map<string, Set<string>> {
  const occupied = new Map<string, Set<string>>()
  for (const item of items ?? []) {
    if (item.activeYn === false) continue
    const dateKey = extractLectureDateKey(item.lectureDate)
    if (!dateKey || item.instructorMemberId == null) continue
    addOccupied(occupied, String(item.instructorMemberId), dateKey)
  }
  return occupied
}

/**
 * 강사 키 → 점유 강의일.
 * 1) assignment.lectureDate (enrich) 우선
 * 2) scheduleId → scheduleDateById 폴백
 */
export function buildOccupiedLectureDatesByInstructorKeys(
  assignments:
    | Array<InstructorAssignmentListItemResponse | InstructorAssignmentListItemEnriched>
    | undefined
    | null,
  scheduleDateById: Map<string, string>
): Map<string, Set<string>> {
  const occupied = new Map<string, Set<string>>()

  for (const assignment of assignments ?? []) {
    if (!isActiveInstructorAssignmentStatus(assignment.assignmentStatus)) continue
    const enriched = assignment as InstructorAssignmentListItemEnriched
    const dateKey =
      extractLectureDateKey(enriched.lectureDate) ??
      (assignment.scheduleId != null
        ? scheduleDateById.get(String(assignment.scheduleId))
        : undefined)
    if (!dateKey) continue
    addOccupied(
      occupied,
      assignment.participantId != null ? String(assignment.participantId) : null,
      dateKey
    )
    addOccupied(
      occupied,
      assignment.instructorMemberId != null ? String(assignment.instructorMemberId) : null,
      dateKey
    )
  }

  return occupied
}

/** calendar Map + list Map 병합 */
export function mergeOccupiedLectureDateMaps(
  ...maps: Array<Map<string, Set<string>> | undefined | null>
): Map<string, Set<string>> {
  const merged = new Map<string, Set<string>>()
  for (const map of maps) {
    if (!map) continue
    for (const [key, dates] of map) {
      let set = merged.get(key)
      if (!set) {
        set = new Set()
        merged.set(key, set)
      }
      for (const d of dates) set.add(d)
    }
  }
  return merged
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
