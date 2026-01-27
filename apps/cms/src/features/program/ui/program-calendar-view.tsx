/**
 * 프로그램 캘린더 뷰 컴포넌트
 * 좌측: 메인 월간 캘린더, 우측: 미니 캘린더 + 일정 리스트
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { Calendar, Button, Segmented, Spin } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { ProgramMiniCalendar } from './program-mini-calendar'
import { ProgramScheduleList } from './program-schedule-list'
import './program-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface ProgramCalendarViewProps {
  programs: Program[]
  loading?: boolean
  onProgramClick: (program: Program) => void
}

// 이벤트 바 색상 (상태별)
const eventColors = {
  recruiting: '#52c41a', // 모집 중 - green
  education: '#1890ff', // 교육 기간 - blue
  completed: '#8c8c8c', // 완료 - gray
}

export function ProgramCalendarView({
  programs,
  loading,
  onProgramClick,
}: ProgramCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null)
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  // 메인 캘린더 높이 측정하여 사이드바에 적용
  useEffect(() => {
    const updateHeight = () => {
      if (mainCalendarRef.current) {
        setSidebarHeight(mainCalendarRef.current.offsetHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [calendarMode])

  // 일정이 있는 날짜들 (미니 캘린더용)
  const programDates = useMemo(() => {
    const dates = new Set<string>()
    programs.forEach(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      let current = start

      while (current.isSameOrBefore(end, 'day')) {
        dates.add(current.format('YYYY-MM-DD'))
        current = current.add(1, 'day')
      }

      // 신청 기간도 추가
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        let appCurrent = appStart

        while (appCurrent.isSameOrBefore(appEnd, 'day')) {
          dates.add(appCurrent.format('YYYY-MM-DD'))
          appCurrent = appCurrent.add(1, 'day')
        }
      }
    })
    return dates
  }, [programs])

  // 특정 날짜의 프로그램 가져오기
  const getProgramsForDate = (date: Dayjs): Program[] => {
    return programs.filter(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      const isInEducationPeriod =
        date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')

      let isInApplicationPeriod = false
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        isInApplicationPeriod =
          date.isSameOrAfter(appStart, 'day') && date.isSameOrBefore(appEnd, 'day')
      }

      return isInEducationPeriod || isInApplicationPeriod
    })
  }

  // 이벤트 바 색상 결정
  const getEventColor = (program: Program, date: Dayjs): string => {
    const now = dayjs()

    // 신청 기간 체크
    if (program.applicationStartDate && program.applicationEndDate) {
      const appStart = dayjs(program.applicationStartDate)
      const appEnd = dayjs(program.applicationEndDate)
      if (date.isSameOrAfter(appStart, 'day') && date.isSameOrBefore(appEnd, 'day')) {
        return eventColors.recruiting
      }
    }

    // 완료 여부
    const end = dayjs(program.endDate)
    if (end.isBefore(now, 'day')) {
      return eventColors.completed
    }

    return eventColors.education
  }

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    // 선택한 날짜의 월로 이동
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  const handleMonthChange = (month: Dayjs) => {
    setCurrentMonth(month)
  }

  const handlePrev = () => {
    if (calendarMode === 'week') {
      setCurrentMonth(prev => prev.subtract(1, 'week'))
    } else {
      setCurrentMonth(prev => prev.subtract(1, 'month'))
    }
  }

  const handleNext = () => {
    if (calendarMode === 'week') {
      setCurrentMonth(prev => prev.add(1, 'week'))
    } else {
      setCurrentMonth(prev => prev.add(1, 'month'))
    }
  }

  // 주간 뷰에서 표시할 날짜들 (선택된 주의 일~토)
  const weekDates = useMemo(() => {
    const startOfWeek = currentMonth.startOf('week')
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  }, [currentMonth])

  const handleToday = () => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }

  // 메인 캘린더 헤더 렌더링
  const headerRender = () => {
    const headerTitle = calendarMode === 'week'
      ? `${weekDates[0].format('YYYY년 M월 D일')} - ${weekDates[6].format('M월 D일')}`
      : currentMonth.format('MMMM YYYY')

    return (
      <div className="program-calendar-header">
        <div className="program-calendar-header-left">
          <span className="program-calendar-header-title">
            {headerTitle}
          </span>
          <Button
            size="small"
            className="program-calendar-today-btn"
            onClick={handleToday}
          >
            오늘
          </Button>
          <div className="program-calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="program-calendar-header-right">
          <Segmented
            size="small"
            value={calendarMode}
            onChange={value => setCalendarMode(value as 'month' | 'week')}
            options={[
              { label: '월간', value: 'month' },
              { label: '주간', value: 'week' },
            ]}
          />
        </div>
      </div>
    )
  }

  // 메인 캘린더 셀 렌더링
  const dateFullCellRender = (date: Dayjs) => {
    const isToday = date.isSame(dayjs(), 'day')
    const isSelected = date.isSame(selectedDate, 'day')
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const dayPrograms = getProgramsForDate(date)
    const hasPrograms = dayPrograms.length > 0

    return (
      <div
        className={`program-calendar-cell ${isSelected ? 'program-calendar-cell--selected' : ''} ${isToday ? 'program-calendar-cell--today' : ''} ${!isCurrentMonth ? 'program-calendar-cell--other-month' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="program-calendar-cell-date">{date.date()}</div>
        {hasPrograms && isCurrentMonth && (
          <div className="program-calendar-cell-events">
            {dayPrograms.map(program => (
              <div
                key={program.id}
                className="program-calendar-event"
                onClick={e => {
                  e.stopPropagation()
                  onProgramClick(program)
                }}
              >
                <span
                  className="program-calendar-event-bar"
                  style={{ backgroundColor: getEventColor(program, date) }}
                />
                <span className="program-calendar-event-title">{program.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="program-calendar-view program-calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  // 주간 뷰 렌더링
  const renderWeekView = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="program-calendar-week">
        {/* 요일 헤더 */}
        <div className="program-calendar-week-header">
          {weekdayNames.map(day => (
            <div key={day} className="program-calendar-week-header-cell">
              {day}
            </div>
          ))}
        </div>
        {/* 날짜 셀들 */}
        <div className="program-calendar-week-body">
          {weekDates.map(date => {
            const isToday = date.isSame(dayjs(), 'day')
            const isSelected = date.isSame(selectedDate, 'day')
            const dayPrograms = getProgramsForDate(date)
            const hasPrograms = dayPrograms.length > 0

            return (
              <div
                key={date.format('YYYY-MM-DD')}
                className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''} ${isToday ? 'program-calendar-week-cell--today' : ''}`}
                onClick={() => handleDateSelect(date)}
              >
                <div className="program-calendar-week-cell-date">{date.date()}</div>
                {hasPrograms && (
                  <div className="program-calendar-week-cell-events">
                    {dayPrograms.slice(0, 6).map(program => (
                      <div
                        key={program.id}
                        className="program-calendar-event"
                        onClick={e => {
                          e.stopPropagation()
                          onProgramClick(program)
                        }}
                      >
                        <span
                          className="program-calendar-event-bar"
                          style={{ backgroundColor: getEventColor(program, date) }}
                        />
                        <span className="program-calendar-event-title">{program.title}</span>
                      </div>
                    ))}
                    {dayPrograms.length > 6 && (
                      <div className="program-calendar-event-more">
                        +{dayPrograms.length - 6}개 더
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="program-calendar-view">
      {/* 좌측: 메인 캘린더 */}
      <div className="program-calendar-main" ref={mainCalendarRef}>
        {headerRender()}
        {calendarMode === 'week' ? (
          renderWeekView()
        ) : (
          <Calendar
            value={currentMonth}
            fullCellRender={dateFullCellRender}
            headerRender={() => null}
          />
        )}
      </div>

      {/* 우측: 미니 캘린더 + 일정 리스트 */}
      <div
        className="program-calendar-sidebar"
        style={sidebarHeight ? { height: sidebarHeight } : undefined}
      >
        <ProgramMiniCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          programDates={programDates}
        />
        <ProgramScheduleList
          selectedDate={selectedDate}
          programs={programs}
          onProgramClick={onProgramClick}
        />
      </div>
    </div>
  )
}
