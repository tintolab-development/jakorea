import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Key } from 'react'
import { CMS_MULTI_SELECT_TAG_COLORS } from '@/shared/ui'
import {
  CalendarMain,
  CalendarSubRightList,
  type CalendarInstitutionApplicationListRow,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { RenderCalendarMonthEventContent } from '@/shared/components/calendar/model/calendar-month-cell-row'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import { UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL } from './types'
import '@/shared/components/calendar/styles/calendar.css'
import {
  buildUjatInstitutionApplicationCalendarEvents,
  type UjatInstitutionCalendarEvent,
  type UjatInstitutionCalendarOriginalItem,
} from './calendar-events'
import type { UjatInstitutionApplicationRow } from './types'
import { useUjatProgramScheduleDates } from '../use-program-schedule-dates'
import {
  parseUjatInstitutionCalendarDateParam,
  resolveUjatInstitutionCalendarFocusIso,
} from './calendar-query'
import { UJAT_INSTITUTION_CALENDAR_DATE_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  goToTodayState,
  resolveViewAnchor,
  syncViewAnchorOnDateSelect,
} from '@/shared/components/calendar/lib/calendar-navigation'
import './calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function extractInstitutionFromCalendarItem(
  item: CalendarItem
): UjatInstitutionCalendarOriginalItem | null {
  const o = item.original
  if (o != null && typeof o === 'object' && 'originalItem' in o) {
    return (o as UjatInstitutionCalendarEvent).originalItem
  }
  return null
}

function toInstitutionListRow(
  item: UjatInstitutionCalendarOriginalItem
): CalendarInstitutionApplicationListRow {
  return {
    id: item.id,
    institutionName: item.institutionName,
    statusLabel: UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL[item.tempAssignmentStatus],
    statusKey: item.tempAssignmentStatus,
    totalClassSummary: item.calendarTotalClassSummary,
    gradeDetail: item.calendarGradeDetail,
  }
}

function renderUjatInstitutionPreviewTooltipContent({
  events,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <div className="calendar-preview-popover">
      {events.map(ev => {
        const institution = extractInstitutionFromCalendarItem(ev)
        const title = institution?.institutionName ?? String(ev.title ?? '-')
        const totalClassSummary = institution?.calendarTotalClassSummary
        const gradeDetail = institution?.calendarGradeDetail

        return (
          <div key={String(ev.id)} className="calendar-preview-popover__entry">
            <span className="calendar-preview-popover__title">{title}</span>
            {totalClassSummary ? (
              <div className="calendar-preview-popover__meta">
                <span className="calendar-preview-popover__meta-part">
                  {totalClassSummary}
                </span>
                {gradeDetail ? (
                  <>
                    <span
                      className="calendar-preview-popover__meta-sep"
                      aria-hidden
                    />
                    <span
                      className="calendar-preview-popover__meta-part calendar-preview-popover__meta-part--session"
                      title={gradeDetail}
                    >
                      {gradeDetail}
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

export function UjatInstitutionApplicationCalendarView({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onOpenDetail,
  programId,
  listPending = false,
}: {
  rows: UjatInstitutionApplicationRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onOpenDetail?: (row: UjatInstitutionApplicationRow) => void
  programId?: string | null
  listPending?: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { dates: programScheduleDates, loading: schedulesLoading } =
    useUjatProgramScheduleDates(programId)
  const events = useMemo(() => buildUjatInstitutionApplicationCalendarEvents(rows), [rows])
  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const eventIsoDates = useMemo(
    () => [
      ...events.map(event => event.startDate.slice(0, 10)),
      ...programScheduleDates.map(entry => entry.isoDate),
    ],
    [events, programScheduleDates]
  )
  const waitingRemoteDates = listPending || schedulesLoading
  const focusIso = resolveUjatInstitutionCalendarFocusIso(
    parseUjatInstitutionCalendarDateParam(searchParams.get(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)),
    eventIsoDates,
    waitingRemoteDates ? null : dayjs().format('YYYY-MM-DD')
  )
  const selectedDate = useMemo(() => dayjs(focusIso ?? dayjs().format('YYYY-MM-DD')), [focusIso])
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() =>
    resolveViewAnchor('month', dayjs(focusIso))
  )
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])

  useEffect(() => {
    setCurrentMonth(prev =>
      selectedDate.isSame(prev, 'month') ? prev : resolveViewAnchor('month', selectedDate)
    )
  }, [selectedDate])

  useEffect(() => {
    if (!focusIso) return
    const current = parseUjatInstitutionCalendarDateParam(
      searchParams.get(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)
    )
    if (current === focusIso) return
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(UJAT_INSTITUTION_CALENDAR_DATE_PARAM, focusIso)
        return next.toString() === prev.toString() ? prev : next
      },
      { replace: true }
    )
  }, [focusIso, searchParams, setSearchParams])

  const dayEvents = useMemo((): UjatInstitutionCalendarEvent[] => {
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

  const listRows = useMemo((): CalendarInstitutionApplicationListRow[] => {
    const seen = new Set<string>()
    const out: CalendarInstitutionApplicationListRow[] = []
    for (const ev of filteredDayEvents) {
      const item = ev.originalItem
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(toInstitutionListRow(item))
    }
    return out
  }, [filteredDayEvents])

  const listColorMap = useMemo(
    () => buildResolvedColorMap(filteredDayEvents),
    [filteredDayEvents, buildResolvedColorMap]
  )

  const resolveRowColors = useCallback(
    (row: CalendarInstitutionApplicationListRow) => {
      const match = filteredDayEvents.find(ev => ev.originalItem.id === row.id)
      return match ? (listColorMap.get(match.id) ?? SCHEDULE_COLORS[0]) : SCHEDULE_COLORS[0]
    },
    [filteredDayEvents, listColorMap]
  )

  const writeSelectedDate = useCallback(
    (date: Dayjs) => {
      const iso = date.format('YYYY-MM-DD')
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (next.get(UJAT_INSTITUTION_CALENDAR_DATE_PARAM) === iso) return prev
          next.set(UJAT_INSTITUTION_CALENDAR_DATE_PARAM, iso)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleDateSelect = useCallback(
    (date: Dayjs) => {
      setCurrentMonth(prev => syncViewAnchorOnDateSelect('month', date, prev))
      writeSelectedDate(date)
    },
    [writeSelectedDate]
  )

  const handleMonthChange = useCallback((month: Dayjs) => {
    setCurrentMonth(month)
  }, [])

  const handleTodayClick = useCallback(() => {
    const today = goToTodayState('month')
    setCurrentMonth(today.viewAnchor)
    writeSelectedDate(today.selectedDate)
  }, [writeSelectedDate])

  const handleListRowClick = useCallback(
    (listRow: CalendarInstitutionApplicationListRow) => {
      if (!onOpenDetail) return
      const fullRow = rows.find(row => row.id === listRow.id)
      if (fullRow) onOpenDetail(fullRow)
    },
    [onOpenDetail, rows]
  )

  const renderMonthEventContent: RenderCalendarMonthEventContent = useCallback(
    ({ row, colors }) => {
      const institution = extractInstitutionFromCalendarItem(row.sourceEvent)
      const left = institution?.institutionName ?? String(row.sourceEvent.title ?? '')
      const right = institution?.regionLabel?.trim() || undefined
      return (
        <CalendarMonthEventTitleWithDivider
          parts={{ left, right }}
          accentColor={colors.text}
        />
      )
    },
    []
  )

  return (
    <div className="calendar-set calendar-set--page-scroll">
      <div className="calendar-main-container">
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
          selectedRowKeys={selectedRowKeys}
          eventsTooltipScope="full-day"
          eventsTooltipTrigger="cell"
          formatEventsOverflowText={n => `외 ${n}개의 항목`}
          previewTooltipContent={renderUjatInstitutionPreviewTooltipContent}
          renderMonthEventContent={renderMonthEventContent}
        />
      </div>

      <div className="calendar-sub-right-list">
        <CalendarSubRightList
          mode="institutionApplication"
          selectedDate={selectedDate}
          rows={listRows}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onRowClick={onOpenDetail ? handleListRowClick : undefined}
          resolveRowColors={resolveRowColors}
        />
      </div>
    </div>
  )
}
