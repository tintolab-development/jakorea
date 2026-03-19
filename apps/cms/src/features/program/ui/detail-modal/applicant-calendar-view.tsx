import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
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

/** 학교/강사별 색상 팔레트 — primary: 좌측 accent, light: 배경 (opacity 0.8) */
const SCHEDULE_COLOR_BASE: { primary: string; light: string; border: string }[] = [
  {
    primary: 'rgba(233, 30, 99, 0.8)',
    light: 'rgba(252, 228, 236, 0.6)',
    border: 'rgba(233, 30, 99, 0.7)',
  }, // pink
  {
    primary: 'rgba(76, 175, 80, 0.8)',
    light: 'rgba(232, 245, 233, 0.6)',
    border: 'rgba(76, 175, 80, 0.7)',
  }, // green/mint
  {
    primary: 'rgba(0, 188, 212, 0.8)',
    light: 'rgba(224, 247, 250, 0.6)',
    border: 'rgba(0, 188, 212, 0.7)',
  }, // cyan
  {
    primary: 'rgba(255, 152, 0, 0.8)',
    light: 'rgba(255, 243, 224, 0.6)',
    border: 'rgba(255, 152, 0, 0.7)',
  }, // orange
  {
    primary: 'rgba(121, 85, 72, 0.8)',
    light: 'rgba(239, 235, 233, 0.6)',
    border: 'rgba(121, 85, 72, 0.7)',
  }, // brown
  {
    primary: 'rgba(96, 125, 139, 0.8)',
    light: 'rgba(236, 239, 241, 0.6)',
    border: 'rgba(96, 125, 139, 0.7)',
  }, // blue grey
  {
    primary: 'rgba(255, 235, 59, 0.8)',
    light: 'rgba(255, 249, 196, 0.6)',
    border: 'rgba(255, 235, 59, 0.7)',
  }, // 연한 노란색
  {
    primary: 'rgba(79, 195, 247, 0.8)',
    light: 'rgba(179, 229, 252, 0.6)',
    border: 'rgba(79, 195, 247, 0.7)',
  }, // 연한 하늘색
  {
    primary: 'rgba(244, 143, 177, 0.8)',
    light: 'rgba(252, 228, 236, 0.6)',
    border: 'rgba(244, 143, 177, 0.7)',
  }, // 연한 분홍색
  {
    primary: 'rgba(129, 199, 132, 0.8)',
    light: 'rgba(232, 245, 233, 0.7)',
    border: 'rgba(129, 199, 132, 0.7)',
  }, // 연한 연두색
  {
    primary: 'rgba(179, 157, 219, 0.8)',
    light: 'rgba(243, 229, 245, 0.6)',
    border: 'rgba(179, 157, 219, 0.7)',
  }, // 연한 보라색
  {
    primary: 'rgba(248, 187, 208, 0.8)',
    light: 'rgba(252, 228, 236, 0.8)',
    border: 'rgba(248, 187, 208, 0.7)',
  }, // 연한 분홍색 (파스텔)
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

  /** 인접한 서로 다른 엔티티 간 동일 색상 방지. 이미 사용된 색은 최대한 재사용하지 않고 미사용 색 우선 배정 */
  const buildResolvedColorMap = useCallback(
    (eventList: any[]) => {
      const map = new Map<string, (typeof colorPalette)[0]>()
      const usedIndices = new Set<number>()
      let prevIdx = -1
      let prevKey = ''

      eventList.forEach(ev => {
        const key = getEntityKey(ev)
        let idx = entityToColorIndex.get(key) ?? 0

        // 서로 다른 엔티티가 인접한데 같은 색이면 → 미사용 색 우선, 없으면 다음 색
        if (prevIdx >= 0 && idx === prevIdx && key !== prevKey) {
          let altIdx = -1
          for (let i = 0; i < colorPalette.length; i++) {
            if (!usedIndices.has(i) && i !== prevIdx) {
              altIdx = i
              break
            }
          }
          if (altIdx >= 0) {
            idx = altIdx
          } else {
            idx = (prevIdx + 1) % colorPalette.length
          }
        }

        usedIndices.add(idx)
        prevIdx = idx
        prevKey = key
        map.set(ev.id, colorPalette[idx])
      })
      return map
    },
    [entityToColorIndex, colorPalette]
  )

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

  const dayEvents = useMemo(() => getEventsForDate(selectedDate), [events, selectedDate])
  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(dayEvents),
    [dayEvents, buildResolvedColorMap]
  )
  const getColorForScheduleList = useCallback(
    (event: any) => scheduleListColorMap.get(event.id) ?? colorPalette[0],
    [scheduleListColorMap, colorPalette]
  )

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
            {(() => {
              const resolvedMap = buildResolvedColorMap(dayEvents)
              return dayEvents.slice(0, 2).map(event => {
                const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
                const isEventSelected = selectedRowKeys.includes(event.id)
                const color = resolvedMap.get(event.id) ?? colorPalette[0]
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
              })
            })()}
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
          events={dayEvents}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onEventClick={onItemClick}
          getColorForEvent={getColorForScheduleList}
        />
      </div>
    </div>
  )
}
