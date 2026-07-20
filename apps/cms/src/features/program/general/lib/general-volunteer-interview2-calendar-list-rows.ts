import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import {
  computeGeneralInterviewTotalScore,
  resolveGeneralEffectiveSecondInterviewStatus,
  type GeneralEffectiveSecondInterviewStatus,
} from '@/features/program/general/lib/general-volunteer-interview2-display'

export type GeneralVolunteerInterview2CalendarListRow = {
  /** 지원자 id — 체크박스·rowKey */
  id: string
  /** 캘린더 이벤트 id — 색상 조회 */
  eventId: string
  volunteerName: string
  slotLabel: string
  effectiveStatus: GeneralEffectiveSecondInterviewStatus
  totalScore: number | null
}

export function buildGeneralVolunteerInterview2CalendarListRows(
  dayEvents: GeneralVolunteerInterviewCalendarEvent[]
): GeneralVolunteerInterview2CalendarListRow[] {
  return dayEvents.map(event => ({
    id: event.originalItem.id,
    eventId: String(event.id),
    volunteerName: event.volunteerName,
    slotLabel: event.slotLabel,
    effectiveStatus: resolveGeneralEffectiveSecondInterviewStatus(event.originalItem),
    totalScore: computeGeneralInterviewTotalScore(event.originalItem),
  }))
}
