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
} from '@/features/program/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/program-detail/ui/applicant-list/applicant-calendar-schedule-helpers'
import { SegmentedTab } from '@/shared/ui/segmented-tab'
import '@/shared/ui/overlay-popover.css'
import { CalendarBody } from './calendar-body'
import { WeekView } from './ui/week-view'
import {
  CalendarCell,
  CalendarCellSchedulePreview,
  buildEventsPreview,
  type CalendarEventsConfig,
} from './calendar-core/calendar-cell'
import {
  calendarItemsForEventMode,
  dateValueToCalendarString,
  getItemsForDate,
  mapEventsToItems,
  uniqueScheduleSourcesForDay,
  type CalendarItem,
} from './calendar-core/calendar-helpers'

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
  scheduleOverlay?: 'popover' | 'tooltip'
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
  events: Parameters<typeof mapEventsToItems>[0]
  selectedRowKeys?: React.Key[]
  renderEventsTooltipContent?: (args: {
    events: CalendarItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  overrideEventColorMap?: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
  resolveEventColors?: (item: CalendarItem) => ScheduleColorPair | undefined
  eventsTooltipScope?: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger?: 'event-strip' | 'cell'
  items?: undefined
  onItemClick?: undefined
}

export type CalendarMainProps = CalendarMainItemsProps | CalendarMainEventsProps

function isEventsProps(p: CalendarMainProps): p is CalendarMainEventsProps {
  return 'events' in p && Array.isArray(p.events)
}

function useCalendarNavigation({
  currentMonth,
  mode,
  onSelectDate,
  onMonthChange,
  onTodayClick,
  weekDates,
}: {
  currentMonth: Dayjs
  mode: 'month' | 'week'
  onSelectDate: (date: Dayjs) => void
  onMonthChange: (month: Dayjs) => void
  onTodayClick?: () => void
  weekDates: Dayjs[]
}) {
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
    if (mode === 'week') onMonthChange(currentMonth.subtract(1, 'week'))
    else onMonthChange(currentMonth.subtract(1, 'month'))
  }

  const handleNext = () => {
    if (mode === 'week') onMonthChange(currentMonth.add(1, 'week'))
    else onMonthChange(currentMonth.add(1, 'month'))
  }

  const headerTitle =
    mode === 'week'
      ? weekDates[0].format('YYYY. MM')
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
      {!hideModeToggle && (
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
      )}
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
  scheduleOverlay: 'popover' | 'tooltip'
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
    scheduleOverlay,
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
        ? buildEventsPreview(dayEvents, colorMap, eventsConfig.renderEventsTooltipContent)
        : null
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
        overlayEnabled={dayEvents.length > 0}
        overlayContent={overlayContent}
        scheduleOverlay={scheduleOverlay}
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
      scheduleOverlay={scheduleOverlay}
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
      scheduleOverlay: scheduleOverlayProp,
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
          renderEventsTooltipContent: props.renderEventsTooltipContent,
          overrideEventColorMap: props.overrideEventColorMap,
          resolveEventColors: props.resolveEventColors,
          eventsTooltipScope: props.eventsTooltipScope ?? 'trigger-only',
          formatEventsOverflowText: props.formatEventsOverflowText,
          eventsTooltipTrigger: props.eventsTooltipTrigger ?? 'event-strip',
        }
      : undefined

    const scheduleOverlay: 'popover' | 'tooltip' = scheduleOverlayProp ?? 'popover'

    const weekDates = useMemo(() => {
      const startOfWeek = currentMonth.startOf('week')
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
    }, [currentMonth])

    const { handleToday, handlePrev, handleNext, headerTitle } = useCalendarNavigation({
      currentMonth,
      mode,
      onSelectDate,
      onMonthChange,
      onTodayClick,
      weekDates,
    })

    const renderMonthCell = useCallback(
      (date: Dayjs) =>
        renderCalendarDayCell({
          date,
          cellMode: 'month',
          currentMonthForCell: currentMonth,
          items,
          selectedDate,
          onSelectDate,
          scheduleOverlay,
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
        scheduleOverlay,
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
        scheduleOverlay={scheduleOverlay}
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
            onModeChange={onModeChange}
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
