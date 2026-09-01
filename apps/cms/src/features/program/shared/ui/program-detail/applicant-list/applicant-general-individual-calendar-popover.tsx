/**
 * 일반 프로그램 > 개인(참여자) 신청 목록 캘린더 — 날짜 셀 hover 팝오버 (면접 없음)
 */

import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type { CalendarItem } from '@/shared/components/calendar'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'
import {
  findInstitutionSessionForDate,
  formatInstitutionCalendarSessionTimeDisplay,
  getInstitutionRegionShort,
} from './applicant-institution-calendar-session'

function resolveIndividualFromCalendarItem(item: CalendarItem): {
  applicant: GeneralIndividualApplicantRow
  dateKey: string
} | null {
  const wrapped = item.original as ApplicantCalendarEvent | GeneralIndividualApplicantRow | null
  if (wrapped == null || typeof wrapped !== 'object') return null

  const applicant =
    'originalItem' in wrapped && wrapped.originalItem != null
      ? (wrapped.originalItem as GeneralIndividualApplicantRow)
      : 'applicantName' in wrapped
        ? (wrapped as GeneralIndividualApplicantRow)
        : null

  if (applicant == null || typeof applicant.applicantName !== 'string') return null

  const dateKey = dayjs(item.startDate).format('YYYY-MM-DD')
  return { applicant, dateKey }
}

export function renderGeneralIndividualCalendarPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <div className="participating-institutions-calendar-popover">
      {events.map(item => {
        const resolved = resolveIndividualFromCalendarItem(item)
        if (resolved == null) return null

        const { applicant, dateKey } = resolved
        const session = findInstitutionSessionForDate(applicant, dateKey)
        const titleColor = colorMap.get(item.id)?.text
        const sessionLine = formatInstitutionCalendarSessionTimeDisplay(session)
        const gradeLabel = applicant.educationGrade?.trim() || '-'

        return (
          <div key={String(item.id)} className="participating-institutions-calendar-popover__entry">
            <div
              className="participating-institutions-calendar-popover__title"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {applicant.applicantName.trim() || '-'}
            </div>
            <div className="participating-institutions-calendar-popover__meta">
              <span className="participating-institutions-calendar-popover__meta-part">
                {getInstitutionRegionShort(applicant.homeAddress)}
              </span>
              <span className="participating-institutions-calendar-popover__meta-sep" aria-hidden />
              <span className="participating-institutions-calendar-popover__meta-part">
                {gradeLabel}
              </span>
              {sessionLine !== '-' ? (
                <>
                  <span
                    className="participating-institutions-calendar-popover__meta-sep"
                    aria-hidden
                  />
                  <span className="participating-institutions-calendar-popover__meta-part participating-institutions-calendar-popover__meta-part--session">
                    {sessionLine}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
