import type { ReactNode } from 'react'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import type { CalendarItem } from '@/shared/components/calendar/lib/calendar-helpers'
import { calendarItemsForEventMode } from '@/shared/components/calendar/lib/calendar-helpers'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'

export type GeneralInstitutionMonthCellMeta = {
  institution: ApplicantSchoolRow
}

function resolveInstitutionFromCalendarItem(item: CalendarItem): ApplicantSchoolRow | null {
  const wrapped = item.original as ApplicantCalendarEvent | ApplicantSchoolRow | null
  if (wrapped == null || typeof wrapped !== 'object') return null

  const institution =
    'originalItem' in wrapped && wrapped.originalItem != null
      ? (wrapped.originalItem as ApplicantSchoolRow)
      : 'schoolName' in wrapped
        ? (wrapped as ApplicantSchoolRow)
        : null

  if (institution == null || typeof institution.schoolName !== 'string') return null
  return institution
}

/** 일반 프로그램 기관 신청 — 월간 셀: 기관 1건당 strip 1개 (세션 N개 묶음) */
export function buildGeneralInstitutionCalendarMonthCellRows(
  dayItems: CalendarItem[]
): CalendarMonthCellRow[] {
  const dayEvents = calendarItemsForEventMode(dayItems)
  const grouped = new Map<
    string,
    { institution: ApplicantSchoolRow; sourceEvent: CalendarItem }
  >()

  for (const event of dayEvents) {
    const institution = resolveInstitutionFromCalendarItem(event)
    if (!institution) continue
    const key =
      typeof institution.id === 'string' && institution.id.trim() !== ''
        ? institution.id.trim()
        : String(event.id)
    if (!grouped.has(key)) {
      grouped.set(key, { institution, sourceEvent: event })
    }
  }

  return Array.from(grouped.values()).map(({ institution, sourceEvent }) => ({
    id: institution.id,
    sourceEvent,
    meta: { institution } satisfies GeneralInstitutionMonthCellMeta,
  }))
}

export function renderGeneralInstitutionCalendarMonthEventContent({
  row,
}: {
  row: CalendarMonthCellRow
  colors: ScheduleColorPair
}): ReactNode {
  const meta = row.meta as GeneralInstitutionMonthCellMeta | undefined
  const name =
    meta?.institution.schoolName?.trim() ||
    String(row.sourceEvent.title ?? '').replace(/^\[.*?\]\s*/, '').trim() ||
    '-'
  return <span className="calendar-event-title">{name}</span>
}
