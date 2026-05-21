import { useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect, type Key } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { ApplicantScheduleList } from './applicant-schedule-list'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import './applicant-calendar-view.css'
import { CmsSelect, CMS_MULTI_SELECT_TAG_COLORS, ProgramCalendar } from '@/shared/ui'
import { useApplicantCalendarColorMaps } from './applicant-calendar-schedule-helpers'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface ApplicantCalendarViewProps {
  events: any[]
  loading?: boolean
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onItemClick: (item: any) => void
  /** 월간/주간 — onCalendarGranularityChange와 함께 전달 시 쿼리스트링 등과 동기화 */
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
}

export function ApplicantCalendarView({
  events,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onItemClick,
  calendarGranularity: calendarGranularityProp,
  onCalendarGranularityChange,
}: ApplicantCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [fallbackCalendarMode, setFallbackCalendarMode] = useState<'month' | 'week'>('month')
  const calendarControlled =
    calendarGranularityProp !== undefined && onCalendarGranularityChange !== undefined
  const calendarMode = calendarControlled ? calendarGranularityProp : fallbackCalendarMode
  const setCalendarMode = (mode: 'month' | 'week') => {
    if (calendarControlled) onCalendarGranularityChange(mode)
    else setFallbackCalendarMode(mode)
  }
  /** 날짜별 필터 옵션과 동기화 시 전체 선택이 기본, []는 사용자가 모두 해제한 경우 */
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const getEventsForDate = (date: Dayjs): any[] => {
    return events.filter(event => {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
    })
  }

  const dayEvents = useMemo(() => getEventsForDate(selectedDate), [events, selectedDate])
  const schoolFilterOptions = useMemo(() => {
    const uniqueSchools = Array.from(
      new Set(
        dayEvents.map(ev => String(ev?.originalItem?.schoolName ?? '').trim()).filter(Boolean)
      )
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

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  /**
   * Ant fullscreen 캘린더는 패널이 display:block 이라 flex로 남은 높이를 못 받는 경우가 많음.
   * 테이블 % 높이는 부모 높이가 0에 가깝게 잡혀 실패하므로, 좌측 카드 기준으로 픽셀 행 높이를 직접 넣는다.
   */
  useLayoutEffect(() => {
    const main = mainCalendarRef.current
    if (!main || loading) return

    const ROWS = 6
    const MIN_ROW = 124.2
    /** tbody 아래 ant-picker-body 패딩·보더 여유 */
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
    if (selectedSchools.length === 0) return []
    const selectedSet = new Set(selectedSchools)
    return dayEvents.filter(ev => {
      const schoolName = String(ev?.originalItem?.schoolName ?? '').trim()
      return schoolName !== '' && selectedSet.has(schoolName)
    })
  }, [dayEvents, selectedSchools])
  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(filteredDayEvents),
    [filteredDayEvents, buildResolvedColorMap]
  )
  const getColorForScheduleList = useCallback(
    (event: any) => scheduleListColorMap.get(event.id) ?? SCHEDULE_COLORS[0],
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
    <div className="applicant-calendar-layout">
      <ProgramCalendar
        ref={mainCalendarRef}
        className="applicant-calendar-main"
        events={events}
        selectedRowKeys={selectedRowKeys}
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
            value={selectedSchools}
            onChange={next => setSelectedSchools(next as string[])}
            options={schoolFilterOptions}
            placeholder="기관 선택"
          />
        </div>
        <ApplicantScheduleList
          selectedDate={selectedDate}
          events={filteredDayEvents}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onEventClick={onItemClick}
          getColorForEvent={getColorForScheduleList}
        />
      </div>
    </div>
  )
}
