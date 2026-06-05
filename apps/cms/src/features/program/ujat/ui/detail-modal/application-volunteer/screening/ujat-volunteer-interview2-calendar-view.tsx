/**
 * UJAT 봉사자 2차 면접 대상자 캘린더 뷰
 * 1차 서류 합격(`UjatVolunteerDocPassedCalendarView`)과 분리 — 팝오버·우측 리스트 UI 상이
 */

import { useMemo, useCallback, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  CalendarMain,
  CalendarSplitCardLayout,
  CalendarSubRightVolunteerInterview2List,
  type CalendarVolunteerInterview2ListRow,
} from '@/shared/components/calendar'
import { useCalendarNavigationState } from '@/shared/components/calendar/lib/use-calendar-navigation-state'
import '@/shared/components/calendar/styles/calendar.css'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import type { UjatVolunteerInterviewCalendarEvent } from './ujat-volunteer-interview-calendar-events'
import { renderUjatVolunteerInterview2PreviewTooltipContent } from './ujat-volunteer-interview2-preview-tooltip'
import {
  buildUjatVolunteerInterviewMonthCellRows,
  renderUjatVolunteerInterviewMonthEventContent,
} from './ujat-volunteer-calendar-month-cells'
import '@/features/program/general/ui/detail-modal/program-status/participating-institutions-calendar-view.css' /* tooltip/popover only */

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface UjatVolunteerInterview2CalendarViewProps {
  events: UjatVolunteerInterviewCalendarEvent[]
  loading?: boolean
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onItemClick: (item: UjatVolunteerApplicantRow) => void
}

function buildInterview2ListRows(
  dayEvents: UjatVolunteerInterviewCalendarEvent[]
): CalendarVolunteerInterview2ListRow[] {
  return dayEvents.map(event => ({
    id: event.originalItem.id,
    eventId: String(event.id),
    volunteerName: event.volunteerName,
    screeningStatus:
      event.originalItem.secondInterviewScreeningStatus ?? ('waiting' as UjatSecondInterviewScreeningStatus),
    slotLabel: event.slotLabel,
    totalScore: event.originalItem.totalScore,
  }))
}

export function UjatVolunteerInterview2CalendarView({
  events,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onItemClick,
}: UjatVolunteerInterview2CalendarViewProps) {
  const {
    selectedDate,
    currentMonth,
    mode: calendarMode,
    onSelectDate: handleDateSelect,
    onMonthChange: setCurrentMonth,
    onModeChange: setCalendarMode,
  } = useCalendarNavigationState('month')

  const applicantById = useMemo(
    () => new Map(events.map(event => [event.originalItem.id, event.originalItem])),
    [events]
  )

  const getEventsForDate = useCallback(
    (date: Dayjs): UjatVolunteerInterviewCalendarEvent[] => {
      return events.filter(event => {
        const start = dayjs(event.startDate)
        const end = dayjs(event.endDate)
        return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
      })
    },
    [events]
  )

  const dayEvents = useMemo(() => getEventsForDate(selectedDate), [getEventsForDate, selectedDate])
  const dayListRows = useMemo(() => buildInterview2ListRows(dayEvents), [dayEvents])

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(dayEvents),
    [dayEvents, buildResolvedColorMap]
  )

  const resolveRowColors = useCallback(
    (row: CalendarVolunteerInterview2ListRow) =>
      scheduleListColorMap.get(row.eventId) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const handleListRowClick = useCallback(
    (row: CalendarVolunteerInterview2ListRow) => {
      const applicant = applicantById.get(row.id)
      if (!applicant || applicant.interviewAssignmentStatus === 'withdrawn') return
      onItemClick(applicant)
    },
    [applicantById, onItemClick]
  )

  return (
    <CalendarSplitCardLayout
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
          tooltipOverlayClassName="participating-institutions-calendar-tooltip-overlay"
          previewTooltipContent={renderUjatVolunteerInterview2PreviewTooltipContent}
          buildMonthCellRows={buildUjatVolunteerInterviewMonthCellRows}
          renderMonthEventContent={renderUjatVolunteerInterviewMonthEventContent}
        />
      }
      right={
        <CalendarSubRightVolunteerInterview2List
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
