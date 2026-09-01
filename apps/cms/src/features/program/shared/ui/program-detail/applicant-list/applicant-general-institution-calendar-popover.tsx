/**
 * 일반 프로그램 > 기관 신청 목록 캘린더 — 날짜 셀 hover 팝오버
 */

import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type { CalendarItem } from '@/shared/components/calendar'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from '@/shared/components/calendar/ui/item-list/calendar-approval-status-badge'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'
import {
  findInstitutionSessionsForDate,
  formatInstitutionCalendarSessionsTimeDisplay,
  getInstitutionRegionShort,
} from './applicant-institution-calendar-session'

function resolveInstitutionFromCalendarItem(item: CalendarItem): {
  institution: ApplicantSchoolRow
  dateKey: string
} | null {
  const wrapped = item.original as ApplicantCalendarEvent | ApplicantSchoolRow | null
  if (wrapped == null || typeof wrapped !== 'object') return null

  const institution =
    'originalItem' in wrapped && wrapped.originalItem != null
      ? (wrapped.originalItem as ApplicantSchoolRow)
      : 'schoolName' in wrapped
        ? (wrapped as ApplicantSchoolRow)
        : null

  if (institution == null || typeof institution.schoolName !== 'string') return null

  const dateKey = dayjs(item.startDate).format('YYYY-MM-DD')
  return { institution, dateKey }
}

function approvalStatusModifier(status: ApprovalStatusKey | undefined): ApprovalStatusKey {
  if (status === 'approved' || status === 'rejected' || status === 'pending') {
    return status
  }
  return 'pending'
}

export function renderGeneralInstitutionCalendarPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <div className="participating-institutions-calendar-popover">
      {events.map(item => {
        const resolved = resolveInstitutionFromCalendarItem(item)
        if (resolved == null) return null

        const { institution, dateKey } = resolved
        const sessions = findInstitutionSessionsForDate(institution, dateKey)
        const titleColor = colorMap.get(item.id)?.text
        const sessionLine = formatInstitutionCalendarSessionsTimeDisplay(
          sessions,
          institution.desiredEducationPeriod
        )
        const gradeLabel = institution.educationGrade?.trim() || '-'
        const approvalStatus = approvalStatusModifier(
          institution.approvalStatus as ApprovalStatusKey | undefined
        )

        return (
          <div key={String(item.id)} className="participating-institutions-calendar-popover__entry">
            <div className="participating-institutions-calendar-popover__title-row">
              <span
                className="participating-institutions-calendar-popover__title"
                style={titleColor ? { color: titleColor } : undefined}
              >
                {institution.schoolName.trim() || '-'}
              </span>
              <CalendarApprovalStatusBadge status={approvalStatus} />
            </div>
            <div className="participating-institutions-calendar-popover__meta">
              <span className="participating-institutions-calendar-popover__meta-part">
                {getInstitutionRegionShort(institution.region)}
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
