import { forwardRef, useCallback, useMemo, type ReactNode } from 'react'
import { Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import {
  type ScheduleColorPair,
  buildResolvedScheduleColorMapForPrograms,
} from '@/features/program/shared/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-schedule-helpers'
import { SegmentedTab } from '@/shared/ui/segmented-tab'
import '@/shared/ui/overlay-popover.css'
import '../styles/calendar.css'
import { CalendarBody } from './calendar-body'
import { WeekView } from './week-view'
import {
  CalendarCell,
  CalendarCellSchedulePreview,
  buildEventsPreview,
  type CalendarEventsConfig,
} from './calendar-cell'
import {
  calendarItemsForEventMode,
  dateValueToCalendarString,
  getItemsForDate,
  mapEventsToItems,
  uniqueScheduleSourcesForDay,
  type CalendarItem,
} from '../lib/calendar-helpers'
import type { CalendarMainEventInput } from '../model/calendar-main-event-input'
import type {
  BuildCalendarMonthCellRows,
  RenderCalendarMonthEventContent,
} from '../model/calendar-month-cell-row'
import {
  goToTodayState,
  resolveWeekViewHeaderTitle,
  shiftCalendarViewByStep,
  syncViewAnchorOnModeChange,
  type CalendarViewMode,
} from '../lib/calendar-navigation'

export type { CalendarMainEventInput } from '../model/calendar-main-event-input'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** 교육·신청 기간을 각각 한 쌍의 범위로 올려 `getItemsForDate`와 동일한 가시성을 유지합니다. */
function buildCalendarItemsFromPrograms(programs: Program[]): CalendarItem[] {
  const out: CalendarItem[] = []
  for (const program of programs) {
    out.push({
      id: `${String(program.id)}__edu`,
      title: program.title,
      startDate: dateValueToCalendarString(program.startDate),
      endDate: dateValueToCalendarString(program.endDate),
      type: 'event',
      original: program,
    })
    if (program.applicationStartDate && program.applicationEndDate) {
      out.push({
        id: `${String(program.id)}__app`,
        title: program.title,
        startDate: dateValueToCalendarString(program.applicationStartDate),
        endDate: dateValueToCalendarString(program.applicationEndDate),
        type: 'event',
        original: program,
      })
    }
  }
  return out
}

type CalendarMainSharedProps = {
  selectedDate: Dayjs
  currentMonth: Dayjs
  mode: 'month' | 'week'
  onSelectDate: (date: Dayjs) => void
  onMonthChange: (month: Dayjs) => void
  onModeChange: (mode: 'month' | 'week') => void
  className?: string
  onTodayClick?: () => void
  tooltipOverlayClassName?: string
  hideHeader?: boolean
  /** true면 헤더 우측 월간/주간 토글을 숨김(월간만 쓰는 화면용) */
  hideModeToggle?: boolean
}

export type CalendarMainItemsProps = CalendarMainSharedProps & {
  items: Program[]
  onItemClick: (item: Program) => void
  events?: undefined
  selectedRowKeys?: undefined
}

export type CalendarMainScheduleProps = CalendarMainItemsProps

/** @deprecated Use `CalendarMainScheduleProps` or `CalendarMainItemsProps` */
export type CalendarMainProgramProps = CalendarMainItemsProps

export type CalendarMainEventsProps = CalendarMainSharedProps & {
  events: CalendarMainEventInput[]
  selectedRowKeys?: React.Key[]
  previewTooltipContent?: (args: {
    events: CalendarItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  overrideEventColorMap?: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
  resolveEventColors?: (item: CalendarItem) => ScheduleColorPair | undefined
  eventsTooltipScope?: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger?: 'event-strip' | 'cell'
  /** 월간 셀 strip 목록 — 페이지별 (UJAT 지원자·슬롯 묶음 등) */
  buildMonthCellRows?: BuildCalendarMonthCellRows
  /** 월간 strip 내부 UI — shell(`.calendar-event`)은 공통 */
  renderMonthEventContent?: RenderCalendarMonthEventContent
  items?: undefined
  onItemClick?: undefined
}

export type CalendarMainProps = CalendarMainItemsProps | CalendarMainEventsProps

function isEventsProps(p: CalendarMainProps): p is CalendarMainEventsProps {
  return 'events' in p && Array.isArray(p.events)
}

function useCalendarNavigation({
  currentMonth,
  selectedDate,
  mode,
  onSelectDate,
  onMonthChange,
  onTodayClick,
  weekDates,
}: {
  currentMonth: Dayjs
  selectedDate: Dayjs
  mode: 'month' | 'week'
  onSelectDate: (date: Dayjs) => void
  onMonthChange: (month: Dayjs) => void
  onTodayClick?: () => void
  weekDates: Dayjs[]
}) {
  const handleToday = () => {
    const { selectedDate: today, viewAnchor } = goToTodayState(mode)
    onTodayClick?.()
    onSelectDate(today)
    onMonthChange(viewAnchor)
  }

  const handlePrev = () => {
    const next = shiftCalendarViewByStep(mode, currentMonth, -1)
    onSelectDate(next.selectedDate)
    onMonthChange(next.viewAnchor)
  }

  const handleNext = () => {
    const next = shiftCalendarViewByStep(mode, currentMonth, 1)
    onSelectDate(next.selectedDate)
    onMonthChange(next.viewAnchor)
  }

  const headerTitle =
    mode === 'week'
      ? resolveWeekViewHeaderTitle(selectedDate, weekDates)
      : currentMonth.format('YYYY.MM')

  return { handleToday, handlePrev, handleNext, headerTitle }
}

function CalendarHeader({
  headerTitle,
  mode,
  onModeChange,
  onToday,
  onPrev,
  onNext,
  hideModeToggle,
}: {
  headerTitle: string
  mode: 'month' | 'week'
  onModeChange: (mode: 'month' | 'week') => void
  onToday: () => void
  onPrev: () => void
  onNext: () => void
  hideModeToggle?: boolean
}) {
  return (
    <div className="calendar-header">
      <div className="calendar-header-left">
        <span className="calendar-header-title">{headerTitle}</span>
        <Button size="small" className="calendar-today-btn" onClick={onToday}>
          오늘
        </Button>
        <div className="calendar-nav">
          <Button
            type="text"
            size="small"
            icon={<LeftOutlined />}
            className="calendar-nav-btn"
            onClick={onPrev}
          />
          <Button
            type="text"
            size="small"
            icon={<RightOutlined />}
            className="calendar-nav-btn"
            onClick={onNext}
          />
        </div>
      </div>
      {hideModeToggle && mode === 'month' ? (
        <div className="calendar-header-right">
          <div className="calendar-month-only-badge" aria-current="true">
            <span className="calendar-month-only-badge__inner">월간</span>
          </div>
        </div>
      ) : !hideModeToggle ? (
        <div className="calendar-header-right">
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
      ) : null}
    </div>
  )
}

type RenderCalendarDayCellParams = {
  date: Dayjs
  cellMode: 'month' | 'week'
  currentMonthForCell: Dayjs
  items: CalendarItem[]
  selectedDate: Dayjs
  onSelectDate: (date: Dayjs) => void
  tooltipOverlayClassName?: string
  colorMap: Map<string | number, ScheduleColorPair>
  eventsConfig?: CalendarEventsConfig
  buildResolvedColorMap: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
}

function renderCalendarDayCell(p: RenderCalendarDayCellParams): ReactNode {
  const {
    date,
    cellMode,
    currentMonthForCell,
    items,
    selectedDate,
    onSelectDate,
    tooltipOverlayClassName,
    colorMap,
    eventsConfig,
    buildResolvedColorMap,
  } = p

  const dayItems = getItemsForDate(items, date)
  if (eventsConfig != null) {
    const dayEvents = calendarItemsForEventMode(dayItems)
    const overlayContent =
      dayEvents.length > 0
        ? buildEventsPreview(dayEvents, colorMap, eventsConfig.previewTooltipContent)
        : null
    const overlayEnabled = dayEvents.length > 0 && overlayContent != null
    return (
      <CalendarCell
        date={date}
        items={items}
        selectedDate={selectedDate}
        currentMonth={currentMonthForCell}
        mode={cellMode}
        selectedKeys={eventsConfig.selectedRowKeys}
        colorMap={colorMap}
        onSelectDate={onSelectDate}
        overlayEnabled={overlayEnabled}
        overlayContent={overlayContent}
        tooltipOverlayClassName={tooltipOverlayClassName}
        eventsConfig={eventsConfig}
        buildResolvedColorMap={buildResolvedColorMap}
      />
    )
  }
  const dayScheduleSources = uniqueScheduleSourcesForDay(dayItems)
  const overlayContent = (
    <CalendarCellSchedulePreview date={date} items={dayScheduleSources} colorMap={colorMap} />
  )
  return (
    <CalendarCell
      date={date}
      items={items}
      selectedDate={selectedDate}
      currentMonth={currentMonthForCell}
      mode={cellMode}
      selectedKeys={[]}
      colorMap={colorMap}
      onSelectDate={onSelectDate}
      overlayEnabled={dayScheduleSources.length > 0}
      overlayContent={overlayContent}
      tooltipOverlayClassName={tooltipOverlayClassName}
    />
  )
}

export const CalendarMain = forwardRef<HTMLDivElement, CalendarMainProps>(
  function CalendarMainInner(props, ref) {
    const {
      selectedDate,
      currentMonth,
      mode,
      onSelectDate,
      onMonthChange,
      onModeChange,
      className,
      onTodayClick,
      tooltipOverlayClassName,
      hideHeader = false,
      hideModeToggle = false,
    } = props

    const isEventsMode = isEventsProps(props)
    const sourcePrograms = isEventsMode ? undefined : props.items
    const events = isEventsMode ? props.events : undefined

    const items = useMemo((): CalendarItem[] => {
      if (events !== undefined) return mapEventsToItems(events)
      return buildCalendarItemsFromPrograms(sourcePrograms ?? [])
    }, [events, sourcePrograms])

    const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events ?? [])

    const colorMap = useMemo((): Map<string | number, ScheduleColorPair> => {
      if (isEventsProps(props)) {
        return props.overrideEventColorMap?.(items) ?? buildResolvedColorMap(items)
      }
      return buildResolvedScheduleColorMapForPrograms((props as CalendarMainItemsProps).items)
    }, [
      buildResolvedColorMap,
      isEventsMode,
      items,
      isEventsMode ? (props as CalendarMainEventsProps).overrideEventColorMap : undefined,
    ])

    const eventsConfig: CalendarEventsConfig | undefined = isEventsMode
      ? {
          selectedRowKeys: props.selectedRowKeys ?? [],
          previewTooltipContent: props.previewTooltipContent,
          overrideEventColorMap: props.overrideEventColorMap,
          resolveEventColors: props.resolveEventColors,
          eventsTooltipScope: props.eventsTooltipScope ?? 'trigger-only',
          formatEventsOverflowText: props.formatEventsOverflowText,
          eventsTooltipTrigger: props.eventsTooltipTrigger ?? 'event-strip',
          buildMonthCellRows: props.buildMonthCellRows,
          renderMonthEventContent: props.renderMonthEventContent,
        }
      : undefined

    const weekDates = useMemo(() => {
      const startOfWeek = currentMonth.startOf('week')
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
    }, [currentMonth])

    const { handleToday, handlePrev, handleNext, headerTitle } = useCalendarNavigation({
      currentMonth,
      selectedDate,
      mode,
      onSelectDate,
      onMonthChange,
      onTodayClick,
      weekDates,
    })

    const handleModeChange = useCallback(
      (nextMode: CalendarViewMode) => {
        onMonthChange(syncViewAnchorOnModeChange(nextMode, selectedDate))
        onModeChange(nextMode)
      },
      [selectedDate, onMonthChange, onModeChange]
    )

    const renderMonthCell = useCallback(
      (date: Dayjs) =>
        renderCalendarDayCell({
          date,
          cellMode: 'month',
          currentMonthForCell: currentMonth,
          items,
          selectedDate,
          onSelectDate,
          tooltipOverlayClassName,
          colorMap,
          eventsConfig,
          buildResolvedColorMap,
        }),
      [
        currentMonth,
        items,
        selectedDate,
        onSelectDate,
        tooltipOverlayClassName,
        colorMap,
        eventsConfig,
        buildResolvedColorMap,
      ]
    )

    const weekTimeGrid = (
      <WeekView
        weekDates={weekDates}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        items={items}
        colorMap={colorMap}
        tooltipOverlayClassName={tooltipOverlayClassName}
        isEventsMode={isEventsMode}
        eventsConfig={eventsConfig}
        buildResolvedColorMap={buildResolvedColorMap}
        onProgramClick={isEventsMode ? undefined : (props as CalendarMainItemsProps).onItemClick}
      />
    )

    return (
      <div ref={ref} className={['calendar-main', className].filter(Boolean).join(' ')}>
        {!hideHeader && (
          <CalendarHeader
            headerTitle={headerTitle}
            mode={mode}
            onModeChange={handleModeChange}
            onToday={handleToday}
            onPrev={handlePrev}
            onNext={handleNext}
            hideModeToggle={hideModeToggle}
          />
        )}
        <CalendarBody
          mode={mode}
          currentMonth={currentMonth}
          monthFullCellRender={renderMonthCell}
          weekView={weekTimeGrid}
        />
      </div>
    )
  }
)

CalendarMain.displayName = 'CalendarMain'
