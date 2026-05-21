import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { CMS_MULTI_SELECT_TAG_COLORS } from '@/shared/ui'
import {
  CalendarMain,
  CalendarSubRightList,
  type CalendarItem,
} from '@/shared/components/calendar'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import '@/shared/components/calendar/styles/calendar.css'
import {
  buildUjatEducationProgressInstitutionCalendarEvents,
  toEducationProgressInstitutionCalendarListRow,
  type UjatEducationProgressInstitutionCalendarEvent,
  type UjatEducationProgressInstitutionCalendarOriginalItem,
} from './calendar-events'
import type { EducationProgressHalfKey } from '../ujat-education-progress-tabs'
import type { UjatEducationProgressInstitutionRow } from './types'
import '../../application-institution/list/calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function defaultCalendarDate(half: EducationProgressHalfKey): Dayjs {
  return half === 'h1' ? dayjs('2026-04-03') : dayjs('2026-09-11')
}

function extractInstitutionFromCalendarItem(
  item: CalendarItem
): UjatEducationProgressInstitutionCalendarOriginalItem | null {
  const o = item.original
  if (o != null && typeof o === 'object' && 'originalItem' in o) {
    return (o as UjatEducationProgressInstitutionCalendarEvent).originalItem
  }
  return null
}

function renderEducationProgressInstitutionPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <div className="program-preview">
      {events.map(ev => {
        const institution = extractInstitutionFromCalendarItem(ev)
        const colors = colorMap.get(ev.id) ?? SCHEDULE_COLORS[0]
        const title = institution?.institutionName ?? String(ev.title ?? '-')
        const totalClassSummary = institution?.calendarTotalClassSummary
        const scheduleDetail = institution?.calendarScheduleDetail

        return (
          <div key={String(ev.id)} className="program-preview-item program-preview-item--stack">
            <span className="program-preview-item__title" style={{ color: colors.text }}>
              {title}
            </span>
            {totalClassSummary ? (
              <div className="ujat-institution-preview__meta">
                <span className="ujat-institution-preview__meta-total">{totalClassSummary}</span>
                {scheduleDetail ? (
                  <>
                    <span className="program-preview-item__sep" aria-hidden>
                      |
                    </span>
                    <span className="ujat-institution-preview__meta-detail" title={scheduleDetail}>
                      {scheduleDetail}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function UjatEducationProgressInstitutionsCalendarView({
  rows,
  half,
}: {
  rows: UjatEducationProgressInstitutionRow[]
  half: EducationProgressHalfKey
}) {
  const initialDate = defaultCalendarDate(half)
  const events = useMemo(
    () => buildUjatEducationProgressInstitutionCalendarEvents(rows),
    [rows]
  )
  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => initialDate)
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => initialDate.startOf('month'))
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])

  useEffect(() => {
    const next = defaultCalendarDate(half)
    setSelectedDate(next)
    setCurrentMonth(next.startOf('month'))
  }, [half])

  const dayEvents = useMemo((): UjatEducationProgressInstitutionCalendarEvent[] => {
    return events.filter(event => {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      return selectedDate.isSameOrAfter(start, 'day') && selectedDate.isSameOrBefore(end, 'day')
    })
  }, [events, selectedDate])

  const schoolFilterOptions = useMemo(() => {
    const uniqueSchools = Array.from(
      new Set(dayEvents.map(ev => String(ev.originalItem?.schoolName ?? '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'ko'))
    return uniqueSchools.map((school, i) => ({
      value: school,
      label: school,
      tagColor: CMS_MULTI_SELECT_TAG_COLORS[i % CMS_MULTI_SELECT_TAG_COLORS.length],
    }))
  }, [dayEvents])

  useEffect(() => {
    setSelectedSchools(schoolFilterOptions.map(o => o.value))
  }, [schoolFilterOptions])

  const filteredDayEvents = useMemo(() => {
    if (selectedSchools.length === 0) return []
    const selectedSet = new Set(selectedSchools)
    return dayEvents.filter(ev => {
      const schoolName = String(ev.originalItem?.schoolName ?? '').trim()
      return schoolName !== '' && selectedSet.has(schoolName)
    })
  }, [dayEvents, selectedSchools])

  const listRows = useMemo(() => {
    const seen = new Set<string>()
    const out: ReturnType<typeof toEducationProgressInstitutionCalendarListRow>[] = []
    for (const ev of filteredDayEvents) {
      const item = ev.originalItem
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(toEducationProgressInstitutionCalendarListRow(item))
    }
    return out
  }, [filteredDayEvents])

  const listColorMap = useMemo(
    () => buildResolvedColorMap(filteredDayEvents),
    [filteredDayEvents, buildResolvedColorMap]
  )

  const resolveRowColors = useCallback(
    (row: { id: string }) => {
      const match = filteredDayEvents.find(ev => ev.originalItem.id === row.id)
      return match ? (listColorMap.get(match.id) ?? SCHEDULE_COLORS[0]) : SCHEDULE_COLORS[0]
    },
    [filteredDayEvents, listColorMap]
  )

  const handleDateSelect = useCallback((date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prev => (date.isSame(prev, 'month') ? prev : date.startOf('month')))
  }, [])

  const handleMonthChange = useCallback((month: Dayjs) => {
    setCurrentMonth(month)
  }, [])

  const handleTodayClick = useCallback(() => {
    const today = defaultCalendarDate(half)
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }, [half])

  return (
    <div className="ujat-institution-application-calendar-view ujat-institution-application-calendar-view--page-scroll">
      <CalendarMain
        mode="month"
        hideModeToggle
        onModeChange={() => {}}
        events={events}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        onMonthChange={handleMonthChange}
        onTodayClick={handleTodayClick}
        selectedRowKeys={[]}
        eventsTooltipScope="full-day"
        eventsTooltipTrigger="cell"
        formatEventsOverflowText={n => `외 ${n}개의 항목`}
        previewTooltipContent={renderEducationProgressInstitutionPreviewTooltipContent}
      />

      <div className="calendar-sub-right-list">
        <CalendarSubRightList
          mode="institutionApplication"
          selectedDate={selectedDate}
          rows={listRows}
          selectedRowKeys={[]}
          onSelectionChange={() => {}}
          resolveRowColors={resolveRowColors}
        />
      </div>
    </div>
  )
}
