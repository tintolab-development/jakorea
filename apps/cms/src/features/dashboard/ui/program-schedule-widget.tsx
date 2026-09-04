/**
 * 대시보드 - 프로그램 일정 위젯 (일반 / 1사1교 / UJAT / Gemini)
 * - 월간/주간 탭 전환, 상단 헤더 공유, 하위 캘린더 형식만 전환
 * - 월간: 월 그리드 + 우측 일정 리스트 / 주간: 주간 그리드 셀 내 이벤트
 */

import { Card, List, Popover } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useState, useMemo, useRef, useLayoutEffect, Fragment, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingButton, EmptyState } from '@/shared/ui'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import dayjs, { type Dayjs } from 'dayjs'
import {
  mockSchedules,
  getCompanySchoolPrograms,
  getUjatPrograms,
  buildCompanySchoolSchedulesForVisibleRange,
  buildGeneralSchedulesForVisibleRange,
  buildGeminiSchedulesForVisibleRange,
  buildUjatSchedulesForVisibleRange,
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
} from '@/features/program/shared/ui/program-schedule-colors'
import { programScheduleEventPath } from '../lib/dashboard-widget-links'
import { SegmentedTab } from '@/shared/ui'
import '@/shared/ui/widget-more-button.css'
import './program-schedule-widget.css'
import type { User } from '@/types/user'
import { filterProgramsByACL } from '@/features/permission-request/lib/program-acl'
import { shouldUseDashboardRemoteApi } from '@/features/dashboard/api/admin-dashboard-service'
import { useDashboardProgramSchedules } from '../hooks/use-dashboard-program-schedules'
import { useDashboardProgramOptions } from '../hooks/use-dashboard-program-options'
import { DashboardWidgetQueryError } from './dashboard-widget-query-error'
import { shouldUseCompanySchoolRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { useCompanySchoolPrograms } from '@/features/program/1c-1s/api/hooks'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** 월간 헤더로 월을 바꾼 뒤 선택일: 이번 달(년·월)이면 오늘, 그 밖이면 해당 월 1일 */
function selectedDateAfterMonthNavigation(visibleMonth: Dayjs): Dayjs {
  const today = dayjs()
  return visibleMonth.isSame(today, 'month') ? today : visibleMonth.startOf('month')
}

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
  if (variant === 'company_school') {
    return programService.getByIdSync(programId) ?? getCompanySchoolPrograms().find(p => p.id === programId)
  }
  if (variant === 'ujat') {
    return programService.getByIdSync(programId) ?? getUjatPrograms().find(p => p.id === programId)
  }
  return programService.getByIdSync(programId)
}

function programsFromOptions(options: { id: string; title: string }[]): Program[] {
  return options.map(o => ({
    id: o.id,
    title: o.title,
    sponsorId: '',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    rounds: [],
    startDate: '',
    endDate: '',
    status: 'active',
    createdAt: '',
    updatedAt: '',
  }))
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
    case 'company_school':
      return new Set(getCompanySchoolPrograms().map(p => p.id))
    case 'ujat':
      return new Set(getUjatPrograms().map(p => p.id))
    case 'gemini':
      return new Set(getGeminiPrograms().map(p => p.id))
  }
}

function getProgramsForRecruitment(variant: ProgramScheduleKind): Program[] {
  switch (variant) {
    case 'general':
      return getGeneralEducationPrograms()
    case 'company_school':
      return getCompanySchoolPrograms()
    case 'ujat':
      return getUjatPrograms()
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
    case 'company_school':
      return buildCompanySchoolSchedulesForVisibleRange(visibleDateKeys, allowedProgramIdSet)
    case 'ujat':
      return buildUjatSchedulesForVisibleRange(visibleDateKeys, allowedProgramIdSet)
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
          <div
            key={ev.id}
            role="button"
            tabIndex={0}
            className="program-calendar-cell-preview__item"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onEventClick?.(ev)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onEventClick?.(ev)
              }
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
          </div>
        )
      })}
    </div>
  )
}

const EVENT_PREVIEW_POPOVER_CLASS =
  'program-calendar-cell-preview-popover program-schedule-widget__event-preview-popover'

/** 태그(배지·일정 카드) 기준 상단 고정 미리보기 — 본문은 공통 popover 클래스로 스크롤 가능 */
function ProgramScheduleEventPreviewPopover({
  dayEvents,
  variant,
  onEventClick,
  children,
  placement = 'top',
}: {
  dayEvents: ScheduleEvent[]
  variant: ProgramScheduleKind
  onEventClick?: (ev: ScheduleEvent) => void
  children: ReactElement
  placement?: 'top' | 'bottom'
}) {
  return (
    <Popover
      arrow={false}
      trigger="hover"
      placement={placement}
      overlayClassName={EVENT_PREVIEW_POPOVER_CLASS}
      classNames={{ root: EVENT_PREVIEW_POPOVER_CLASS }}
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
      const startT = schedule.startTime || '00:00'
      events.push({
        id: schedule.id,
        type: 'education',
        title: `${program.title} ${schedule.title || ''}`.trim(),
        time: startT,
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

  const useRemoteSchedules = shouldUseDashboardRemoteApi()
  const useCompanySchoolProgramsRemote =
    !useRemoteSchedules && variant === 'company_school' && shouldUseCompanySchoolRemoteApi()
  const companySchoolProgramsQuery = useCompanySchoolPrograms({}, useCompanySchoolProgramsRemote)
  const { data: remoteProgramOptions = [] } = useDashboardProgramOptions(widgetKey, useRemoteSchedules)

  const categoryProgramIdSet = useMemo(() => {
    if (useRemoteSchedules) {
      return new Set(remoteProgramOptions.map(p => p.id))
    }
    if (useCompanySchoolProgramsRemote && companySchoolProgramsQuery.data) {
      return new Set(companySchoolProgramsQuery.data.map(p => p.id))
    }
    return getCategoryProgramIdSet(variant)
  }, [
    useRemoteSchedules,
    remoteProgramOptions,
    useCompanySchoolProgramsRemote,
    companySchoolProgramsQuery.data,
    variant,
  ])

  const allowedProgramIdSet = useMemo(
    () => allowedIdsFromWidgetSelection(variant, selectedMockProgramIds),
    [variant, selectedMockProgramIds]
  )

  const programsForRecruitment = useMemo(() => {
    if (useRemoteSchedules) {
      return programsFromOptions(remoteProgramOptions)
    }
    if (useCompanySchoolProgramsRemote && companySchoolProgramsQuery.data) {
      const base = companySchoolProgramsQuery.data
      if (!user || user.role !== 'ADMIN' || user.adminLevel === 'MASTER') return base
      return filterProgramsByACL(base, user)
    }
    return getProgramsForRecruitmentForUser(variant, user)
  }, [
    useRemoteSchedules,
    remoteProgramOptions,
    useCompanySchoolProgramsRemote,
    companySchoolProgramsQuery.data,
    variant,
    user,
  ])

  const visibleDateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = currentMonth.startOf('week')
      return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
    }
    const end = currentMonth.endOf('month')
    const start = end.subtract(34, 'day')
    return Array.from({ length: 35 }, (_, i) => start.add(i, 'day'))
  }, [currentMonth, viewMode])

  const scheduleDateFrom = visibleDateRange[0]?.format('YYYY-MM-DD')
  const scheduleDateTo = visibleDateRange[visibleDateRange.length - 1]?.format('YYYY-MM-DD')
  const { data: remoteScheduleEvents = [], isError: scheduleQueryError } = useDashboardProgramSchedules({
    programIds: selectedMockProgramIds,
    dateFrom: scheduleDateFrom,
    dateTo: scheduleDateTo,
    programType: variant,
    enabled: useRemoteSchedules,
  })

  const schedulesByDate = useMemo(() => {
    if (useRemoteSchedules) {
      return {} as Record<string, Schedule[]>
    }
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
  }, [useRemoteSchedules, allowedProgramIdSet, categoryProgramIdSet, variant, visibleDateRange])

  const eventsByDate = useMemo(() => {
    if (useRemoteSchedules) {
      const out: Record<string, ScheduleEvent[]> = {}
      for (const d of visibleDateRange) {
        out[d.format('YYYY-MM-DD')] = []
      }
      for (const ev of remoteScheduleEvents) {
        const dateKey = dayjs(ev.startAt).format('YYYY-MM-DD')
        if (!out[dateKey]) out[dateKey] = []
        out[dateKey].push({
          id: ev.id,
          type: ev.type,
          title: ev.title,
          time: ev.time,
          programId: ev.programId,
          programTitle: ev.programTitle,
          lifecycleStatus: ev.lifecycleStatus,
        })
      }
      for (const key of Object.keys(out)) {
        out[key].sort((a, b) => {
          const timeA = a.time === '24:00' ? '23:59' : a.time
          const timeB = b.time === '24:00' ? '23:59' : b.time
          return timeA.localeCompare(timeB)
        })
      }
      return out
    }

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
    useRemoteSchedules,
    remoteScheduleEvents,
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
      const next = currentMonth.subtract(1, 'month')
      setCurrentMonth(next)
      setSelectedDate(selectedDateAfterMonthNavigation(next))
    }
  }

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentMonth(prev => prev.add(1, 'week'))
    } else {
      const next = currentMonth.add(1, 'month')
      setCurrentMonth(next)
      setSelectedDate(selectedDateAfterMonthNavigation(next))
    }
  }

  const handleViewAll = () => {
    navigate(viewAllPath)
  }

  const handleEventClick = (event: ScheduleEvent) => {
    navigate(programScheduleEventPath(variant, event.programId))
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
        className={[
          'program-calendar-cell',
          !isCurrentMonth ? 'program-calendar-cell--other-month' : '',
          isSelected ? 'program-calendar-cell--selected' : '',
          isToday ? 'program-calendar-cell--today' : '',
          hasEvents ? 'program-calendar-cell--has-schedule' : '',
        ]
          .filter(Boolean)
          .join(' ')}
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
          const dateKey = date.format('YYYY-MM-DD')
          const isSelected = date.isSame(selectedDate, 'day')
          const isToday = date.isSame(dayjs(), 'day')
          const dayEvents = eventsByDate[dateKey] || []
          const dayColorMap = buildScheduleColorMapForWidgetEvents(dayEvents, variant)
          const programIds = getDisplayProgramIds(dayEvents, 2)
          const hasEvents = programIds.length > 0
          const weekColorOnly = halfColumn

          const eventsClass = [
            'program-schedule-widget__week-events',
            weekColorOnly ? 'program-schedule-widget__week-events--color-only' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div
              key={dateKey}
              className={[
                'program-calendar-week-cell',
                isSelected ? 'program-calendar-week-cell--selected' : '',
                isToday ? 'program-schedule-widget__week-cell--today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleDateSelect(date)}
            >
              <div
                className={[
                  'program-calendar-week-cell-date',
                  isSelected ? 'program-calendar-week-cell-date--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date.date()}
              </div>
              {hasEvents && (
                <div className={eventsClass}>
                  {!weekColorOnly &&
                    dayEvents.slice(0, 2).map(ev => {
                      const pair = dayColorMap.get(ev.programId) ?? SCHEDULE_COLORS[0]
                      return (
                        <ProgramScheduleEventPreviewPopover
                          key={ev.id}
                          dayEvents={dayEvents}
                          variant={variant}
                          onEventClick={handleEventClick}
                          placement="bottom"
                        >
                          <div className="program-schedule-widget__week-event-preview-host">
                            <div
                              className="program-schedule-widget__week-event-card"
                              style={{
                                backgroundColor: pair.bg,
                                border: `1px solid ${pair.border}`,
                              }}
                              role="button"
                              tabIndex={0}
                              onClick={e => {
                                e.stopPropagation()
                                handleEventClick(ev)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleEventClick(ev)
                                }
                              }}
                            >
                              <div className="program-schedule-widget__week-event-title">{ev.programTitle}</div>
                              <div className="program-schedule-widget__week-event-time">
                                {getEventTypeLabel(ev.type)} | {ev.time}
                              </div>
                            </div>
                          </div>
                        </ProgramScheduleEventPreviewPopover>
                      )
                    })}
                  {weekColorOnly &&
                    programIds.map(pid => {
                      const pair = dayColorMap.get(pid) ?? SCHEDULE_COLORS[0]
                      return (
                        <ProgramScheduleEventPreviewPopover
                          key={pid}
                          dayEvents={dayEvents}
                          variant={variant}
                          onEventClick={handleEventClick}
                          placement="bottom"
                        >
                          <div className="program-schedule-widget__week-event-preview-host">
                            <div
                              className="program-schedule-widget__week-event-card program-schedule-widget__week-event-card--color-only"
                              style={{
                                backgroundColor: pair.bg,
                                border: `1px solid ${pair.border}`,
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
                          </div>
                        </ProgramScheduleEventPreviewPopover>
                      )
                    })}
                  {dayEvents.length > 2 && (
                    <ProgramScheduleEventPreviewPopover
                      dayEvents={dayEvents}
                      variant={variant}
                      onEventClick={handleEventClick}
                      placement="bottom"
                    >
                      <div className="program-schedule-widget__week-event-preview-host">
                        <div className="program-schedule-widget__week-event-more">
                          외 {dayEvents.length - 2}개의 항목
                        </div>
                      </div>
                    </ProgramScheduleEventPreviewPopover>
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
        <div className="program-schedule-widget__empty">
          <EmptyState description="해당 날짜에 일정이 없습니다" />
        </div>
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
      bordered={false}
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
                size="medium"
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
            <LoadingButton
              type="link"
              size="small"
              onClick={handleViewAll}
              className="widget-more-button program-schedule-widget__head-more"
            >
              더보기
            </LoadingButton>
          </div>
        </div>
      }
      className={cardClassName}
    >
      {scheduleQueryError ? (
        <DashboardWidgetQueryError />
      ) : (
        <div className="program-schedule-widget__content">
          {viewMode === 'month' ? (
            <div className="program-schedule-widget__body program-schedule-widget__body--month">
              <div className="program-schedule-widget__calendar-main">
                {renderMonthGrid()}
              </div>
              {eventListSection}
            </div>
          ) : (
            <div className="program-schedule-widget__body program-schedule-widget__body--week">
              <div className="program-schedule-widget__calendar-main">
                {renderWeekView()}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
