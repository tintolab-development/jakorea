import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import {
  GENERAL_INTERVIEW_ASSIGNMENT_STATUS_CALENDAR_LIST_TAG_LABELS,
  type GeneralInterviewAssignmentStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { normalizeTimeRangeKey } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'

export type GeneralVolunteerDocPassedCalendarListRow = {
  /** 색상·클릭용 대표 이벤트 id */
  id: string
  volunteerName: string
  assignmentStatus: GeneralInterviewAssignmentStatus
  assignmentStatusLabel: string
  /** 선택일 기준 가장 빠른 시간 + `외 N개` */
  daySlotSummary: string
  /** 신청한 전체 면접 가능 일정 수 */
  interviewSlotCount: number
}

function parseSlotStartMinutes(slot: string): number {
  const normalized = normalizeTimeRangeKey(slot)
  const match = normalized.match(/(\d{2}):(\d{2})/)
  if (!match) return Number.POSITIVE_INFINITY
  return Number(match[1]) * 60 + Number(match[2])
}

function sortSlotLabels(slots: string[]): string[] {
  return [...slots].sort((a, b) => parseSlotStartMinutes(a) - parseSlotStartMinutes(b))
}

function formatDaySlotSummary(slots: string[]): string {
  const sorted = sortSlotLabels(slots)
  const primarySlot = sorted[0] ?? ''
  const extraCount = sorted.length - 1
  if (!primarySlot) return ''
  return extraCount > 0 ? `${primarySlot} 외 ${extraCount}개` : primarySlot
}

export function buildGeneralVolunteerDocPassedCalendarListRows(
  dayEvents: GeneralVolunteerInterviewCalendarEvent[]
): GeneralVolunteerDocPassedCalendarListRow[] {
  const grouped = new Map<
    string,
    {
      representativeId: string
      volunteerName: string
      assignmentStatus: GeneralInterviewAssignmentStatus
      interviewSlotCount: number
      slots: string[]
      slotSet: Set<string>
    }
  >()

  for (const event of dayEvents) {
    const key = event.volunteerName.trim()
    if (!key) continue

    let group = grouped.get(key)
    if (!group) {
      group = {
        representativeId: String(event.id),
        volunteerName: key,
        assignmentStatus: event.originalItem.interviewAssignmentStatus,
        interviewSlotCount: event.originalItem.interviewSlotCount,
        slots: [],
        slotSet: new Set<string>(),
      }
      grouped.set(key, group)
    }

    const slot = event.slotLabel.trim()
    if (slot && !group.slotSet.has(slot)) {
      group.slotSet.add(slot)
      group.slots.push(slot)
    }
  }

  return Array.from(grouped.values()).map(group => ({
    id: group.representativeId,
    volunteerName: group.volunteerName,
    assignmentStatus: group.assignmentStatus,
    assignmentStatusLabel:
      GENERAL_INTERVIEW_ASSIGNMENT_STATUS_CALENDAR_LIST_TAG_LABELS[group.assignmentStatus],
    daySlotSummary: formatDaySlotSummary(group.slots),
    interviewSlotCount: group.interviewSlotCount,
  }))
}
