/**
 * 일반 프로그램 봉사자 2차 면접 대상자 캘린더 뷰
 */

import { useMemo, useCallback, type Key } from 'react'
import { EmptyState } from '@/shared/ui'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import {
  buildGeneralVolunteerInterview2CalendarListRows,
  type GeneralVolunteerInterview2CalendarListRow,
} from '@/features/program/general/lib/general-volunteer-interview2-calendar-list-rows'
import {
  CalendarMain,
  CalendarSplitCardLayout,
} from '@/shared/components/calendar'
import { useCalendarNavigationState } from '@/shared/components/calendar/lib/use-calendar-navigation-state'
import '@/shared/components/calendar/styles/calendar.css'
import { SCHEDULE_COLORS, type ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import { renderGeneralVolunteerInterview2PreviewTooltipContent } from './general-volunteer-interview2-preview-tooltip'
import { GeneralVolunteerInterview2CalendarListItem } from './general-volunteer-interview2-calendar-list-item'
import {
  buildUjatVolunteerInterviewMonthCellRows,
  renderUjatVolunteerInterviewMonthEventContent,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/shared/calendar-month-cells'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface GeneralVolunteerInterview2CalendarViewProps {
  events: GeneralVolunteerInterviewCalendarEvent[]
  loading?: boolean
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onItemClick: (item: GeneralVolunteerApplicantRow) => void
}

function GeneralVolunteerInterview2CalendarRightList({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
  resolveRowColors,
}: {
  rows: GeneralVolunteerInterview2CalendarListRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onRowClick: (row: GeneralVolunteerInterview2CalendarListRow) => void
  resolveRowColors?: (row: GeneralVolunteerInterview2CalendarListRow) => ScheduleColorPair | undefined
}) {
  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(key)) return
        onSelectionChange([...selectedRowKeys, key])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== key))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <div className={rows.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
      {rows.length === 0 ? (
        <EmptyState description="해당 날짜에 일정이 없습니다" />
      ) : (
        rows.map(row => {
          const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
          return (
            <div
              key={row.id}
              className={[
                'calendar-list-item',
                selectedSet.has(row.id) ? 'calendar-list-item--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-has-color="true"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
              onClick={() => onRowClick(row)}
            >
              <div className="calendar-list-item__column">
                <GeneralVolunteerInterview2CalendarListItem
                  row={row}
                  checked={selectedSet.has(row.id)}
                  onToggle={handleToggle}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export function GeneralVolunteerInterview2CalendarView({
  events,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onItemClick,
}: GeneralVolunteerInterview2CalendarViewProps) {
  const {
    selectedDate,
    currentMonth,
    mode: calendarMode,
    onSelectDate: navigateDate,
    onMonthChange: setCurrentMonth,
    onModeChange: setCalendarMode,
  } = useCalendarNavigationState('month')

  const handleDateSelect = useCallback(
    (date: Dayjs) => {
      navigateDate(date)
      if (!date.isSame(selectedDate, 'day')) {
        onSelectionChange([])
      }
    },
    [navigateDate, onSelectionChange, selectedDate]
  )

  const applicantById = useMemo(
    () => new Map(events.map(event => [event.originalItem.id, event.originalItem])),
    [events]
  )

  const getEventsForDate = useCallback(
    (date: Dayjs): GeneralVolunteerInterviewCalendarEvent[] => {
      return events.filter(event => {
        const start = dayjs(event.startDate)
        const end = dayjs(event.endDate)
        return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
      })
    },
    [events]
  )

  const dayEvents = useMemo(() => getEventsForDate(selectedDate), [getEventsForDate, selectedDate])
  const dayListRows = useMemo(
    () => buildGeneralVolunteerInterview2CalendarListRows(dayEvents),
    [dayEvents]
  )

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(dayEvents),
    [dayEvents, buildResolvedColorMap]
  )

  const resolveRowColors = useCallback(
    (row: GeneralVolunteerInterview2CalendarListRow) =>
      scheduleListColorMap.get(row.eventId) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const handleListRowClick = useCallback(
    (row: GeneralVolunteerInterview2CalendarListRow) => {
      const applicant = applicantById.get(row.id)
      if (!applicant || applicant.interviewAssignmentStatus === 'withdrawn') return
      onItemClick(applicant)
    },
    [applicantById, onItemClick]
  )

  return (
    <CalendarSplitCardLayout
      pageScroll
      loading={loading}
      left={
        <CalendarMain
          className="calendar-split-card-main"
          events={events}
          selectedRowKeys={[]}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          mode={calendarMode}
          onSelectDate={handleDateSelect}
          onMonthChange={setCurrentMonth}
          onModeChange={setCalendarMode}
          eventsTooltipScope="full-day"
          eventsTooltipTrigger="cell"
          formatEventsOverflowText={n => `외 ${n}개의 항목`}
          previewTooltipContent={renderGeneralVolunteerInterview2PreviewTooltipContent}
          buildMonthCellRows={buildUjatVolunteerInterviewMonthCellRows}
          renderMonthEventContent={renderUjatVolunteerInterviewMonthEventContent}
        />
      }
      right={
        <GeneralVolunteerInterview2CalendarRightList
          rows={dayListRows}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onRowClick={handleListRowClick}
          resolveRowColors={resolveRowColors}
        />
      }
    />
  )
}
