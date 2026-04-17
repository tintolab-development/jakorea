import { forwardRef, Fragment, useMemo, type ReactElement, type ReactNode } from 'react'
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
import '../program-calendar.css'
import { ProgramCalendarOverlayFollowCursor } from '@/shared/components/program-calendar-cursor-overlay'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

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

type SpanRole = 'start' | 'middle' | 'end' | 'single'

type CalendarEventsConfig = {
  selectedRowKeys: React.Key[]
  renderEventsTooltipContent?: (args: {
    events: CalendarMainEventItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  overrideEventColorMap?: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  resolveEventColors?: (event: CalendarMainEventItem) => ScheduleColorPair | undefined
  eventsTooltipScope: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger: 'event-strip' | 'cell'
}

function isEventsProps(p: CalendarMainProps): p is CalendarMainEventsProps {
  return 'events' in p && Array.isArray(p.events)
}

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

function getEventsForDate(events: CalendarMainEventItem[], date: Dayjs): CalendarMainEventItem[] {
  return events.filter(event => {
    const start = dayjs(event.startDate)
    const end = dayjs(event.endDate)
    return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  })
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
            <span className="program-calendar-cell-preview__title" style={{ color: colorPair.text }}>
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

function ScheduleOverlayWrapper({
  scheduleOverlay,
  tooltipOverlayClassName,
  previewContent,
  children,
}: {
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  previewContent: ReactNode
  children: ReactElement
}) {
  return (
    <ProgramCalendarOverlayFollowCursor
      variant={scheduleOverlay}
      tooltipOverlayClassName={tooltipOverlayClassName}
      content={previewContent}
    >
      {children}
    </ProgramCalendarOverlayFollowCursor>
  )
}

function buildEventsPreview(
  dayEvents: CalendarMainEventItem[],
  colorMap: Map<string | number, ScheduleColorPair>,
  renderEventsTooltipContent?: (args: {
    events: CalendarMainEventItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
) {
  return renderEventsTooltipContent ? (
    renderEventsTooltipContent({ events: dayEvents, colorMap })
  ) : (
    <ApplicantCalendarEventPopoverContent events={dayEvents} colorMap={colorMap} />
  )
}

function CalendarHeader({
  headerTitle,
  mode,
  onModeChange,
  onToday,
  onPrev,
  onNext,
}: {
  headerTitle: string
  mode: 'month' | 'week'
  onModeChange: (mode: 'month' | 'week') => void
  onToday: () => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="program-calendar-header">
      <div className="program-calendar-header-left">
        <span className="program-calendar-header-title">{headerTitle}</span>
        <Button size="small" className="program-calendar-today-btn" onClick={onToday}>
          오늘
        </Button>
        <div className="program-calendar-nav">
          <Button
            type="text"
            size="small"
            icon={<LeftOutlined />}
            className="program-calendar-nav-btn"
            onClick={onPrev}
          />
          <Button
            type="text"
            size="small"
            icon={<RightOutlined />}
            className="program-calendar-nav-btn"
            onClick={onNext}
          />
        </div>
      </div>
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
    </div>
  )
}

function MonthProgramCell({
  date,
  currentMonth,
  selectedDate,
  programs,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
}: {
  date: Dayjs
  currentMonth: Dayjs
  selectedDate: Dayjs
  programs: Program[]
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
}) {
  const isCurrentMonth = date.isSame(currentMonth, 'month')
  const isSelected = date.isSame(selectedDate, 'day')
  const isToday = date.isSame(dayjs(), 'day')
  const dayPrograms = getProgramsForDate(programs, date)
  const hasPrograms = dayPrograms.length > 0
  const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)
  const preview = <CalendarCellSchedulePreview date={date} programs={dayPrograms} />

  const cellClass = [
    'program-calendar-cell',
    !isCurrentMonth ? 'program-calendar-cell--other-month' : '',
    isSelected ? 'program-calendar-cell--selected' : '',
    isToday ? 'program-calendar-cell--today' : '',
  ]
    .filter(Boolean)
    .join(' ')

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
            <div className="program-calendar-event-more">외 {dayPrograms.length - 2}개의 항목</div>
          )}
        </div>
      )}
    </div>
  )

  if (!hasPrograms) return cellBody
  return (
    <ScheduleOverlayWrapper
      scheduleOverlay={scheduleOverlay}
      tooltipOverlayClassName={tooltipOverlayClassName}
      previewContent={preview}
    >
      <div className="program-calendar-cell-tooltip-trigger">{cellBody}</div>
    </ScheduleOverlayWrapper>
  )
}

function MonthEventCell({
  date,
  currentMonth,
  selectedDate,
  events,
  config,
  buildResolvedColorMap,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
}: {
  date: Dayjs
  currentMonth: Dayjs
  selectedDate: Dayjs
  events: CalendarMainEventItem[]
  config: CalendarEventsConfig
  buildResolvedColorMap: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
}) {
  const isCurrentMonth = date.isSame(currentMonth, 'month')
  const isSelected = date.isSame(selectedDate, 'day')
  const isToday = date.isSame(dayjs(), 'day')
  const dayEvents = getEventsForDate(events, date)
  const hasItems = dayEvents.length > 0
  const resolvedColors =
    config.overrideEventColorMap != null
      ? config.overrideEventColorMap(dayEvents)
      : buildResolvedColorMap(dayEvents)

  const cellClass = [
    'program-calendar-cell',
    !isCurrentMonth ? 'program-calendar-cell--other-month' : '',
    isSelected ? 'program-calendar-cell--selected' : '',
    isToday ? 'program-calendar-cell--today' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (!hasItems) {
    return (
      <div className={cellClass} onClick={() => onSelectDate(date)}>
        <div className="program-calendar-cell-date">{date.date()}</div>
      </div>
    )
  }

  if (config.eventsTooltipTrigger === 'cell') {
    const fullDayPreview = buildEventsPreview(
      dayEvents,
      resolvedColors,
      config.renderEventsTooltipContent
    )

    const cellInner = (
      <div className={cellClass} onClick={() => onSelectDate(date)}>
        <div className="program-calendar-cell-date">{date.date()}</div>
        <div className="program-calendar-cell-events">
          {dayEvents.slice(0, 2).map(event => {
            const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
            const isEventSelected = config.selectedRowKeys.includes(event.id)
            const colors =
              config.resolveEventColors?.(event) ?? resolvedColors.get(event.id) ?? SCHEDULE_COLORS[0]
            return (
              <div key={String(event.id)}>
                <div
                  className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                  style={{ backgroundColor: colors.bg }}
                  onClick={e => e.stopPropagation()}
                >
                  <span className="program-calendar-event-title" style={{ color: colors.text }}>
                    {displayTitle}
                  </span>
                </div>
              </div>
            )
          })}
          {dayEvents.length > 2 && (
            <div className="program-calendar-event-more">
              {config.formatEventsOverflowText?.(dayEvents.length - 2) ?? `외 ${dayEvents.length - 2}개의 항목`}
            </div>
          )}
        </div>
      </div>
    )

    return (
      <ScheduleOverlayWrapper
        scheduleOverlay={scheduleOverlay}
        tooltipOverlayClassName={tooltipOverlayClassName}
        previewContent={fullDayPreview}
      >
        <div className="program-calendar-cell-tooltip-trigger program-calendar-cell-tooltip-trigger--full-cell">
          {cellInner}
        </div>
      </ScheduleOverlayWrapper>
    )
  }

  return (
    <div className={cellClass} onClick={() => onSelectDate(date)}>
      <div className="program-calendar-cell-date">{date.date()}</div>
      <div className="program-calendar-cell-events">
        {dayEvents.slice(0, 2).map(event => {
          const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
          const isEventSelected = config.selectedRowKeys.includes(event.id)
          const colors =
            config.resolveEventColors?.(event) ?? resolvedColors.get(event.id) ?? SCHEDULE_COLORS[0]
          const tooltipList = config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
          const tooltipColorMap =
            config.overrideEventColorMap != null
              ? config.overrideEventColorMap(
                  config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
                )
              : buildResolvedColorMap(tooltipList)
          const previewOne = buildEventsPreview(
            tooltipList,
            tooltipColorMap,
            config.renderEventsTooltipContent
          )
          return (
            <Fragment key={String(event.id)}>
              <ScheduleOverlayWrapper
                scheduleOverlay={scheduleOverlay}
                tooltipOverlayClassName={tooltipOverlayClassName}
                previewContent={previewOne}
              >
                <div className="program-calendar-event-tooltip-trigger">
                  <div
                    className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                    style={{ backgroundColor: colors.bg }}
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="program-calendar-event-title" style={{ color: colors.text }}>
                      {displayTitle}
                    </span>
                  </div>
                </div>
              </ScheduleOverlayWrapper>
            </Fragment>
          )
        })}
        {dayEvents.length > 2 && (
          <Fragment key="more">
            <ScheduleOverlayWrapper
              scheduleOverlay={scheduleOverlay}
              tooltipOverlayClassName={tooltipOverlayClassName}
              previewContent={(() => {
                const moreList =
                  config.eventsTooltipScope === 'full-day' ? dayEvents : dayEvents.slice(2)
                const moreColorMap =
                  config.overrideEventColorMap != null
                    ? config.overrideEventColorMap(moreList)
                    : buildResolvedColorMap(moreList)
                return buildEventsPreview(moreList, moreColorMap, config.renderEventsTooltipContent)
              })()}
            >
              <div className="program-calendar-event-tooltip-trigger program-calendar-event-more">
                {config.formatEventsOverflowText?.(dayEvents.length - 2) ?? `외 ${dayEvents.length - 2}개의 항목`}
              </div>
            </ScheduleOverlayWrapper>
          </Fragment>
        )}
      </div>
    </div>
  )
}

function WeekProgramCell({
  date,
  selectedDate,
  programs,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
}: {
  date: Dayjs
  selectedDate: Dayjs
  programs: Program[]
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
}) {
  const isSelected = date.isSame(selectedDate, 'day')
  const dayPrograms = getProgramsForDate(programs, date)
  const hasPrograms = dayPrograms.length > 0
  const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)
  const preview = <CalendarCellSchedulePreview date={date} programs={dayPrograms} />

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
            const colorPair = scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
            return (
              <div
                key={program.id}
                className="program-calendar-event"
                style={{ backgroundColor: colorPair.bg }}
                onClick={e => e.stopPropagation()}
              >
                <span className="program-calendar-event-title">{program.title}</span>
              </div>
            )
          })}
          {dayPrograms.length > 2 && (
            <div className="program-calendar-event-more">외 {dayPrograms.length - 2}개의 항목</div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div
      className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
      onClick={() => onSelectDate(date)}
    >
      {hasPrograms ? (
        <ScheduleOverlayWrapper
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
          previewContent={preview}
        >
          <div className="program-calendar-week-cell-tooltip-trigger">{weekCellInner}</div>
        </ScheduleOverlayWrapper>
      ) : (
        weekCellInner
      )}
    </div>
  )
}

function WeekEventCell({
  date,
  selectedDate,
  events,
  config,
  buildResolvedColorMap,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
}: {
  date: Dayjs
  selectedDate: Dayjs
  events: CalendarMainEventItem[]
  config: CalendarEventsConfig
  buildResolvedColorMap: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
}) {
  const isSelected = date.isSame(selectedDate, 'day')
  const dayEvents = getEventsForDate(events, date)
  const hasItems = dayEvents.length > 0
  const resolvedWeekColors =
    config.overrideEventColorMap != null
      ? config.overrideEventColorMap(dayEvents)
      : buildResolvedColorMap(dayEvents)

  if (!hasItems) {
    return (
      <div
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

  if (config.eventsTooltipTrigger === 'cell') {
    const fullDayPreview = buildEventsPreview(
      dayEvents,
      resolvedWeekColors,
      config.renderEventsTooltipContent
    )
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
            const isEventSelected = config.selectedRowKeys.includes(event.id)
            const colors =
              config.resolveEventColors?.(event) ?? resolvedWeekColors.get(event.id) ?? SCHEDULE_COLORS[0]
            return (
              <div key={String(event.id)}>
                <div
                  className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                  style={{
                    backgroundColor: colors.bg,
                    border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <span className="program-calendar-event-title" style={{ color: colors.text }}>
                    {displayTitle}
                  </span>
                </div>
              </div>
            )
          })}
          {dayEvents.length > 2 && (
            <div className="program-calendar-event-more">
              {config.formatEventsOverflowText?.(dayEvents.length - 2) ?? `외 ${dayEvents.length - 2}개의 항목`}
            </div>
          )}
        </div>
      </>
    )

    return (
      <div
        className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
        onClick={() => onSelectDate(date)}
      >
        <ScheduleOverlayWrapper
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
          previewContent={fullDayPreview}
        >
          <div className="program-calendar-week-cell-tooltip-trigger program-calendar-week-cell-tooltip-trigger--full-cell">
            {weekCellInnerPlain}
          </div>
        </ScheduleOverlayWrapper>
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
      <div className="program-calendar-week-cell-events">
        {dayEvents.slice(0, 2).map(event => {
          const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
          const isEventSelected = config.selectedRowKeys.includes(event.id)
          const colors =
            config.resolveEventColors?.(event) ?? resolvedWeekColors.get(event.id) ?? SCHEDULE_COLORS[0]
          const tooltipList = config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
          const tooltipColorMap =
            config.overrideEventColorMap != null
              ? config.overrideEventColorMap(
                  config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
                )
              : buildResolvedColorMap(tooltipList)
          const previewOne = buildEventsPreview(
            tooltipList,
            tooltipColorMap,
            config.renderEventsTooltipContent
          )
          return (
            <Fragment key={String(event.id)}>
              <ScheduleOverlayWrapper
                scheduleOverlay={scheduleOverlay}
                tooltipOverlayClassName={tooltipOverlayClassName}
                previewContent={previewOne}
              >
                <div className="program-calendar-event-tooltip-trigger">
                  <div
                    className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                    style={{
                      backgroundColor: colors.bg,
                      border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="program-calendar-event-title" style={{ color: colors.text }}>
                      {displayTitle}
                    </span>
                  </div>
                </div>
              </ScheduleOverlayWrapper>
            </Fragment>
          )
        })}
        {dayEvents.length > 2 && (
          <Fragment key="more">
            <ScheduleOverlayWrapper
              scheduleOverlay={scheduleOverlay}
              tooltipOverlayClassName={tooltipOverlayClassName}
              previewContent={(() => {
                const moreList =
                  config.eventsTooltipScope === 'full-day' ? dayEvents : dayEvents.slice(2)
                const moreColorMap =
                  config.overrideEventColorMap != null
                    ? config.overrideEventColorMap(moreList)
                    : buildResolvedColorMap(moreList)
                return buildEventsPreview(moreList, moreColorMap, config.renderEventsTooltipContent)
              })()}
            >
              <div className="program-calendar-event-tooltip-trigger program-calendar-event-more">
                {config.formatEventsOverflowText?.(dayEvents.length - 2) ?? `외 ${dayEvents.length - 2}개의 항목`}
              </div>
            </ScheduleOverlayWrapper>
          </Fragment>
        )}
      </div>
    </>
  )

  return (
    <div
      className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
      onClick={() => onSelectDate(date)}
    >
      {weekCellInner}
    </div>
  )
}

function MonthView({
  currentMonth,
  selectedDate,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
  programs,
  events,
  eventsConfig,
  buildResolvedColorMap,
}: {
  currentMonth: Dayjs
  selectedDate: Dayjs
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  programs?: Program[]
  events?: CalendarMainEventItem[]
  eventsConfig?: CalendarEventsConfig
  buildResolvedColorMap: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
}) {
  if (events != null && eventsConfig != null) {
    return (
      <Calendar
        fullscreen={false}
        value={currentMonth}
        headerRender={() => null}
        fullCellRender={date => (
          <MonthEventCell
            date={date}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            events={events}
            config={eventsConfig}
            buildResolvedColorMap={buildResolvedColorMap}
            onSelectDate={onSelectDate}
            scheduleOverlay={scheduleOverlay}
            tooltipOverlayClassName={tooltipOverlayClassName}
          />
        )}
      />
    )
  }

  return (
    <Calendar
      fullscreen={false}
      value={currentMonth}
      headerRender={() => null}
      fullCellRender={date => (
        <MonthProgramCell
          date={date}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          programs={programs ?? []}
          onSelectDate={onSelectDate}
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
        />
      )}
    />
  )
}

function WeekView({
  weekDates,
  selectedDate,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
  programs,
  events,
  eventsConfig,
  buildResolvedColorMap,
}: {
  weekDates: Dayjs[]
  selectedDate: Dayjs
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  programs?: Program[]
  events?: CalendarMainEventItem[]
  eventsConfig?: CalendarEventsConfig
  buildResolvedColorMap: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
}) {
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const isEventsMode = events != null && eventsConfig != null

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
          if (isEventsMode) {
            return (
              <WeekEventCell
                key={date.format('YYYY-MM-DD')}
                date={date}
                selectedDate={selectedDate}
                events={events}
                config={eventsConfig}
                buildResolvedColorMap={buildResolvedColorMap}
                onSelectDate={onSelectDate}
                scheduleOverlay={scheduleOverlay}
                tooltipOverlayClassName={tooltipOverlayClassName}
              />
            )
          }

          return (
            <WeekProgramCell
              key={date.format('YYYY-MM-DD')}
              date={date}
              selectedDate={selectedDate}
              programs={programs ?? []}
              onSelectDate={onSelectDate}
              scheduleOverlay={scheduleOverlay}
              tooltipOverlayClassName={tooltipOverlayClassName}
            />
          )
        })}
      </div>
    </div>
  )
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

