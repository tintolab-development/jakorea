/**
 * UJAT 봉사자 신청(서류합격·2차 면접 등) 캘린더 뷰
 * 공통 `CalendarSplitCardLayout` + `CalendarMain` + `CalendarSubRightVolunteerInterviewList`
 */

import { useState, useMemo, useCallback } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  CalendarMain,
  CalendarSplitCardLayout,
  CalendarSubRightVolunteerInterviewList,
  type CalendarVolunteerInterviewListRow,
} from '@/shared/components/calendar'
import '@/shared/components/calendar/styles/calendar.css'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import type { UjatVolunteerInterviewCalendarEvent } from './ujat-volunteer-interview-calendar-events'
import { renderUjatVolunteerInterviewPreviewTooltipContent } from './ujat-volunteer-interview-preview-tooltip'
import {
  buildUjatVolunteerInterviewMonthCellRows,
  renderUjatVolunteerInterviewMonthEventContent,
} from './ujat-volunteer-calendar-month-cells'
import '@/features/program/general/ui/detail-modal/program-status/participating-institutions-calendar-view.css' /* tooltip/popover only */

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface UjatVolunteerDocPassedCalendarViewProps {
  events: UjatVolunteerInterviewCalendarEvent[]
  loading?: boolean
  onItemClick: (item: UjatVolunteerApplicantRow) => void
}

function buildVolunteerInterviewListRows(
  dayEvents: UjatVolunteerInterviewCalendarEvent[]
): CalendarVolunteerInterviewListRow[] {
  const grouped = new Map<
    string,
    {
      representativeId: string
      volunteerName: string
      assignmentStatus: UjatVolunteerInterviewCalendarEvent['originalItem']['interviewAssignmentStatus']
      slots: string[]
      slotSet: Set<string>
    }
  >()

  for (const event of dayEvents) {
    const key = event.volunteerName.trim()
    if (!key) continue

    let group = grouped.get(key)
    if (!group) {
      group = {
        representativeId: String(event.id),
        volunteerName: key,
        assignmentStatus: event.originalItem.interviewAssignmentStatus,
        slots: [],
        slotSet: new Set<string>(),
      }
      grouped.set(key, group)
    }

    const slot = event.slotLabel.trim()
    if (slot && !group.slotSet.has(slot)) {
      group.slotSet.add(slot)
      group.slots.push(slot)
    }
  }

  return Array.from(grouped.values()).map(group => ({
    id: group.representativeId,
    volunteerName: group.volunteerName,
    assignmentStatus: group.assignmentStatus,
    slotLabels: group.slots,
  }))
}

export function UjatVolunteerDocPassedCalendarView({
  events,
  loading,
  onItemClick,
}: UjatVolunteerDocPassedCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')

  const eventById = useMemo(() => new Map(events.map(event => [String(event.id), event])), [events])

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

  const dayListRows = useMemo(
    () => buildVolunteerInterviewListRows(dayEvents),
    [dayEvents]
  )

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(dayEvents),
    [dayEvents, buildResolvedColorMap]
  )

  const resolveRowColors = useCallback(
    (row: CalendarVolunteerInterviewListRow) =>
      scheduleListColorMap.get(row.id) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const handleListRowClick = useCallback(
    (row: CalendarVolunteerInterviewListRow) => {
      const event = eventById.get(row.id)
      if (event) onItemClick(event.originalItem)
    },
    [eventById, onItemClick]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    if (calendarMode === 'week') {
      if (!date.isSame(currentMonth, 'week')) {
        setCurrentMonth(date.startOf('week'))
      }
    } else if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  const handleToday = () => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }

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
          onTodayClick={handleToday}
          eventsTooltipScope="full-day"
          eventsTooltipTrigger="cell"
          formatEventsOverflowText={n => `외 ${n}개의 항목`}
          tooltipOverlayClassName="participating-institutions-calendar-tooltip-overlay"
          previewTooltipContent={renderUjatVolunteerInterviewPreviewTooltipContent}
          buildMonthCellRows={buildUjatVolunteerInterviewMonthCellRows}
          renderMonthEventContent={renderUjatVolunteerInterviewMonthEventContent}
        />
      }
      right={
        <CalendarSubRightVolunteerInterviewList
          rows={dayListRows}
          onRowClick={handleListRowClick}
          resolveRowColors={resolveRowColors}
        />
      }
    />
  )
}
