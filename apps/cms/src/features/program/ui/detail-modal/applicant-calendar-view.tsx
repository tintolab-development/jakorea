import { useState, useRef, useMemo, useCallback } from 'react'
import { Calendar, Button, Spin, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { ApplicantScheduleList } from './applicant-schedule-list'
import './applicant-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** 학교/강사별 태그 배경색 (participating-institutions-calendar-view와 동일, tone-on-tone border) */
const SCHEDULE_COLOR_BASE: { primary: string; light: string; border: string }[] = [
  { primary: '#E8D4D4', light: '#FCF8F8', border: '#E8D4D4' },
  { primary: '#E8C4C4', light: '#FBEFEF', border: '#E8C4C4' },
  { primary: '#E8C8DC', light: '#FEEBF6', border: '#E8C8DC' },
  { primary: '#E8B0B0', light: '#FFDCDC', border: '#E8B0B0' },
  { primary: '#E8E0C8', light: '#FFFBF1', border: '#E8E0C8' },
  { primary: '#D4D8A8', light: '#F1F3E0', border: '#D4D8A8' },
  { primary: '#A8D898', light: '#DDF6D2', border: '#A8D898' },
  { primary: '#B8E0A8', light: '#ECFAE5', border: '#B8E0A8' },
  { primary: '#98D088', light: '#D8EFD3', border: '#98D088' },
  { primary: '#88D0E8', light: '#D4F6FF', border: '#88D0E8' },
  { primary: '#88B0E0', light: '#C6E7FF', border: '#88B0E0' },
  { primary: '#B8C0E8', light: '#EEF1FF', border: '#B8C0E8' },
  { primary: '#D8E0A8', light: '#F4F8D3', border: '#D8E0A8' },
  { primary: '#E8D868', light: '#FFF89A', border: '#E8D868' },
  { primary: '#E8E898', light: '#FDFFBC', border: '#E8E898' },
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
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const weekDates = useMemo(() => {
    const startOfWeek = currentMonth.startOf('week')
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  }, [currentMonth])

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
    if (calendarMode === 'week') {
      if (!date.isSame(currentMonth, 'week')) {
        setCurrentMonth(date.startOf('week'))
      }
    } else if (!date.isSame(currentMonth, 'month')) {
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

  /** 이벤트 툴팁용 미리보기 텍스트 */
  const getEventPreviewContent = useCallback((event: any): string => {
    const displayTitle = event?.title?.replace(/^\[.*?\]\s*/, '') ?? ''
    const item = event?.originalItem
    const lines = [displayTitle]
    if (item?.educationGrade) {
      const grade = item.educationGrade.endsWith('학년')
        ? item.educationGrade
        : `${item.educationGrade}학년`
      lines.push(grade)
    }
    if (item?.desiredEducationPeriod) {
      lines.push(item.desiredEducationPeriod)
    }
    return lines.join('\n')
  }, [])

  // 메인 캘린더 헤더 렌더링
  const headerRender = () => {
    const headerTitle =
      calendarMode === 'week'
        ? `${weekDates[0].format('YYYY.MM')} ${weekDates[0].format('D')} - ${weekDates[6].format('D')}`
        : currentMonth.format('YYYY. MM')

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
          <div className="applicant-calendar-view-mode">
            <div
              className={`applicant-calendar-view-mode__indicator ${calendarMode === 'week' ? 'applicant-calendar-view-mode__indicator--week' : ''}`}
              aria-hidden
            />
            <button
              type="button"
              className={`applicant-calendar-view-mode__tab ${calendarMode === 'month' ? 'applicant-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                setCalendarMode('month')
                setCurrentMonth(selectedDate.startOf('month'))
              }}
            >
              <span className="applicant-calendar-view-mode__tab-text">월간</span>
            </button>
            <button
              type="button"
              className={`applicant-calendar-view-mode__tab ${calendarMode === 'week' ? 'applicant-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                setCalendarMode('week')
                setCurrentMonth(selectedDate.startOf('week'))
              }}
            >
              <span className="applicant-calendar-view-mode__tab-text">주간</span>
            </button>
          </div>
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
              const colorIdx = entityToColorIndex.get(getEntityKey(event)) ?? 0
              return (
                <Tooltip
                  key={event.id}
                  title={
                    <pre className="applicant-calendar-event-tooltip">
                      {getEventPreviewContent(event)}
                    </pre>
                  }
                  placement="topLeft"
                  mouseEnterDelay={0.2}
                >
                  <div
                    className={`applicant-calendar-event ${isEventSelected ? 'applicant-calendar-event--selected' : ''}`}
                    data-color-index={colorIdx}
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="applicant-calendar-event-title">{displayTitle}</span>
                  </div>
                </Tooltip>
              )
            })}
            {dayEvents.length > 2 && (
              <Tooltip
                title={
                  <pre className="applicant-calendar-event-tooltip">
                    {dayEvents
                      .slice(2)
                      .map(ev => getEventPreviewContent(ev))
                      .join('\n\n')}
                  </pre>
                }
                placement="topLeft"
                mouseEnterDelay={0.2}
              >
                <div className="applicant-calendar-event-more">
                  외 {dayEvents.length - 2}개의 일정
                </div>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    )
  }

  // 주간 뷰 렌더링
  const renderWeekView = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="applicant-calendar-week">
        <div className="applicant-calendar-week-header">
          {weekdayNames.map(day => (
            <div key={day} className="applicant-calendar-week-header-cell">
              {day}
            </div>
          ))}
        </div>
        <div className="applicant-calendar-week-body">
          {weekDates.map(d => {
            const isToday = d.isSame(dayjs(), 'day')
            const isSelected = d.isSame(selectedDate, 'day')
            const dayEvents = getEventsForDate(d)
            const hasEvents = dayEvents.length > 0
            return (
              <div
                key={d.format('YYYY-MM-DD')}
                className={`applicant-calendar-week-cell ${isSelected ? 'applicant-calendar-week-cell--selected' : ''} ${isToday ? 'applicant-calendar-week-cell--today' : ''}`}
                onClick={() => handleDateSelect(d)}
              >
                <div className="applicant-calendar-week-cell-date">{d.date()}</div>
                {hasEvents && (
                  <div className="applicant-calendar-week-cell-events">
                    {dayEvents.slice(0, 2).map(event => {
                      const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
                      const colorIdx = entityToColorIndex.get(getEntityKey(event)) ?? 0
                      return (
                        <Tooltip
                          key={event.id}
                          title={
                            <pre className="applicant-calendar-event-tooltip">
                              {getEventPreviewContent(event)}
                            </pre>
                          }
                          placement="topLeft"
                          mouseEnterDelay={0.2}
                        >
                          <div
                            className="applicant-calendar-event"
                            data-color-index={colorIdx}
                            onClick={e => e.stopPropagation()}
                          >
                            <span className="applicant-calendar-event-title">{displayTitle}</span>
                          </div>
                        </Tooltip>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <Tooltip
                        title={
                          <pre className="applicant-calendar-event-tooltip">
                            {dayEvents
                              .slice(2)
                              .map(ev => getEventPreviewContent(ev))
                              .join('\n\n')}
                          </pre>
                        }
                        placement="topLeft"
                        mouseEnterDelay={0.2}
                      >
                        <div className="applicant-calendar-event-more">
                          외 {dayEvents.length - 2}개의 일정
                        </div>
                      </Tooltip>
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

      {/* 우측: 선택일 일정 리스트 */}
      <div className="applicant-calendar-right">
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
