/**
 * 캘린더 뷰 컴포넌트
 * Phase 3.1: 월간/주간 전환, 일정 표시, M3 기반 디자인
 */

import { useState, useMemo } from 'react'
import { MdButton } from '../m3'
import type { Schedule } from '../../types/domain'
import {
  getMonthCalendarDates,
  getWeekCalendarDates,
  formatDateString,
  isDateToday,
  isSameDate,
  isDateInMonth,
  getNextMonth,
  getPrevMonth,
  getNextWeek,
  getPrevWeek,
  formatMonth,
  formatDay,
  getDayName,
} from '../../utils/calendar'
import './CalendarView.css'

export type CalendarViewMode = 'month' | 'week'

interface CalendarViewProps {
  schedules: Schedule[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onViewModeChange: (mode: CalendarViewMode) => void
  onScheduleClick?: (schedule: Schedule) => void
  onDateClick?: (date: Date) => void
  viewMode?: CalendarViewMode
}

export default function CalendarView({
  schedules,
  currentDate,
  onDateChange,
  onViewModeChange,
  onScheduleClick,
  onDateClick,
  viewMode = 'month',
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // 현재 뷰 모드에 따른 날짜 배열
  const calendarDates = useMemo(() => {
    return viewMode === 'month' ? getMonthCalendarDates(currentDate) : getWeekCalendarDates(currentDate)
  }, [currentDate, viewMode])

  // 날짜별 일정 그룹화
  const schedulesByDate = useMemo(() => {
    const grouped = new Map<string, Schedule[]>()
    schedules.forEach(schedule => {
      const scheduleDate = formatDateString(schedule.date)
      const existing = grouped.get(scheduleDate) || []
      existing.push(schedule)
      grouped.set(scheduleDate, existing)
    })
    return grouped
  }, [schedules])

  // 날짜 이동 핸들러
  const handlePrev = () => {
    const newDate = viewMode === 'month' ? getPrevMonth(currentDate) : getPrevWeek(currentDate)
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = viewMode === 'month' ? getNextMonth(currentDate) : getNextWeek(currentDate)
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  // 일정 클릭 핸들러
  const handleScheduleClick = (schedule: Schedule, event: React.MouseEvent) => {
    event.stopPropagation()
    onScheduleClick?.(schedule)
  }

  // 요일 헤더 렌더링
  const renderDayHeaders = () => {
    const weekStart = viewMode === 'month' ? getMonthCalendarDates(currentDate)[0] : getWeekCalendarDates(currentDate)[0]
    const headers = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      headers.push(
        <div key={i} className="calendar-day-header">
          {getDayName(date)}
        </div>
      )
    }
    return headers
  }

  // 날짜 셀 렌더링
  const renderDateCell = (date: Date) => {
    const dateStr = formatDateString(date)
    const daySchedules = schedulesByDate.get(dateStr) || []
    const isCurrentMonth = viewMode === 'month' ? isDateInMonth(date, currentDate) : true
    const isSelected = selectedDate && isSameDate(date, selectedDate)
    const isTodayDate = isDateToday(date)

    return (
      <div
        key={dateStr}
        className={`calendar-date-cell ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
        onClick={() => handleDateClick(date)}
      >
        <div className="calendar-date-number">{date.getDate()}</div>
        <div className="calendar-schedules">
          {daySchedules.slice(0, 3).map(schedule => (
            <div
              key={schedule.id}
              className="calendar-schedule-item"
              onClick={e => handleScheduleClick(schedule, e)}
            >
              <span className="schedule-time">{schedule.startTime}</span>
              <span className="schedule-title">{schedule.title}</span>
            </div>
          ))}
          {daySchedules.length > 3 && (
            <div className="calendar-schedule-more">+{daySchedules.length - 3}개 더</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-view">
      {/* 캘린더 헤더 */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <MdButton variant="outlined" onClick={handlePrev}>
            ←
          </MdButton>
          <div className="calendar-title">
            {viewMode === 'month' ? formatMonth(currentDate) : `${formatDay(getWeekCalendarDates(currentDate)[0])} ~ ${formatDay(getWeekCalendarDates(currentDate)[6])}`}
          </div>
          <MdButton variant="outlined" onClick={handleNext}>
            →
          </MdButton>
          <MdButton variant="text" onClick={handleToday}>
            오늘
          </MdButton>
        </div>
        <div className="calendar-view-mode">
          <MdButton
            variant={viewMode === 'month' ? 'filled' : 'outlined'}
            onClick={() => onViewModeChange('month')}
          >
            월
          </MdButton>
          <MdButton
            variant={viewMode === 'week' ? 'filled' : 'outlined'}
            onClick={() => onViewModeChange('week')}
          >
            주
          </MdButton>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="calendar-grid">
        {viewMode === 'month' && (
          <>
            <div className="calendar-day-headers">{renderDayHeaders()}</div>
            <div className="calendar-dates">{calendarDates.map(date => renderDateCell(date))}</div>
          </>
        )}
        {viewMode === 'week' && (
          <>
            <div className="calendar-day-headers">{renderDayHeaders()}</div>
            <div className="calendar-dates">{calendarDates.map(date => renderDateCell(date))}</div>
          </>
        )}
      </div>
    </div>
  )
}

