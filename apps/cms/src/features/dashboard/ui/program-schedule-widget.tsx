/**
 * 대시보드 - 프로그램 일정 위젯 (일반 / 경제 교육 / 제미나이)
 * - 월간/주간 탭 전환, 상단 헤더 공유, 하위 캘린더 형식만 전환
 * - 월간: 월 그리드 + 우측 일정 리스트 / 주간: 주간 그리드 셀 내 이벤트
 */

import { Card, List, Button, Empty, Popover } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useRef, useLayoutEffect, Fragment, type ReactElement } from 'react'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import dayjs, { type Dayjs } from 'dayjs'
import {
  mockSchedules,
  getEconomyPrograms,
  buildEconomySchedulesForVisibleRange,
  buildGeneralSchedulesForVisibleRange,
  buildGeminiSchedulesForVisibleRange,
  getGeneralEducationPrograms,
  getGeminiPrograms,
  type ProgramScheduleKind,
} from '@/data/mock'
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
import '@/shared/components/program-calendar.css'
import './program-schedule-widget.css'
import type { User } from '@/types/user'
import { filterProgramsByACL } from '@/features/permission-request/lib/program-acl'

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

function resolveWidgetProgram(programId: string, variant: ProgramScheduleKind): Program | undefined {
  if (variant === 'economy') {
    return programService.getByIdSync(programId) ?? getEconomyPrograms().find(p => p.id === programId)
  }
  return programService.getByIdSync(programId)
}

/** 빈 배열 = 전체, 선택 id → 해당 id만 */
function allowedProgramIdsFromSelection(
  selectedIds: string[] | undefined,
  validIdSet: Set<string>
): Set<string> | null {
  if (selectedIds == null || selectedIds.length === 0) return null
  const out = new Set<string>()
  for (const id of selectedIds) {
    if (validIdSet.has(id)) out.add(id)
  }
  return out.size > 0 ? out : null
}

function getCategoryProgramIdSet(variant: ProgramScheduleKind): Set<string> {
  switch (variant) {
    case 'general':
      return new Set(getGeneralEducationPrograms().map(p => p.id))
    case 'economy':
      return new Set(getEconomyPrograms().map(p => p.id))
    case 'gemini':
      return new Set(getGeminiPrograms().map(p => p.id))
  }
}

function getProgramsForRecruitment(variant: ProgramScheduleKind): Program[] {
  switch (variant) {
    case 'general':
      return getGeneralEducationPrograms()
    case 'economy':
      return getEconomyPrograms()
    case 'gemini':
      return getGeminiPrograms()
  }
}

/** 비마스터 관리자: ACL로 당일 모집 일정에 쓸 프로그램만 */
function getProgramsForRecruitmentForUser(
  variant: ProgramScheduleKind,
  user: Omit<User, 'password'> | null | undefined
): Program[] {
  const base = getProgramsForRecruitment(variant)
  if (!user || user.role !== 'ADMIN' || user.adminLevel === 'MASTER') {
    return base
  }
  return filterProgramsByACL(base, user)
}

/** 대시보드 설정에 체크된 프로그램 id → 허용 집합 (null = 전체) */
function allowedIdsFromWidgetSelection(
  variant: ProgramScheduleKind,
  selectedIds: string[] | undefined
): Set<string> | null {
  if (selectedIds == null || selectedIds.length === 0) return null
  const valid = getCategoryProgramIdSet(variant)
  return allowedProgramIdsFromSelection(selectedIds, valid)
}

function buildDynamicSchedulesForVisibleRange(
  variant: ProgramScheduleKind,
  visibleDateKeys: string[],
  allowedProgramIdSet: Set<string> | null
): Schedule[] {
  switch (variant) {
    case 'general':
      return buildGeneralSchedulesForVisibleRange(visibleDateKeys, allowedProgramIdSet)
    case 'economy':
      return buildEconomySchedulesForVisibleRange(visibleDateKeys, allowedProgramIdSet)
    case 'gemini':
      return buildGeminiSchedulesForVisibleRange(visibleDateKeys, allowedProgramIdSet)
  }
}

/** 일정 목록·캘린더·팝오버에서 동일한 SCHEDULE_COLORS 매핑 */
function buildScheduleColorMapForWidgetEvents(
  events: ScheduleEvent[],
  variant: ProgramScheduleKind
): Map<string, ScheduleColorPair> {
  const seen = new Set<string>()
  const programs: Program[] = []
  for (const ev of events) {
    if (seen.has(ev.programId)) continue
    seen.add(ev.programId)
    const p = resolveWidgetProgram(ev.programId, variant)
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
  variant,
}: {
  dayEvents: ScheduleEvent[]
  onEventClick?: (ev: ScheduleEvent) => void
  variant: ProgramScheduleKind
}) {
  const scheduleColorMap = useMemo(
    () => buildScheduleColorMapForWidgetEvents(dayEvents, variant),
    [dayEvents, variant]
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

/** 태그(배지·일정 카드) 기준 상단 고정 미리보기 — 본문은 공통 popover 클래스로 스크롤 가능 */
function ProgramScheduleEventPreviewPopover({
  dayEvents,
  variant,
  onEventClick,
  children,
}: {
  dayEvents: ScheduleEvent[]
  variant: ProgramScheduleKind
  onEventClick?: (ev: ScheduleEvent) => void
  children: ReactElement
}) {
  return (
    <Popover
      arrow={false}
      trigger="hover"
      placement="top"
      overlayClassName="program-calendar-cell-preview-popover program-schedule-widget__event-preview-popover"
      mouseEnterDelay={0.12}
      mouseLeaveDelay={0.08}
      getPopupContainer={() => document.body}
      content={
        <ScheduleWidgetWeekCellPreview
          dayEvents={dayEvents}
          onEventClick={onEventClick}
          variant={variant}
        />
      }
    >
      {children}
    </Popover>
  )
}

function buildEventsForDate(
  date: Dayjs,
  schedulesByDate: Record<string, Schedule[]>,
  allowedProgramIdSet: Set<string> | null,
  categoryProgramIdSet: Set<string>,
  programsForRecruitment: Program[],
  variant: ProgramScheduleKind
): ScheduleEvent[] {
  const dateKey = date.format('YYYY-MM-DD')
  const schedules = schedulesByDate[dateKey] || []
  const events: ScheduleEvent[] = []

  const defaultStatus: ProgramLifecycleStatus = 'education_completed'

  schedules.forEach(schedule => {
    if (!categoryProgramIdSet.has(schedule.programId)) return
    if (allowedProgramIdSet && !allowedProgramIdSet.has(schedule.programId)) return
    const program = resolveWidgetProgram(schedule.programId, variant)
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

  const programs = allowedProgramIdSet
    ? programsForRecruitment.filter(p => allowedProgramIdSet.has(p.id))
    : programsForRecruitment
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

export interface ProgramScheduleWidgetProps {
  variant: ProgramScheduleKind
  widgetKey: string
  title: string
  viewAllPath: string
  /** ACL: 비마스터는 담당 프로그램만 모집 일정에 반영 */
  user?: Omit<User, 'password'> | null
}

export function ProgramScheduleWidget({
  variant,
  widgetKey,
  title,
  viewAllPath,
  user,
}: ProgramScheduleWidgetProps) {
  const navigate = useNavigate()
  const { cardRef, halfColumn } = useDashboardHalfColumnSlot()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const selectedMockProgramIds = useDashboardSettingsStore(s => s.widgetProgramIds[widgetKey])

  const categoryProgramIdSet = useMemo(() => getCategoryProgramIdSet(variant), [variant])

  const allowedProgramIdSet = useMemo(
    () => allowedIdsFromWidgetSelection(variant, selectedMockProgramIds),
    [variant, selectedMockProgramIds]
  )

  const programsForRecruitment = useMemo(
    () => getProgramsForRecruitmentForUser(variant, user),
    [variant, user]
  )

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
    const visibleKeys = visibleDateRange.map(d => d.format('YYYY-MM-DD'))
    const dynamic = buildDynamicSchedulesForVisibleRange(variant, visibleKeys, allowedProgramIdSet)

    let schedules = mockSchedules.filter(s => categoryProgramIdSet.has(s.programId))
    if (allowedProgramIdSet) {
      schedules = schedules.filter(s => allowedProgramIdSet.has(s.programId))
    }
    schedules = [...schedules, ...dynamic]

    schedules.forEach(schedule => {
      const dateKey = dayjs(schedule.date).format('YYYY-MM-DD')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(schedule)
    })

    return grouped
  }, [allowedProgramIdSet, categoryProgramIdSet, variant, visibleDateRange])

  const eventsByDate = useMemo(() => {
    const out: Record<string, ScheduleEvent[]> = {}
    visibleDateRange.forEach(d => {
      out[d.format('YYYY-MM-DD')] = buildEventsForDate(
        d,
        schedulesByDate,
        allowedProgramIdSet,
        categoryProgramIdSet,
        programsForRecruitment,
        variant
      )
    })
    return out
  }, [
    visibleDateRange,
    schedulesByDate,
    allowedProgramIdSet,
    categoryProgramIdSet,
    programsForRecruitment,
    variant,
  ])

  const selectedDateEvents = useMemo(() => {
    const dateKey = selectedDate.format('YYYY-MM-DD')
    return eventsByDate[dateKey] ?? []
  }, [selectedDate, eventsByDate])

  const selectedDayScheduleColorMap = useMemo(
    () => buildScheduleColorMapForWidgetEvents(selectedDateEvents, variant),
    [selectedDateEvents, variant]
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

  const handleViewAll = () => navigate(viewAllPath)

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
    const dayColorMap = buildScheduleColorMapForWidgetEvents(dayEvents, variant)
    const programIds = getDisplayProgramIds(dayEvents, 2)
    const hasEvents = programIds.length > 0
    const isSingleBlock = programIds.length === 1

    const monthCell = (
      <div
        className={`program-calendar-cell ${!isCurrentMonth ? 'program-calendar-cell--other-month' : ''} ${isSelected ? 'program-calendar-cell--selected' : ''} ${isToday ? 'program-calendar-cell--today' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="program-calendar-cell-date">{date.date()}</div>
        {hasEvents && !halfColumn && (
          <div className="program-schedule-widget__cell-badges">
            {isSingleBlock ? (
              <ProgramScheduleEventPreviewPopover
                dayEvents={dayEvents}
                variant={variant}
                onEventClick={handleEventClick}
              >
                <span className="program-schedule-widget__month-cell-badge-host">
                  <div
                    className="program-schedule-widget__cell-badge program-schedule-widget__cell-badge--single"
                    style={{
                      backgroundColor: (dayColorMap.get(programIds[0]) ?? SCHEDULE_COLORS[0]).bg,
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={e => {
                      e.stopPropagation()
                      const ev = dayEvents.find(x => x.programId === programIds[0])
                      if (ev) handleEventClick(ev)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        const ev = dayEvents.find(x => x.programId === programIds[0])
                        if (ev) handleEventClick(ev)
                      }
                    }}
                  />
                </span>
              </ProgramScheduleEventPreviewPopover>
            ) : (
              programIds.map(pid => {
                const pair = dayColorMap.get(pid) ?? SCHEDULE_COLORS[0]
                return (
                  <ProgramScheduleEventPreviewPopover
                    key={pid}
                    dayEvents={dayEvents}
                    variant={variant}
                    onEventClick={handleEventClick}
                  >
                    <span className="program-schedule-widget__month-cell-badge-host">
                      <div
                        className="program-schedule-widget__cell-badge program-schedule-widget__cell-badge--multi"
                        style={{
                          backgroundColor: pair.bg,
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={e => {
                          e.stopPropagation()
                          const ev = dayEvents.find(x => x.programId === pid)
                          if (ev) handleEventClick(ev)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            const ev = dayEvents.find(x => x.programId === pid)
                            if (ev) handleEventClick(ev)
                          }
                        }}
                      />
                    </span>
                  </ProgramScheduleEventPreviewPopover>
                )
              })
            )}
          </div>
        )}
      </div>
    )

    return <Fragment key={dateKey}>{monthCell}</Fragment>
  }

  const renderMonthGrid = () => {
    const monthDates = visibleDateRange as Dayjs[]
    return (
      <div className="program-schedule-widget__month-grid-wrap">
        <div className="program-schedule-widget__month-grid program-schedule-widget__month-grid--dow-row">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="program-schedule-widget__month-grid-dow" role="columnheader">
              {day}
            </div>
          ))}
        </div>
        <div
          className="program-schedule-widget__month-grid program-schedule-widget__month-grid--cells"
          role="grid"
          aria-label="월간 일정"
        >
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
          const dayColorMap = buildScheduleColorMapForWidgetEvents(dayEvents, variant)
          const weekColorOnly = halfColumn
          const visibleEvents = weekColorOnly ? dayEvents.slice(0, 3) : dayEvents.slice(0, 2)
          const hasMore = weekColorOnly ? dayEvents.length > 3 : dayEvents.length > 2
          const moreCount = weekColorOnly ? dayEvents.length - 3 : dayEvents.length - 2

          const weekDateClassName = isSelected
            ? 'program-calendar-week-cell-date program-calendar-week-cell-date--selected'
            : 'program-calendar-week-cell-date'

          const weekCell = (
            <div className={`program-calendar-week-cell`} onClick={() => handleDateSelect(date)}>
              <div className={weekDateClassName}>
                {date.date()}
              </div>
              {visibleEvents.length > 0 && (
                <div
                  className={
                    weekColorOnly
                      ? 'program-schedule-widget__week-events program-schedule-widget__week-events--color-only'
                      : 'program-schedule-widget__week-events'
                  }
                >
                  {visibleEvents.map(ev => {
                    const pair = dayColorMap.get(ev.programId) ?? SCHEDULE_COLORS[0]
                    const bg = pair.bg
                    const label = `${ev.programTitle} ${ev.title}`.trim()
                    if (weekColorOnly) {
                      return (
                        <ProgramScheduleEventPreviewPopover
                          key={ev.id}
                          dayEvents={dayEvents}
                          variant={variant}
                          onEventClick={handleEventClick}
                        >
                          <div
                            className="program-schedule-widget__week-event-card program-schedule-widget__week-event-card--color-only"
                            style={{
                              backgroundColor: pair.bg,
                              border: `1px solid ${pair.border}`,
                            }}
                            onClick={e => {
                              e.stopPropagation()
                              handleEventClick(ev)
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={label}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                handleEventClick(ev)
                              }
                            }}
                          />
                        </ProgramScheduleEventPreviewPopover>
                      )
                    }
                    return (
                      <ProgramScheduleEventPreviewPopover
                        key={ev.id}
                        dayEvents={dayEvents}
                        variant={variant}
                        onEventClick={handleEventClick}
                      >
                        <div
                          className="program-schedule-widget__week-event-card"
                          style={{ backgroundColor: bg }}
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
                      </ProgramScheduleEventPreviewPopover>
                    )
                  })}
                  {hasMore && (
                    <ProgramScheduleEventPreviewPopover
                      dayEvents={dayEvents}
                      variant={variant}
                      onEventClick={handleEventClick}
                    >
                      <div className="program-schedule-widget__week-event-more" role="button" tabIndex={0}>
                        외 {moreCount}개의 항목
                      </div>
                    </ProgramScheduleEventPreviewPopover>
                  )}
                </div>
              )}
            </div>
          )

          /* 그리드 직계 자식은 항상 week-column — 일정은 태그별 Popover로 미리보기 */
          return (
            <div className="program-schedule-widget__week-column" key={dateKey}>
              {weekCell}
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
              <span className="widget-card-title">{title}</span>
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
            <div className="program-schedule-widget__view-mode-switch">
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
            </div>
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
