/**
 * 프로그램 일정 위젯
 * - 월간/주간 탭 전환, 상단 헤더 공유, 하위 캘린더 형식만 전환
 * - 월간: 월 그리드 + 우측 일정 리스트 / 주간: 주간 그리드 셀 내 이벤트
 */

import { Card, List, Button, Empty } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import dayjs, { type Dayjs } from 'dayjs'
import { mockSchedules, mockPrograms } from '@/data/mock'
import { programService } from '@/entities/program/api/program-service'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import type { Schedule } from '@/types'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { SegmentedTab } from '@/shared/ui'
import '@/shared/ui/widget-more-button.css'
import './program-schedule-widget.css'
import '@/features/program/ui/program-calendar-view.css'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface ScheduleEvent {
  id: string
  type: 'education' | 'recruitment_deadline' | 'recruitment_start'
  title: string
  time: string
  programId: string
  programTitle: string
  /** 프로그램 진행 현황 태그 색상 동기화용 */
  lifecycleStatus: ProgramLifecycleStatus
}

/** 프로그램 진행 현황 배지 배경색 (program-lifecycle-status-badge.css와 동기화) */
const LIFECYCLE_STATUS_BG: Record<ProgramLifecycleStatus, string> = {
  planned: '#f5f5f5',
  recruiting_students: '#eaf7ec',
  recruiting_instructors: '#f4f0f9',
  matching_completed: '#fff5e9',
  education_before_textbook: '#e9f6fa',
  education_after_textbook: '#e9f6fa',
  education_completed: '#fdeef1',
  document_processing_completed: '#f5f5f5',
}

function getEventTypeLabel(type: ScheduleEvent['type']) {
  switch (type) {
    case 'education':
      return '교육 예정'
    case 'recruitment_deadline':
      return '모집 마감'
    case 'recruitment_start':
      return '모집 시작'
    default:
      return ''
  }
}

function getLifecycleBg(status: ProgramLifecycleStatus): string {
  return LIFECYCLE_STATUS_BG[status] ?? '#f0f0f0'
}

/** 같은 날 일정에서 상이한 프로그램 진행현황 최대 2개만 추출 (표시용) */
function getDisplayStatuses(dayEvents: ScheduleEvent[]): ProgramLifecycleStatus[] {
  const seen = new Set<ProgramLifecycleStatus>()
  const result: ProgramLifecycleStatus[] = []
  for (const ev of dayEvents) {
    if (result.length >= 2) break
    if (!seen.has(ev.lifecycleStatus)) {
      seen.add(ev.lifecycleStatus)
      result.push(ev.lifecycleStatus)
    }
  }
  return result
}

const WIDGET_KEY = 'program-schedule-widget'
const EMPTY_IDS: string[] = []

function buildEventsForDate(
  date: Dayjs,
  schedulesByDate: Record<string, Schedule[]>,
  programIdSet: Set<string> | null
): ScheduleEvent[] {
  const dateKey = date.format('YYYY-MM-DD')
  const schedules = schedulesByDate[dateKey] || []
  const events: ScheduleEvent[] = []

  const defaultStatus: ProgramLifecycleStatus = 'education_before_textbook'

  schedules.forEach(schedule => {
    const program = programService.getByIdSync(schedule.programId)
    if (program) {
      events.push({
        id: schedule.id,
        type: 'education',
        title: `${program.title} ${schedule.title || ''}`.trim(),
        time: schedule.startTime || '00:00',
        programId: program.id,
        programTitle: program.title,
        lifecycleStatus: program.lifecycleStatus ?? defaultStatus,
      })
    }
  })

  const programs = programIdSet
    ? mockPrograms.filter(p => programIdSet.has(p.id))
    : mockPrograms
  programs.forEach(program => {
    const applicationEndDate = program.applicationEndDate
      ? dayjs(program.applicationEndDate)
      : null
    const applicationStartDate = program.applicationStartDate
      ? dayjs(program.applicationStartDate)
      : null
    const status = program.lifecycleStatus ?? defaultStatus

    if (applicationEndDate?.isSame(date, 'day')) {
      events.push({
        id: `recruitment-deadline-${program.id}`,
        type: 'recruitment_deadline',
        title: `${program.title} 모집 마감일`,
        time: '24:00',
        programId: program.id,
        programTitle: program.title,
        lifecycleStatus: status,
      })
    }
    if (applicationStartDate?.isSame(date, 'day')) {
      events.push({
        id: `recruitment-start-${program.id}`,
        type: 'recruitment_start',
        title: `${program.title} 강사 모집 시작일`,
        time: '24:00',
        programId: program.id,
        programTitle: program.title,
        lifecycleStatus: status,
      })
    }
  })

  return events.sort((a, b) => {
    const timeA = a.time === '24:00' ? '23:59' : a.time
    const timeB = b.time === '24:00' ? '23:59' : b.time
    return timeA.localeCompare(timeB)
  })
}

export function ProgramScheduleWidget() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const selectedIds = useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY])
  const allowedProgramIds = selectedIds ?? EMPTY_IDS
  const programIdSet = useMemo(
    () => (allowedProgramIds.length > 0 ? new Set(allowedProgramIds) : null),
    [allowedProgramIds]
  )

  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {}
    const schedules = programIdSet
      ? mockSchedules.filter(s => programIdSet.has(s.programId))
      : mockSchedules
    schedules.forEach(schedule => {
      const dateKey = dayjs(schedule.date).format('YYYY-MM-DD')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(schedule)
    })
    return grouped
  }, [programIdSet])

  // 월간: 이전 달 말일 + 현재 달만 (35셀 고정). 주간: 해당 주 7일
  const visibleDateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = currentMonth.startOf('week')
      return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
    }
    const end = currentMonth.endOf('month')
    const start = end.subtract(34, 'day')
    return Array.from({ length: 35 }, (_, i) => start.add(i, 'day'))
  }, [currentMonth, viewMode])

  const eventsByDate = useMemo(() => {
    const out: Record<string, ScheduleEvent[]> = {}
    visibleDateRange.forEach(d => {
      out[d.format('YYYY-MM-DD')] = buildEventsForDate(d, schedulesByDate, programIdSet)
    })
    return out
  }, [visibleDateRange, schedulesByDate, programIdSet])

  const selectedDateEvents = useMemo(() => {
    const dateKey = selectedDate.format('YYYY-MM-DD')
    return eventsByDate[dateKey] ?? []
  }, [selectedDate, eventsByDate])

  const weekDates = useMemo(() => {
    const startOfWeek = currentMonth.startOf('week')
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  }, [currentMonth])

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    if (viewMode === 'month' && !date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentMonth(prev => prev.subtract(1, 'week'))
    } else {
      setCurrentMonth(prev => prev.subtract(1, 'month'))
    }
  }

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentMonth(prev => prev.add(1, 'week'))
    } else {
      setCurrentMonth(prev => prev.add(1, 'month'))
    }
  }

  const handleViewAll = () => navigate('/schedules')

  const handleEventClick = (event: ScheduleEvent) => {
    if (event.type === 'education') {
      navigate(`/schedules/${event.id}`)
    } else {
      navigate('/schedules')
    }
  }

  const headerTitle =
    viewMode === 'week'
      ? `${weekDates[0].format('MM.DD')} - ${weekDates[6].format('MM.DD')}`
      : currentMonth.format('YY.MM')

  const renderMonthCell = (date: Dayjs) => {
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isToday = date.isSame(dayjs(), 'day')
    const isSelected = date.isSame(selectedDate, 'day')
    const dateKey = date.format('YYYY-MM-DD')
    const dayEvents = eventsByDate[dateKey] || []
    const displayStatuses = getDisplayStatuses(dayEvents)
    const hasEvents = displayStatuses.length > 0
    const isSingleBlock = displayStatuses.length === 1

    return (
      <div
        key={dateKey}
        className={`program-calendar-cell ${!isCurrentMonth ? 'program-calendar-cell--other-month' : ''} ${isSelected ? 'program-calendar-cell--selected' : ''} ${isToday ? 'program-calendar-cell--today' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="program-calendar-cell-date">{date.date()}</div>
        {hasEvents && (
          <div className="program-schedule-widget__cell-badges">
            {isSingleBlock ? (
              <div
                className="program-schedule-widget__cell-badge program-schedule-widget__cell-badge--single"
                style={{ backgroundColor: getLifecycleBg(displayStatuses[0]) }}
                onClick={e => {
                  e.stopPropagation()
                  if (dayEvents[0]) handleEventClick(dayEvents[0])
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    if (dayEvents[0]) handleEventClick(dayEvents[0])
                  }
                }}
              />
            ) : (
              displayStatuses.map((status, i) => (
                <div
                  key={`${status}-${i}`}
                  className="program-schedule-widget__cell-badge program-schedule-widget__cell-badge--multi"
                  style={{ backgroundColor: getLifecycleBg(status) }}
                  onClick={e => {
                    e.stopPropagation()
                    if (dayEvents[i]) handleEventClick(dayEvents[i])
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      if (dayEvents[i]) handleEventClick(dayEvents[i])
                    }
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  /** 월간: 이전 달 말일 + 현재 달만, 35셀(5×7) 고정 그리드 */
  const renderMonthGrid = () => {
    const monthDates = visibleDateRange as Dayjs[]
    return (
      <div className="program-schedule-widget__month-grid-wrap">
        <table className="program-schedule-widget__month-grid">
          <thead>
            <tr>
              {WEEKDAY_LABELS.map(day => (
                <th key={day} scope="col">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4].map(row => (
              <tr key={row}>
                {[0, 1, 2, 3, 4, 5, 6].map(col => {
                  const date = monthDates[row * 7 + col]
                  return (
                    <td key={col}>
                      {date ? renderMonthCell(date) : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderWeekView = () => (
    <div className="program-calendar-week">
      <div className="program-calendar-week-header">
        {WEEKDAY_LABELS.map(day => (
          <div key={day} className="program-calendar-week-header-cell">
            {day}
          </div>
        ))}
      </div>
      <div className="program-calendar-week-body">
        {weekDates.map(date => {
          const isToday = date.isSame(dayjs(), 'day')
          const isSelected = date.isSame(selectedDate, 'day')
          const dateKey = date.format('YYYY-MM-DD')
          const dayEvents = eventsByDate[dateKey] || []
          const visibleEvents = dayEvents.slice(0, 3)
          const hasMore = dayEvents.length > 3
          const moreCount = dayEvents.length - 3

          return (
            <div
              key={dateKey}
              className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''} ${isToday ? 'program-calendar-week-cell--today' : ''}`}
              onClick={() => handleDateSelect(date)}
            >
              <div className="program-calendar-week-cell-date">{date.date()}</div>
              {visibleEvents.length > 0 && (
                <div className="program-schedule-widget__week-events">
                  {visibleEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="program-schedule-widget__week-event-card"
                      style={{ backgroundColor: getLifecycleBg(ev.lifecycleStatus) }}
                      onClick={e => {
                        e.stopPropagation()
                        handleEventClick(ev)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          handleEventClick(ev)
                        }
                      }}
                    >
                      <span className="program-schedule-widget__week-event-time">{ev.time}</span>
                      <span className="program-schedule-widget__week-event-title">{ev.title}</span>
                    </div>
                  ))}
                  {hasMore && (
                    <div className="program-schedule-widget__week-event-more">
                      외 {moreCount}개의 일정
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

  const eventListSection = (
    <div className="program-schedule-widget__events">
      {selectedDateEvents.length === 0 ? (
        <Empty
          description="해당 날짜에 일정이 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="program-schedule-widget__empty"
        />
      ) : (
        <List
          dataSource={selectedDateEvents}
          split={false}
          className="program-schedule-widget__event-list"
          renderItem={event => (
            <List.Item
              className="program-schedule-widget__event-item"
              onClick={() => handleEventClick(event)}
            >
              <div className="program-schedule-widget__event-column">
                <div className="program-schedule-widget__event-head">
                  <span className="program-schedule-widget__event-type">
                    {getEventTypeLabel(event.type)}
                  </span>
                  <span className="program-schedule-widget__event-time">| {event.time}</span>
                </div>
                <div className="program-schedule-widget__event-desc">{event.title}</div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <Card
      title={
        <div className="program-schedule-widget__head-row">
          <div className="program-schedule-widget__head-left">
            <WidgetTitleWithHandle>
              <span>프로그램 일정</span>
            </WidgetTitleWithHandle>
            <div className="program-schedule-widget__head-nav">
              <button
                type="button"
                onClick={handlePrev}
                className="program-schedule-widget__head-nav-btn"
                aria-label="이전"
              >
                <LeftOutlined />
              </button>
              <span className="program-schedule-widget__head-date">{headerTitle}</span>
              <button
                type="button"
                onClick={handleNext}
                className="program-schedule-widget__head-nav-btn"
                aria-label="다음"
              >
                <RightOutlined />
              </button>
            </div>
          </div>
          <div className="program-schedule-widget__head-right">
            <SegmentedTab
              size="small"
              value={viewMode}
              onChange={v => {
                const mode = v as 'month' | 'week'
                setViewMode(mode)
                if (mode === 'week') {
                  setCurrentMonth(selectedDate.startOf('week'))
                }
              }}
              options={[
                { label: '월간', value: 'month' },
                { label: '주간', value: 'week' },
              ]}
            />
            <Button
              type="link"
              size="small"
              onClick={handleViewAll}
              className="widget-more-button program-schedule-widget__head-more"
            >
              더보기
            </Button>
          </div>
        </div>
      }
      className="program-schedule-widget"
    >
      <div className="program-schedule-widget__content">
        {/* 하위 영역: viewMode에 따라 캘린더 형식만 변경 */}
        {viewMode === 'month' ? (
          <div className="program-schedule-widget__body program-schedule-widget__body--month">
            <div className="program-calendar-main program-schedule-widget__calendar-main">
              {renderMonthGrid()}
            </div>
            {eventListSection}
          </div>
        ) : (
          <div className="program-schedule-widget__body program-schedule-widget__body--week">
            <div className="program-calendar-main program-schedule-widget__calendar-main">
              {renderWeekView()}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
