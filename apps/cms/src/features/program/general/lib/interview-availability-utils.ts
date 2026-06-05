import type {
  GeneralVolunteerApplicantRow,
  GeneralVolunteerInterviewAvailabilityDay,
} from '@/data/mock/general-volunteer-applicants-mock'
import {
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-interview-assign-schedule-utils'
import { parseUjatInterviewDateLabel } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview-calendar-events'

function parseInterviewDateLabel(label: string) {
  return parseUjatInterviewDateLabel(label) ?? parseInterviewDisplayDateLabel(label)
}

function dateLabelsMatch(a: string, b: string): boolean {
  const da = parseInterviewDateLabel(a)
  const db = parseInterviewDateLabel(b)
  if (da && db) return da.isSame(db, 'day')
  return a === b
}

export function isAssignedInterviewSlot(
  applicant: GeneralVolunteerApplicantRow,
  dateLabel: string,
  slot: string
): boolean {
  if (applicant.interviewAssignmentStatus !== 'assigned') return false
  if (!applicant.assignedInterviewDateLabel || !applicant.assignedInterviewTime) return false
  if (!dateLabelsMatch(applicant.assignedInterviewDateLabel, dateLabel)) return false
  return normalizeTimeRangeKey(applicant.assignedInterviewTime) === normalizeTimeRangeKey(slot)
}

export function countInterviewAvailabilitySlots(
  days: GeneralVolunteerInterviewAvailabilityDay[]
): number {
  return days.reduce((sum, day) => sum + day.slots.length, 0)
}

/** 배정·재배정 확정 슬롯을 면접 진행 가능 일정 목록에 반영 — 상세 `(배정)` 표시용 */
export function mergeAssignedInterviewIntoAvailability(
  applicant: GeneralVolunteerApplicantRow
): GeneralVolunteerInterviewAvailabilityDay[] {
  const {
    interviewAvailability,
    interviewAssignmentStatus,
    assignedInterviewDateLabel,
    assignedInterviewTime,
  } = applicant

  if (
    interviewAssignmentStatus !== 'assigned' ||
    !assignedInterviewDateLabel ||
    !assignedInterviewTime
  ) {
    return interviewAvailability
  }

  const normalizedAssignedTime = normalizeTimeRangeKey(assignedInterviewTime)
  const existingDayIndex = interviewAvailability.findIndex(day =>
    dateLabelsMatch(day.dateLabel, assignedInterviewDateLabel)
  )

  if (existingDayIndex >= 0) {
    const day = interviewAvailability[existingDayIndex]
    const hasSlot = day.slots.some(
      slot => normalizeTimeRangeKey(slot) === normalizedAssignedTime
    )
    if (hasSlot) return interviewAvailability

    return interviewAvailability.map((entry, index) =>
      index === existingDayIndex
        ? { ...entry, slots: [...entry.slots, assignedInterviewTime] }
        : entry
    )
  }

  return [
    ...interviewAvailability,
    { dateLabel: assignedInterviewDateLabel, slots: [assignedInterviewTime] },
  ]
}
