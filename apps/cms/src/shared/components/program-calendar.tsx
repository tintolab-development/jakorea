/**
 * 공통 프로그램 메인 캘린더 (중앙 컬럼)
 * - 마크업·클래스는 `program-calendar-*` 단일 체계
 * - `scheduleOverlay`로 Popover(프로그램 일정) vs Tooltip(신청자 일정)만 분기
 */

import {
  forwardRef,
  Fragment,
  useMemo,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Calendar, Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { getProgramDayScheduleLine } from '@/entities/program/lib/program-day-schedule-line'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
  buildResolvedScheduleColorMapForPrograms,
} from '@/features/program/ui/program-schedule-colors'
import {
  ApplicantCalendarEventPopoverContent,
  useApplicantCalendarColorMaps,
} from '@/features/program/program-detail/ui/applicant-list/applicant-calendar-schedule-helpers'
import { SegmentedTab } from '@/shared/ui/segmented-tab'
import '@/shared/ui/overlay-popover.css'
import './program-calendar.css'
import { ProgramCalendarOverlayFollowCursor } from '@/shared/components/program-calendar-cursor-overlay'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type ProgramCalendarEventItem = {
  id: string | number
  title?: string
  startDate: string
  endDate: string
  originalItem?: unknown
  /** 주간 시간 격자: HH:mm. 없으면 종일로 상단에 스택 */
  startTime?: string
  endTime?: string
  /** 주간 격자 블록 전용 문구(금액·상태 한 줄 `title`과 별도) */
  timeGridLabel?: string
  /** 주간 격자 태그 배경·테두리·글자색(지급조서 파스텔 등) */
  weekGridSurface?: { bg: string; border: string; text: string }
}

type ProgramCalendarSharedProps = {
  selectedDate: Dayjs
  currentMonth: Dayjs
  mode: 'month' | 'week'
  onSelectDate: (date: Dayjs) => void
  onMonthChange: (month: Dayjs) => void
  onModeChange: (mode: 'month' | 'week') => void
  className?: string
  /** 기본: 오늘 선택 + `onMonthChange(startOf('month'))` */
  onTodayClick?: () => void
  /** true면 헤더 좌측 `YYYY.MM` / 주간 범위 문구 숨김 (상위 기간 필터와 중복 제거용) */
  hideHeaderTitle?: boolean
  /** true면 헤더 좌측 날짜 제어(오늘/이전/다음) 전체를 숨김 */
  hideDateControls?: boolean
  /** true면 월간·주간 전환 탭 숨김 — `mode`는 부모가 고정(예: 월간만) */
  hideModeToggle?: boolean
  /**
   * 일정 호버 오버레이. 미지정 시 `programs` → popover, `events` → tooltip
   */
  scheduleOverlay?: 'popover' | 'tooltip'
  /** Tooltip일 때 `program-calendar-tooltip-overlay`에 추가하는 클래스 */
  tooltipOverlayClassName?: string
  /**
   * 주간 뷰: `simple`(7열 태그) | `time-grid`(좌측 한글 시 라벨 + 시간 격자).
   * `events` 모드에서만 적용.
   */
  weekViewVariant?: 'simple' | 'time-grid'
  /**
   * true이면 상단 헤더(월 제목·오늘·이전다음·월/주 전환)를 렌더하지 않음.
   * 상위 레이아웃에서 월 네비를 따로 둘 때 사용.
   */
  hideHeader?: boolean
}

export type ProgramCalendarProgramProps = ProgramCalendarSharedProps & {
  programs: Program[]
  onProgramClick: (program: Program) => void
  events?: undefined
  selectedRowKeys?: undefined
}

export type ProgramCalendarEventsProps = ProgramCalendarSharedProps & {
  events: ProgramCalendarEventItem[]
  selectedRowKeys?: React.Key[]
  renderEventsTooltipContent?: (args: {
    events: ProgramCalendarEventItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  /**
   * 일별 이벤트 색상 맵. 지정 시 신청자 일정용 `useApplicantCalendarColorMaps` 해시 대신 사용
   * (예: 강사 정산 캘린더의 상태별 색). `resolveEventColors`보다 먼저 일별 맵이 적용된다.
   */
  overrideEventColorMap?: (
    dayEvents: ProgramCalendarEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  /**
   * 셀 배지 색상. 미지정 시 신청자 일정 팔레트(`useApplicantCalendarColorMaps`) 사용.
   */
  resolveEventColors?: (event: ProgramCalendarEventItem) => ScheduleColorPair | undefined
  /**
   * 툴팁에 표시할 일정 범위. `full-day`면 해당 날짜의 전체 `events`(지급조서 등).
   * 기본은 호버한 한 건만.
   */
  eventsTooltipScope?: 'trigger-only' | 'full-day'
  /** 셀에서 2건 초과 시 링크 문구. 기본 `외 N개의 항목` */
  formatEventsOverflowText?: (hiddenCount: number) => string
  /**
   * 이벤트 모드 툴팁/팝오버 앵커: `cell`이면 해당 날짜 셀(날짜+일정 영역) 전체 호버 시 그날 전체 일정을 표시.
   * 기본 `event-strip`은 일정 스트립·「외 N개」마다 개별 툴팁.
   */
  eventsTooltipTrigger?: 'event-strip' | 'cell'
  programs?: undefined
  onProgramClick?: undefined
}

export type ProgramCalendarProps = ProgramCalendarProgramProps | ProgramCalendarEventsProps

function isEventsProps(p: ProgramCalendarProps): p is ProgramCalendarEventsProps {
  return 'events' in p && Array.isArray(p.events)
}

type SpanRole = 'start' | 'middle' | 'end' | 'single'

function getProgramSpanRole(program: Program, date: Dayjs): SpanRole {
  const start = dayjs(program.startDate)
  const end = dayjs(program.endDate)
  const isInEducation = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  let rangeStart: Dayjs
  let rangeEnd: Dayjs

  if (program.applicationStartDate && program.applicationEndDate) {
    const appStart = dayjs(program.applicationStartDate)
    const appEnd = dayjs(program.applicationEndDate)
    const isInApp = date.isSameOrAfter(appStart, 'day') && date.isSameOrBefore(appEnd, 'day')
    if (isInApp) {
      rangeStart = appStart
      rangeEnd = appEnd
    } else if (isInEducation) {
      rangeStart = start
      rangeEnd = end
    } else {
      return 'single'
    }
  } else if (isInEducation) {
    rangeStart = start
    rangeEnd = end
  } else {
    return 'single'
  }

  if (rangeStart.isSame(rangeEnd, 'day')) return 'single'
  if (date.isSame(rangeStart, 'day')) return 'start'
  if (date.isSame(rangeEnd, 'day')) return 'end'
  return 'middle'
}

function getProgramsForDate(programs: Program[], date: Dayjs): Program[] {
  return programs.filter(program => {
    const start = dayjs(program.startDate)
    const end = dayjs(program.endDate)
    const isInEducationPeriod = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')

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

function getEventsForDate(
  events: ProgramCalendarEventItem[],
  date: Dayjs
): ProgramCalendarEventItem[] {
  return events.filter(event => {
    const start = dayjs(event.startDate)
    const end = dayjs(event.endDate)
    return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  })
}

function getPaymentOrderEventClasses(event: ProgramCalendarEventItem): string[] {
  const original = event.originalItem as { status?: string } | undefined
  const status = typeof original?.status === 'string' ? original.status.trim() : ''
  if (!status) return []
  return [
    'program-calendar-event--payment-order-tag',
    `program-calendar-event--payment-order-status-${status}`,
  ]
}

/** 주간 시간 격자: 총 높이를 24시간에 균등 분배 */
const WEEK_TIME_GRID_HOURS = 24
/** 서브픽셀로 격자선이 라벨과 어긋나지 않도록 정수 px로 고정 (54 × 24 = 1296) */
const WEEK_TIME_GRID_HOUR_PX = 54
const WEEK_TIME_GRID_TOTAL_PX = WEEK_TIME_GRID_HOUR_PX * WEEK_TIME_GRID_HOURS
const WEEK_HEADER_WEEKDAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

/** 자정~23시: 오전/오후 + n시 (좌측 거터 2단 표기) */
const WEEK_TIME_GRID_HOUR_ROWS: readonly { period: '오전' | '오후'; hour: string }[] = (() => {
  const rows: { period: '오전' | '오후'; hour: string }[] = []
  rows.push({ period: '오전', hour: '12시' })
  for (let h = 1; h <= 11; h++) rows.push({ period: '오전', hour: `${h}시` })
  rows.push({ period: '오후', hour: '12시' })
  for (let h = 1; h <= 11; h++) rows.push({ period: '오후', hour: `${h}시` })
  return rows
})()

function formatWeekHeaderDayLabel(date: Dayjs, weekDates: Dayjs[]): string {
  const i = weekDates.findIndex(d => d.isSame(date, 'day'))
  const prev = i > 0 ? weekDates[i - 1] : null
  if (prev && prev.month() !== date.month()) {
    return `${date.month() + 1}.${date.date()}`
  }
  return String(date.date())
}

function parseHHmmToMinutes(s: string | undefined): number | null {
  if (!s?.trim()) return null
  const t = s.trim()
  if (t === '24:00') return 24 * 60
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

function layoutTimedEventInGrid(
  event: ProgramCalendarEventItem,
  hourPx: number
): { top: number; height: number } {
  const startM = parseHHmmToMinutes(event.startTime)
  if (startM == null) {
    return { top: 0, height: 32 }
  }
  const endRaw = parseHHmmToMinutes(event.endTime)
  let endM = endRaw != null && endRaw > startM ? endRaw : startM + 60
  if (endM <= startM) endM = startM + 60
  endM = Math.min(endM, 24 * 60)
  const top = (startM / 60) * hourPx
  const height = Math.max(((endM - startM) / 60) * hourPx, 28)
  return { top, height }
}

type TimedEventLayout = {
  event: ProgramCalendarEventItem
  top: number
  height: number
  /** cluster 내 column 번호 (0-based) */
  columnIndex: number
  /** cluster 내 총 column 수 (N) — 폭 = 100% / N */
  columnCount: number
}

/**
 * 하루의 시간 이벤트들을 FullCalendar 식 column 레이아웃으로 배치.
 * - 같은 cluster(겹침 체인) 안에서 최대 동시 활성 column 수 N을 찾아 모두 같은 N으로 분할
 * - 겹치지 않는 단일 이벤트는 N=1이라 전체 폭을 점유
 */
function layoutTimedEventsForDay(
  events: ProgramCalendarEventItem[],
  hourPx: number
): TimedEventLayout[] {
  type Span = {
    event: ProgramCalendarEventItem
    startM: number
    endM: number
    top: number
    height: number
    columnIndex: number
  }

  const spans: Span[] = []
  for (const event of events) {
    const { top, height } = layoutTimedEventInGrid(event, hourPx)
    const startM = parseHHmmToMinutes(event.startTime)
    if (startM == null) continue
    const endRaw = parseHHmmToMinutes(event.endTime)
    let endM = endRaw != null && endRaw > startM ? endRaw : startM + 60
    endM = Math.min(endM, 24 * 60)
    spans.push({ event, startM, endM, top, height, columnIndex: -1 })
  }

  spans.sort((a, b) => {
    if (a.startM !== b.startM) return a.startM - b.startM
    return b.endM - a.endM
  })

  const columnEnds: number[] = []
  for (const sp of spans) {
    let placed = -1
    for (let c = 0; c < columnEnds.length; c++) {
      if (columnEnds[c] <= sp.startM) {
        placed = c
        break
      }
    }
    if (placed === -1) {
      placed = columnEnds.length
      columnEnds.push(sp.endM)
    } else {
      columnEnds[placed] = sp.endM
    }
    sp.columnIndex = placed
  }

  /** cluster 분할: 정렬된 순서로 훑으며 현재까지의 최대 종료시각 < 다음 시작시각이면 cluster 경계 */
  const clusters: { startIdx: number; endIdx: number; columnCount: number }[] = []
  let clusterStart = 0
  let clusterMaxEnd = -Infinity
  for (let i = 0; i < spans.length; i++) {
    const sp = spans[i]
    if (i > 0 && sp.startM >= clusterMaxEnd) {
      clusters.push({
        startIdx: clusterStart,
        endIdx: i - 1,
        columnCount: 0,
      })
      clusterStart = i
      clusterMaxEnd = sp.endM
    } else {
      clusterMaxEnd = Math.max(clusterMaxEnd, sp.endM)
    }
  }
  if (spans.length > 0) {
    clusters.push({
      startIdx: clusterStart,
      endIdx: spans.length - 1,
      columnCount: 0,
    })
  }
  for (const cluster of clusters) {
    let max = 0
    for (let i = cluster.startIdx; i <= cluster.endIdx; i++) {
      if (spans[i].columnIndex + 1 > max) max = spans[i].columnIndex + 1
    }
    cluster.columnCount = Math.max(max, 1)
  }

  const layoutByEventId = new Map<ProgramCalendarEventItem, TimedEventLayout>()
  for (const cluster of clusters) {
    for (let i = cluster.startIdx; i <= cluster.endIdx; i++) {
      const sp = spans[i]
      layoutByEventId.set(sp.event, {
        event: sp.event,
        top: sp.top,
        height: sp.height,
        columnIndex: sp.columnIndex,
        columnCount: cluster.columnCount,
      })
    }
  }

  return events
    .filter(e => parseHHmmToMinutes(e.startTime) != null)
    .map(
      e =>
        layoutByEventId.get(e) ?? {
          event: e,
          top: 0,
          height: 32,
          columnIndex: 0,
          columnCount: 1,
        }
    )
}

function weekTimeGridEventLabel(event: ProgramCalendarEventItem): string {
  const custom = event.timeGridLabel?.trim()
  if (custom) return custom
  return String(event.title ?? '')
}

function weekTimeGridEventColors(
  event: ProgramCalendarEventItem,
  resolveEventColors: ((e: ProgramCalendarEventItem) => ScheduleColorPair | undefined) | undefined,
  resolvedWeekColors: Map<string | number, ScheduleColorPair>
): ScheduleColorPair {
  const surface = event.weekGridSurface
  if (surface) {
    return {
      ...SCHEDULE_COLORS[0],
      bg: surface.bg,
      border: surface.border,
      text: surface.text,
    } as ScheduleColorPair
  }
  return (
    resolveEventColors?.(event) ??
    resolvedWeekColors.get(event.id) ??
    SCHEDULE_COLORS[0]
  )
}

function CalendarCellSchedulePreview({ date, programs }: { date: Dayjs; programs: Program[] }) {
  const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(programs)

  return (
    <div className="program-calendar-cell-preview">
      {programs.map(program => {
        const { statusLabel, time } = getProgramDayScheduleLine(program, date)
        const title = program.title ?? ''
        const colorPair = scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
        return (
          <button key={program.id} type="button" className="program-calendar-cell-preview__item">
            <span
              className="program-calendar-cell-preview__title"
              style={{ color: colorPair.text }}
            >
              [{title}]
            </span>
            <span className="program-calendar-cell-preview__desc">
              {statusLabel} | {time}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function wrapScheduleOverlay(
  scheduleOverlay: 'popover' | 'tooltip',
  tooltipOverlayClassName: string | undefined,
  previewContent: ReactNode,
  trigger: ReactElement
): ReactNode {
  return (
    <ProgramCalendarOverlayFollowCursor
      variant={scheduleOverlay}
      tooltipOverlayClassName={tooltipOverlayClassName}
      content={previewContent}
    >
      {trigger}
    </ProgramCalendarOverlayFollowCursor>
  )
}

export const ProgramCalendar = forwardRef<HTMLDivElement, ProgramCalendarProps>(
  function ProgramCalendarInner(props, ref) {
    const {
      selectedDate,
      currentMonth,
      mode,
      onSelectDate,
      onMonthChange,
      onModeChange,
      className,
      onTodayClick,
      hideHeaderTitle = false,
      hideDateControls = false,
      hideModeToggle = false,
      scheduleOverlay: scheduleOverlayProp,
      tooltipOverlayClassName,
      weekViewVariant = 'simple',
      hideHeader = false,
    } = props

    const isEvents = isEventsProps(props)
    const programs = isEvents ? [] : props.programs
    const events = isEvents ? props.events : []
    const selectedRowKeys = isEvents ? (props.selectedRowKeys ?? []) : []
    const renderEventsTooltipContent = isEvents ? props.renderEventsTooltipContent : undefined
    const overrideEventColorMap = isEvents ? props.overrideEventColorMap : undefined
    const resolveEventColors = isEvents ? props.resolveEventColors : undefined
    const eventsTooltipScope = isEvents
      ? (props.eventsTooltipScope ?? 'trigger-only')
      : 'trigger-only'
    const formatEventsOverflowText = isEvents ? props.formatEventsOverflowText : undefined
    const eventsTooltipTrigger = isEvents ? (props.eventsTooltipTrigger ?? 'event-strip') : 'event-strip'

    const scheduleOverlay: 'popover' | 'tooltip' =
      scheduleOverlayProp ?? (isEvents ? 'tooltip' : 'popover')

    const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

    const weekDates = useMemo(() => {
      const startOfWeek = currentMonth.startOf('week')
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
    }, [currentMonth])

    const handleToday = () => {
      if (onTodayClick) {
        onTodayClick()
        return
      }
      const today = dayjs()
      onSelectDate(today)
      onMonthChange(today.startOf('month'))
    }

    const handlePrev = () => {
      if (mode === 'week') {
        onMonthChange(currentMonth.subtract(1, 'week'))
      } else {
        onMonthChange(currentMonth.subtract(1, 'month'))
      }
    }

    const handleNext = () => {
      if (mode === 'week') {
        onMonthChange(currentMonth.add(1, 'week'))
      } else {
        onMonthChange(currentMonth.add(1, 'month'))
      }
    }

    const headerTitle =
      mode === 'week'
        ? `${weekDates[0].format('MM.DD')} ~ ${weekDates[6].format('MM.DD')}`
        : currentMonth.format('YYYY.MM')

    const buildProgramPreview = (date: Dayjs, dayPrograms: Program[]) => (
      <CalendarCellSchedulePreview date={date} programs={dayPrograms} />
    )

    const buildEventsPreview = (
      dayEvents: ProgramCalendarEventItem[],
      colorMap: Map<string | number, ScheduleColorPair>
    ) =>
      renderEventsTooltipContent ? (
        renderEventsTooltipContent({ events: dayEvents, colorMap })
      ) : (
        <ApplicantCalendarEventPopoverContent events={dayEvents} colorMap={colorMap} />
      )

    const dateFullCellRender = (date: Dayjs) => {
      const isCurrentMonth = date.isSame(currentMonth, 'month')
      const isSelected = date.isSame(selectedDate, 'day')
      const isToday = date.isSame(dayjs(), 'day')

      const cellClass = [
        'program-calendar-cell',
        !isCurrentMonth ? 'program-calendar-cell--other-month' : '',
        isSelected ? 'program-calendar-cell--selected' : '',
        isToday ? 'program-calendar-cell--today' : '',
      ]
        .filter(Boolean)
        .join(' ')

      if (isEvents) {
        const dayEvents = getEventsForDate(events, date)
        const hasItems = dayEvents.length > 0
        const resolvedColors =
          overrideEventColorMap != null
            ? overrideEventColorMap(dayEvents)
            : buildResolvedColorMap(dayEvents)

        const emptyEventsCell = (
          <div className={cellClass} onClick={() => onSelectDate(date)}>
            <div className="program-calendar-cell-date">{date.date()}</div>
          </div>
        )

        if (!hasItems) {
          return emptyEventsCell
        }

        if (eventsTooltipTrigger === 'cell') {
          const fullDayPreview = buildEventsPreview(dayEvents, resolvedColors)
          const cellInner = (
            <div className={cellClass} onClick={() => onSelectDate(date)}>
              <div className="program-calendar-cell-date">{date.date()}</div>
              <div className="program-calendar-cell-events">
                {dayEvents.slice(0, 2).map(event => {
                  const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                  const isEventSelected = selectedRowKeys.includes(event.id)
                  const colors =
                    resolveEventColors?.(event) ??
                    resolvedColors.get(event.id) ??
                    SCHEDULE_COLORS[0]
                  return (
                    <div key={String(event.id)}>
                      <div
                        className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                        style={{
                          backgroundColor: colors.bg,
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span
                          className="program-calendar-event-title"
                          style={{ color: colors.text }}
                        >
                          {displayTitle}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {dayEvents.length > 2 && (
                  <div className="program-calendar-event-more">
                    {formatEventsOverflowText?.(dayEvents.length - 2) ??
                      `외 ${dayEvents.length - 2}개의 항목`}
                  </div>
                )}
              </div>
            </div>
          )
          return wrapScheduleOverlay(
            scheduleOverlay,
            tooltipOverlayClassName,
            fullDayPreview,
            <div className="program-calendar-cell-tooltip-trigger program-calendar-cell-tooltip-trigger--full-cell">
              {cellInner}
            </div>
          )
        }

        const cellBody = (
          <div className={cellClass} onClick={() => onSelectDate(date)}>
            <div className="program-calendar-cell-date">{date.date()}</div>
            {hasItems && (
              <div className="program-calendar-cell-events">
                {dayEvents.slice(0, 2).map(event => {
                  const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                  const isEventSelected = selectedRowKeys.includes(event.id)
                  const colors =
                    resolveEventColors?.(event) ??
                    resolvedColors.get(event.id) ??
                    SCHEDULE_COLORS[0]
                  const tooltipList = eventsTooltipScope === 'full-day' ? dayEvents : [event]
                  const tooltipColorMap =
                    overrideEventColorMap != null
                      ? overrideEventColorMap(tooltipList)
                      : buildResolvedColorMap(tooltipList)
                  const previewOne = buildEventsPreview(tooltipList, tooltipColorMap)
                  return (
                    <Fragment key={String(event.id)}>
                      {wrapScheduleOverlay(
                        scheduleOverlay,
                        tooltipOverlayClassName,
                        previewOne,
                        <div className="program-calendar-event-tooltip-trigger">
                          <div
                            className={[
                              'program-calendar-event',
                              isEventSelected ? 'program-calendar-event--selected' : '',
                              ...getPaymentOrderEventClasses(event),
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            style={{
                              backgroundColor: colors.bg,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <span
                              className="program-calendar-event-title"
                              style={{ color: colors.text }}
                            >
                              {displayTitle}
                            </span>
                          </div>
                        </div>
                      )}
                    </Fragment>
                  )
                })}
                {dayEvents.length > 2 && (
                  <Fragment key="more">
                    {wrapScheduleOverlay(
                      scheduleOverlay,
                      tooltipOverlayClassName,
                      (() => {
                        const moreList =
                          eventsTooltipScope === 'full-day' ? dayEvents : dayEvents.slice(2)
                        const moreColorMap =
                          overrideEventColorMap != null
                            ? overrideEventColorMap(moreList)
                            : buildResolvedColorMap(moreList)
                        return buildEventsPreview(moreList, moreColorMap)
                      })(),
                      <div className="program-calendar-event-tooltip-trigger program-calendar-event-more">
                        {formatEventsOverflowText?.(dayEvents.length - 2) ??
                          `외 ${dayEvents.length - 2}개의 항목`}
                      </div>
                    )}
                  </Fragment>
                )}
              </div>
            )}
          </div>
        )

        return cellBody
      }

      const dayPrograms = getProgramsForDate(programs, date)
      const hasPrograms = dayPrograms.length > 0
      const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)
      const preview = buildProgramPreview(date, dayPrograms)

      const cellBody = (
        <div className={cellClass} onClick={() => onSelectDate(date)}>
          <div className="program-calendar-cell-date">{date.date()}</div>
          {hasPrograms && (
            <div className="program-calendar-cell-events">
              {dayPrograms.slice(0, 2).map(program => {
                const spanRole = getProgramSpanRole(program, date)
                const colorPair = scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
                return (
                  <div
                    key={program.id}
                    className={`program-calendar-event program-calendar-event--span-${spanRole}`}
                    style={{ backgroundColor: colorPair.bg }}
                  >
                    <span className="program-calendar-event-title">{program.title}</span>
                  </div>
                )
              })}
              {dayPrograms.length > 2 && (
                <div className="program-calendar-event-more">
                  외 {dayPrograms.length - 2}개의 항목
                </div>
              )}
            </div>
          )}
        </div>
      )

      if (!hasPrograms) return cellBody
      const trigger = <div className="program-calendar-cell-tooltip-trigger">{cellBody}</div>
      return wrapScheduleOverlay(scheduleOverlay, tooltipOverlayClassName, preview, trigger)
    }

    /** 주간 `events`: 좌측 한글 시 라벨 + `28 (SUN)` 헤더 + 시간 격자 */
    const renderWeekTimeGridForEvents = () => {
      const totalPx = WEEK_TIME_GRID_TOTAL_PX
      const hourPx = WEEK_TIME_GRID_HOUR_PX
      const rootStyle = {
        '--program-calendar-week-total-px': `${totalPx}px`,
        '--program-calendar-week-hour-px': `${hourPx}px`,
      } as CSSProperties

      return (
        <div className="program-calendar-week program-calendar-week--time-grid" style={rootStyle}>
          <div className="program-calendar-week-time-grid__header-row" role="row">
            <div className="program-calendar-week-time-grid__header-corner" aria-hidden />
            {weekDates.map(date => {
              const isSelected = date.isSame(selectedDate, 'day')
              const dateKey = date.format('YYYY-MM-DD')
              const dayLabel = formatWeekHeaderDayLabel(date, weekDates)
              const weekday = WEEK_HEADER_WEEKDAY_EN[date.day()]
              return (
                <button
                  key={dateKey}
                  type="button"
                  className={[
                    'program-calendar-week-header-cell',
                    'program-calendar-week-time-grid__header-day',
                    isSelected ? 'program-calendar-week-time-grid__header-day--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelectDate(date)}
                >
                  {`${dayLabel} (${weekday})`}
                </button>
              )
            })}
          </div>
          <div className="program-calendar-week-time-grid__scroll">
            <div className="program-calendar-week-time-grid__shell">
              <div className="program-calendar-week-time-grid__gutter">
                {WEEK_TIME_GRID_HOUR_ROWS.map((row, hourIdx) => (
                  <div
                    key={`week-gutter-${hourIdx}`}
                    className={[
                      'program-calendar-week-time-grid__gutter-cell',
                      hourIdx === 0 ? 'program-calendar-week-time-grid__gutter-cell--first' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ top: hourIdx * hourPx }}
                  >
                    <span className="program-calendar-week-time-grid__gutter-period">{row.period}</span>
                    <span className="program-calendar-week-time-grid__gutter-hour">{row.hour}</span>
                  </div>
                ))}
              </div>
              <div className="program-calendar-week-time-grid__columns">
                {weekDates.map(date => {
                  const dateKey = date.format('YYYY-MM-DD')
                  const dayEvents = getEventsForDate(events, date)
                  const resolvedWeekColors = buildResolvedColorMap(dayEvents)
                  const allDayEvents = dayEvents.filter(e => parseHHmmToMinutes(e.startTime) == null)
                  const timedEvents = dayEvents.filter(e => parseHHmmToMinutes(e.startTime) != null)
                  const timedLayouts = layoutTimedEventsForDay(timedEvents, hourPx)

                  return (
                    <div
                      key={dateKey}
                      className="program-calendar-week-time-grid__column"
                      role="presentation"
                      onClick={() => onSelectDate(date)}
                    >
                      <div
                        className="program-calendar-week-time-grid__column-inner"
                        style={{ height: totalPx }}
                      >
                        {allDayEvents.map((event, idx) => {
                          const displayTitle = weekTimeGridEventLabel(event)
                          const isEventSelected = selectedRowKeys.includes(event.id)
                          const colors = weekTimeGridEventColors(
                            event,
                            resolveEventColors,
                            resolvedWeekColors
                          )
                          const tooltipList =
                            eventsTooltipScope === 'full-day' ? dayEvents : [event]
                          const tooltipColorMap = buildResolvedColorMap(tooltipList)
                          const previewOne = buildEventsPreview(tooltipList, tooltipColorMap)
                          const pos: CSSProperties = {
                            position: 'absolute',
                            top: idx * 36,
                            left: 4,
                            right: 4,
                            height: 32,
                            zIndex: 10 + idx,
                            backgroundColor: colors.bg,
                            border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                          }
                          return (
                            <Fragment key={String(event.id)}>
                              {wrapScheduleOverlay(
                                scheduleOverlay,
                                tooltipOverlayClassName,
                                previewOne,
                                <div className="program-calendar-event-tooltip-trigger">
                                  <div
                                    className={[
                                      'program-calendar-week-time-grid__event',
                                      'program-calendar-event',
                                      isEventSelected ? 'program-calendar-event--selected' : '',
                                      ...getPaymentOrderEventClasses(event),
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                    style={pos}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <span
                                      className="program-calendar-event-title program-calendar-week-time-grid__event-text"
                                      style={{ color: colors.text }}
                                    >
                                      {displayTitle}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Fragment>
                          )
                        })}
                        {timedEvents.map((event, idx) => {
                          const layout = timedLayouts[idx]
                          const displayTitle = weekTimeGridEventLabel(event)
                          const isEventSelected = selectedRowKeys.includes(event.id)
                          const colors = weekTimeGridEventColors(
                            event,
                            resolveEventColors,
                            resolvedWeekColors
                          )
                          const tooltipList =
                            eventsTooltipScope === 'full-day' ? dayEvents : [event]
                          const tooltipColorMap = buildResolvedColorMap(tooltipList)
                          const previewOne = buildEventsPreview(tooltipList, tooltipColorMap)
                          const widthPct = 100 / layout.columnCount
                          const leftPct = layout.columnIndex * widthPct
                          const pos: CSSProperties = {
                            position: 'absolute',
                            top: layout.top,
                            left: `calc(${leftPct}% + 4px)`,
                            width: `calc(${widthPct}% - 8px)`,
                            height: layout.height,
                            minHeight: 28,
                            zIndex: 1 + idx,
                            backgroundColor: colors.bg,
                            border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                          }
                          return (
                            <Fragment key={String(event.id)}>
                              {wrapScheduleOverlay(
                                scheduleOverlay,
                                tooltipOverlayClassName,
                                previewOne,
                                <div className="program-calendar-event-tooltip-trigger">
                                  <div
                                    className={[
                                      'program-calendar-week-time-grid__event',
                                      'program-calendar-event',
                                      'program-calendar-week-time-grid__event--timed',
                                      isEventSelected ? 'program-calendar-event--selected' : '',
                                      ...getPaymentOrderEventClasses(event),
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                    style={pos}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <span
                                      className="program-calendar-event-title program-calendar-week-time-grid__event-text"
                                      style={{ color: colors.text }}
                                    >
                                      {displayTitle}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Fragment>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )
    }

    const renderWeekView = () => {
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      return (
        <div className="program-calendar-week">
          <div className="program-calendar-week-header">
            {weekdayNames.map(day => (
              <div key={day} className="program-calendar-week-header-cell">
                {day}
              </div>
            ))}
          </div>
          <div className="program-calendar-week-body">
            {weekDates.map(date => {
              const isSelected = date.isSame(selectedDate, 'day')

              if (isEvents) {
                const dayEvents = getEventsForDate(events, date)
                const hasItems = dayEvents.length > 0
                const resolvedWeekColors =
                  overrideEventColorMap != null
                    ? overrideEventColorMap(dayEvents)
                    : buildResolvedColorMap(dayEvents)

                if (!hasItems) {
                  return (
                    <div
                      key={date.format('YYYY-MM-DD')}
                      className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
                      onClick={() => onSelectDate(date)}
                    >
                      <div
                        className={`program-calendar-week-cell-date ${isSelected ? 'program-calendar-week-cell-date--selected' : ''}`}
                      >
                        {date.date()}
                      </div>
                    </div>
                  )
                }

                if (eventsTooltipTrigger === 'cell') {
                  const fullDayPreview = buildEventsPreview(dayEvents, resolvedWeekColors)
                  const weekCellInnerPlain = (
                    <>
                      <div
                        className={`program-calendar-week-cell-date ${isSelected ? 'program-calendar-week-cell-date--selected' : ''}`}
                      >
                        {date.date()}
                      </div>
                      <div className="program-calendar-week-cell-events">
                        {dayEvents.slice(0, 2).map(event => {
                          const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                          const isEventSelected = selectedRowKeys.includes(event.id)
                          const colors =
                            resolveEventColors?.(event) ??
                            resolvedWeekColors.get(event.id) ??
                            SCHEDULE_COLORS[0]
                          return (
                            <div key={String(event.id)}>
                              <div
                                className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                                style={{
                                  backgroundColor: colors.bg,
                                  border: isEventSelected
                                    ? 'none'
                                    : `1px solid ${colors.border}`,
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <span
                                  className="program-calendar-event-title"
                                  style={{ color: colors.text }}
                                >
                                  {displayTitle}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <div className="program-calendar-event-more">
                            {formatEventsOverflowText?.(dayEvents.length - 2) ??
                              `외 ${dayEvents.length - 2}개의 항목`}
                          </div>
                        )}
                      </div>
                    </>
                  )
                  return (
                    <div
                      key={date.format('YYYY-MM-DD')}
                      className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
                      onClick={() => onSelectDate(date)}
                    >
                      {wrapScheduleOverlay(
                        scheduleOverlay,
                        tooltipOverlayClassName,
                        fullDayPreview,
                        <div className="program-calendar-week-cell-tooltip-trigger program-calendar-week-cell-tooltip-trigger--full-cell">
                          {weekCellInnerPlain}
                        </div>
                      )}
                    </div>
                  )
                }

                const weekCellInner = (
                  <>
                    <div
                      className={`program-calendar-week-cell-date ${isSelected ? 'program-calendar-week-cell-date--selected' : ''}`}
                    >
                      {date.date()}
                    </div>
                    {hasItems && (
                      <div className="program-calendar-week-cell-events">
                        {dayEvents.slice(0, 2).map(event => {
                          const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                          const isEventSelected = selectedRowKeys.includes(event.id)
                          const colors =
                            resolveEventColors?.(event) ??
                            resolvedWeekColors.get(event.id) ??
                            SCHEDULE_COLORS[0]
                          const tooltipList =
                            eventsTooltipScope === 'full-day' ? dayEvents : [event]
                          const tooltipColorMap =
                            overrideEventColorMap != null
                              ? overrideEventColorMap(
                                  eventsTooltipScope === 'full-day' ? dayEvents : [event]
                                )
                              : buildResolvedColorMap(tooltipList)
                          const previewOne = buildEventsPreview(tooltipList, tooltipColorMap)
                          return (
                            <Fragment key={String(event.id)}>
                              {wrapScheduleOverlay(
                                scheduleOverlay,
                                tooltipOverlayClassName,
                                previewOne,
                                <div className="program-calendar-event-tooltip-trigger">
                                  <div
                                    className={[
                                      'program-calendar-event',
                                      isEventSelected ? 'program-calendar-event--selected' : '',
                                      ...getPaymentOrderEventClasses(event),
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                    style={{
                                      backgroundColor: colors.bg,
                                      border: isEventSelected
                                        ? 'none'
                                        : `1px solid ${colors.border}`,
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <span
                                      className="program-calendar-event-title"
                                      style={{ color: colors.text }}
                                    >
                                      {displayTitle}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Fragment>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <Fragment key="more">
                            {wrapScheduleOverlay(
                              scheduleOverlay,
                              tooltipOverlayClassName,
                              (() => {
                                const moreList =
                                  eventsTooltipScope === 'full-day' ? dayEvents : dayEvents.slice(2)
                                const moreColorMap =
                                  overrideEventColorMap != null
                                    ? overrideEventColorMap(moreList)
                                    : buildResolvedColorMap(moreList)
                                return buildEventsPreview(moreList, moreColorMap)
                              })(),
                              <div className="program-calendar-event-tooltip-trigger program-calendar-event-more">
                                {formatEventsOverflowText?.(dayEvents.length - 2) ??
                                  `외 ${dayEvents.length - 2}개의 항목`}
                              </div>
                            )}
                          </Fragment>
                        )}
                      </div>
                    )}
                  </>
                )

                return (
                  <div
                    key={date.format('YYYY-MM-DD')}
                    className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
                    onClick={() => onSelectDate(date)}
                  >
                    {weekCellInner}
                  </div>
                )
              }

              const dayPrograms = getProgramsForDate(programs, date)
              const hasPrograms = dayPrograms.length > 0
              const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)
              const preview = buildProgramPreview(date, dayPrograms)

              const weekCellInner = (
                <>
                  <div
                    className={`program-calendar-week-cell-date ${isSelected ? 'program-calendar-week-cell-date--selected' : ''}`}
                  >
                    {date.date()}
                  </div>
                  {hasPrograms && (
                    <div className="program-calendar-week-cell-events">
                      {dayPrograms.slice(0, 2).map(program => {
                        const colorPair =
                          scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
                        return (
                          <div
                            key={program.id}
                            className="program-calendar-event"
                            style={{
                              backgroundColor: colorPair.bg,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <span className="program-calendar-event-title">{program.title}</span>
                          </div>
                        )
                      })}
                      {dayPrograms.length > 2 && (
                        <div className="program-calendar-event-more">
                          외 {dayPrograms.length - 2}개의 항목
                        </div>
                      )}
                    </div>
                  )}
                </>
              )

              return (
                <div
                  key={date.format('YYYY-MM-DD')}
                  className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
                  onClick={() => onSelectDate(date)}
                >
                  {hasPrograms
                    ? wrapScheduleOverlay(
                        scheduleOverlay,
                        tooltipOverlayClassName,
                        preview,
                        <div className="program-calendar-week-cell-tooltip-trigger">
                          {weekCellInner}
                        </div>
                      )
                    : weekCellInner}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const showCalendarChrome =
      !hideHeader && (!hideDateControls || !hideModeToggle)

    return (
      <div ref={ref} className={['program-calendar-main', className].filter(Boolean).join(' ')}>
        {showCalendarChrome ? (
          <div className="program-calendar-header">
            <div className="program-calendar-header-left">
              {hideDateControls ? null : (
                <>
                  {hideHeaderTitle ? null : (
                    <span className="program-calendar-header-title">{headerTitle}</span>
                  )}
                  <Button size="small" className="program-calendar-today-btn" onClick={handleToday}>
                    오늘
                  </Button>
                  <div className="program-calendar-nav">
                    <Button
                      type="text"
                      size="small"
                      icon={<LeftOutlined />}
                      className="program-calendar-nav-btn"
                      onClick={handlePrev}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<RightOutlined />}
                      className="program-calendar-nav-btn"
                      onClick={handleNext}
                    />
                  </div>
                </>
              )}
            </div>
            {hideModeToggle ? null : (
              <div className="program-calendar-header-right">
                <SegmentedTab
                  size="medium"
                  value={mode}
                  onChange={value => onModeChange(value as 'month' | 'week')}
                  options={[
                    { label: '월간', value: 'month' },
                    { label: '주간', value: 'week' },
                  ]}
                />
              </div>
            )}
          </div>
        ) : null}
        {mode === 'week' ? (
          isEvents && weekViewVariant === 'time-grid' ? renderWeekTimeGridForEvents() : renderWeekView()
        ) : (
          <Calendar
            fullscreen={false}
            value={currentMonth}
            fullCellRender={dateFullCellRender}
            headerRender={() => null}
          />
        )}
      </div>
    )
  }
)

ProgramCalendar.displayName = 'ProgramCalendar'
