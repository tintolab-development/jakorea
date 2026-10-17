/**
 * 일반 프로그램 > 강사 신청 목록 캘린더 — 날짜 셀 hover 팝오버
 * 기관명(제목) + 지역 | 차시(시간) | 신청 인원
 */

import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type { CalendarItem } from '@/shared/components/calendar'
import { formatInstitutionRegionForTableDisplay } from '@/shared/lib/format-institution-region-display'
import type {
  ApplicantCalendarEvent,
  ApplicantInstructorCalendarEventItem,
} from './applicant-calendar-events'
import { resolveInstructorCalendarInstitutionName } from './applicant-calendar-events'
import { formatInstitutionCalendarSessionsTimeDisplay } from './applicant-institution-calendar-session'

function resolveInstructorInstitutionFromCalendarItem(item: CalendarItem): {
  schoolName: string
  regionDisplay: string
  applicantCount: number
  sessionLabel: string
} | null {
  const wrapped = item.original as
    | ApplicantCalendarEvent
    | ApplicantInstructorCalendarEventItem
    | null
  if (wrapped == null || typeof wrapped !== 'object') return null

  const row =
    'originalItem' in wrapped && wrapped.originalItem != null
      ? (wrapped.originalItem as ApplicantInstructorCalendarEventItem)
      : 'calendarInstitutionSummary' in wrapped
        ? (wrapped as ApplicantInstructorCalendarEventItem)
        : null

  if (row == null) return null

  const summary = row.calendarInstitutionSummary
  if (summary == null) return null

  const schoolName = resolveInstructorCalendarInstitutionName(row)
  const regionRaw =
    row.calendarInstitutionRow?.region?.trim() || summary.regionDisplay?.trim() || ''
  const regionDisplay = formatInstitutionRegionForTableDisplay(regionRaw)
  const sessionsOnDate = row.sessionsOnDate ?? []
  const sessionLabel = formatInstitutionCalendarSessionsTimeDisplay(
    sessionsOnDate,
    row.calendarInstitutionRow?.desiredEducationPeriod
  )

  return {
    schoolName,
    regionDisplay,
    applicantCount: summary.applicantCount,
    sessionLabel,
  }
}

export function renderGeneralInstructorCalendarPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <div className="participating-institutions-calendar-popover">
      {events.map(item => {
        const resolved = resolveInstructorInstitutionFromCalendarItem(item)
        if (resolved == null) return null

        const { schoolName, regionDisplay, applicantCount, sessionLabel } = resolved
        const titleColor = colorMap.get(item.id)?.text

        return (
          <div key={String(item.id)} className="participating-institutions-calendar-popover__entry">
            <div
              className="participating-institutions-calendar-popover__title"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {schoolName}
            </div>
            <div className="participating-institutions-calendar-popover__meta participating-institutions-calendar-popover__meta--applicant-instructor">
              <span className="participating-institutions-calendar-popover__meta-part">
                {regionDisplay}
              </span>
              {sessionLabel !== '-' ? (
                <>
                  <span
                    className="participating-institutions-calendar-popover__meta-sep"
                    aria-hidden
                  />
                  <span className="participating-institutions-calendar-popover__meta-part">
                    {sessionLabel}
                  </span>
                </>
              ) : null}
              <span className="participating-institutions-calendar-popover__meta-sep" aria-hidden />
              <span className="participating-institutions-calendar-popover__meta-part">
                {`신청 : ${applicantCount}명`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
