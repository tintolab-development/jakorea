/**
 * 일반 프로그램 — 1차 서류 합격자 캘린더 뷰
 * UJAT 2차 면접 캘린더(`UjatVolunteerInterview2CalendarView`) UI 재사용 — 체크박스·일괄 처리 제외
 */

import { useMemo, useCallback } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Empty } from 'antd'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import {
  CalendarMain,
  CalendarSplitCardLayout,
} from '@/shared/components/calendar'
import { useCalendarNavigationState } from '@/shared/components/calendar/lib/use-calendar-navigation-state'
import '@/shared/components/calendar/styles/calendar.css'
import { SCHEDULE_COLORS, type ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import { renderGeneralVolunteerInterviewCalendarPreviewTooltipContent } from './general-volunteer-interview-calendar-preview-tooltip'
import {
  buildUjatVolunteerInterviewMonthCellRows,
  renderUjatVolunteerInterviewMonthEventContent,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-calendar-month-cells'
import {
  formatUjatInterview2ScoreLabel,
  ujatInterview2ScreeningListBadgeLabel,
  ujatInterview2ScreeningTone,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview2-screening-ui'
import '@/shared/components/calendar/ui/item-list/ujat-volunteer-interview2-list-item.css'
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

type GeneralDocPassedCalendarListRow = {
  id: string
  eventId: string
  volunteerName: string
  screeningStatus: GeneralSecondInterviewScreeningStatus
  slotLabel: string
  totalScore: number | null | undefined
}

export interface GeneralVolunteerDocPassedCalendarViewProps {
  events: GeneralVolunteerInterviewCalendarEvent[]
  loading?: boolean
  onItemClick: (item: GeneralVolunteerApplicantRow) => void
}

function buildDocPassedCalendarListRows(
  dayEvents: GeneralVolunteerInterviewCalendarEvent[]
): GeneralDocPassedCalendarListRow[] {
  return dayEvents.map(event => ({
    id: event.originalItem.id,
    eventId: String(event.id),
    volunteerName: event.volunteerName,
    screeningStatus: event.originalItem.secondInterviewScreeningStatus ?? 'waiting',
    slotLabel: event.slotLabel,
    totalScore: event.originalItem.totalScore,
  }))
}

function GeneralDocPassedCalendarListItem({ row }: { row: GeneralDocPassedCalendarListRow }) {
  const tone = ujatInterview2ScreeningTone(
    row.screeningStatus as Parameters<typeof ujatInterview2ScreeningTone>[0]
  )

  return (
    <div className="ujat-volunteer-interview2-list-item general-volunteer-doc-passed-calendar-list-item">
      <div className="ujat-volunteer-interview2-list-item__body">
        <div className="ujat-volunteer-interview2-list-item__head">
          <span className="ujat-volunteer-interview2-list-item__name">{row.volunteerName}</span>
          <span className="ujat-volunteer-interview2-list-item__sep" aria-hidden>
            |
          </span>
          <span
            className={`ujat-volunteer-interview2-list-item__status-badge ujat-volunteer-interview2-list-item__status-badge--${tone}`}
          >
            {ujatInterview2ScreeningListBadgeLabel(
              row.screeningStatus as Parameters<typeof ujatInterview2ScreeningListBadgeLabel>[0]
            )}
          </span>
        </div>
        <div className="ujat-volunteer-interview2-list-item__meta">
          <span className="ujat-volunteer-interview2-list-item__meta-slot">{row.slotLabel}</span>
          <span className="ujat-volunteer-interview2-list-item__sep" aria-hidden>
            |
          </span>
          <span className="ujat-volunteer-interview2-list-item__meta-score">
            {formatUjatInterview2ScoreLabel(row.totalScore)}
          </span>
        </div>
      </div>
    </div>
  )
}

function GeneralDocPassedCalendarRightList({
  rows,
  onRowClick,
  resolveRowColors,
}: {
  rows: GeneralDocPassedCalendarListRow[]
  onRowClick: (row: GeneralDocPassedCalendarListRow) => void
  resolveRowColors?: (row: GeneralDocPassedCalendarListRow) => ScheduleColorPair | undefined
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
                <GeneralDocPassedCalendarListItem row={row} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
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
  const dayListRows = useMemo(() => buildDocPassedCalendarListRows(dayEvents), [dayEvents])

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(dayEvents),
    [dayEvents, buildResolvedColorMap]
  )

  const resolveRowColors = useCallback(
    (row: GeneralDocPassedCalendarListRow) =>
      scheduleListColorMap.get(row.eventId) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const handleListRowClick = useCallback(
    (row: GeneralDocPassedCalendarListRow) => {
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
          previewTooltipContent={renderGeneralVolunteerInterviewCalendarPreviewTooltipContent}
          buildMonthCellRows={buildUjatVolunteerInterviewMonthCellRows}
          renderMonthEventContent={renderUjatVolunteerInterviewMonthEventContent}
        />
      }
      right={
        <GeneralDocPassedCalendarRightList
          rows={dayListRows}
          onRowClick={handleListRowClick}
          resolveRowColors={resolveRowColors}
        />
      }
    />
  )
}
