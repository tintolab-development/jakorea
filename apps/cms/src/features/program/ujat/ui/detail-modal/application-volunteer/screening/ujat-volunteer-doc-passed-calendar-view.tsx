import { useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { CmsSelect, CMS_MULTI_SELECT_TAG_COLORS, ProgramCalendar } from '@/shared/ui'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import type { UjatVolunteerInterviewCalendarEvent } from './ujat-volunteer-interview-calendar-events'
import { UjatVolunteerInterviewScheduleList } from './ujat-volunteer-interview-schedule-list'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-view.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-list.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface UjatVolunteerDocPassedCalendarViewProps {
  events: UjatVolunteerInterviewCalendarEvent[]
  loading?: boolean
  onItemClick: (item: UjatVolunteerApplicantRow) => void
}

export function UjatVolunteerDocPassedCalendarView({
  events,
  loading,
  onItemClick,
}: UjatVolunteerDocPassedCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([])
  const mainCalendarRef = useRef<HTMLDivElement>(null)

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

  const volunteerFilterOptions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(dayEvents.map(ev => ev.volunteerName.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'ko'))
    return uniqueNames.map((name, i) => ({
      value: name,
      label: name,
      tagColor: CMS_MULTI_SELECT_TAG_COLORS[i % CMS_MULTI_SELECT_TAG_COLORS.length],
    }))
  }, [dayEvents])

  useEffect(() => {
    setSelectedVolunteers(volunteerFilterOptions.map(o => o.value))
  }, [volunteerFilterOptions])

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  useLayoutEffect(() => {
    const main = mainCalendarRef.current
    if (!main || loading) return

    const ROWS = 6
    const MIN_ROW = 124.2
    const BOTTOM_RESERVE = 12

    const applyMonthRowHeight = () => {
      if (calendarMode !== 'month') {
        main.style.removeProperty('--calendar-month-row-height')
        return
      }

      const thead = main.querySelector('.ant-picker-content thead')
      if (!thead) {
        main.style.removeProperty('--calendar-month-row-height')
        return
      }

      const mainRect = main.getBoundingClientRect()
      const padBottom = parseFloat(getComputedStyle(main).paddingBottom) || 0
      const innerBottom = mainRect.bottom - padBottom
      const tbodyTop = thead.getBoundingClientRect().bottom
      const forBody = Math.max(0, innerBottom - tbodyTop - BOTTOM_RESERVE)
      const rowPx = Math.max(MIN_ROW, forBody / ROWS)
      main.style.setProperty(
        '--calendar-month-row-height',
        `${Math.round(rowPx * 10) / 10}px`
      )
    }

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(applyMonthRowHeight)
    })
    ro.observe(main)
    const parent = main.parentElement
    if (parent) ro.observe(parent)

    requestAnimationFrame(applyMonthRowHeight)
    return () => {
      ro.disconnect()
      main.style.removeProperty('--calendar-month-row-height')
    }
  }, [calendarMode, loading, currentMonth])

  const filteredDayEvents = useMemo(() => {
    if (selectedVolunteers.length === 0) return []
    const selectedSet = new Set(selectedVolunteers)
    return dayEvents.filter(ev => selectedSet.has(ev.volunteerName))
  }, [dayEvents, selectedVolunteers])

  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(filteredDayEvents),
    [filteredDayEvents, buildResolvedColorMap]
  )

  const getColorForScheduleList = useCallback(
    (event: UjatVolunteerInterviewCalendarEvent) =>
      scheduleListColorMap.get(event.id) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
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

  if (loading) {
    return (
      <div className="applicant-calendar-view applicant-calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="applicant-calendar-layout applicant-calendar-view-container">
      <ProgramCalendar
        ref={mainCalendarRef}
        className="applicant-calendar-main"
        events={events}
        selectedRowKeys={[]}
        selectedDate={selectedDate}
        currentMonth={currentMonth}
        mode={calendarMode}
        onSelectDate={handleDateSelect}
        onMonthChange={setCurrentMonth}
        onModeChange={setCalendarMode}
        onTodayClick={handleToday}
      />

      <div className="applicant-calendar-right">
        <div className="applicant-calendar-right__school-filter">
          <CmsSelect
            mode="multiple"
            withAllOption={false}
            value={selectedVolunteers}
            onChange={next => setSelectedVolunteers(next as string[])}
            options={volunteerFilterOptions}
            placeholder="봉사자 선택"
          />
        </div>
        <UjatVolunteerInterviewScheduleList
          events={filteredDayEvents}
          onEventClick={onItemClick}
          getColorForEvent={getColorForScheduleList}
        />
      </div>
    </div>
  )
}
