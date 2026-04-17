import { forwardRef, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { useApplicantCalendarColorMaps } from '@/features/program/program-detail/ui/applicant-list/applicant-calendar-schedule-helpers'
import { CalendarHeader } from './CalendarHeader'
import { MonthView, type CalendarMainEventsConfig } from './MonthView'
import { WeekView } from './WeekView'

export type CalendarMainEventItem = {
  id: string | number
  title?: string
  startDate: string
  endDate: string
  originalItem?: unknown
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
}

export type CalendarMainProgramProps = CalendarMainSharedProps & {
  programs: Program[]
  onProgramClick: (program: Program) => void
  events?: undefined
  selectedRowKeys?: undefined
}

export type CalendarMainEventsProps = CalendarMainSharedProps & {
  events: CalendarMainEventItem[]
  selectedRowKeys?: React.Key[]
  renderEventsTooltipContent?: (args: {
    events: CalendarMainEventItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  overrideEventColorMap?: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  resolveEventColors?: (event: CalendarMainEventItem) => ScheduleColorPair | undefined
  eventsTooltipScope?: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger?: 'event-strip' | 'cell'
  programs?: undefined
  onProgramClick?: undefined
}

export type CalendarMainProps = CalendarMainProgramProps | CalendarMainEventsProps

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
      ? `${weekDates[0].format('MM.DD')} ~ ${weekDates[6].format('MM.DD')}`
      : currentMonth.format('YYYY.MM')

  return { handleToday, handlePrev, handleNext, headerTitle }
}

export const CalendarMain = forwardRef<HTMLDivElement, CalendarMainProps>(function CalendarMainInner(
  props,
  ref
) {
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
  } = props

  const isEventsMode = isEventsProps(props)
  const programs = isEventsMode ? undefined : props.programs
  const events = isEventsMode ? props.events : undefined

  const eventsConfig: CalendarMainEventsConfig | undefined = isEventsMode
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

  const scheduleOverlay: 'popover' | 'tooltip' =
    scheduleOverlayProp ?? (isEventsMode ? 'tooltip' : 'popover')

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events ?? [])

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

  return (
    <div ref={ref} className={['program-calendar-main', className].filter(Boolean).join(' ')}>
      {!hideHeader && (
        <CalendarHeader
          headerTitle={headerTitle}
          mode={mode}
          onModeChange={onModeChange}
          onToday={handleToday}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
      {mode === 'week' ? (
        <WeekView
          weekDates={weekDates}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
          programs={programs}
          events={events}
          eventsConfig={eventsConfig}
          buildResolvedColorMap={buildResolvedColorMap}
        />
      ) : (
        <MonthView
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
          programs={programs}
          events={events}
          eventsConfig={eventsConfig}
          buildResolvedColorMap={buildResolvedColorMap}
        />
      )}
    </div>
  )
})

CalendarMain.displayName = 'CalendarMain'

