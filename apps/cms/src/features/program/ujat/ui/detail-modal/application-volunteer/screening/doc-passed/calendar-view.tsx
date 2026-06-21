/**
 * UJAT 봉사자 신청(서류합격·2차 면접 등) 캘린더 뷰
 * 공통 `CalendarSplitCardLayout` + `CalendarMain` + `CalendarSubRightVolunteerInterviewList`
 */

import { useMemo, useCallback } from 'react'
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
import { useCalendarNavigationState } from '@/shared/components/calendar/lib/use-calendar-navigation-state'
import '@/shared/components/calendar/styles/calendar.css'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import type { UjatVolunteerInterviewCalendarEvent } from '../shared/interview-calendar-events'
import { formatUjatInterviewSlotSummary } from '../shared/interview-calendar-events'
import { renderUjatVolunteerInterviewPreviewTooltipContent } from '../interview-assign/preview-tooltip'
import {
  buildUjatVolunteerInterviewMonthCellRows,
  renderUjatVolunteerInterviewMonthEventContent,
} from '../shared/calendar-month-cells'
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
      totalSlotCount: number
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
        totalSlotCount: event.originalItem.interviewSlotCount,
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
    slotSummary: formatUjatInterviewSlotSummary(group.slots),
    totalSlotCount: group.totalSlotCount,
  }))
}

export function UjatVolunteerDocPassedCalendarView({
  events,
  loading,
  onItemClick,
}: UjatVolunteerDocPassedCalendarViewProps) {
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
