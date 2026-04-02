/**
 * 대시보드 - 프로그램 일정 위젯
 * - 월간/주간 탭 전환, 상단 헤더 공유, 하위 캘린더 형식만 전환
 * - 월간: 월 그리드 + 우측 일정 리스트 / 주간: 주간 그리드 셀 내 이벤트
 */

import { Card, List, Button, Empty, Popover } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useRef, useLayoutEffect, Fragment } from 'react'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import dayjs, { type Dayjs } from 'dayjs'
import { mockPrograms, mockSchedules, getEconomyPrograms } from '@/data/mock'
import { programService } from '@/entities/program/api/program-service'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import type { Schedule } from '@/types'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'
import { getProgramAdminDetailInfoTabUrl } from '@/features/program/lib/program-admin-detail-url'
import { SegmentedTab } from '@/shared/ui'
import '@/shared/ui/widget-more-button.css'
import '@/shared/ui/program-calendar.css'
import './program-schedule-widget.css'

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

// ---------------------------------------------------------------------------
// TEMP: 대시보드「프로그램 일정」위젯은 경제 교육 프로그램만 노출.
// 대시보드 설정은 mockPrograms id(prog-*)를 저장하고, 일정은 economy-prog-* 이므로
// 선택 id → title → 동일 title 경제 프로그램 id로 매핑한다.
// 보이는 날짜 구간에 경제 스케줄이 없으면 injectEconomyFallbackSchedules로 보강한다.
// 일반 교육 연동 시 economy 전용 로직·resolveWidgetProgram 보조를 제거할 것.
// ---------------------------------------------------------------------------

function resolveWidgetProgram(programId: string): Program | undefined {
  return programService.getByIdSync(programId) ?? getEconomyPrograms().find(p => p.id === programId)
}

/** 일정 목록·캘린더·팝오버에서 동일한 SCHEDULE_COLORS 매핑 */
function buildScheduleColorMapForWidgetEvents(
  events: ScheduleEvent[]
): Map<string, ScheduleColorPair> {
  const seen = new Set<string>()
  const programs: Program[] = []
  for (const ev of events) {
    if (seen.has(ev.programId)) continue
    seen.add(ev.programId)
    const p = resolveWidgetProgram(ev.programId)
    if (p) programs.push(p)
  }
  return buildResolvedScheduleColorMapForPrograms(programs)
}

/** 같은 날 일정에서 서로 다른 programId 최대 2개 (월간 셀 배지용, 등장 순) */
function getDisplayProgramIds(dayEvents: ScheduleEvent[], max = 2): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const ev of dayEvents) {
    if (ids.length >= max) break
    if (!seen.has(ev.programId)) {
      seen.add(ev.programId)
      ids.push(ev.programId)
    }
  }
  return ids
}

/** program-calendar-view Popover 미리보기와 동일 마크업·클래스 (제목만 SCHEDULE_COLORS.text) */
function ScheduleWidgetWeekCellPreview({
  dayEvents,
  onEventClick,
}: {
  dayEvents: ScheduleEvent[]
  onEventClick?: (ev: ScheduleEvent) => void
}) {
  const scheduleColorMap = useMemo(
    () => buildScheduleColorMapForWidgetEvents(dayEvents),
    [dayEvents]
  )

  return (
    <div className="program-calendar-cell-preview">
      {dayEvents.map(ev => {
        const colorPair = scheduleColorMap.get(ev.programId) ?? SCHEDULE_COLORS[0]
        return (
          <button
            key={ev.id}
            type="button"
            className="program-calendar-cell-preview__item"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onEventClick?.(ev)
            }}
          >
            <span
              className="program-calendar-cell-preview__title"
              style={{ color: colorPair.text }}
            >
              [{ev.programTitle}]
            </span>
            <span className="program-calendar-cell-preview__desc">
              {getEventTypeLabel(ev.type)} | {ev.time}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const WIDGET_KEY = 'program-schedule-widget'

/**
 * 대시보드 설정에 체크된 mock 프로그램 id → 동일 title의 경제 프로그램 id 집합.
 * 빈/미설정은 null(전체 노출). 선택은 있으나 매칭 title이 없으면 빈 Set.
 */
function economyProgramIdsFromWidgetSelection(
  selectedMockProgramIds: string[] | undefined
): Set<string> | null {
  if (selectedMockProgramIds == null || selectedMockProgramIds.length === 0) return null

  const titleSet = new Set<string>()
  for (const id of selectedMockProgramIds) {
    const p = mockPrograms.find(m => m.id === id)
    if (p) titleSet.add(p.title)
  }
  // 저장 id가 mock과 안 맞거나 매핑 실패 시 빈 Set이면 일정 0건 → 전체 노출로 폴백
  if (titleSet.size === 0) return null

  const out = new Set<string>()
  for (const ep of getEconomyPrograms()) {
    if (titleSet.has(ep.title)) out.add(ep.id)
  }
  return out.size > 0 ? out : null
}

/** mock 스케줄이 보이는 구간에 경제 일정이 없을 때(달 불일치·필터 등) 대시보드용 보강 */
function injectEconomyFallbackSchedules(
  grouped: Record<string, Schedule[]>,
  visibleDates: Dayjs[],
  economyProgramIdSet: Set<string>,
  pool: Program[]
): void {
  if (pool.length === 0) return
  let countInRange = 0
  for (const d of visibleDates) {
    const key = d.format('YYYY-MM-DD')
    for (const s of grouped[key] ?? []) {
      if (economyProgramIdSet.has(s.programId)) countInRange += 1
    }
  }
  if (countInRange > 0) return

  visibleDates.forEach((d, i) => {
    const dateKey = d.format('YYYY-MM-DD')
    const program = pool[i % pool.length]
    const round = program.rounds?.[0]
    const startHour = 9 + (i % 7)
    const row: Schedule = {
      id: `sch-economy-widget-${dateKey}`,
      programId: program.id,
      roundId: round?.id,
      title: '교육 일정 1차시',
      date: dateKey,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(Math.min(startHour + 2, 18)).padStart(2, '0')}:00`,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
    }
    grouped[dateKey] = [...(grouped[dateKey] ?? []), row]
  })
}

function buildEventsForDate(
  date: Dayjs,
  schedulesByDate: Record<string, Schedule[]>,
  allowedEconomyProgramIdSet: Set<string> | null,
  economyProgramIdSet: Set<string>
): ScheduleEvent[] {
  const dateKey = date.format('YYYY-MM-DD')
  const schedules = schedulesByDate[dateKey] || []
  const events: ScheduleEvent[] = []

  const defaultStatus: ProgramLifecycleStatus = 'education_completed'

  schedules.forEach(schedule => {
    if (!economyProgramIdSet.has(schedule.programId)) return
    const program = resolveWidgetProgram(schedule.programId)
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

  const economyPrograms = getEconomyPrograms()
  const programs = allowedEconomyProgramIdSet
    ? economyPrograms.filter(p => allowedEconomyProgramIdSet.has(p.id))
    : economyPrograms
  programs.forEach(program => {
    const applicationEndDate = program.applicationEndDate ? dayjs(program.applicationEndDate) : null
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

/** 대시보드 SortableWidgetSlot의 data-col-span(50% = 12) — CSS만으로는 적용이 어긋날 수 있어 DOM으로 동기화 */
function useDashboardHalfColumnSlot() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [halfColumn, setHalfColumn] = useState(false)

  useLayoutEffect(() => {
    const root = cardRef.current
    if (!root) {
      setHalfColumn(false)
      return
    }
    const slot = root.closest('.dashboard-widget-slot')
    if (!slot) {
      setHalfColumn(false)
      return
    }
    const sync = () => setHalfColumn(slot.getAttribute('data-col-span') === '12')
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(slot, { attributes: true, attributeFilter: ['data-col-span'] })
    return () => mo.disconnect()
  }, [])

  return { cardRef, halfColumn }
}

export function ProgramScheduleWidget() {
  const navigate = useNavigate()
  const { cardRef, halfColumn } = useDashboardHalfColumnSlot()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const selectedMockProgramIds = useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY])

  /** TEMP: 경제 교육 프로그램 id만 (원복 시 제거) */
  const economyProgramIdSet = useMemo(() => new Set(getEconomyPrograms().map(p => p.id)), [])

  const allowedEconomyProgramIdSet = useMemo(
    () => economyProgramIdsFromWidgetSelection(selectedMockProgramIds),
    [selectedMockProgramIds]
  )

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

  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {}
    let schedules = mockSchedules.filter(s => economyProgramIdSet.has(s.programId))
    if (allowedEconomyProgramIdSet) {
      schedules = schedules.filter(s => allowedEconomyProgramIdSet.has(s.programId))
    }
    schedules.forEach(schedule => {
      const dateKey = dayjs(schedule.date).format('YYYY-MM-DD')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(schedule)
    })

    const economyPrograms = getEconomyPrograms()
    const pool = allowedEconomyProgramIdSet
      ? economyPrograms.filter(p => allowedEconomyProgramIdSet.has(p.id))
      : economyPrograms
    injectEconomyFallbackSchedules(grouped, visibleDateRange, economyProgramIdSet, pool)

    return grouped
  }, [allowedEconomyProgramIdSet, economyProgramIdSet, visibleDateRange])

  const eventsByDate = useMemo(() => {
    const out: Record<string, ScheduleEvent[]> = {}
    visibleDateRange.forEach(d => {
      out[d.format('YYYY-MM-DD')] = buildEventsForDate(
        d,
        schedulesByDate,
        allowedEconomyProgramIdSet,
        economyProgramIdSet
      )
    })
    return out
  }, [visibleDateRange, schedulesByDate, allowedEconomyProgramIdSet, economyProgramIdSet])

  const selectedDateEvents = useMemo(() => {
    const dateKey = selectedDate.format('YYYY-MM-DD')
    return eventsByDate[dateKey] ?? []
  }, [selectedDate, eventsByDate])

  const selectedDayScheduleColorMap = useMemo(
    () => buildScheduleColorMapForWidgetEvents(selectedDateEvents),
    [selectedDateEvents]
  )

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

  const handleViewAll = () => navigate('/programs/economy-education')

  const handleEventClick = (event: ScheduleEvent) => {
    navigate(getProgramAdminDetailInfoTabUrl(event.programId))
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
    const dayColorMap = buildScheduleColorMapForWidgetEvents(dayEvents)
    const programIds = getDisplayProgramIds(dayEvents, 2)
    const hasEvents = programIds.length > 0
    const isSingleBlock = programIds.length === 1

    const monthCell = (
      <div
        className={`program-calendar-cell ${!isCurrentMonth ? 'program-calendar-cell--other-month' : ''} ${isSelected ? 'program-calendar-cell--selected' : ''} ${isToday ? 'program-calendar-cell--today' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="program-calendar-cell-date">{date.date()}</div>
        {hasEvents && (
          <div className="program-schedule-widget__cell-badges">
            {isSingleBlock ? (
              <div
                className="program-schedule-widget__cell-badge program-schedule-widget__cell-badge--single"
                style={{
                  backgroundColor: (dayColorMap.get(programIds[0]) ?? SCHEDULE_COLORS[0]).bg,
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    const ev = dayEvents.find(x => x.programId === programIds[0])
                    if (ev) handleEventClick(ev)
                  }
                }}
              />
            ) : (
              programIds.map(pid => {
                const pair = dayColorMap.get(pid) ?? SCHEDULE_COLORS[0]
                return (
                  <div
                    key={pid}
                    className="program-schedule-widget__cell-badge program-schedule-widget__cell-badge--multi"
                    style={{
                      backgroundColor: pair.bg,
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        const ev = dayEvents.find(x => x.programId === pid)
                        if (ev) handleEventClick(ev)
                      }
                    }}
                  />
                )
              })
            )}
          </div>
        )}
      </div>
    )

    if (dayEvents.length === 0) {
      return <Fragment key={dateKey}>{monthCell}</Fragment>
    }

    return (
      <Popover
        key={dateKey}
        arrow={false}
        overlayClassName="program-calendar-cell-preview-popover"
        trigger="hover"
        placement="bottomLeft"
        mouseEnterDelay={0.12}
        mouseLeaveDelay={0.08}
        getPopupContainer={() => document.body}
        content={<ScheduleWidgetWeekCellPreview dayEvents={dayEvents} />}
      >
        {monthCell}
      </Popover>
    )
  }

  /* 대시보드 캘린더 — table 대신 CSS Grid로 5행 균등(브라우저별 tr/td % 높이 불안정·Popover 래퍼 이슈 회피) */
  const renderMonthGrid = () => {
    const monthDates = visibleDateRange as Dayjs[]
    return (
      <div className="program-schedule-widget__month-grid-wrap">
        <div
          className="program-schedule-widget__month-grid program-schedule-widget__month-grid--grid"
          role="grid"
          aria-label="월간 일정"
        >
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="program-schedule-widget__month-grid-dow" role="columnheader">
              {day}
            </div>
          ))}
          {[0, 1, 2, 3, 4].flatMap(row =>
            [0, 1, 2, 3, 4, 5, 6].map(col => {
              const date = monthDates[row * 7 + col]
              const edgeClass = [
                col === 0 ? 'program-schedule-widget__month-grid-slot--edge-w' : '',
                row === 0 ? 'program-schedule-widget__month-grid-slot--edge-t' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <div
                  key={`${row}-${col}`}
                  className={`program-schedule-widget__month-grid-slot ${edgeClass}`.trim()}
                  role="gridcell"
                >
                  {date ? (
                    <div className="program-schedule-widget__month-td-fill">
                      {renderMonthCell(date)}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
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
          const isSelected = date.isSame(selectedDate, 'day')
          const dateKey = date.format('YYYY-MM-DD')
          const dayEvents = eventsByDate[dateKey] || []
          const dayColorMap = buildScheduleColorMapForWidgetEvents(dayEvents)
          const visibleEvents = dayEvents.slice(0, 3)
          const hasMore = dayEvents.length > 3
          const moreCount = dayEvents.length - 3

          const weekCell = (
            <div className={`program-calendar-week-cell`} onClick={() => handleDateSelect(date)}>
              <div
                className={`${isSelected ? 'program-calendar-week-cell-date--selected' : 'program-calendar-week-cell-date'}`}
              >
                {date.date()}
              </div>
              {visibleEvents.length > 0 && (
                <div className="program-schedule-widget__week-events">
                  {visibleEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="program-schedule-widget__week-event-card"
                      style={{
                        backgroundColor: (dayColorMap.get(ev.programId) ?? SCHEDULE_COLORS[0]).bg,
                      }}
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
                      <span className="program-schedule-widget__week-event-title">
                        {ev.programTitle}
                        <span className="program-schedule-widget__week-event-time">
                          {' '}
                          | {ev.time}
                        </span>
                      </span>
                      <span className="program-schedule-widget__week-event-desc">{ev.title}</span>
                    </div>
                  ))}
                  {hasMore && (
                    <div className="program-schedule-widget__week-event-more">
                      외 {moreCount}개의 항목
                    </div>
                  )}
                </div>
              )}
            </div>
          )

          if (dayEvents.length === 0) {
            return <Fragment key={dateKey}>{weekCell}</Fragment>
          }

          return (
            <Popover
              key={dateKey}
              arrow={false}
              overlayClassName="program-calendar-cell-preview-popover"
              trigger="hover"
              placement="bottomLeft"
              mouseEnterDelay={0.12}
              mouseLeaveDelay={0.08}
              getPopupContainer={() => document.body}
              content={
                <ScheduleWidgetWeekCellPreview
                  dayEvents={dayEvents}
                  onEventClick={handleEventClick}
                />
              }
            >
              {weekCell}
            </Popover>
          )
        })}
      </div>
    </div>
  )

  /* 대시보드 캘린더(월간) - 일정 목록 */
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
          renderItem={event => {
            const pair = selectedDayScheduleColorMap.get(event.programId) ?? SCHEDULE_COLORS[0]
            return (
              <List.Item
                className="program-schedule-widget__event-item"
                style={{
                  backgroundColor: pair.bg,
                  border: `1px solid ${pair.border}`,
                }}
                onClick={() => handleEventClick(event)}
              >
                <div className="program-schedule-widget__event-column">
                  <div className="program-schedule-widget__event-title">{event.title}</div>
                  <div className="program-schedule-widget__event-desc">
                    <span>{getEventTypeLabel(event.type)}</span>
                    <span> | {event.time}</span>
                  </div>
                </div>
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )

  const cardClassName = [
    'program-schedule-widget',
    viewMode === 'week' ? 'program-schedule-widget--week-view' : '',
    halfColumn ? 'program-schedule-widget--dashboard-half' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Card
      ref={cardRef}
      title={
        <div className="program-schedule-widget__head-row">
          <div className="program-schedule-widget__head-left">
            <WidgetTitleWithHandle>
              <span className="widget-card-title">프로그램 일정</span>
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
      className={cardClassName}
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
