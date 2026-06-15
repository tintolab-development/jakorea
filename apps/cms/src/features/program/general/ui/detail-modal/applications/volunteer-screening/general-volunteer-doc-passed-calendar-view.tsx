/**
 * 일반 프로그램 — 1차 서류 합격자 캘린더 뷰
 */

import { useMemo, useCallback, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Empty } from 'antd'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import {
  buildGeneralVolunteerDocPassedCalendarListRows,
  type GeneralVolunteerDocPassedCalendarListRow,
} from '@/features/program/general/lib/general-volunteer-doc-passed-calendar-list-rows'
import { CalendarMain, CalendarSplitCardLayout } from '@/shared/components/calendar'
import { useCalendarNavigationState } from '@/shared/components/calendar/lib/use-calendar-navigation-state'
import '@/shared/components/calendar/styles/calendar.css'
import { SCHEDULE_COLORS, type ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import { renderGeneralVolunteerInterviewCalendarPreviewTooltipContent } from './general-volunteer-interview-calendar-preview-tooltip'
import { GeneralVolunteerDocPassedCalendarListItem } from './general-volunteer-doc-passed-calendar-list-item'
import { buildUjatVolunteerInterviewMonthCellRows } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-calendar-month-cells'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const GENERAL_DOC_PASSED_CALENDAR_EVENT_TITLE_COLOR = 'var(--main-BK, #3D3D3D)'

type GeneralDocPassedMonthCellMeta = {
  titleParts: {
    left: string
    right?: string
  }
}

/** 캘린더 셀 — 봉사자명은 기본색, 팝오버에서만 일정 색 강조 */
function renderGeneralVolunteerDocPassedMonthEventContent({
  row,
}: {
  row: CalendarMonthCellRow
  colors: ScheduleColorPair
}): ReactNode {
  const meta = row.meta as GeneralDocPassedMonthCellMeta | undefined
  const titleParts = meta?.titleParts ?? { left: String(row.sourceEvent.title ?? '') }
  return (
    <CalendarMonthEventTitleWithDivider
      parts={titleParts}
      accentColor={GENERAL_DOC_PASSED_CALENDAR_EVENT_TITLE_COLOR}
    />
  )
}

function GeneralVolunteerDocPassedCalendarRightList({
  rows,
  onRowClick,
  resolveRowColors,
}: {
  rows: GeneralVolunteerDocPassedCalendarListRow[]
  onRowClick: (row: GeneralVolunteerDocPassedCalendarListRow) => void
  resolveRowColors?: (row: GeneralVolunteerDocPassedCalendarListRow) => ScheduleColorPair | undefined
}) {
  return (
    <div className={rows.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
      {rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        rows.map(row => {
          const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
          return (
            <div
              key={row.id}
              className="calendar-list-item"
              data-has-color="true"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
              onClick={() => onRowClick(row)}
            >
              <div className="calendar-list-item__column">
                <GeneralVolunteerDocPassedCalendarListItem row={row} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export interface GeneralVolunteerDocPassedCalendarViewProps {
  events: GeneralVolunteerInterviewCalendarEvent[]
  loading?: boolean
  onItemClick: (item: GeneralVolunteerApplicantRow) => void
}

export function GeneralVolunteerDocPassedCalendarView({
  events,
  loading,
  onItemClick,
}: GeneralVolunteerDocPassedCalendarViewProps) {
  const {
    selectedDate,
    currentMonth,
    mode: calendarMode,
    onSelectDate: handleDateSelect,
    onMonthChange: setCurrentMonth,
    onModeChange: setCalendarMode,
  } = useCalendarNavigationState('month')

  const eventById = useMemo(() => new Map(events.map(event => [String(event.id), event])), [events])

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
    () => buildGeneralVolunteerDocPassedCalendarListRows(dayEvents),
    [dayEvents]
  )

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(dayEvents),
    [dayEvents, buildResolvedColorMap]
  )

  const resolveRowColors = useCallback(
    (row: GeneralVolunteerDocPassedCalendarListRow) =>
      scheduleListColorMap.get(row.id) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const handleListRowClick = useCallback(
    (row: GeneralVolunteerDocPassedCalendarListRow) => {
      const event = eventById.get(row.id)
      if (event) onItemClick(event.originalItem)
    },
    [eventById, onItemClick]
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
          previewTooltipContent={renderGeneralVolunteerInterviewCalendarPreviewTooltipContent}
          buildMonthCellRows={buildUjatVolunteerInterviewMonthCellRows}
          renderMonthEventContent={renderGeneralVolunteerDocPassedMonthEventContent}
        />
      }
      right={
        <GeneralVolunteerDocPassedCalendarRightList
          rows={dayListRows}
          onRowClick={handleListRowClick}
          resolveRowColors={resolveRowColors}
        />
      }
    />
  )
}
