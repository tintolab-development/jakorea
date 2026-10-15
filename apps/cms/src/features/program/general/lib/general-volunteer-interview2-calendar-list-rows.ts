import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import {
  computeGeneralInterviewTotalScore,
  resolveGeneralEffectiveSecondInterviewStatus,
  type GeneralEffectiveSecondInterviewStatus,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { isGeneralVolunteerInterview2SelectableForResult } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/general-volunteer-interview2-actions'

export type GeneralVolunteerInterview2CalendarListRow = {
  /** 지원자 id — 체크박스·rowKey */
  id: string
  /** 캘린더 이벤트 id — 색상 조회 */
  eventId: string
  volunteerName: string
  slotLabel: string
  effectiveStatus: GeneralEffectiveSecondInterviewStatus
  totalScore: number | null
  selectableForResult: boolean
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
    selectableForResult: isGeneralVolunteerInterview2SelectableForResult(event.originalItem),
  }))
}
