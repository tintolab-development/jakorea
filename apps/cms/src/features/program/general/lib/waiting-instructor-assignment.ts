import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { ParticipatingSchoolRow, ParticipatingSchoolSession } from '@/data/mock/participating-schools'

export type WaitingInstructorAssignmentStatus = 'waiting' | 'unavailable'

export const WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS: Record<
  WaitingInstructorAssignmentStatus,
  string
> = {
  waiting: '배정 대기',
  unavailable: '배정 불가',
}

export interface WaitingInstructorHopeSchedule {
  hopeDate?: string
  hopeTime?: string
  hopeSession?: string
}

function padTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

function normalizeSlotPart(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, '')
}

/** 희망 일정·타 기관 배정 일정 비교용 슬롯 키 */
export function buildWaitingInstructorScheduleSlotKey(
  schedule: WaitingInstructorHopeSchedule
): string {
  return [
    normalizeSlotPart(schedule.hopeDate),
    normalizeSlotPart(schedule.hopeTime),
    normalizeSlotPart(schedule.hopeSession),
  ].join('|')
}

export function participatingSchoolSessionToHopeSchedule(
  session: ParticipatingSchoolSession
): WaitingInstructorHopeSchedule {
  const datePart = `${session.date}(${session.dayOfWeek})`
  const [startRaw, endRaw] = session.timeRange.split('~')
  const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  return {
    hopeDate: datePart,
    hopeTime: timePart,
    hopeSession: `${session.round}차시`,
  }
}

/**
 * 타 기관(또는 타 프로그램)에 이미 배정된 교육 일정 슬롯.
 * 동일 슬롯에 희망 일정이 겹치면 배정 불가.
 */
export function buildOccupiedWaitingInstructorScheduleSlots(
  instructorList: ParticipatingInstructorRow[],
  currentSchoolName: string,
  schoolRows: ParticipatingSchoolRow[]
): Set<string> {
  const schoolByName = new Map(schoolRows.map(s => [s.schoolName, s]))
  const occupied = new Set<string>()

  for (const instructor of instructorList) {
    const assignedSchoolName = instructor.schoolName?.trim()
    if (!assignedSchoolName || assignedSchoolName === currentSchoolName) continue

    const school = schoolByName.get(assignedSchoolName)
    const sessions = school?.sessions
    if (!sessions?.length) continue

    let h = 0
    for (let i = 0; i < instructor.id.length; i++) {
      h = (h << 5) - h + instructor.id.charCodeAt(i)
    }
    const session = sessions[Math.abs(h) % sessions.length]
    occupied.add(
      buildWaitingInstructorScheduleSlotKey(participatingSchoolSessionToHopeSchedule(session))
    )
  }

  return occupied
}

export function resolveWaitingInstructorAssignmentStatus(
  hopeSchedule: WaitingInstructorHopeSchedule,
  occupiedSlots: Set<string>
): WaitingInstructorAssignmentStatus {
  const slotKey = buildWaitingInstructorScheduleSlotKey(hopeSchedule)
  if (!slotKey || slotKey === '||') return 'waiting'
  return occupiedSlots.has(slotKey) ? 'unavailable' : 'waiting'
}

/** 배정 불가 행은 목록 하단에 노출 (스크린샷 정렬) */
export function sortWaitingInstructorRowsUnavailableToBottom<
  T extends { no: number; assignmentStatus: WaitingInstructorAssignmentStatus },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aUnavailable = a.assignmentStatus === 'unavailable' ? 1 : 0
    const bUnavailable = b.assignmentStatus === 'unavailable' ? 1 : 0
    if (aUnavailable !== bUnavailable) return aUnavailable - bUnavailable
    return b.no - a.no
  })
}
