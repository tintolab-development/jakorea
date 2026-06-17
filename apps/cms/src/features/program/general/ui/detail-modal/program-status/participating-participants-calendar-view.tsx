/**
 * 참여자(개인) 캘린더 뷰 (풀페이지 모달 > 프로그램 진행 현황 > 참여자)
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import {
  buildParticipatingIndividualParticipantCalendarEvents,
  type ParticipatingIndividualParticipantCalendarEvent,
} from '@/features/program/general/lib/build-participating-individual-participant-calendar-events'
import { formatInstitutionCalendarSessionTimeDisplay } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-calendar-session'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import {
  CalendarMain,
  CalendarSplitCardLayout,
  calendarItemsForEventMode,
} from '@/shared/components/calendar'
import {
  createInitialCalendarNavigationState,
  syncViewAnchorOnDateSelect,
} from '@/shared/components/calendar/lib/calendar-navigation'
import { ParticipatingParticipantsCalendarRight } from './participating-participants-calendar-right'
import '@/shared/components/calendar/styles/calendar.css'
import './participating-institutions-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function ParticipatingParticipantCalendarPopoverContent({
  events,
  titleColorMap,
}: {
  events: ParticipatingIndividualParticipantCalendarEvent[]
  titleColorMap: Map<string, string>
}) {
  return (
    <div className="participating-institutions-calendar-popover">
      {events.map(ev => {
        const { participant, session } = ev.originalItem
        const titleColor = titleColorMap.get(String(ev.id))
        const sessionLine = formatInstitutionCalendarSessionTimeDisplay(session)
        const affiliation = participant.affiliation?.trim() || '-'
        const grade = participant.educationGrade?.trim() || '-'

        return (
          <div key={ev.id} className="participating-institutions-calendar-popover__entry">
            <div
              className="participating-institutions-calendar-popover__title"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {participant.applicantName?.trim() || '-'}
            </div>
            <div className="participating-institutions-calendar-popover__meta">
              <span className="participating-institutions-calendar-popover__meta-part">
                {affiliation}
              </span>
              <span className="participating-institutions-calendar-popover__meta-sep" aria-hidden />
              <span className="participating-institutions-calendar-popover__meta-part">
                {grade}
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

export interface ParticipatingParticipantsCalendarViewProps {
  participants: ParticipatingIndividualParticipantRow[]
  selectedRowKeys: string[]
  onSelectionChange: (keys: string[]) => void
  onParticipantClick: (participant: ParticipatingIndividualParticipantRow) => void
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
}

export function ParticipatingParticipantsCalendarView({
  participants,
  selectedRowKeys,
  onSelectionChange,
  onParticipantClick,
  calendarGranularity: calendarGranularityProp,
  onCalendarGranularityChange,
}: ParticipatingParticipantsCalendarViewProps) {
  const [fallbackCalendarMode, setFallbackCalendarMode] = useState<'month' | 'week'>('month')
  const calendarControlled =
    calendarGranularityProp !== undefined && onCalendarGranularityChange !== undefined
  const calendarMode = calendarControlled ? calendarGranularityProp : fallbackCalendarMode
  const setCalendarMode = (mode: 'month' | 'week') => {
    if (calendarControlled) onCalendarGranularityChange(mode)
    else setFallbackCalendarMode(mode)
  }

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() =>
    createInitialCalendarNavigationState(calendarGranularityProp ?? 'month').viewAnchor
  )
  const didSnapToEventsRef = useRef(false)

  const events = useMemo(
    () => buildParticipatingIndividualParticipantCalendarEvents(participants),
    [participants]
  )

  useEffect(() => {
    if (didSnapToEventsRef.current || events.length === 0) return
    const startDates = events.map(ev => dayjs(ev.startDate)).filter(d => d.isValid())
    if (startDates.length === 0) return
    const earliest = startDates.reduce((a, b) => (a.isBefore(b) ? a : b))
    const hasEventsInViewMonth = events.some(ev =>
      dayjs(ev.startDate).isSame(currentMonth, 'month')
    )
    if (!hasEventsInViewMonth) {
      setCurrentMonth(earliest.startOf('month'))
      setSelectedDate(earliest.startOf('day'))
    }
    didSnapToEventsRef.current = true
  }, [events, currentMonth])

  const participantToColorIndex = useMemo(() => {
    const names = Array.from(
      new Set(participants.map(p => p.applicantName?.trim() || '').filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'ko'))
    const map = new Map<string, number>()
    names.forEach((name, i) => map.set(name, i % SCHEDULE_COLORS.length))
    return map
  }, [participants])

  const getColorForParticipant = (participantName: string) => {
    const idx = participantToColorIndex.get(participantName.trim()) ?? 0
    return SCHEDULE_COLORS[idx % SCHEDULE_COLORS.length]
  }

  const getColorForEvent = (event: ParticipatingIndividualParticipantCalendarEvent) =>
    getColorForParticipant(event.originalItem.participant.applicantName?.trim() || '')

  const eventsForSelectedDate = useMemo(
    () =>
      events.filter(
        ev =>
          selectedDate.isSameOrAfter(dayjs(ev.startDate), 'day') &&
          selectedDate.isSameOrBefore(dayjs(ev.endDate), 'day')
      ),
    [events, selectedDate]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prev => syncViewAnchorOnDateSelect(calendarMode, date, prev))
  }

  return (
    <CalendarSplitCardLayout
      pageScroll
      left={
        <CalendarMain
          className="calendar-split-card-main"
          events={events}
          selectedRowKeys={selectedRowKeys}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          mode={calendarMode}
          onSelectDate={handleDateSelect}
          onMonthChange={setCurrentMonth}
          onModeChange={setCalendarMode}
          eventsTooltipScope="full-day"
          eventsTooltipTrigger="cell"
          formatEventsOverflowText={n => `외 ${n}개의 항목`}
          previewTooltipContent={({ events: dayItems, colorMap }) => {
            const dayEvents = calendarItemsForEventMode(dayItems).map(
              item => item.original as ParticipatingIndividualParticipantCalendarEvent
            )
            return (
              <ParticipatingParticipantCalendarPopoverContent
                events={dayEvents}
                titleColorMap={
                  new Map(
                    dayEvents.map(ev => [
                      String(ev.id),
                      colorMap.get(ev.id)?.text ?? getColorForEvent(ev).text,
                    ])
                  )
                }
              />
            )
          }}
        />
      }
      right={
        <ParticipatingParticipantsCalendarRight
          events={eventsForSelectedDate}
          getColorForParticipant={getColorForParticipant}
          selectedParticipantIds={selectedRowKeys}
          onParticipantSelectionChange={onSelectionChange}
          onParticipantClick={onParticipantClick}
        />
      }
    />
  )
}
