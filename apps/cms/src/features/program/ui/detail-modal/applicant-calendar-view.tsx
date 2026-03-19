import { useState, useRef, useEffect, useMemo } from 'react'
import { Calendar, Button, Spin, Segmented } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { ApplicantScheduleList } from './applicant-schedule-list'
import './applicant-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** 학교/강사별 색상 팔레트 — primary: 좌측 accent, light: 배경 (스크린샷: pink, green, cyan 등) */
const SCHEDULE_COLOR_BASE: { primary: string; light: string }[] = [
  { primary: '#E91E63', light: '#FCE4EC' }, // pink
  { primary: '#4CAF50', light: '#E8F5E9' }, // green/mint
  { primary: '#00BCD4', light: '#E0F7FA' }, // cyan
  { primary: '#9C27B0', light: '#F3E5F5' }, // purple
  { primary: '#FF9800', light: '#FFF3E0' }, // orange
  { primary: '#2196F3', light: '#E3F2FD' }, // blue
  { primary: '#795548', light: '#EFEBE9' }, // brown
  { primary: '#607D8B', light: '#ECEFF1' }, // blue grey
]

function getEntityKey(event: any): string {
  const item = event?.originalItem
  if (item?.schoolName) return item.schoolName
  if (item?.instructorName) return item.instructorName
  return event?.title?.replace(/^\[.*?\]\s*/, '') ?? ''
}

interface ApplicantCalendarViewProps {
  events: any[]
  loading?: boolean
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onItemClick: (item: any) => void
}

export function ApplicantCalendarView({
  events,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onItemClick,
}: ApplicantCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null)
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  // 고정 팔레트 (학교/강사별 색상 일관 유지)
  const colorPalette = SCHEDULE_COLOR_BASE
  // 학교/강사별 색상 매핑 (순차 할당)
  const entityToColorIndex = useMemo(() => {
    const keys = new Set<string>()
    events.forEach(ev => {
      const k = getEntityKey(ev)
      if (k) keys.add(k)
    })
    const sorted = Array.from(keys).sort()
    const map = new Map<string, number>()
    sorted.forEach((k, i) => map.set(k, i % colorPalette.length))
    return map
  }, [events, colorPalette])

  const getColorForEvent = (event: any) => {
    const key = getEntityKey(event)
    const idx = entityToColorIndex.get(key) ?? 0
    return colorPalette[idx]
  }

  // 메인 캘린더 높이 측정하여 우측 패널에 적용
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

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Dayjs): any[] => {
    return events.filter(event => {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
    })
  }

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    // 선택한 날짜의 월로 이동
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
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

  const handleToday = () => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }

  // 메인 캘린더 헤더 렌더링
  const headerRender = () => {
    const headerTitle = currentMonth.format('YYYY. MM')

    return (
      <div className="applicant-calendar-header">
        <div className="applicant-calendar-header-left">
          <span className="applicant-calendar-header-title">{headerTitle}</span>
          <Button size="small" className="applicant-calendar-today-btn" onClick={handleToday}>
            오늘
          </Button>
          <div className="applicant-calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              className="applicant-calendar-nav-btn"
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              className="applicant-calendar-nav-btn"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="applicant-calendar-header-right">
          <Segmented
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
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isToday = date.isSame(dayjs(), 'day')
    const isSelected = date.isSame(selectedDate, 'day')
    const dayEvents = getEventsForDate(date)
    const hasEvents = dayEvents.length > 0

    return (
      <div
        className={`applicant-calendar-cell ${!isCurrentMonth ? 'applicant-calendar-cell--other-month' : ''} ${isSelected ? 'applicant-calendar-cell--selected' : ''} ${isToday ? 'applicant-calendar-cell--today' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="applicant-calendar-cell-date">
          <span className={isToday ? 'applicant-calendar-cell-date-today' : ''}>{date.date()}</span>
        </div>
        {hasEvents && (
          <div className="applicant-calendar-cell-events">
            {dayEvents.slice(0, 2).map(event => {
              const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
              const isEventSelected = selectedRowKeys.includes(event.id)
              const color = getColorForEvent(event)
              return (
                <div
                  key={event.id}
                  className={`applicant-calendar-event ${isEventSelected ? 'applicant-calendar-event--selected' : ''}`}
                  style={{
                    backgroundColor: color.light,
                    ...(isEventSelected && { boxShadow: '0 0 0 2px #1890ff' }),
                  }}
                >
                  <span className="applicant-calendar-event-title">{displayTitle}</span>
                </div>
              )
            })}
            {dayEvents.length > 2 && (
              <div className="applicant-calendar-event-more">
                외 {dayEvents.length - 2}개의 일정
              </div>
            )}
          </div>
        )}
      </div>
    )
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
      {/* 좌측: 메인 캘린더 */}
      <div className="applicant-calendar-main" ref={mainCalendarRef}>
        {headerRender()}
        <Calendar
          value={currentMonth}
          fullCellRender={dateFullCellRender}
          headerRender={() => null}
          mode={calendarMode === 'week' ? 'month' : 'month'} // Ant Design Calendar doesn't natively support week mode easily without custom logic
        />
      </div>

      {/* 우측: 선택일 일정 리스트 */}
      <div
        className="applicant-calendar-right"
        style={sidebarHeight ? { height: sidebarHeight } : undefined}
      >
        <ApplicantScheduleList
          selectedDate={selectedDate}
          events={getEventsForDate(selectedDate)}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onEventClick={onItemClick}
          getColorForEvent={getColorForEvent}
        />
      </div>
    </div>
  )
}
